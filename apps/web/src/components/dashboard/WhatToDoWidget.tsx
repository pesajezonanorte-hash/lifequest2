import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface Priority {
  id: string;
  type: 'habit' | 'quest' | 'event';
  title: string;
  icon: string;
  xp: number;
  urgent: boolean;
  detail?: string;
}

const TYPE_ROUTES: Record<string, string> = {
  habit: '/habits',
  quest: '/quests',
  event: '/agenda',
};

export function WhatToDoWidget() {
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<Priority[]>('/dashboard/priorities')
      .then(r => setPriorities(r.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (priorities.length === 0) return null;

  return (
    <div
      className="rounded-2xl"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--bg-panel)',
        padding: '16px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            ¿Qué hago ahora?
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {priorities.length} prioridades
        </span>
      </div>

      <div className="space-y-2">
        {priorities.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(TYPE_ROUTES[p.type] ?? '/')}
            className="w-full flex items-center gap-3 text-left rounded-xl px-3 py-2.5 transition-colors"
            style={{
              background: p.urgent ? 'rgba(251,191,36,0.08)' : 'var(--bg-panel-light)',
              border: `1px solid ${p.urgent ? 'rgba(251,191,36,0.3)' : 'var(--border)'}`,
            }}
          >
            <span className="text-xl flex-shrink-0">{p.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {p.title}
              </p>
              {p.detail && (
                <p className="text-xs mt-0.5" style={{ color: p.urgent ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
                  {p.detail}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 text-right">
              {p.xp > 0 && (
                <span className="text-xs font-bold" style={{ color: 'var(--accent-cyan)' }}>
                  +{p.xp} XP
                </span>
              )}
              {p.urgent && (
                <span className="block text-[10px] font-bold mt-0.5" style={{ color: 'var(--accent-gold)' }}>
                  ¡Hoy!
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
