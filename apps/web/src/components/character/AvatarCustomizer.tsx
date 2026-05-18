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

const HAIR_STYLE_LABELS: Record<HairStyle, string> = {
  short: 'Corto',
  medium: 'Medio',
  long: 'Largo',
  shaved: 'Afeitado',
  copete: 'Copete',
  afro: 'Afro',
  recogido: 'Recogido',
  trenzas: 'Trenzas',
  ondulado: 'Ondulado',
};

const ACCESSORY_LABELS: Record<Accessory, string> = {
  none: 'Ninguno',
  glasses: 'Gafas',
  cap: 'Gorro',
  headband: 'Diadema',
  earrings: 'Aretes',
  scarf: 'Bufanda',
};

const EXPRESSION_LABELS: Record<Expression, string> = {
  normal: 'Normal',
  smile: 'Sonriente',
  serious: 'Serio',
  determined: 'Decidido',
};

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
              <motion.div className="flex items-center justify-between p-5 border-b-2 border-accent-gold/30 bg-gradient-to-r from-accent-gold/10 to-transparent">
                <h2 className="font-pixel text-accent-gold tracking-widest" style={{ fontSize: '11px', textShadow: '2px 2px 0 rgba(212, 160, 23, 0.3)' }}>
                  ✨ PERSONALIZAR ✨
                </h2>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="text-text-secondary hover:text-accent-gold transition-colors"
                >
                  <X size={18} />
                </motion.button>
              </motion.div>

              <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="font-pixel text-accent-gold block mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                    GÉNERO
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['male', 'female'] as const).map((gender) => (
                      <motion.button
                        key={gender}
                        onClick={() => {
                          update('bodyType')(gender);
                          setConfig((c) => {
                            const femaleStyles: HairStyle[] = ['long', 'short', 'recogido', 'trenzas', 'ondulado', 'afro'];
                            const maleStyles: HairStyle[] = ['short', 'medium', 'long', 'shaved', 'copete', 'afro'];
                            const validStyles = gender === 'female' ? femaleStyles : maleStyles;
                            return {
                              ...c,
                              bodyType: gender,
                              hairStyle: validStyles.includes(c.hairStyle) ? c.hairStyle : validStyles[0],
                            };
                          });
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`py-1.5 px-1.5 text-xs font-vt border-2 transition-all rounded-lg ${
                          config.bodyType === gender
                            ? 'border-accent-gold bg-accent-gold/20 text-accent-gold font-bold shadow-pixel-gold'
                            : 'border-border-pixel text-text-secondary hover:border-accent-gold hover:bg-white/5'
                        }`}
                      >
                        {gender === 'male' ? '♂️ Masculino' : '♀️ Femenino'}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center py-2">
                  <motion.div
                    key={JSON.stringify(config)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-2xl" style={{ background: 'radial-gradient(circle at center, rgba(212,160,23,0.1), transparent)' }} />
                    <MiguelSprite
                      size={140}
                      bodyType={config.bodyType}
                      hairStyle={config.hairStyle}
                      hairColor={config.hairColor}
                      skinColor={config.skinColor}
                      shirtColor={config.shirtColor}
                      pantsColor={config.pants}
                      accessory={config.accessory}
                      expression={config.expression}
                      animate="celebrate"
                    />
                  </motion.div>
                </div>

                <div>
                  <label className="font-pixel text-accent-gold block mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                    ESTILOS DE CABELLO
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {hairStyles.map((style) => (
                      <motion.button
                        key={style}
                        onClick={() => update('hairStyle')(style)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`py-1.5 px-1.5 text-xs font-vt border-2 transition-all rounded-lg ${
                          config.hairStyle === style
                            ? 'border-accent-gold bg-accent-gold/20 text-accent-gold font-bold shadow-pixel-gold'
                            : 'border-border-pixel text-text-secondary hover:border-accent-gold hover:bg-white/5'
                        }`}
                      >
                        {HAIR_STYLE_LABELS[style]}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <ColorPicker label="CABELLO" value={config.hairColor} colors={HAIR_COLORS} onChange={update('hairColor')} />
                <ColorPicker label="PIEL" value={config.skinColor} colors={SKIN_COLORS} onChange={update('skinColor')} />
                <ColorPicker label="CAMISA" value={config.shirtColor} colors={SHIRT_COLORS} onChange={update('shirtColor')} />
                <ColorPicker label="PANTALÓN" value={config.pants} colors={PANTS_COLORS} onChange={update('pants')} />

                <div>
                  <label className="font-pixel text-accent-gold block mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                    ACCESORIOS
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ACCESSORIES.map((acc) => (
                      <motion.button
                        key={acc}
                        onClick={() => update('accessory')(acc)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`py-1.5 px-1.5 text-xs font-vt border-2 transition-all rounded-lg ${
                          config.accessory === acc
                            ? 'border-accent-gold bg-accent-gold/20 text-accent-gold font-bold shadow-pixel-gold'
                            : 'border-border-pixel text-text-secondary hover:border-accent-gold hover:bg-white/5'
                        }`}
                      >
                        {ACCESSORY_LABELS[acc]}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-pixel text-accent-gold block mb-2" style={{ fontSize: '8px', letterSpacing: '0.1em' }}>
                    EXPRESIÓN
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {EXPRESSIONS.map((expr) => (
                      <motion.button
                        key={expr}
                        onClick={() => update('expression')(expr)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`py-1.5 px-1.5 text-xs font-vt border-2 transition-all rounded-lg ${
                          config.expression === expr
                            ? 'border-accent-gold bg-accent-gold/20 text-accent-gold font-bold shadow-pixel-gold'
                            : 'border-border-pixel text-text-secondary hover:border-accent-gold hover:bg-white/5'
                        }`}
                      >
                        {EXPRESSION_LABELS[expr]}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-3 border-t border-border-pixel">
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <PixelButton variant="ghost" onClick={onClose} className="w-full">
                      CANCELAR
                    </PixelButton>
                  </motion.div>
                  <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <PixelButton variant="primary" onClick={handleSave} disabled={saving} className="w-full">
                      {saving ? 'GUARDANDO...' : 'GUARDAR ✨'}
                    </PixelButton>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
