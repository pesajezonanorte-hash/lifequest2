import { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import * as userService from '../services/user.service';

export async function getCharacter(req: AuthRequest, res: Response): Promise<void> {
  try {
    const character = await userService.getCharacter(req.userId!);
    res.json({ character });
  } catch {
    res.status(500).json({ error: 'Error al obtener la ficha del personaje.' });
  }
}

export async function updateAvatar(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await userService.updateAvatar(req.userId!, req.body);
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Error al actualizar el avatar.' });
  }
}

export async function completeOnboarding(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await userService.completeOnboarding(req.userId!, req.body);
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Error al completar el onboarding.' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await userService.updateProfile(req.userId!, req.body as Parameters<typeof userService.updateProfile>[1]);
    res.json({ user });
  } catch {
    res.status(500).json({ error: 'Error al actualizar perfil.' });
  }
}

export async function equipItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const item = await userService.equipItem(req.userId!, req.body.inventoryItemId);
    res.json({ item });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg === 'ITEM_NOT_FOUND') {
      res.status(404).json({ error: 'Item no encontrado.' });
    } else {
      res.status(500).json({ error: 'Error al equipar el item.' });
    }
  }
}

export async function completeGuideDay(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await userService.completeGuideDay(req.userId!, Number(req.body.day));
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'GUIDE_DAY_INVALID') {
      res.status(400).json({ error: 'Día de guía inválido.' });
      return;
    }
    res.status(500).json({ error: 'Error al completar el día de guía.' });
  }
}

export async function dismissGuide(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await userService.dismissGuide(req.userId!);
    res.json(result);
  } catch {
    res.status(500).json({ error: 'Error al ocultar la guía.' });
  }
}
