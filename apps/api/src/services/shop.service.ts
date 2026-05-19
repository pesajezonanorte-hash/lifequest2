import { prisma } from '../lib/prisma';

export async function listShopItems(userId: string) {
  const [items, inventory] = await Promise.all([
    prisma.shopItem.findMany({ orderBy: { cost: 'asc' } }),
    prisma.inventoryItem.findMany({ where: { userId }, include: { shopItem: true } }),
  ]);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  return items.map(item => {
    const inventoryEntry = inventory.find(inv => inv.shopItemId === item.id);
    return {
      ...item,
      createdAt: item.createdAt.toISOString(),
      owned: !!inventoryEntry,
      equipped: inventoryEntry?.isEquipped ?? false,
      locked: item.levelRequired > user.level,
    };
  });
}

export async function purchaseItem(userId: string, shopItemId: string) {
  const item = await prisma.shopItem.findUniqueOrThrow({ where: { id: shopItemId } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.level < item.levelRequired) throw new Error('Nivel insuficiente');
  if (user.gold < item.cost) throw new Error('Gold insuficiente');

  const existing = await prisma.inventoryItem.findFirst({ where: { userId, shopItemId } });
  if (existing) throw new Error('Ya tienes este ítem');

  const [updatedUser, inventoryItem] = await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { gold: { decrement: item.cost } } }),
    prisma.inventoryItem.create({ data: { userId, shopItemId }, include: { shopItem: true } }),
  ]);

  return { user: updatedUser, inventoryItem };
}

export async function listInventory(userId: string) {
  return prisma.inventoryItem.findMany({
    where: { userId },
    include: { shopItem: true },
    orderBy: { purchasedAt: 'desc' },
  });
}

const EQUIP_TYPES = new Set(['COSMETIC', 'HAT', 'AURA', 'FRAME', 'THEME']);

const TYPE_TO_USER_FIELD: Record<string, string> = {
  HAT: 'equippedHat',
  AURA: 'equippedAura',
  FRAME: 'equippedFrame',
  THEME: 'equippedTheme',
};

export async function equipItem(userId: string, inventoryItemId: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: inventoryItemId, userId },
    include: { shopItem: true },
  });
  if (!item) throw new Error('No encontrado');

  const { type, imageKey } = item.shopItem;
  if (!EQUIP_TYPES.has(type)) throw new Error('Este ítem no se puede equipar');

  const willEquip = !item.isEquipped;

  // Unequip all items of the same type
  await prisma.inventoryItem.updateMany({
    where: { userId, id: { not: inventoryItemId }, shopItem: { type } },
    data: { isEquipped: false },
  });

  // Update User equipped field for HAT/AURA/FRAME/THEME
  const userField = TYPE_TO_USER_FIELD[type];
  if (userField) {
    await prisma.user.update({
      where: { id: userId },
      data: { [userField]: willEquip ? (imageKey ?? null) : null },
    });
  }

  return prisma.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { isEquipped: willEquip },
    include: { shopItem: true },
  });
}

export async function useItem(userId: string, inventoryItemId: string) {
  const item = await prisma.inventoryItem.findFirst({
    where: { id: inventoryItemId, userId },
    include: { shopItem: true },
  });
  if (!item) throw new Error('No encontrado');
  if (item.shopItem.type !== 'POWERUP' && item.shopItem.type !== 'PASS') throw new Error('No es un consumible');

  return prisma.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { usedAt: new Date(), expiresAt: new Date(Date.now() + 86400000) },
    include: { shopItem: true },
  });
}
