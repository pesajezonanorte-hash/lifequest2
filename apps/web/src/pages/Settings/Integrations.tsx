import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import { CalendarDays, Music, Activity, Check } from 'lucide-react';

interface Status {
  googleCalendar: boolean;
  spotify: boolean;
  googleFit: boolean;
}

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api/v1';

function IntegrationCard({
  icon,
  title,
  description,
  connected,
  onConnect,
  onSync,
  onDisconnect,
  syncing,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  connected: boolean;
  onConnect: () => void;
  onSync?: () => void;
  onDisconnect: () => void;
  syncing?: boolean;
}) {
  return (
    <PixelPanel className="p-4">
      <div className="flex items-start gap-4">
        <div className={`p-2 border-2 border-border-pixel flex-shrink-0 ${connected ? 'bg-accent-green/10 border-accent-green' : 'bg-bg-deep'}`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-pixel text-text-primary" style={{ fontSize: '9px' }}>{title}</p>
            {connected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-accent-green/20 border border-accent-green px-2 py-0.5"
              >
                <Check size={10} className="text-[var(--accent-green)]" />
                <span className="font-pixel text-accent-green" style={{ fontSize: '7px' }}>CONECTADO</span>
              </motion.div>
            )}
          </div>
          <p className="font-vt text-text-secondary text-base mt-1">{description}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        {!connected ? (
          <PixelButton variant="primary" onClick={onConnect} className="text-xs">
            Conectar
          </PixelButton>
        ) : (
          <>
            {onSync && (
              <PixelButton variant="secondary" onClick={onSync} disabled={syncing} className="text-xs">
                {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </PixelButton>
            )}
            <PixelButton variant="ghost" onClick={onDisconnect} className="text-xs text-accent-red border-accent-red">
              Desconectar
            </PixelButton>
          </>
        )}
      </div>
    </PixelPanel>
  );
}

const SERVICE_LABEL: Record<string, string> = {
  google:    'Google Calendar',
  spotify:   'Spotify',
  googlefit: 'Google Fit',
};

const SERVICE_TO_STATUS_KEY: Record<string, keyof Status> = {
  google:    'googleCalendar',
  spotify:   'spotify',
  googlefit: 'googleFit',
};

export default function IntegrationsPage() {
  const [status, setStatus] = useState<Status>({ googleCalendar: false, spotify: false, googleFit: false });
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const toast = useToast();

  const refetchStatus = useCallback(async () => {
    try {
      const r = await api.get<Status>('/integrations/status');
      setStatus(r.data);
    } catch {
      // keep current status; backend may be temporarily unreachable
    }
  }, []);

  useEffect(() => {
    refetchStatus();
  }, [refetchStatus]);

  // Handle OAuth callback redirects: ?{service}={connected|success|error}
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      let touched = false;

      for (const service of Object.keys(SERVICE_LABEL)) {
        const v = params.get(service);
        if (!v) continue;
        touched = true;
        const label = SERVICE_LABEL[service];

        if (v === 'connected' || v === 'success') {
          toast.success(`¡${label} conectado correctamente!`);
          // optimistic + authoritative refetch
          const statusKey = SERVICE_TO_STATUS_KEY[service];
          setStatus((s) => ({ ...s, [statusKey]: true }));
          refetchStatus();
        } else if (v === 'error') {
          toast.error(`No se pudo conectar ${label}. Intenta de nuevo.`);
        }
      }

      if (touched) {
        // Clean the URL so the toast doesn't fire again on reload / re-mount.
        window.history.replaceState({}, '', '/settings/integrations');
      }
    } catch (e) {
      // Never let URL parsing crash the page.
      console.error('[Integrations] callback handling failed:', e);
    }
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncGoogle = async () => {
    setSyncing((s) => ({ ...s, google: true }));
    try {
      const r = await api.post<{ synced: number }>('/integrations/google/sync') as { data: { synced: number } };
      toast.success(`${r.data.synced} misiones sincronizadas con Google Calendar`);
    } catch {
      toast.error('Error al sincronizar con Google Calendar');
    } finally {
      setSyncing((s) => ({ ...s, google: false }));
    }
  };

  const disconnect = async (service: keyof Status, endpoint: string) => {
    try {
      await api.delete(endpoint);
      setStatus((s) => ({ ...s, [service]: false }));
      toast.success('Desconectado correctamente');
    } catch {
      toast.error('Error al desconectar');
    }
  };

  const connectRedirect = (path: string) => {
    const token = useAuthStore.getState().accessToken;
    if (!token) {
      toast.error('Debes iniciar sesión primero');
      return;
    }
    window.location.href = `${BASE}${path}?token=${encodeURIComponent(token)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-pixel text-accent-gold" style={{ fontSize: '12px' }}>INTEGRACIONES</h1>
        <p className="font-vt text-text-secondary text-lg mt-1">
          Conecta tus herramientas favoritas con LifeQuest.
        </p>
      </div>

      <div className="space-y-4">
        <IntegrationCard
          icon={<CalendarDays size={28} className={status.googleCalendar ? 'text-[var(--accent-green)]' : 'text-[var(--text-secondary)]'} />}
          title="Google Calendar"
          description="Sincroniza tus quests con deadline en Google Calendar como eventos. Nunca te pierdas una misión importante."
          connected={status.googleCalendar}
          onConnect={() => connectRedirect('/integrations/google/auth')}
          onSync={syncGoogle}
          onDisconnect={() => void disconnect('googleCalendar', '/integrations/google/disconnect')}
          syncing={syncing.google}
        />

        <IntegrationCard
          icon={<Music size={28} className={status.spotify ? 'text-[#1DB954]' : 'text-[var(--text-secondary)]'} />}
          title="Spotify"
          description="Activa el modo entrenamiento para escuchar tu playlist de gym al iniciar un workout en el Coliseo."
          connected={status.spotify}
          onConnect={() => connectRedirect('/integrations/spotify/auth')}
          onDisconnect={() => void disconnect('spotify', '/integrations/spotify/disconnect')}
        />

        <IntegrationCard
          icon={<Activity size={28} className={status.googleFit ? 'text-[var(--accent-cyan)]' : 'text-[var(--text-secondary)]'} />}
          title="Google Fit"
          description="Importa automáticamente pasos, calorías y datos de sueño de tu wearable para llenar la Torre del Sueño y el Coliseo."
          connected={status.googleFit}
          onConnect={() => connectRedirect('/integrations/googlefit/auth')}
          onDisconnect={() => void disconnect('googleFit', '/integrations/googlefit/disconnect')}
        />
      </div>
    </div>
  );
}
