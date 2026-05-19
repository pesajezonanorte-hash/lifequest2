import { useState } from 'react';
import { motion } from 'framer-motion';
import { PixelInput } from '../ui/PixelInput';
import { PixelButton } from '../ui/PixelButton';
import { PixelPanel } from '../ui/PixelPanel';

interface Props {
  initialName?: string;
  initialGender?: 'male' | 'female';
  lockGender?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onNext: (data: { displayName: string; birthDate: string; timezone: string; gender: 'male' | 'female' }) => void;
  onBack: () => void;
}

export function IdentityStep({
  initialName = '',
  initialGender = 'male',
  lockGender = false,
  secondaryActionLabel,
  onSecondaryAction,
  onNext,
  onBack,
}: Props) {
  const [name, setName] = useState(initialName);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>(initialGender);
  const [timezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);

  const canContinue = name.trim().length > 0;

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
    >
      <div className="text-center">
        <h2 className="font-pixel text-accent-gold mb-1" style={{ fontSize: '11px' }}>
          QUIEN ERES?
        </h2>
        <p className="font-vt text-text-secondary text-xl">
          Cuentame sobre el heroe que esta comenzando.
        </p>
      </div>

      <PixelPanel className="p-5 space-y-5">
        {!lockGender && (
          <div>
            <label className="font-pixel text-text-secondary block mb-2" style={{ fontSize: '8px' }}>
              ERES HEROE O HEROINA?
            </label>
            <div className="flex gap-3">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 border-2 font-vt text-lg transition-colors ${
                    gender === g
                      ? 'border-accent-gold bg-accent-gold/10 text-accent-gold'
                      : 'border-border-pixel text-text-secondary hover:border-accent-gold'
                  }`}
                >
                  {g === 'male' ? 'Heroe' : 'Heroina'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="font-pixel text-text-secondary block mb-2" style={{ fontSize: '8px' }}>
            COMO TE LLAMARAN EN EL REINO?
          </label>
          <PixelInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre de heroe..."
            maxLength={60}
          />
        </div>

        <div>
          <label className="font-pixel text-text-secondary block mb-2" style={{ fontSize: '8px' }}>
            FECHA DE NACIMIENTO (OPCIONAL)
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-xl px-3 py-2 focus:outline-none focus:border-accent-gold"
          />
          <p className="font-vt text-text-secondary text-sm mt-1">
            Para celebrar tu aniversario en LifeQuest
          </p>
        </div>

        <div>
          <label className="font-pixel text-text-secondary block mb-2" style={{ fontSize: '8px' }}>
            ZONA HORARIA (AUTO-DETECTADA)
          </label>
          <div className="bg-bg-deep border-2 border-border-pixel px-3 py-2">
            <span className="font-vt text-text-secondary text-lg">{timezone}</span>
          </div>
        </div>
      </PixelPanel>

      <div className="flex gap-3">
        <PixelButton variant="ghost" onClick={onBack} className="flex-1">
          ATRAS
        </PixelButton>
        <PixelButton
          variant="primary"
          onClick={() => canContinue && onNext({ displayName: name.trim(), birthDate, timezone, gender })}
          disabled={!canContinue}
          className="flex-1"
        >
          SIGUIENTE
        </PixelButton>
      </div>

      {secondaryActionLabel && onSecondaryAction && (
        <button
          type="button"
          onClick={onSecondaryAction}
          className="text-center font-vt text-base text-[var(--text-secondary)] underline decoration-dotted underline-offset-4 transition-colors hover:text-[var(--text-primary)]"
        >
          {secondaryActionLabel}
        </button>
      )}
    </motion.div>
  );
}
