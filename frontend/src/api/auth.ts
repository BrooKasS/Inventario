/**
 * auth.ts
 * Funciones de autenticación para el frontend.
 * El token se guarda en sessionStorage (por tab) y se adjunta
 * automáticamente a cada request via axios interceptor.
 * sessionStorage: cada tab tiene su propia sesión (protege contra clonación)
 */

import api from "./client";

const TOKEN_KEY  = "inventario_token";
const USER_KEY   = "inventario_usuario";
const NOMBRE_KEY = "inventario_nombre";
const ROL_KEY    = "inventario_rol";

/**
 * Login — llama al backend, guarda token, usuario, nombre real y rol.
 */
export async function loginUser(usuario: string, password: string): Promise<void> {
  const res = await api.post("/auth/login", { usuario, password });
  const { token, usuario: user, nombre, rol } = res.data;
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, user);
  sessionStorage.setItem(NOMBRE_KEY, nombre || user);
  sessionStorage.setItem(ROL_KEY, rol ?? "AUDITOR");
}

/**
 * Logout — borra token, usuario, nombre y rol, luego redirige a login.
 */
export function logoutUser(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(NOMBRE_KEY);
  sessionStorage.removeItem(ROL_KEY);
  window.location.href = "/login";
}

/**
 * Retorna el token guardado o null si no existe.
 */
export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Retorna el usuario guardado o null.
 */
export function getUsuario(): string | null {
  return sessionStorage.getItem(USER_KEY);
}

/**
 * funcion para obtener el nombre completo de la persona
 */
export function getNombreReal(): string | null {
  return sessionStorage.getItem(NOMBRE_KEY);
}

/**
 * Verifica si hay sesión activa.
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Obtiene el rol del usuario (ADMIN o AUDITOR)
 */
export function getRol(): "ADMIN" | "AUDITOR" {
  return (sessionStorage.getItem(ROL_KEY) as "ADMIN" | "AUDITOR") ?? "AUDITOR";
}