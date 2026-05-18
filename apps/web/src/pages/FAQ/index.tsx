import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { PixelPanel } from '../../components/ui/PixelPanel';

interface QA { q: string; a: string }

const FAQ: QA[] = [
  {
    q: '¿Qué es LifeQuest?',
    a: 'Un RPG gamificado para tu vida real. Convierte tus metas, hábitos, entrenamientos, finanzas y aprendizaje en misiones épicas. Ganas XP, subes de nivel y vas desbloqueando logros — todo basado en lo que haces de verdad.',
  },
  {
    q: '¿Cómo funcionan las quests?',
    a: 'Las quests son tus objetivos. Pueden ser MAIN (grandes, importantes), SIDE (secundarias), DAILY (diarias) o WEEKLY (semanales). Al completarlas ganas XP, oro y suben tus stats. Las daily se reinician cada día; las weekly cada lunes.',
  },
  {
    q: '¿Cómo se calcula el XP y los niveles?',
    a: 'Cada acción (completar una quest, registrar un hábito, entrenar, dormir, escribir en el diario, etc.) te da XP. Al acumular suficiente XP subes de nivel. Cada nivel pide más XP que el anterior. Tu clase de héroe (Guerrero, Mago, Pícaro, Bardo) puede dar bonus multiplicador en ciertas áreas.',
  },
  {
    q: '¿Qué son los hábitos y las rachas?',
    a: 'Los hábitos son acciones diarias que repites (meditar, leer, hacer ejercicio…). Cada vez que registras un hábito sube tu racha. Si fallas un día, la racha se reinicia. Las rachas largas te dan más XP por completion.',
  },
  {
    q: '¿Quién es el Sabio del Castillo?',
    a: 'Tu mentor de IA personal. Te puede sugerir misiones, analizar tus hábitos, planificar entrenamientos, darte un consejo del día y responder lo que le preguntes sobre tu vida en el juego. Tiene memoria de tus conversaciones anteriores.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Cada usuario solo ve sus propios datos. Las contraseñas se guardan hasheadas con bcrypt y los tokens de sesión expiran. Tu diario, finanzas y datos personales nunca son visibles para otros usuarios.',
  },
  {
    q: '¿Qué muestran los amigos en mi perfil?',
    a: 'Solo lo gamificado: nivel, logros desbloqueados, rachas, posición en los leaderboards. Nunca verán tu diario, tus transacciones ni tus datos privados.',
  },
  {
    q: '¿Puedo usar LifeQuest sin Spotify o sin la IA?',
    a: 'Sí. Spotify, Google Calendar, Google Fit y el Sabio son integraciones opcionales. La app funciona perfecto sin ellos; cuando alguno falla, la app sigue como si nada.',
  },
  {
    q: '¿Funciona en el celular?',
    a: 'Sí. Está optimizada para mobile y desktop, y la puedes instalar como PWA desde el navegador (Android e iOS). Una vez instalada queda como una app normal.',
  },
  {
    q: '¿Cómo reporto un bug o sugiero algo?',
    a: 'Usa el botón "💬 Feedback" en la esquina inferior derecha o en Settings. Tu mensaje llega directo al equipo de LifeQuest.',
  },
];

function Item({ qa, open, onToggle }: { qa: QA; open: boolean; onToggle: () => void }) {
  return (
    <PixelPanel className="p-0 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-[var(--bg-panel-hover)] transition-colors"
      >
        <span className="font-vt text-[var(--text-primary)] text-lg">{qa.q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-[var(--text-secondary)]" />
        </motion.span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 pb-4 pt-1"
        >
          <p className="font-vt text-[var(--text-secondary)] text-base leading-relaxed">{qa.a}</p>
        </motion.div>
      )}
    </PixelPanel>
  );
}

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>❓ AYUDA Y PREGUNTAS</h1>
        <p className="font-vt text-text-secondary text-base">Todo lo que necesitas saber para empezar</p>
      </div>

      <div className="space-y-2">
        {FAQ.map((qa, i) => (
          <Item key={i} qa={qa} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
        ))}
      </div>

      <PixelPanel className="p-4 text-center mt-6">
        <p className="font-vt text-[var(--text-secondary)] text-base">
          ¿Algo que no resolví? Usa el botón <span className="text-[var(--accent-gold)]">💬 Feedback</span> para escribirnos.
        </p>
      </PixelPanel>
    </div>
  );
}
