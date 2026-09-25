import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import * as authService from '../services/auth.service';

/**
 * Al montar, intenta recuperar la sesión del usuario usando el refresh token
 * almacenado en la httpOnly cookie. Si falla, el usuario no está autenticado.
 */
export function useBootstrapAuth() {
  const { setAuth, logout, setLoading } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const { user, accessToken } = await authService.refreshToken();
        if (!cancelled) setAuth(user, accessToken);
      } catch {
        if (!cancelled) logout();
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [setAuth, logout]);
}

/**
 * Re-sincroniza el usuario desde el servidor (XP, gold, nivel, rachas, stats…).
 *
 * El store solo se poblaba al hacer boot de la app, así que cualquier XP/gold
 * ganado durante la sesión (hábitos, misiones, gym, focus…) no se reflejaba en
 * el HUD ni en "Ficha del héroe" aunque el leaderboard (que lee la BD) sí lo
 * mostraba. Llamar a esto después de cualquier acción que otorgue recompensas.
 *
 * Falla en silencio: un error de red no debe romper la UI.
 */
export async function refreshUser(): Promise<void> {
  try {
    const user = await authService.fetchMe();
    useAuthStore.getState().updateUser(user);
  } catch {
    // no-op: conservamos los datos actuales del store
  }
}
