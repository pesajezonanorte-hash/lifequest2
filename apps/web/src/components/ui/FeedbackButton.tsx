import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import api from '../../lib/api';

type Kind = 'bug' | 'idea' | 'other';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('idea');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (message.trim().length < 3) {
      setError('El mensaje es muy corto.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/feedback', { kind, message: message.trim(), url: window.location.pathname });
      setSent(true);
      setMessage('');
      setTimeout(() => { setOpen(false); setSent(false); }, 1800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo enviar.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-[5.5rem] bottom-auto sm:top-auto sm:bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border-2 border-[var(--border)] bg-[var(--bg-panel)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] shadow-lg hover:border-[var(--accent-gold)] hover:text-[var(--text-primary)]"
        title="Enviar feedback"
      >
        <MessageSquare size={14} className="text-[var(--accent-gold)]" />
        <span className="hidden sm:inline">Feedback</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
            onClick={() => !submitting && setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-pixel text-[var(--accent-gold)]" style={{ fontSize: '11px' }}>💬 ENVIAR FEEDBACK</h2>
                <button onClick={() => setOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={18} /></button>
              </div>

              {sent ? (
                <p className="font-vt text-[var(--accent-green)] text-lg text-center py-4">¡Gracias! Recibido. 🙏</p>
              ) : (
                <>
                  <div className="flex gap-2">
                    {([['bug', '🐛 Bug'], ['idea', '💡 Idea'], ['other', '🗨️ Otro']] as [Kind, string][]).map(([k, label]) => (
                      <button
                        key={k}
                        onClick={() => setKind(k)}
                        className={`flex-1 px-3 py-1.5 border-2 rounded font-vt text-base transition-colors ${kind === k ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--bg-deep)]' : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Cuéntanos qué pasó, qué te gustaría, o cualquier comentario…"
                    className="w-full bg-[var(--bg-deep)] border-2 border-[var(--border)] text-[var(--text-primary)] font-vt text-base px-3 py-2 rounded focus:border-[var(--accent-gold)] outline-none resize-none"
                    maxLength={2000}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">{message.length}/2000</span>
                    {error && <span className="text-[var(--accent-red)]">{error}</span>}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                      className="px-3 py-1.5 border-2 border-[var(--border)] text-[var(--text-secondary)] rounded font-vt text-base hover:text-[var(--text-primary)]"
                    >Cancelar</button>
                    <button
                      onClick={submit}
                      disabled={submitting || message.trim().length < 3}
                      className="px-4 py-1.5 border-2 border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--bg-deep)] rounded font-vt text-base disabled:opacity-50"
                    >{submitting ? 'Enviando…' : 'Enviar'}</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
