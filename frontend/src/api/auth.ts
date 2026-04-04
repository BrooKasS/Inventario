/**
 * auth.ts
 * Funciones de autenticación para el frontend.
 * El token se guarda en localStorage y se adjunta
 * automáticamente a cada request via axios interceptor.
 */

import api from "./client";

const TOKEN_KEY = "inventario_token";
const USER_KEY  = "inventario_usuario";

/**
 * Login — llama al backend, guarda token y usuario.
 */
export async function loginUser(usuario: string, password: string): Promise<void> {
  const res = await api.post("/auth/login", { usuario, password });
  const { token, usuario: user } = res.data;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY,  user);
}

/**
 * Logout — borra token y redirige a login.
 */
export function logoutUser(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = "/login";
}

/**
 * Retorna el token guardado o null si no existe.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Retorna el usuario guardado o null.
 */
export function getUsuario(): string | null {
  return localStorage.getItem(USER_KEY);
}

/**
 * Verifica si hay sesión activa.
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}