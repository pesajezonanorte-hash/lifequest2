import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { E } from '@/components/ui/glyphs';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-deep)] text-[var(--text-primary)] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md space-y-6"
      >
        <div className="text-7xl"><E e="🗺" /></div>
        <h1 className="text-3xl font-bold">Zona inexplorada</h1>
        <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
          Esta parte del reino aún no ha sido descubierta. Puede que la URL sea incorrecta o que la zona haya sido movida.
        </p>
        <div className="text-5xl font-bold text-[var(--text-muted)] opacity-30">404</div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Volver
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'var(--accent-gold)', color: 'var(--bg-deep)' }}
          >
            <E e="🏰" /> Ir al Castillo
          </button>
        </div>
      </motion.div>
    </div>
  );
}
