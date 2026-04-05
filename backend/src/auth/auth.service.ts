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

  async login(usuario: string, password: string): Promise<string> {

    const ldapUrl    = process.env.LDAP_URL    ?? "ldap://fiduprevisora.com.co:389";
    const ldapDomain = process.env.LDAP_DOMAIN ?? "fiduprevisora.com.co";

    // Conectar al AD y validar credenciales
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
        client.destroy();
        if (err) {
          reject(new Error("Credenciales incorrectas"));
        } else {
          resolve();
        }
      });
    });

    // Si llegó acá → credenciales correctas → generar token
    const payload: TokenPayload = {
      usuario,
      nombre: usuario, // El AD no devuelve nombre en bind simple
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
  }

  /**
   * Verifica un JWT y retorna el payload.
   * Lanza error si el token es inválido o expiró.
   */
  verificarToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  }
}

export const authService = new AuthService();