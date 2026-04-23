/**
 * auth.service.ts
 * Autenticación contra Active Directory via LDAP.
 * Cada login consulta el AD en tiempo real —
 * si el usuario cambia su contraseña en AD, automáticamente
 * aplica acá sin tocar nada.
 */

import jwt from "jsonwebtoken";
import ldap from "ldapjs";

const JWT_SECRET  = process.env.JWT_SECRET  ?? "dev_secret_cambiar_en_produccion";
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? "8h";

export interface TokenPayload {
  usuario: string;
  nombre:  string;
}

export class AuthService {
  // ✅ Token Blacklist - Sesiones únicas por usuario
  private static revokedTokens = new Set<string>();
  private static usuarioTokenMap = new Map<string, string>();

  async login(usuario: string, password: string): Promise<{ token: string; nombre: string }> {

    const ldapUrl    = process.env.LDAP_URL    ?? "ldap://fiduprevisora.com.co:389";
    const ldapDomain = process.env.LDAP_DOMAIN ?? "fiduprevisora.com.co";

    // Conectar al AD y validar credenciales + traer displayName
    let nombreReal = usuario; // fallback si no se encuentra en AD
    
    await new Promise<void>((resolve, reject) => {
      const client = ldap.createClient({
        url:            ldapUrl,
        timeout:        5000,
        connectTimeout: 5000,
      });

      // Si hay error de conexión al AD
      client.on("error", (err) => {
        client.destroy();
        reject(new Error("Error conectando al servidor de autenticación"));
      });

      // Intentar bind con usuario@dominio y contraseña
      client.bind(`${usuario}@${ldapDomain}`, password, (err) => {
        if (err) {
          client.destroy();
          reject(new Error("Credenciales incorrectas"));
        } else {
          // ✅ Credenciales OK → Buscar displayName usando sAMAccountName
          const searchBase = `DC=fiduprevisora,DC=com,DC=co`;
          const searchOptions: any = {
            scope: "sub" as any,
            filter: `(sAMAccountName=${usuario})`,
            attributes: ["displayName"],
            sizeLimit: 1,
          };
          
          client.search(searchBase, searchOptions, (searchErr: any, res: any) => {
            if (searchErr) {
              // Si falla la búsqueda, continuar con fallback (nombreReal = usuario)
              client.destroy();
              resolve();
              return;
            }

            let encontrado = false;

            res.on("searchEntry", (entry: any) => {
              encontrado = true;
              console.log("[LDAP-DEBUG] searchEntry encontrada para:", usuario);
              console.log("[LDAP-DEBUG] entry.pojo:", JSON.stringify(entry.pojo, null, 2));
              const attrs: any = entry.pojo.attributes;
              if (attrs && attrs.length > 0) {
                const displayNameAttr = attrs.find((a: any) => a.type === "displayName");
                if (displayNameAttr && displayNameAttr.values && displayNameAttr.values.length > 0) {
                  nombreReal = displayNameAttr.values[0];
                  console.log("[LDAP-DEBUG] ✅ displayName encontrado:", nombreReal);
                } else {
                  console.log("[LDAP-DEBUG] ❌ displayName NOT found. Attrs:", JSON.stringify(attrs, null, 2));
                }
              } else {
                console.log("[LDAP-DEBUG] ❌ attrs vacío o no es array");
              }
            });

            res.on("error", (err: any) => {
              client.destroy();
              resolve();
            });

            res.on("end", () => {
              client.destroy();
              resolve();
            });
          });
        }
      });
    });

    // Si llegó acá → credenciales correctas y nombre obtenido
    
    // ✅ REVOCAR token anterior de este usuario (sesión única)
    const tokenAnterior = AuthService.usuarioTokenMap.get(usuario);
    if (tokenAnterior) {
      AuthService.revokedTokens.add(tokenAnterior);
    }
    
    const payload: TokenPayload = {
      usuario,
      nombre: nombreReal, // ✅ Nombre real del AD (displayName)
    };

    const nuevoToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
    
    // ✅ Guardar el nuevo token como activo para este usuario
    AuthService.usuarioTokenMap.set(usuario, nuevoToken);
    
    console.log("[LDAP-DEBUG] 📤 FINAL: usuario =", usuario, "| nombreReal =", nombreReal);
    
    return {
      token: nuevoToken,
      nombre: nombreReal, // ✅ Devolver también el nombre
    };
  }

  /**
   * Verifica un JWT y retorna el payload.
   * Lanza error si el token es inválido o expiró.
   */
  verificarToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }

  /**
   * ✅ Verifica si un token ha sido revocado (logout en otro dispositivo)
   */
  estaTokenRevocado(token: string): boolean {
    return AuthService.revokedTokens.has(token);
  }
}

export const authService = new AuthService();