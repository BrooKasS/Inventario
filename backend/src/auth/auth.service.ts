/**
 * auth.service.ts
 * Lógica de autenticación.
 * AHORA: usuario hardcodeado para desarrollo sin AD.
 * DESPUÉS (PC corporativa): reemplazar validarCredenciales por conexión LDAP.
 */

import jwt from "jsonwebtoken";

const JWT_SECRET  = process.env.JWT_SECRET  ?? "dev_secret_cambiar_en_produccion";
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? "8h";

export interface TokenPayload {
  usuario: string;
  nombre:  string;
}

export class AuthService {

  /**
   * Valida credenciales y retorna JWT si son correctas.
   * ─────────────────────────────────────────────────
   * FASE 1 (ahora): hardcodeado para desarrollo local.
   * FASE 2 (PC corporativa): reemplazar el bloque marcado
   *         con la conexión LDAP real.
   */
  async login(usuario: string, password: string): Promise<string> {

    // ── FASE 1: validación hardcodeada ──────────────────────────────
    // Cuando tengas acceso al AD, BORRA este bloque y descomenta FASE 2
    const USUARIOS_DEV: Record<string, { password: string; nombre: string }> = {
      "admin":  { password: "1234", nombre: "Administrador" },
      "sebas":  { password: "1234", nombre: "Sebastián"     },
    };

    const user = USUARIOS_DEV[usuario.toLowerCase()];
    if (!user || user.password !== password) {
      throw new Error("Credenciales incorrectas");
    }
    const nombre = user.nombre;
    // ── FIN FASE 1 ──────────────────────────────────────────────────

    // ── FASE 2: conexión LDAP real (descomentar en PC corporativa) ──
    // import ldap from "ldapjs";
    // const client = ldap.createClient({ url: process.env.LDAP_URL! });
    // await new Promise<void>((resolve, reject) => {
    //   client.bind(`${usuario}@${process.env.LDAP_DOMAIN}`, password, (err) => {
    //     client.destroy();
    //     if (err) reject(new Error("Credenciales incorrectas"));
    //     else resolve();
    //   });
    // });
    // const nombre = usuario; // O buscar nombre real en AD
    // ── FIN FASE 2 ──────────────────────────────────────────────────

    const payload: TokenPayload = { usuario, nombre };
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