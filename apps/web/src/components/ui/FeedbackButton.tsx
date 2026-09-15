import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import api from '../../lib/api';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';

type Kind = 'bug' | 'idea' | 'other';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
}

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('idea');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const kbHeight = useKeyboardHeight();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

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

  const btnStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        top: 70,
        right: 60,
        width: 36,
        height: 36,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: '2px solid var(--border)',
        background: 'var(--bg-panel)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }
    : {
        position: 'fixed',
        bottom: 16,
        left: 16,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderRadius: '9999px',
        border: '2px solid var(--border)',
        background: 'var(--bg-panel)',
        padding: '8px 12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      };

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={btnStyle}
        title="Enviar feedback"
      >
        <MessageSquare size={isMobile ? 16 : 14} className="text-[var(--accent-gold)]" />
        {!isMobile && (
          <span className="hidden sm:inline text-xs font-medium text-[var(--text-secondary)]">Feedback</span>
        )}
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
              className="w-full max-w-md rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-panel)] p-5 space-y-3 overflow-y-auto"
              style={{
                maxHeight: kbHeight > 0 ? `calc(100vh - ${kbHeight}px - 20px)` : '90vh',
                transition: 'max-height 0.2s ease',
              }}
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
                    ref={textareaRef}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Cuéntanos qué pasó, qué te gustaría, o cualquier comentario…"
                    className="w-full bg-[var(--bg-deep)] border-2 border-[var(--border)] text-[var(--text-primary)] font-vt text-base px-3 py-2 rounded focus:border-[var(--accent-gold)] outline-none resize-none overflow-hidden"
                    maxLength={2000}
                    style={{ minHeight: 72 }}
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
