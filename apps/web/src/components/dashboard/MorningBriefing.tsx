import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMorningBriefing } from '../../services/lifescore.service';

interface Props {
  onClose: () => void;
}

export function MorningBriefing({ onClose }: Props) {
  const [briefing, setBriefing] = useState('');
  const [loading, setLoading] = useState(true);
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    fetchMorningBriefing()
      .then((data) => {
        setBriefing(data.briefing);
        setLoading(false);
      })
      .catch(() => {
        setBriefing('¡Buenos días, héroe! El Sabio no pudo conectarse hoy. ¡Que tengas un día épico igual!');
        setLoading(false);
      });
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (!briefing || loading) return;
    let i = 0;
    setDisplayedText('');
    const id = setInterval(() => {
      setDisplayedText(briefing.slice(0, i + 1));
      i++;
      if (i >= briefing.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [briefing, loading]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg my-auto max-h-[85vh] flex flex-col"
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div
          className="pixel-panel p-5 sm:p-6 relative overflow-y-auto flex flex-col cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #1a0a2e 0%, #0d1b4b 50%, #0a2a1a 100%)',
            maxHeight: '85vh',
            WebkitOverflowScrolling: 'touch',
          }}
          onClick={() => {
            if (briefing && displayedText.length < briefing.length) {
              setDisplayedText(briefing);
            }
          }}
        >
          {/* Stars background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </div>

          {/* Header */}
          <div className="text-center mb-5 relative shrink-0">
            <motion.div
              className="text-5xl mb-2"
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              🧙‍♂️
            </motion.div>
            <h2 className="pixel-text text-xl text-yellow-300">Briefing del Día</h2>
            <p className="font-mono text-xs text-purple-300 mt-1">El Sabio del Castillo te habla</p>
          </div>

          {/* Content */}
          <div className="relative flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-yellow-300 rounded-full"
                    animate={{ y: [0, -12, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            ) : (
              <div
                className="font-mono text-sm leading-relaxed text-gray-100 whitespace-pre-line min-h-[100px]"
                style={{ textShadow: '0 0 8px rgba(168, 85, 247, 0.5)' }}
              >
                {displayedText}
                {displayedText.length < briefing.length && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-yellow-300 ml-1 align-middle"
                  />
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          <motion.div
            className="mt-6 text-center shrink-0 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: !loading ? 1 : 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="pixel-button px-8 py-3 text-sm hover:scale-105 active:scale-95 transition-transform"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              ⚔️ Entendido, ¡vamos!
            </button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
