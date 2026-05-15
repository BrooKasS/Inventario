"use strict";
/**
 * auth.service.ts
 * Autenticación contra Active Directory via LDAP.
 * Cada login consulta el AD en tiempo real —
 * si el usuario cambia su contraseña en AD, automáticamente
 * aplica acá sin tocar nada.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ldapjs_1 = __importDefault(require("ldapjs"));
const JWT_SECRET = process.env.JWT_SECRET ?? "dev_secret_cambiar_en_produccion";
const JWT_EXPIRES = process.env.JWT_EXPIRES ?? "8h";
class AuthService {
    async login(usuario, password) {
        const ldapUrl = process.env.LDAP_URL ?? "ldap://fiduprevisora.com.co:389";
        const ldapDomain = process.env.LDAP_DOMAIN ?? "fiduprevisora.com.co";
        // Conectar al AD y validar credenciales + traer displayName
        let nombreReal = usuario; // fallback si no se encuentra en AD
        await new Promise((resolve, reject) => {
            const client = ldapjs_1.default.createClient({
                url: ldapUrl,
                timeout: 5000,
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
                }
                else {
                    // ✅ Credenciales OK → Buscar displayName usando sAMAccountName
                    const searchBase = `DC=fiduprevisora,DC=com,DC=co`;
                    const searchOptions = {
                        scope: "sub",
                        filter: `(sAMAccountName=${usuario})`,
                        attributes: ["displayName"],
                        sizeLimit: 1,
                    };
                    client.search(searchBase, searchOptions, (searchErr, res) => {
                        if (searchErr) {
                            // Si falla la búsqueda, continuar con fallback (nombreReal = usuario)
                            client.destroy();
                            resolve();
                            return;
                        }
                        let encontrado = false;
                        res.on("searchEntry", (entry) => {
                            encontrado = true;
                            console.log("[LDAP-DEBUG] searchEntry encontrada para:", usuario);
                            console.log("[LDAP-DEBUG] entry.pojo:", JSON.stringify(entry.pojo, null, 2));
                            const attrs = entry.pojo.attributes;
                            if (attrs && attrs.length > 0) {
                                const displayNameAttr = attrs.find((a) => a.type === "displayName");
                                if (displayNameAttr && displayNameAttr.values && displayNameAttr.values.length > 0) {
                                    nombreReal = displayNameAttr.values[0];
                                    console.log("[LDAP-DEBUG] ✅ displayName encontrado:", nombreReal);
                                }
                                else {
                                    console.log("[LDAP-DEBUG] ❌ displayName NOT found. Attrs:", JSON.stringify(attrs, null, 2));
                                }
                            }
                            else {
                                console.log("[LDAP-DEBUG] ❌ attrs vacío o no es array");
                            }
                        });
                        res.on("error", (err) => {
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
        const payload = {
            usuario,
            nombre: nombreReal, // ✅ Nombre real del AD (displayName)
        };
        const nuevoToken = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
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
    verificarToken(token) {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    /**
     * ✅ Verifica si un token ha sido revocado (logout en otro dispositivo)
     */
    estaTokenRevocado(token) {
        return AuthService.revokedTokens.has(token);
    }
}
exports.AuthService = AuthService;
// ✅ Token Blacklist - Sesiones únicas por usuario
AuthService.revokedTokens = new Set();
AuthService.usuarioTokenMap = new Map();
exports.authService = new AuthService();
