import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import type { ShopItem, InventoryItem } from '@lifequest/shared';
import * as shopService from '../../services/shop.service';

const TYPE_TABS = [
  { key: '', label: '🛒 Todo' },
  { key: 'HAT', label: '🎩 Sombreros' },
  { key: 'AURA', label: '✨ Auras' },
  { key: 'FRAME', label: '🖼️ Marcos' },
  { key: 'THEME', label: '🎨 Temas' },
  { key: 'POWERUP', label: '⚡ Power-ups' },
  { key: 'PASS', label: '🎭 Pases' },
  { key: 'COSMETIC', label: '👗 Cosméticos' },
] as const;

const TYPE_LABELS: Record<string, string> = {
  COSMETIC: 'Cosmético', POWERUP: 'Power-up', DECORATION: 'Decoración',
  PASS: 'Pase especial', HAT: 'Sombrero', AURA: 'Aura', FRAME: 'Marco', THEME: 'Tema de color',
};

const EQUIPPABLE_TYPES = new Set(['COSMETIC', 'HAT', 'AURA', 'FRAME', 'THEME']);

function ConfirmPurchaseModal({ item, userGold, onConfirm, onClose }: { item: ShopItem; userGold: number; onConfirm: () => void; onClose: () => void }) {
  const canAfford = userGold >= item.cost;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }} className="bg-bg-panel border-2 border-border-pixel w-full max-w-sm space-y-4 p-5" onClick={e => e.stopPropagation()}>
        <p className="font-pixel text-accent-gold text-center" style={{ fontSize: '10px' }}>CONFIRMAR COMPRA</p>
        <div className="text-center space-y-2">
          <p className="font-vt text-text-primary text-2xl">{item.name}</p>
          <p className="font-vt text-text-secondary text-base">{item.description}</p>
          <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>TIPO: {TYPE_LABELS[item.type]}</p>
        </div>
        <PixelPanel className="p-3 flex justify-between items-center">
          <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>TU GOLD</p>
          <p className={`font-pixel ${canAfford ? 'text-accent-gold' : 'text-accent-red'}`} style={{ fontSize: '12px' }}>🪙 {userGold}</p>
        </PixelPanel>
        <PixelPanel className="p-3 flex justify-between items-center">
          <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>PRECIO</p>
          <p className="font-pixel text-accent-gold" style={{ fontSize: '12px' }}>🪙 {item.cost}</p>
        </PixelPanel>
        {!canAfford && <p className="font-pixel text-accent-red text-center" style={{ fontSize: '8px' }}>GOLD INSUFICIENTE</p>}
        <div className="flex gap-2">
          <PixelButton variant="ghost" onClick={onClose} className="flex-1">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={onConfirm} disabled={!canAfford} className="flex-1">
            ¡COMPRAR!
          </PixelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ShopPage() {
  const { user, updateUser } = useAuthStore();
  const toast = useToast();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>('');
  const [shopTab, setShopTab] = useState<'shop' | 'inventory'>('shop');
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [shopItems, inv] = await Promise.all([shopService.fetchShopItems(), shopService.fetchInventory()]);
      setItems(shopItems);
      setInventory(inv);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handlePurchase(item: ShopItem) {
    setPurchasing(item.id);
    setConfirmItem(null);
    // Optimistic: decrease gold
    if (user) updateUser({ ...user, gold: user.gold - item.cost });
    try {
      const result = await shopService.purchaseItem(item.id);
      updateUser(result.user as never);
      setInventory(prev => [...prev, result.inventoryItem]);
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, owned: true } : i));
      toast.success(`¡${item.name} comprado! 🎉`);
    } catch (err) {
      if (user) updateUser({ ...user, gold: user.gold + item.cost }); // rollback
      toast.error(err instanceof Error ? err.message : 'Error al comprar');
    } finally { setPurchasing(null); }
  }

  async function handleEquip(invItem: InventoryItem) {
    const sameType = EQUIPPABLE_TYPES.has(invItem.shopItem.type);
    setInventory(prev => prev.map(i => ({
      ...i,
      isEquipped: i.id === invItem.id ? !i.isEquipped : (sameType && i.shopItem.type === invItem.shopItem.type ? false : i.isEquipped),
    })));
    try {
      const updated = await shopService.equipItem(invItem.id);
      setInventory(prev => prev.map(i => i.id === updated.id ? updated : i));
      toast.info(updated.isEquipped ? `${invItem.shopItem.name} equipado` : `${invItem.shopItem.name} desequipado`);
    } catch {
      load(); // rollback
      toast.error('Error al equipar');
    }
  }

  const filtered = tab ? items.filter(i => i.type === tab) : items;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>🛒 EL MERCADO</h1>
          <p className="font-vt text-text-secondary text-base">Gasta tu Gold sabiamente, héroe</p>
        </div>
        <div className="flex items-center gap-2 bg-bg-panel border-2 border-border-pixel px-3 py-2">
          <span className="font-pixel text-accent-gold" style={{ fontSize: '8px' }}>GOLD</span>
          <motion.span
            key={user?.gold}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            className="font-pixel text-accent-gold"
            style={{ fontSize: '14px' }}
          >
            🪙 {user?.gold ?? 0}
          </motion.span>
        </div>
      </div>

      {/* Shop / Inventory tabs */}
      <div className="flex gap-1">
        {[['shop', '🛒 Tienda'], ['inventory', '🎒 Inventario']].map(([key, label]) => (
          <button key={key} onClick={() => setShopTab(key as 'shop' | 'inventory')} className={`px-4 py-2 border-2 font-pixel transition-all ${shopTab === key ? 'border-accent-gold bg-accent-gold text-bg-deep' : 'border-border-pixel text-text-secondary'}`} style={{ fontSize: '8px' }}>
            {label}
          </button>
        ))}
      </div>

      {shopTab === 'shop' && (
        <>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TYPE_TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`flex-shrink-0 px-3 py-1.5 border-2 font-pixel transition-all ${tab === t.key ? 'border-accent-gold bg-accent-gold text-bg-deep' : 'border-border-pixel text-text-secondary'}`} style={{ fontSize: '8px' }}>
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8"><motion.p className="font-vt text-text-secondary text-xl" animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>Cargando tienda...</motion.p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <AnimatePresence>
                {filtered.map((item, i) => {
                  const isLocked = (item as ShopItem & { locked?: boolean }).locked;
                  const isOwned = item.owned;
                  const isBuying = purchasing === item.id;
                  return (
                    <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                      <PixelPanel className={`p-4 space-y-3 ${isLocked ? 'opacity-50' : 'hover:border-accent-gold/50'} transition-all`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-vt text-text-primary text-xl">{item.name}</p>
                            <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>{TYPE_LABELS[item.type]}</p>
                          </div>
                          {isLocked ? (
                            <div className="text-right">
                              <p className="text-2xl">🔒</p>
                              <p className="font-pixel text-text-secondary" style={{ fontSize: '6px' }}>Lv.{item.levelRequired}</p>
                            </div>
                          ) : isOwned ? (
                            <span className="font-pixel text-accent-green" style={{ fontSize: '8px' }}>✓ OWNED</span>
                          ) : null}
                        </div>
                        {item.description && <p className="font-vt text-text-secondary text-base">{item.description}</p>}
                        <div className="flex items-center justify-between">
                          <p className="font-pixel text-accent-gold" style={{ fontSize: '12px' }}>🪙 {item.cost}</p>
                          {!isLocked && !isOwned && (
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              disabled={isBuying}
                              onClick={() => setConfirmItem(item)}
                              className="font-pixel border-2 border-accent-gold text-accent-gold px-3 py-1.5 hover:bg-accent-gold hover:text-bg-deep transition-colors disabled:opacity-50"
                              style={{ fontSize: '8px' }}
                            >
                              {isBuying ? '...' : 'COMPRAR'}
                            </motion.button>
                          )}
                        </div>
                      </PixelPanel>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {shopTab === 'inventory' && (
        <div className="space-y-3">
          {inventory.length === 0 ? (
            <PixelPanel className="p-8 text-center">
              <p className="text-4xl mb-2">🎒</p>
              <p className="font-pixel text-text-secondary" style={{ fontSize: '9px' }}>INVENTARIO VACÍO</p>
              <p className="font-vt text-text-secondary text-base mt-1">Ve a la tienda y consigue algo genial</p>
            </PixelPanel>
          ) : (
            <AnimatePresence>
              {inventory.map((inv, i) => (
                <motion.div key={inv.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                  <PixelPanel className="p-3 flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-vt text-text-primary text-xl">{inv.shopItem.name}</p>
                      <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>{TYPE_LABELS[inv.shopItem.type]}</p>
                      {inv.expiresAt && (
                        <p className="font-pixel text-accent-gold" style={{ fontSize: '7px' }}>
                          Expira: {new Date(inv.expiresAt).toLocaleString('es-CO')}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {EQUIPPABLE_TYPES.has(inv.shopItem.type) && (
                        <PixelButton variant={inv.isEquipped ? 'primary' : 'secondary'} onClick={() => handleEquip(inv)}>
                          {inv.isEquipped ? 'EQUIPADO' : 'EQUIPAR'}
                        </PixelButton>
                      )}
                    </div>
                  </PixelPanel>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      <AnimatePresence>
        {confirmItem && (
          <ConfirmPurchaseModal
            item={confirmItem}
            userGold={user?.gold ?? 0}
            onConfirm={() => handlePurchase(confirmItem)}
            onClose={() => setConfirmItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
