import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { REFRESH_COOKIE_OPTIONS } from '../lib/jwt';
import type { AuthRequest } from '../middleware/auth.middleware';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({ user, accessToken });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'ERROR';
    if (msg === 'EMAIL_TAKEN') {
      res.status(409).json({ error: 'Este email ya está en uso, héroe.' });
    } else if (msg === 'USERNAME_TAKEN') {
      res.status(409).json({ error: 'Este nombre de usuario ya existe.' });
    } else {
      res.status(500).json({ error: 'Error al crear la cuenta.' });
    }
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.json({ user, accessToken });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'ERROR';
    if (msg === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    } else {
      res.status(500).json({ error: 'Error al iniciar sesión.' });
    }
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Refresh token requerido.' });
    return;
  }

  try {
    const { accessToken, user } = await authService.refreshAccessToken(token);
    res.json({ accessToken, user });
  } catch {
    res.clearCookie('refreshToken', { path: '/api/v1' });
    res.status(401).json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
  }
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  if (req.userId) {
    await authService.logoutUser(req.userId);
  }
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  res.json({ message: 'Hasta pronto, héroe.' });
}

export async function me(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { prisma } = await import('../lib/prisma');
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: req.userId },
      select: {
        id: true, email: true, username: true, displayName: true,
        level: true, xp: true, xpToNextLevel: true, gold: true,
        hp: true, maxHp: true, mp: true, maxMp: true,
        strength: true, intelligence: true, charisma: true,
        avatarConfig: true, timezone: true, currency: true,
        language: true, relationshipStatus: true, createdAt: true,
        onboardingCompleted: true, birthDate: true,
        currentStreak: true, longestStreak: true,
      },
    });
    res.json({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        birthDate: user.birthDate?.toISOString() ?? null,
      },
    });
  } catch {
    res.status(404).json({ error: 'Usuario no encontrado.' });
  }
}
