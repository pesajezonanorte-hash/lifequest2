import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { useToast } from '../../hooks/useToast';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import * as userService from '../../services/user.service';
import api from '../../lib/api';

const THEMES = [
  { id: 'aurora', name: 'Aurora', cost: 0, description: 'RPG clásico oscuro', emoji: '🌌', preview: '#1a0d2e' },
  { id: 'cyber', name: 'Cyber', cost: 200, description: 'Neon cyberpunk', emoji: '🤖', preview: '#001a33' },
  { id: 'forest', name: 'Forest', cost: 200, description: 'Bosque encantado', emoji: '🌲', preview: '#122214' },
  { id: 'ocean', name: 'Ocean', cost: 200, description: 'Profundidades marinas', emoji: '🌊', preview: '#041e33' },
  { id: 'sunset', name: 'Sunset', cost: 300, description: 'Atardecer dorado', emoji: '🌅', preview: '#2d1300' },
  { id: 'retro', name: 'Retro SNES', cost: 500, description: '16-bit clásico', emoji: '🕹️', preview: '#16213e' },
];

function useDarkMode() {
  const stored = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [isDark, setIsDark] = useState(stored === 'dark' || (!stored && systemDark));

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      html.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.add('light');
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark(v => !v) };
}

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { audioEnabled, toggleAudio } = useUIStore();
  const [animationsEnabled, setAnimationsEnabled] = useState(() => localStorage.getItem('animations') !== 'false');

  function handleToggleAnimations() {
    const next = !animationsEnabled;
    setAnimationsEnabled(next);
    localStorage.setItem('animations', String(next));
    document.documentElement.classList.toggle('reduce-motion', !next);
  }
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'America/Bogota');
  const [gymPlaylistUrl, setGymPlaylistUrl] = useState(user?.gymPlaylistUrl ?? '');
  const [saving, setSaving] = useState(false);

  const validSections = ['profile', 'game', 'datos', 'about'] as const;
  type Section = typeof validSections[number];
  const [section, setSection] = useState<Section>('profile');
  const [themeLoading, setThemeLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const activeTheme = (user as any)?.activeTheme ?? 'aurora';

  async function handleExportJSON() {
    setExporting('json');
    try {
      const response = await api.get('/export/json', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifequest-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('¡Backup descargado!');
    } catch {
      toast.error('Error exportando datos');
    } finally {
      setExporting(null);
    }
  }

  async function handleExportCSV() {
    setExporting('csv');
    try {
      const response = await api.get('/export/transactions.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transacciones-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('¡CSV descargado!');
    } catch {
      toast.error('Error exportando transacciones');
    } finally {
      setExporting(null);
    }
  }

  async function handleThemeChange(themeId: string) {
    setThemeLoading(themeId);
    try {
      await api.patch('/users/me/theme', { theme: themeId });
      document.documentElement.setAttribute('data-theme', themeId);
      updateUser({ ...(user as any), activeTheme: themeId });
      toast.success(`Tema "${THEMES.find(t => t.id === themeId)?.name}" activado`);
    } catch {
      toast.error('No tienes ese tema disponible. Cómpralo en la tienda.');
    } finally { setThemeLoading(null); }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        displayName: displayName || undefined,
        timezone: timezone || undefined,
        gymPlaylistUrl: gymPlaylistUrl || null,
      });
      updateUser(updated);
      toast.success('¡Perfil actualizado!');
    } catch {
      toast.error('Error al guardar');
    } finally { setSaving(false); }
  }

  function extractSpotifyId(url: string): string | null {
    const m = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return m ? m[1] : null;
  }

  function openGymPlaylist() {
    if (!gymPlaylistUrl) return;
    window.open(gymPlaylistUrl.startsWith('http') ? gymPlaylistUrl : `https://open.spotify.com/playlist/${gymPlaylistUrl}`, '_blank');
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>⚙️ CONFIGURACIÓN</h1>
        <p className="font-vt text-text-secondary text-base">Ajusta tu aventura, héroe</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {[['profile', '👤 Perfil'], ['game', '🎮 Juego'], ['datos', '💾 Tus Datos'], ['about', 'ℹ️ Acerca de']].map(([key, label]) => (
          <button key={key} onClick={() => setSection(key as typeof section)} className={`flex-shrink-0 px-3 py-1.5 border-2 font-pixel transition-all ${section === key ? 'border-accent-gold bg-accent-gold text-bg-deep' : 'border-border-pixel text-text-secondary'}`} style={{ fontSize: '8px' }}>
            {label}
          </button>
        ))}
      </div>

      {section === 'profile' && (
        <PixelPanel className="p-5 space-y-4">
          <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>PERFIL</p>
          <div>
            <p className="font-pixel text-text-secondary mb-1" style={{ fontSize: '7px' }}>NOMBRE DE HÉROE</p>
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-lg px-3 py-2 focus:border-accent-gold outline-none"
            />
          </div>
          <div>
            <p className="font-pixel text-text-secondary mb-1" style={{ fontSize: '7px' }}>EMAIL</p>
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full bg-bg-deep border-2 border-border-pixel text-text-secondary font-vt text-base px-3 py-2 outline-none opacity-60"
            />
          </div>
          <PixelButton variant="primary" onClick={saveProfile} disabled={saving}>
            {saving ? 'Guardando...' : 'GUARDAR CAMBIOS'}
          </PixelButton>
        </PixelPanel>
      )}

      {section === 'game' && (
        <PixelPanel className="p-5 space-y-4">
          <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>CONFIGURACIÓN DE JUEGO</p>
          <div>
            <p className="font-pixel text-text-secondary mb-1" style={{ fontSize: '7px' }}>ZONA HORARIA</p>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none"
            >
              <option value="America/Bogota">America/Bogota (COT)</option>
              <option value="America/New_York">America/New_York (ET)</option>
              <option value="America/Chicago">America/Chicago (CT)</option>
              <option value="Europe/Madrid">Europe/Madrid (CET)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          {/* Theme picker */}
          <div className="space-y-3 border-b border-border-pixel pb-4">
            <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>🎨 TEMA VISUAL</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {THEMES.map(theme => (
                <motion.button
                  key={theme.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleThemeChange(theme.id)}
                  disabled={themeLoading === theme.id}
                  className={`p-3 border-2 text-left transition-all ${activeTheme === theme.id ? 'border-accent-gold bg-accent-gold/10' : 'border-border-pixel hover:border-text-secondary'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full border border-border-pixel" style={{ background: theme.preview }} />
                    <span className="font-pixel" style={{ fontSize: '8px', color: activeTheme === theme.id ? 'var(--accent-gold)' : 'var(--text-primary)' }}>
                      {theme.emoji} {theme.name}
                    </span>
                  </div>
                  <p className="font-vt text-text-secondary text-xs">{theme.description}</p>
                  {theme.cost > 0 && activeTheme !== theme.id && (
                    <p className="font-pixel text-accent-gold mt-1" style={{ fontSize: '7px' }}>{theme.cost}G</p>
                  )}
                  {activeTheme === theme.id && (
                    <p className="font-pixel text-accent-green mt-1" style={{ fontSize: '7px' }}>✓ ACTIVO</p>
                  )}
                </motion.button>
              ))}
            </div>
            <p className="font-vt text-text-secondary text-sm">Los temas de pago se desbloquean en la tienda</p>
          </div>

          {/* Toggles */}
          {[
            { label: 'MODO OSCURO', hint: 'Cambia la apariencia de la app', active: isDark, onToggle: toggleDark },
            { label: 'SONIDOS', hint: 'Efectos de audio en la interfaz', active: audioEnabled, onToggle: toggleAudio },
            { label: 'ANIMACIONES', hint: 'Transiciones y efectos visuales', active: animationsEnabled, onToggle: handleToggleAnimations },
          ].map(({ label, hint, active, onToggle }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border-pixel">
              <div>
                <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>{label}</p>
                <p className="font-vt text-text-muted text-sm mt-0.5">{hint}</p>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onToggle}
                className={`relative w-12 h-6 rounded-full transition-colors border ${active ? 'bg-accent-gold border-accent-gold' : 'bg-bg-panel-light border-border-pixel'}`}
              >
                <motion.div
                  animate={{ x: active ? 24 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-bg-panel"
                  style={{ boxShadow: 'var(--shadow-sm)' }}
                />
              </motion.button>
            </div>
          ))}

          <div className="space-y-1">
            <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>STATS DEL HÉROE</p>
            {user && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'NIVEL', value: user.level },
                  { label: 'RACHA', value: user.currentStreak },
                  { label: 'FUERZA', value: user.strength },
                  { label: 'INTELIGENCIA', value: user.intelligence },
                  { label: 'CARISMA', value: user.charisma },
                  { label: 'GOLD TOTAL', value: user.gold },
                ].map(s => (
                  <PixelPanel key={s.label} className="p-2 text-center">
                    <p className="font-pixel text-text-secondary" style={{ fontSize: '6px' }}>{s.label}</p>
                    <p className="font-pixel text-accent-gold" style={{ fontSize: '12px' }}>{s.value}</p>
                  </PixelPanel>
                ))}
              </div>
            )}
          </div>
          {/* Spotify */}
          <div className="space-y-2 border-t-2 border-border-pixel pt-4">
            <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>🎵 PLAYLIST DE ENTRENAMIENTO</p>
            <p className="font-vt text-text-secondary text-sm">Pega el link de tu playlist de Spotify para abrirla rápido desde el Coliseo</p>
            <div className="flex gap-2">
              <input
                value={gymPlaylistUrl}
                onChange={e => setGymPlaylistUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/..."
                className="flex-1 bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none"
              />
              {gymPlaylistUrl && extractSpotifyId(gymPlaylistUrl) && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={openGymPlaylist}
                  className="border-2 border-accent-green text-accent-green font-vt text-base px-3 py-2 hover:bg-accent-green hover:text-bg-deep transition-colors whitespace-nowrap"
                >
                  ▶ Abrir
                </motion.button>
              )}
            </div>
            {gymPlaylistUrl && extractSpotifyId(gymPlaylistUrl) && (
              <iframe
                title="Spotify playlist preview"
                src={`https://open.spotify.com/embed/playlist/${extractSpotifyId(gymPlaylistUrl)}?theme=0`}
                width="100%"
                height={152}
                frameBorder={0}
                allow="encrypted-media"
                style={{ borderRadius: 12, marginTop: 8 }}
              />
            )}
          </div>

          <PixelButton variant="primary" onClick={saveProfile} disabled={saving}>
            {saving ? 'Guardando...' : 'GUARDAR'}
          </PixelButton>
        </PixelPanel>
      )}

      {section === 'datos' && (
        <PixelPanel className="p-5 space-y-5">
          <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>💾 TUS DATOS</p>
          <p className="font-vt text-text-secondary text-sm">Exporta y respalda toda tu información. Tus datos son tuyos.</p>

          <div className="space-y-3">
            <div className="border-2 border-border-pixel p-4 space-y-2">
              <p className="font-pixel text-text-primary" style={{ fontSize: '9px' }}>📦 BACKUP COMPLETO (JSON)</p>
              <p className="font-vt text-text-secondary text-sm">Misiones, hábitos, finanzas, entrenamientos, diario, metas y más. Úsalo para restaurar o analizar tu progreso.</p>
              <PixelButton variant="primary" onClick={handleExportJSON} disabled={exporting === 'json'}>
                {exporting === 'json' ? 'Exportando...' : '⬇ DESCARGAR JSON'}
              </PixelButton>
            </div>

            <div className="border-2 border-border-pixel p-4 space-y-2">
              <p className="font-pixel text-text-primary" style={{ fontSize: '9px' }}>📊 TRANSACCIONES (CSV)</p>
              <p className="font-vt text-text-secondary text-sm">Todas tus transacciones en formato CSV. Compatible con Excel, Google Sheets y otras apps de finanzas.</p>
              <PixelButton variant="secondary" onClick={handleExportCSV} disabled={exporting === 'csv'}>
                {exporting === 'csv' ? 'Exportando...' : '⬇ DESCARGAR CSV'}
              </PixelButton>
            </div>
          </div>
        </PixelPanel>
      )}

      {section === 'about' && (
        <PixelPanel className="p-5 space-y-4 text-center">
          <p className="text-5xl">🏆</p>
          <p className="font-pixel text-accent-gold" style={{ fontSize: '12px' }}>LIFEQUEST</p>
          <p className="font-pixel text-text-secondary" style={{ fontSize: '8px' }}>v10.0.0 — FASE FINAL</p>
          <p className="font-vt text-text-secondary text-base leading-relaxed">
            LifeQuest es tu aventura de vida real.<br />
            10 fases, RPG completo, IA integrada.
          </p>
          <PixelButton variant="primary" onClick={() => navigate('/about')}>
            VER PÁGINA COMPLETA
          </PixelButton>
        </PixelPanel>
      )}
    </div>
  );
}
