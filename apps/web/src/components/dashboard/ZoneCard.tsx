import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { E } from '@/components/ui/glyphs';

interface Props {
  icon: ReactNode;
  label: string;
  sublabel: string;
  to: string;
  color: string;
  badge?: string;
}

export function ZoneCard({ icon, label, sublabel, to, color, badge }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(to)}
      className={`bg-bg-panel border-2 ${color} shadow-pixel p-3 cursor-pointer relative group`}
    >
      <span className="absolute top-0 left-0 w-2 h-2 bg-border-pixel" />
      <span className="absolute top-0 right-0 w-2 h-2 bg-border-pixel" />
      <span className="absolute bottom-0 left-0 w-2 h-2 bg-border-pixel" />
      <span className="absolute bottom-0 right-0 w-2 h-2 bg-border-pixel" />

      <div className="mb-2 flex justify-center drop-shadow-sm"><E e={icon} /></div>
      <p className="font-pixel text-text-primary text-center" style={{ fontSize: '9px' }}>{label}</p>
      <p className="font-vt text-text-secondary text-sm text-center">{sublabel}</p>

      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-1.5 bg-bg-deep border border-border-pixel px-1.5 py-0.5 inline-block"
        >
          <p className="font-vt text-text-secondary text-xs">{badge}</p>
        </motion.div>
      )}

      {/* Glow on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-10 bg-white transition-opacity"
      />
    </motion.div>
  );
}
