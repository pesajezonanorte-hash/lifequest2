import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Send, LogOut, Plus, Copy, Check } from 'lucide-react';
import {
  getMyGuild, createGuild, joinGuild, getGuildMessages, postGuildMessage, leaveGuild,
} from '../../services/social.service';
import { useAuthStore } from '../../store/authStore';
import { AvatarDisplay } from '../../components/character/AvatarDisplay';

interface GuildMemberUser {
  id: string;
  username: string;
  displayName: string;
  level: number;
  currentStreak: number;
  xp: number;
  avatarConfig?: unknown;
  equippedAura?: string | null;
  equippedFrame?: string | null;
  equippedHat?: string | null;
}

interface GuildMessageUser {
  id: string;
  username: string;
  displayName: string;
  avatarConfig?: unknown;
  equippedAura?: string | null;
  equippedFrame?: string | null;
}

interface GuildMessage {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  user: GuildMessageUser;
}

interface Guild {
  id: string;
  name: string;
  description?: string;
  emblem: string;
  leaderId: string;
  level: number;
  xp: number;
  inviteCode: string;
  members: Array<{
    id: string;
    userId: string;
    role: string;
    user: GuildMemberUser;
  }>;
}

const EMBLEMS = ['shield', 'sword', 'crown', 'star', 'dragon', 'wolf'];
const EMBLEM_ICONS: Record<string, string> = {
  shield: '🛡️', sword: '⚔️', crown: '👑', star: '⭐', dragon: '🐉', wolf: '🐺',
};

