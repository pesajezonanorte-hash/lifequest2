import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Dumbbell, PiggyBank, Users, Globe, UserPlus, Check, X } from 'lucide-react';
import { getLeaderboard, sendFriendRequest, getFriends, getPendingRequests, respondFriendRequest, removeFriend } from '../../services/social.service';
import { useAuthStore } from '../../store/authStore';
import { AvatarDisplay } from '../../components/character/AvatarDisplay';

type Category = 'xp' | 'streak' | 'gym' | 'savings';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  level: number;
  value: number;
  xpToNextLevel?: number;
  avatarConfig?: unknown;
  equippedAura?: string | null;
  equippedFrame?: string | null;
  equippedHat?: string | null;
}

interface Friend {
  friendshipId: string;
  friend: {
    id: string;
    username: string;
    displayName: string;
    level: number;
    currentStreak: number;
    avatarConfig?: unknown;
    inviteCode?: string;
  };
  since: string;
}

interface PendingRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    displayName: string;
    level: number;
    avatarConfig?: unknown;
  };
  createdAt: string;
}

const CATEGORIES: Array<{ id: Category; label: string; icon: React.ReactNode; unit: string }> = [
  { id: 'xp',      label: 'XP Total',    icon: <Trophy size={16} />,   unit: 'XP' },
  { id: 'streak',  label: 'Racha Activa', icon: <Flame size={16} />,    unit: 'días' },
  { id: 'gym',     label: 'Gym',          icon: <Dumbbell size={16} />, unit: 'sesiones' },
  { id: 'savings', label: 'Ahorro',       icon: <PiggyBank size={16} />, unit: '%' },
];

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
const RANK_EMOJI  = ['👑', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [category, setCategory] = useState<Category>('xp');
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Friends state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [addInput, setAddInput] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addMsg, setAddMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [friendsLoading, setFriendsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(category, friendsOnly)
      .then((d) => setData(d as LeaderboardEntry[]))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [category, friendsOnly]);

  useEffect(() => {
    if (!friendsOnly) return;
    setFriendsLoading(true);
    Promise.all([getFriends(), getPendingRequests()])
      .then(([f, p]) => {
        setFriends(f as Friend[]);
        setPending(p as PendingRequest[]);
      })
      .catch(() => null)
      .finally(() => setFriendsLoading(false));
  }, [friendsOnly]);

  const myRank = data.findIndex((e) => e.id === user?.id) + 1;

  async function handleSendRequest() {
    if (!addInput.trim()) return;
    setAddLoading(true);
    setAddMsg(null);
    try {
      await sendFriendRequest(addInput.trim());
      setAddMsg({ ok: true, text: '¡Solicitud enviada!' });
      setAddInput('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al enviar solicitud';
      setAddMsg({ ok: false, text: msg });
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRespond(id: string, accept: boolean) {
    try {
      await respondFriendRequest(id, accept);
      setPending((prev) => prev.filter((p) => p.id !== id));
      if (accept) {
        // Refresh friends list
        getFriends().then((f) => setFriends(f as Friend[])).catch(() => null);
      }
    } catch { /* ignore */ }
  }

  async function handleRemove(friendshipId: string) {
    try {
      await removeFriend(friendshipId);
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
    } catch { /* ignore */ }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="text-accent-gold" size={28} />
        <h1 className="font-pixel text-accent-gold" style={{ fontSize: '16px' }}>
          TABLA DE LÍDERES
        </h1>
      </div>

      {/* Filter toggle */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setFriendsOnly(false)}
          className={`flex items-center gap-1 px-3 py-2 border-2 font-pixel transition-colors ${
            !friendsOnly ? 'bg-accent-gold text-bg-deep border-accent-gold' : 'border-border-pixel text-text-dim hover:text-text-primary'
          }`}
          style={{ fontSize: '9px' }}
        >
          <Globe size={12} /> Global
        </button>
        <button
          onClick={() => setFriendsOnly(true)}
          className={`flex items-center gap-1 px-3 py-2 border-2 font-pixel transition-colors ${
            friendsOnly ? 'bg-accent-gold text-bg-deep border-accent-gold' : 'border-border-pixel text-text-dim hover:text-text-primary'
          }`}
          style={{ fontSize: '9px' }}
        >
          <Users size={12} /> Amigos
        </button>
      </div>

      {/* Friends management panel */}
      <AnimatePresence>
        {friendsOnly && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-bg-panel border-2 border-border-pixel p-4 space-y-4"
          >
            {/* Add friend */}
            <div>
              <p className="font-pixel text-accent-gold mb-2" style={{ fontSize: '9px' }}>
                <UserPlus size={10} className="inline mr-1" />AGREGAR AMIGO
              </p>
              <div className="flex gap-2">
                <input
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
                  placeholder="Usuario o código de invitación..."
                  className="flex-1 bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-sm px-3 py-1.5 focus:border-accent-gold outline-none"
                />
                <button
                  onClick={handleSendRequest}
                  disabled={addLoading || !addInput.trim()}
                  className="px-3 py-1.5 border-2 border-accent-gold bg-accent-gold text-bg-deep font-pixel disabled:opacity-50"
                  style={{ fontSize: '8px' }}
                >
                  {addLoading ? '...' : 'ENVIAR'}
                </button>
              </div>
              {addMsg && (
                <p className={`font-vt text-sm mt-1 ${addMsg.ok ? 'text-accent-green' : 'text-accent-red'}`}>
                  {addMsg.text}
                </p>
              )}
            </div>

            {/* Pending requests */}
            {pending.length > 0 && (
              <div>
                <p className="font-pixel text-text-secondary mb-2" style={{ fontSize: '9px' }}>
                  SOLICITUDES PENDIENTES ({pending.length})
                </p>
                <div className="space-y-2">
                  {pending.map((req) => (
                    <div key={req.id} className="flex items-center gap-3 bg-bg-deep border border-border-pixel px-3 py-2">
                      <AvatarDisplay avatarConfig={req.requester.avatarConfig} size={32} animate="idle" />
                      <div className="flex-1 min-w-0">
                        <p className="font-pixel text-text-primary truncate" style={{ fontSize: '9px' }}>{req.requester.displayName}</p>
                        <p className="font-vt text-text-dim text-xs">@{req.requester.username} · Nv.{req.requester.level}</p>
                      </div>
                      <button
                        onClick={() => handleRespond(req.id, true)}
                        className="p-1.5 border border-accent-green text-accent-green hover:bg-accent-green hover:text-bg-deep transition-colors"
                        title="Aceptar"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={() => handleRespond(req.id, false)}
                        className="p-1.5 border border-accent-red text-accent-red hover:bg-accent-red hover:text-bg-deep transition-colors"
                        title="Rechazar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends list */}
            {!friendsLoading && friends.length > 0 && (
              <div>
                <p className="font-pixel text-text-secondary mb-2" style={{ fontSize: '9px' }}>
                  MIS AMIGOS ({friends.length})
                </p>
                <div className="space-y-2">
                  {friends.map((f) => (
                    <div key={f.friendshipId} className="flex items-center gap-3 bg-bg-deep border border-border-pixel px-3 py-2">
                      <AvatarDisplay avatarConfig={f.friend.avatarConfig} size={32} animate="idle" />
                      <div className="flex-1 min-w-0">
                        <p className="font-pixel text-text-primary truncate" style={{ fontSize: '9px' }}>{f.friend.displayName}</p>
                        <p className="font-vt text-text-dim text-xs">@{f.friend.username} · Nv.{f.friend.level} · 🔥{f.friend.currentStreak}</p>
                      </div>
                      <button
                        onClick={() => handleRemove(f.friendshipId)}
                        className="p-1.5 border border-border-pixel text-text-dim hover:border-accent-red hover:text-accent-red transition-colors"
                        title="Eliminar amigo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!friendsLoading && friends.length === 0 && pending.length === 0 && (
              <p className="font-vt text-text-dim text-sm text-center py-2">
                Aún no tienes amigos. ¡Agrega uno con su nombre de usuario!
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category tabs */}
      <div className="grid grid-cols-4 gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex flex-col items-center gap-1 p-2 border-2 font-pixel transition-all ${
              category === cat.id
                ? 'bg-bg-panel border-accent-gold text-accent-gold'
                : 'border-border-pixel text-text-dim hover:border-text-dim'
            }`}
            style={{ fontSize: '8px' }}
          >
            {cat.icon}
            <span className="hidden sm:block">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* My position banner */}
      {myRank > 0 && (
        <div className="bg-bg-panel border-2 border-accent-gold px-4 py-2 flex items-center justify-between">
          <span className="font-vt text-text-primary text-sm">Tu posición:</span>
          <span className="font-pixel text-accent-gold" style={{ fontSize: '12px' }}>
            #{myRank}
          </span>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-bg-panel border-4 border-border-pixel overflow-hidden">
        {loading ? (
          <div className="p-8 text-center font-vt text-text-dim animate-pulse">Cargando...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center font-vt text-text-dim">
            No hay datos todavía. ¡Sé el primero!
          </div>
        ) : (
          <div className="divide-y-2 divide-border-pixel">
            {data.slice(0, 50).map((entry, i) => {
              const isMe = entry.id === user?.id;
              const rankColor = RANK_COLORS[i] ?? 'transparent';
              const catInfo = CATEGORIES.find((c) => c.id === category)!;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-accent-gold/10' : ''}`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {i < 3 ? (
                      <span style={{ fontSize: '18px' }}>{RANK_EMOJI[i]}</span>
                    ) : (
                      <span
                        className="font-pixel"
                        style={{ fontSize: '10px', color: rankColor || '#6b7280' }}
                      >
                        #{entry.rank}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <AvatarDisplay
                    avatarConfig={entry.avatarConfig}
                    equippedAura={entry.equippedAura}
                    equippedFrame={entry.equippedFrame}
                    size={40}
                    animate="idle"
                  />

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-pixel truncate ${isMe ? 'text-accent-gold' : 'text-text-primary'}`} style={{ fontSize: '10px' }}>
                      {entry.displayName}
                      {isMe && ' (tú)'}
                    </div>
                    <div className="font-vt text-text-dim text-xs">@{entry.username} · Nv.{entry.level}</div>
                  </div>

                  {/* Value */}
                  <div className="text-right">
                    <div className="font-pixel text-accent-gold" style={{ fontSize: '11px' }}>
                      {entry.value.toLocaleString()}
                    </div>
                    <div className="font-vt text-text-dim" style={{ fontSize: '10px' }}>
                      {catInfo.unit}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
