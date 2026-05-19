import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, X, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';

interface Props {
  url: string | null | undefined;
}

function parseEmbed(url: string): { type: 'spotify' | 'youtube' | null; embedUrl: string | null } {
  if (!url) return { type: null, embedUrl: null };

  // Spotify playlist/track/album
  const spotifyMatch = url.match(/spotify\.com\/(playlist|track|album|artist)\/([a-zA-Z0-9]+)/);
  if (spotifyMatch) {
    return {
      type: 'spotify',
      embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1]}/${spotifyMatch[2]}?utm_source=generator&theme=0`,
    };
  }

  // YouTube video or playlist
  const ytVideoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytVideoMatch) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/${ytVideoMatch[1]}?autoplay=0` };
  }

  const ytListMatch = url.match(/youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (ytListMatch) {
    return { type: 'youtube', embedUrl: `https://www.youtube.com/embed/videoseries?list=${ytListMatch[1]}` };
  }

  return { type: null, embedUrl: null };
}

export function MusicPlayer({ url }: Props) {
  const [open, setOpen] = useState(false);
  const { type, embedUrl } = useMemo(() => parseEmbed(url ?? ''), [url]);

  if (!url || !embedUrl) return null;

  const height = type === 'spotify' ? 152 : 200;

  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            key="player"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="mb-2 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: 300,
              border: '1px solid var(--border)',
              background: 'var(--bg-panel)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2">
                <Music size={14} style={{ color: type === 'spotify' ? '#1db954' : '#ff0000' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {type === 'spotify' ? 'Spotify' : 'YouTube'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <a href={url} target="_blank" rel="noopener noreferrer" title="Abrir en app">
                  <motion.div whileTap={{ scale: 0.9 }} className="flex items-center justify-center w-6 h-6 rounded-md" style={{ color: 'var(--text-muted)' }}>
                    <ExternalLink size={12} />
                  </motion.div>
                </a>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setOpen(false)} className="flex items-center justify-center w-6 h-6 rounded-md" style={{ color: 'var(--text-muted)' }}>
                  <X size={12} />
                </motion.button>
              </div>
            </div>

            {/* Embed iframe */}
            <iframe
              src={embedUrl}
              width="300"
              height={height}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ display: 'block' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.93 }}
        className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow-lg"
        style={{
          background: type === 'spotify' ? 'linear-gradient(135deg, #1db954, #19a347)' : 'linear-gradient(135deg, #ff0000, #cc0000)',
          color: '#fff',
          border: 'none',
        }}
        animate={open ? {} : { scale: [1, 1.04, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: 'loop' }}
      >
        <Music size={14} />
        <span>{open ? 'Cerrar' : 'Música'}</span>
        {open ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </motion.button>
    </div>
  );
}
