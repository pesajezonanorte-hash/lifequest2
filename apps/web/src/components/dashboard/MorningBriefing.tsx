import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Compass } from 'lucide-react';
import { fetchMorningBriefing } from '../../services/lifescore.service';
import { E } from '@/components/ui/glyphs';

interface Props {
  onClose: () => void;
}

export function MorningBriefing({ onClose }: Props) {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMorningBriefing()
      .then((data) => {
        setBriefing(data.briefing);
        setLoading(false);
      })
      .catch(() => {
        setBriefing('**Enfoque hoy:** Mantén tus misiones al día.\n**Consejo:** Avanza con constancia y cuida tus rachas.');
        setLoading(false);
      });
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top subtle glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] via-[var(--accent-gold)] to-[var(--accent-blue)]" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-panel-light)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-gold)]">
              <Compass size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Briefing del Día</h2>
              <p className="text-xs text-[var(--text-secondary)]">Mensaje rápido del Sabio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel-light)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="py-2">
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-[var(--text-secondary)] font-medium">
              <Sparkles size={16} className="animate-spin text-[var(--accent-gold)]" />
              <span>Sintonizando al Sabio...</span>
            </div>
          ) : (
            <div className="text-sm leading-relaxed text-[var(--text-primary)] space-y-2 whitespace-pre-line font-sans">
              {briefing}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-[var(--border-soft)] flex justify-end">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-95 transition-opacity"
          >
            Entendido, ¡vamos!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