export default function GuildPage() {
  const { user } = useAuthStore();
  const [guild, setGuild] = useState<Guild | null>(null);
  const [messages, setMessages] = useState<GuildMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'view' | 'create' | 'join'>('view');
  const [form, setForm] = useState({ name: '', description: '', emblem: 'shield' });
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoading(true);
    getMyGuild().then((d) => setGuild(d as Guild | null)).catch(() => null).finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Poll messages every 5 seconds when in guild
  useEffect(() => {
    if (!guild) return;
    getGuildMessages(guild.id).then((d) => setMessages(d as GuildMessage[])).catch(() => null);
    const interval = setInterval(() => {
      getGuildMessages(guild.id).then((d) => setMessages(d as GuildMessage[])).catch(() => null);
    }, 5000);
    return () => clearInterval(interval);
  }, [guild?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      await createGuild(form);
      setMode('view');
      load();
    } catch (e: unknown) { alert((e as Error).message); }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      await joinGuild(joinCode.trim());
      setMode('view');
      load();
    } catch (e: unknown) { alert((e as Error).message); }
  };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !guild) return;
    const content = msgInput.trim();
    setMsgInput('');
    try {
      const msg = await postGuildMessage(guild.id, content);
      setMessages((prev) => [...prev, msg as GuildMessage]);
    } catch (e: unknown) { alert((e as Error).message); }
  };

  const handleLeave = async () => {
    if (!guild || !confirm('¿Abandonar el gremio?')) return;
    try {
      await leaveGuild(guild.id);
      setGuild(null);
    } catch (e: unknown) { alert((e as Error).message); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(guild?.inviteCode ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="text-center py-12 font-vt text-text-dim animate-pulse">Cargando gremio...</div>;
  }

  // No guild
  if (!guild && mode === 'view') {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-6">
        <Shield className="mx-auto text-text-dim" size={64} />
        <div className="font-pixel text-text-primary" style={{ fontSize: '14px' }}>SIN GREMIO</div>
        <p className="font-vt text-text-dim">No perteneces a ningún gremio todavía.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setMode('create')}
            className="flex items-center gap-2 px-6 py-3 bg-accent-gold border-2 border-accent-gold text-bg-deep font-pixel hover:opacity-90 transition-opacity"
            style={{ fontSize: '10px' }}
          >
            <Plus size={16} /> CREAR GREMIO
          </button>
          <button
            onClick={() => setMode('join')}
            className="flex items-center gap-2 px-6 py-3 border-2 border-border-pixel text-text-primary font-pixel hover:border-accent-gold transition-colors"
            style={{ fontSize: '10px' }}
          >
            UNIRSE
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <h2 className="font-pixel text-accent-gold mb-6" style={{ fontSize: '14px' }}>CREAR GREMIO</h2>
        <div className="space-y-4">
          <input
            placeholder="Nombre del gremio"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-bg-deep border-2 border-border-pixel px-3 py-2 font-vt text-text-primary focus:outline-none focus:border-accent-gold"
          />
          <input
            placeholder="Descripción (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-bg-deep border-2 border-border-pixel px-3 py-2 font-vt text-text-primary focus:outline-none focus:border-accent-gold"
          />
          <div>
            <div className="font-pixel text-text-dim mb-2" style={{ fontSize: '9px' }}>EMBLEMA</div>
            <div className="flex gap-2">
              {EMBLEMS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm({ ...form, emblem: e })}
                  className={`w-10 h-10 border-2 text-xl flex items-center justify-center transition-all ${
                    form.emblem === e ? 'border-accent-gold bg-bg-panel' : 'border-border-pixel hover:border-text-dim'
                  }`}
                >
                  {EMBLEM_ICONS[e]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="flex-1 py-3 bg-accent-gold text-bg-deep font-pixel border-2 border-accent-gold hover:opacity-90" style={{ fontSize: '10px' }}>
              CREAR
            </button>
            <button onClick={() => setMode('view')} className="flex-1 py-3 border-2 border-border-pixel text-text-dim font-pixel hover:text-text-primary" style={{ fontSize: '10px' }}>
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <h2 className="font-pixel text-accent-gold mb-6" style={{ fontSize: '14px' }}>UNIRSE A GREMIO</h2>
        <div className="space-y-4">
          <input
            placeholder="Código de invitación (ej: ABC123)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full bg-bg-deep border-2 border-border-pixel px-3 py-2 font-vt text-text-primary focus:outline-none focus:border-accent-gold uppercase tracking-widest"
          />
          <div className="flex gap-2">
            <button onClick={handleJoin} className="flex-1 py-3 bg-accent-gold text-bg-deep font-pixel border-2 border-accent-gold hover:opacity-90" style={{ fontSize: '10px' }}>
              UNIRSE
            </button>
            <button onClick={() => setMode('view')} className="flex-1 py-3 border-2 border-border-pixel text-text-dim font-pixel hover:text-text-primary" style={{ fontSize: '10px' }}>
              CANCELAR
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!guild) return null;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Guild header */}
      <div className="bg-bg-panel border-4 border-border-pixel p-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="text-4xl">{EMBLEM_ICONS[guild.emblem] ?? '🛡️'}</div>
          <div className="flex-1">
            <div className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>{guild.name}</div>
            {guild.description && <div className="font-vt text-text-dim text-sm mt-1">{guild.description}</div>}
            <div className="flex items-center gap-4 mt-2 font-vt text-xs text-text-dim">
              <span>Nv. {guild.level}</span>
              <span>{guild.members.length}/10 miembros</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-pixel text-text-dim" style={{ fontSize: '9px' }}>CÓDIGO:</span>
              <span className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>{guild.inviteCode}</span>
              <button onClick={copyCode} className="text-text-dim hover:text-accent-gold transition-colors">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <button
              onClick={handleLeave}
              className="flex items-center gap-1 px-2 py-1 border border-accent-crimson text-accent-crimson font-pixel hover:bg-accent-crimson hover:text-white transition-colors"
              style={{ fontSize: '8px' }}
            >
              <LogOut size={10} /> SALIR
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Members */}
        <div className="bg-bg-panel border-4 border-border-pixel p-3">
          <div className="font-pixel text-text-primary mb-3" style={{ fontSize: '10px' }}>MIEMBROS</div>
          <div className="space-y-2">
            {guild.members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <AvatarDisplay
                  avatarConfig={m.user.avatarConfig}
                  equippedAura={m.user.equippedAura}
                  equippedFrame={m.user.equippedFrame}
                  size={32}
                  animate="idle"
                />
                <div className="flex-1 min-w-0">
                  <div className={`font-pixel truncate ${m.userId === user?.id ? 'text-accent-gold' : 'text-text-primary'}`} style={{ fontSize: '8px' }}>
                    {m.user.displayName}
                    {m.role === 'LEADER' && ' 👑'}
                  </div>
                  <div className="font-vt text-text-dim" style={{ fontSize: '10px' }}>Nv.{m.user.level} · 🔥{m.user.currentStreak}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="md:col-span-2 bg-bg-panel border-4 border-border-pixel flex flex-col" style={{ height: '400px' }}>
          <div className="font-pixel text-text-primary p-3 border-b-2 border-border-pixel" style={{ fontSize: '10px' }}>
            CHAT DEL GREMIO
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 ? (
              <div className="text-center py-4 font-vt text-text-dim text-sm">¡Sé el primero en hablar!</div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.userId === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 items-end ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <AvatarDisplay
                      avatarConfig={msg.user.avatarConfig}
                      equippedAura={msg.user.equippedAura}
                      equippedFrame={msg.user.equippedFrame}
                      size={28}
                      animate="none"
                      className="flex-shrink-0 mb-4"
                    />
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                      <span className="font-pixel text-text-dim" style={{ fontSize: '8px' }}>
                        {!isMe && msg.user.displayName}
                      </span>
                      <div className={`px-3 py-2 border-2 font-vt text-sm ${
                        isMe
                          ? 'bg-blue-900 border-blue-600 text-blue-100'
                          : 'bg-bg-deep border-border-pixel text-text-primary'
                      }`}>
                        {msg.content}
                      </div>
                      <span className="font-vt text-text-dim" style={{ fontSize: '10px' }}>
                        {new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
          <div className="p-3 border-t-2 border-border-pixel flex gap-2">
            <input
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Mensaje..."
              maxLength={500}
              className="flex-1 bg-bg-deep border-2 border-border-pixel px-3 py-2 font-vt text-sm text-text-primary focus:outline-none focus:border-accent-gold"
            />
            <button
              onClick={handleSendMessage}
              disabled={!msgInput.trim()}
              className="px-3 py-2 bg-accent-gold border-2 border-accent-gold text-bg-deep hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
