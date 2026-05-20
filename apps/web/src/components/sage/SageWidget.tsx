import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { SagePanel } from './SagePanel';
import { useUIStore } from '../../store/uiStore';

const SEEN_KEY = 'sage-daily-seen';

export function SageWidget() {
  const { sageOpen, openSage, closeSage } = useUIStore();

  const hasNew = (() => {
    const today = new Date().toDateString();
    return localStorage.getItem(SEEN_KEY) !== today;
  })();

  const handleOpen = () => {
    openSage();
    localStorage.setItem(SEEN_KEY, new Date().toDateString());
  };

  return (
    <>
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-lg transition-shadow hover:border-[var(--accent-gold)]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="El Sabio — Asistente IA"
      >
        <Sparkles size={22} className="text-[var(--accent-gold)]" />

        {hasNew && (
          <motion.div
            className="absolute -right-1 -top-1 h-4 w-4 rounded-full border-2 border-[var(--bg-panel)] bg-[var(--accent-gold)]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      <AnimatePresence>
        {sageOpen && <SagePanel onClose={closeSage} />}
      </AnimatePresence>
    </>
  );
}
