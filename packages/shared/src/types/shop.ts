export type ShopItemType = 'COSMETIC' | 'POWERUP' | 'DECORATION' | 'PASS' | 'HAT' | 'AURA' | 'FRAME' | 'THEME';

export interface ShopItem {
  id: string;
  name: string;
  description?: string;
  type: ShopItemType;
  cost: number;
  imageKey?: string;
  levelRequired: number;
  isLimited: boolean;
  createdAt: string;
  owned?: boolean;
  equipped?: boolean;
}

export interface InventoryItem {
  id: string;
  userId: string;
  shopItemId: string;
  shopItem: ShopItem;
  isEquipped: boolean;
  purchasedAt: string;
  usedAt?: string;
  expiresAt?: string;
}
