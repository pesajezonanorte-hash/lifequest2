import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onDone: () => void;
}

function PixelStar({ style }: { style: React.CSSProperties }) {
  return (
    <motion.div
      className="absolute bg-white"
      style={{ width: 1, height: 1, ...style }}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, style.opacity as number, (style.opacity as number) * 0.4] }}
      transition={{
        delay: (style.left as number) / 2000,
        duration: 2 + Math.random() * 2,
        repeat: Infinity,
        repeatType: 'reverse',
      }}
    />
  );
}

// Pre-generate star positions so they're stable across renders
const STARS = Array.from({ length: 80 }, (_, i) => ({
  left: (i * 37 + 17) % 100,
  top: (i * 53 + 23) % 100,
  opacity: 0.2 + ((i * 13) % 60) / 100,
  size: i % 7 === 0 ? 2 : 1,
}));

export function SplashScreen({ onDone }: Props) {
  const [lettersShown, setLettersShown] = useState(0);
  const [showTagline, setShowTagline] = useState(false);
  const [showSprite, setShowSprite] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const [barPct, setBarPct] = useState(0);
  const [canHide, setCanHide] = useState(false);
  const [exiting, setExiting] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t = timers.current;
    const letters = ['L', 'i', 'f', 'e', 'Q', 'u', 'e', 's', 't'];
    let letterIndex = 0;

    // Type letters at 120ms each — 9 letters = 1080ms total
    const typeInterval = setInterval(() => {
      if (letterIndex < letters.length) {
        letterIndex++;
        setLettersShown(letterIndex);
      } else {
        clearInterval(typeInterval);
      }
    }, 120);

    t.push(setTimeout(() => setShowTagline(true), 1300));
    t.push(setTimeout(() => setShowSprite(true), 1600));
    t.push(setTimeout(() => setShowBar(true), 1850));

    // Minimum 2.8s before hiding
    t.push(setTimeout(() => setCanHide(true), 2800));

    // Safety net: force exit after 4s no matter what
    t.push(setTimeout(() => {
      setBarPct(100);
      setCanHide(true);
    }, 4000));

    // Fill bar slowly — targets ~2.2s to reach 100%
    let pct = 0;
    const barInterval = setInterval(() => {
      pct = Math.min(100, pct + Math.random() * 7 + 3);
      setBarPct(Math.floor(pct));
      if (pct >= 100) clearInterval(barInterval);
    }, 150);

    return () => {
      t.forEach(clearTimeout);
      clearInterval(typeInterval);
      clearInterval(barInterval);
    };
  }, []);

  // Exit when both conditions are met: min time passed + bar full
  useEffect(() => {
    if (canHide && barPct >= 100) {
      const t = setTimeout(() => {
        setExiting(true);
        setTimeout(onDone, 450);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [canHide, barPct, onDone]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at 50% 40%, #221045 0%, #0d0620 100%)', zIndex: 300 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45 }}
        >
          {/* Star field */}
          <div className="absolute inset-0 pointer-events-none">
            {STARS.map((s, i) => (
              <PixelStar
                key={i}
                style={{
                  left: `${s.left}%`,
                  top: `${s.top}%`,
                  opacity: s.opacity,
                  width: s.size,
                  height: s.size,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6 px-8">
            <motion.img
              src="/brand/lifequest-logo.png"
              alt="LifeQuest"
              className="h-28 w-28 rounded-[28px] border border-white/15 bg-white object-cover shadow-2xl"
              initial={{ opacity: 0, y: -12, scale: 0.82 }}
              animate={lettersShown > 0 ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ type: 'spring', stiffness: 240, damping: 18 }}
            />

            <motion.div
              className="font-pixel"
              style={{
                fontSize: 'clamp(14px, 4vw, 24px)',
                letterSpacing: '3px',
                color: '#ffd23f',
                textShadow: '3px 3px 0 #0d0620, 0 0 24px rgba(255,210,63,0.45)',
              }}
              initial={{ opacity: 0, y: 8 }}
              animate={lettersShown > 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35 }}
            >
              LIFEQUEST
            </motion.div>

            {/* Tagline */}
            <AnimatePresence>
              {showTagline && (
                <motion.p
                  className="font-vt text-text-secondary text-center"
                  style={{ fontSize: '20px' }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  La aventura de tu vida empieza hoy
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSprite && (
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 240, damping: 18 }}
                >
                  <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 font-vt text-xl text-[var(--text-secondary)]">
                    El RPG de tu vida real
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar */}
            <AnimatePresence>
              {showBar && (
                <motion.div
                  className="w-64"
                  initial={{ opacity: 0, scaleX: 0.5 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>CARGANDO</span>
                    <span className="font-pixel text-accent-gold" style={{ fontSize: '7px' }}>{Math.floor(barPct)}%</span>
                  </div>
                  <div
                    className="border-2 border-accent-gold relative overflow-hidden"
                    style={{ height: '16px', background: 'rgba(0,0,0,0.5)' }}
                  >
                    <motion.div
                      className="h-full bg-accent-gold"
                      animate={{ width: `${barPct}%` }}
                      transition={{ ease: 'easeOut', duration: 0.15 }}
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(0,0,0,0.18) 10px, rgba(0,0,0,0.18) 12px)',
                      }}
                    />
                    {/* Scanline overlay */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)',
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
