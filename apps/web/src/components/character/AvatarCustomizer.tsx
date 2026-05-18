import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { MiguelSprite } from './MiguelSprite';
import { ColorPicker } from '../onboarding/ColorPicker';
import { PixelButton } from '../ui/PixelButton';
import { updateAvatar } from '../../services/user.service';
import { useAuthStore } from '../../store/authStore';
import type { AvatarConfig, HairStyle, Accessory, Expression } from '@lifequest/shared';

const HAIR_COLORS  = ['#2c1810','#4a3728','#8b4513','#d4a017','#c8a2c8','#708090','#1a1a1a','#ff6b6b'];
const SKIN_COLORS  = ['#fde8d0','#f5c89f','#c68642','#a0522d','#7b3f2c','#4a2010'];
const SHIRT_COLORS = ['#4d96ff','#ff6b9d','#4ecdc4','#6bcf7f','#ffd23f','#ff6347','#9b59b6','#2c3e50','#e74c3c','#1abc9c'];
const PANTS_COLORS = ['#37474f','#1a237e','#4e342e','#1b5e20','#880e4f','#263238'];
const HAIR_STYLES_MALE: HairStyle[] = ['short', 'medium', 'long', 'shaved', 'copete', 'afro'];
const HAIR_STYLES_FEMALE: HairStyle[] = ['long', 'short', 'recogido', 'trenzas', 'ondulado', 'afro'];
const ACCESSORIES: Accessory[] = ['none', 'glasses', 'cap', 'headband', 'earrings', 'scarf'];
const EXPRESSIONS: Expression[] = ['normal', 'smile', 'serious', 'determined'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function AvatarCustomizer({ isOpen, onClose }: Props) {
  const { user, updateUser } = useAuthStore();
  const [config, setConfig] = useState<AvatarConfig>(user?.avatarConfig ?? {
    bodyType: 'male',
    hairStyle: 'short',
    hairColor: '#2c1810',
    skinColor: '#c68642',
    shirtColor: '#4d96ff',
    pants: '#37474f',
    accessory: 'none',
    expression: 'normal',
    pet: null,
  });
  const [saving, setSaving] = useState(false);

  const update = (key: keyof AvatarConfig) => (value: string) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const hairStyles = (config.bodyType === 'female') ? HAIR_STYLES_FEMALE : HAIR_STYLES_MALE;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedUser = await updateAvatar(config);
      updateUser(updatedUser);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="bg-bg-panel border-4 border-accent-gold shadow-pixel-gold max-w-sm w-full max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b-2 border-border-pixel">
                <h2 className="font-pixel text-accent-gold" style={{ fontSize: '9px' }}>
                  PERSONALIZAR AVATAR
                </h2>
                <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
                  <X size={16} />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="flex justify-center">
                  <motion.div key={JSON.stringify(config)} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
                    <MiguelSprite
                      size={100}
                      bodyType={config.bodyType}
                      hairStyle={config.hairStyle}
                      hairColor={config.hairColor}
                      skinColor={config.skinColor}
                      shirtColor={config.shirtColor}
                      pantsColor={config.pants}
                      accessory={config.accessory}
                      expression={config.expression}
                      animate="idle"
                    />
                  </motion.div>
                </div>

                <div>
                  <label className="font-pixel text-text-secondary block mb-1" style={{ fontSize: '7px' }}>
                    ESTILO DE CABELLO
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {hairStyles.map((style) => (
                      <button
                        key={style}
                        onClick={() => update('hairStyle')(style)}
                        className={`py-0.5 px-1 text-xs font-vt border border-border-pixel transition-colors ${
                          config.hairStyle === style
                            ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                            : 'text-text-secondary hover:border-accent-gold'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <ColorPicker label="CABELLO" value={config.hairColor} colors={HAIR_COLORS} onChange={update('hairColor')} />
                <ColorPicker label="PIEL" value={config.skinColor} colors={SKIN_COLORS} onChange={update('skinColor')} />
                <ColorPicker label="CAMISA" value={config.shirtColor} colors={SHIRT_COLORS} onChange={update('shirtColor')} />
                <ColorPicker label="PANTALÓN" value={config.pants} colors={PANTS_COLORS} onChange={update('pants')} />

                <div>
                  <label className="font-pixel text-text-secondary block mb-1" style={{ fontSize: '7px' }}>
                    ACCESORIOS
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {ACCESSORIES.map((acc) => (
                      <button
                        key={acc}
                        onClick={() => update('accessory')(acc)}
                        className={`py-0.5 px-1 text-xs font-vt border border-border-pixel transition-colors ${
                          config.accessory === acc
                            ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                            : 'text-text-secondary hover:border-accent-gold'
                        }`}
                      >
                        {acc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-pixel text-text-secondary block mb-1" style={{ fontSize: '7px' }}>
                    EXPRESIÓN
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    {EXPRESSIONS.map((expr) => (
                      <button
                        key={expr}
                        onClick={() => update('expression')(expr)}
                        className={`py-0.5 px-1 text-xs font-vt border border-border-pixel transition-colors ${
                          config.expression === expr
                            ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                            : 'text-text-secondary hover:border-accent-gold'
                        }`}
                      >
                        {expr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <PixelButton variant="ghost" onClick={onClose} className="flex-1">CANCELAR</PixelButton>
                  <PixelButton variant="primary" onClick={handleSave} disabled={saving} className="flex-1">
                    {saving ? 'GUARDANDO...' : 'GUARDAR ✓'}
                  </PixelButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
