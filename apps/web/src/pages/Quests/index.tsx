import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Quest } from '@lifequest/shared';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import { QuestCard } from '../../components/quests/QuestCard';
import { QuestModal } from '../../components/quests/QuestModal';
import { QuestWizard } from '../../components/quests/QuestWizard';
import { SkeletonList } from '../../components/ui/Skeleton';
import { useToastStore } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import * as questService from '../../services/quest.service';
import { SageContextButton } from '../../components/sage/SageContextButton';

const TABS = [
  { key: '',        label: 'Todas',        icon: '📜' },
  { key: 'MAIN',    label: 'Principales',  icon: '⚔️' },
  { key: 'SIDE',    label: 'Secundarias',  icon: '🗡️' },
  { key: 'DAILY',   label: 'Diarias',      icon: '☀️' },
  { key: 'WEEKLY',  label: 'Semanales',    icon: '📅' },
  { key: 'META',    label: 'Metas',        icon: '🎯' },
  { key: 'COMPLETED', label: 'Completadas',icon: '✅' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  HEALTH: 'Salud', FITNESS: 'Fitness', FINANCE: 'Finanzas', LEARNING: 'Aprendizaje',
  LOVE: 'Amor', SOCIAL: 'Social', PERSONAL: 'Personal', CREATIVE: 'Creativo',
};

export default function QuestsPage() {
  const user = useAuthStore((s) => s.user);
  const { addFloatingXP, flashScreen, showAchievementToast, triggerLevelUp } = useUIStore();
  const toast = useToastStore();
  const [searchParams] = useSearchParams();

  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const filter = searchParams.get('filter');
    if (filter === 'meta') return 'META';
    return '';
  });
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [sortBy, setSortBy] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const loadQuests = useCallback(async () => {
    setLoading(true);
    try {
      const filters: questService.QuestFilters = {};
      if (activeTab && activeTab !== 'COMPLETED') filters.type = activeTab;
      if (activeTab === 'COMPLETED') filters.status = 'COMPLETED';
      else if (!activeTab) { /* no status filter — show active + completed */ }
      if (filterCategory) filters.category = filterCategory;
      if (filterDifficulty) filters.difficulty = filterDifficulty;
      if (debouncedSearch) filters.search = debouncedSearch;
      if (sortBy) filters.sortBy = sortBy;

      const data = await questService.fetchQuests(filters);
      setQuests(data);
    } catch {
      toast.error('Error cargando misiones');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filterCategory, filterDifficulty, debouncedSearch, sortBy]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  async function handleComplete(quest: Quest, e?: React.MouseEvent) {
    if (e) {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      addFloatingXP(quest.xpReward, rect.left + rect.width / 2, rect.top);
    }

    // Optimistic update
    setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, status: 'COMPLETED' as const } : q));
    flashScreen('#ffd23f');

    try {
      const result = await questService.completeQuest(quest.id);
      setQuests(prev => prev.map(q => q.id === quest.id ? result.user as unknown as Quest ?? q : q));
      useAuthStore.getState().updateUser(result.user);

      if (result.rewards.leveledUp && result.rewards.newLevel) {
        triggerLevelUp({
          oldLevel: result.rewards.newLevel - 1,
          newLevel: result.rewards.newLevel,
          xpEarned: result.rewards.xpEarned,
          goldEarned: result.rewards.goldEarned,
          statIncreases: result.rewards.statIncreases ?? {},
        });
      }

      for (const ach of result.achievementsUnlocked) {
        showAchievementToast(ach);
      }

      await loadQuests();
    } catch {
      // Rollback
      setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, status: 'ACTIVE' as const } : q));
    }
  }

  async function handleWizardSubmit(formData: {
    type: string; title: string; description: string; category: string;
    difficulty: string; deadline: string; subObjectives: string[];
  }) {
    const payload = {
      type: formData.type as Quest['type'],
      title: formData.title,
      description: formData.description || undefined,
      category: formData.category as Quest['category'],
      difficulty: formData.difficulty as Quest['difficulty'],
      deadline: formData.deadline || undefined,
      subObjectives: formData.subObjectives.filter(Boolean).map((title, i) => ({ id: String(i + 1), title, completed: false })),
    };

    if (editingQuest) {
      // Optimistic update for edit
      setQuests(prev => prev.map(q => q.id === editingQuest.id ? { ...q, ...payload } : q));
      setShowWizard(false);
      setEditingQuest(null);
      try {
        await questService.updateQuest(editingQuest.id, payload);
      } catch {
        await loadQuests(); // rollback
      }
    } else {
      // Optimistic create: show saving placeholder
      const tempId = 'temp_' + Date.now();
      const tempQuest: Quest = {
        id: tempId,
        userId: '',
        ...payload,
        xpReward: 50,
        goldReward: 10,
        isRecurring: false,
        subObjectives: payload.subObjectives ?? [],
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setQuests(prev => [tempQuest, ...prev]);
      setShowWizard(false);
      setEditingQuest(null);
      try {
        await questService.createQuest(payload);
        await loadQuests();
      } catch {
        setQuests(prev => prev.filter(q => q.id !== tempId));
      }
    }
  }

  async function handleArchive(quest: Quest) {
    // Optimistic
    setQuests(prev => prev.filter(q => q.id !== quest.id));
    try {
      await questService.archiveQuest(quest.id);
    } catch {
      await loadQuests();
    }
  }

  async function handleFail(quest: Quest) {
    // Optimistic
    setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, status: 'FAILED' as const } : q));
    try {
      await questService.failQuest(quest.id);
    } catch {
      setQuests(prev => prev.map(q => q.id === quest.id ? { ...q, status: 'ACTIVE' as const } : q));
    }
  }

  function handleEdit(quest: Quest) {
    setEditingQuest(quest);
    setShowWizard(true);
  }

  function handleQuestUpdated(updated: Quest) {
    setQuests((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
    setSelectedQuest(updated);
  }

  const activeQuests = quests.filter((q) => q.status === 'ACTIVE');
  const completedQuests = quests.filter((q) => q.status === 'COMPLETED');
  const inactiveQuests = quests.filter((q) => q.status === 'FAILED' || q.status === 'ARCHIVED');

  const displayQuests = activeTab === 'COMPLETED'
    ? completedQuests
    : activeTab
    ? quests
    : [...activeQuests, ...completedQuests.slice(0, 3), ...inactiveQuests];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>
            📜 PERGAMINO DE MISIONES
          </h1>
          <p className="font-vt text-text-secondary text-base">
            Tus aventuras pendientes, {user?.displayName?.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SageContextButton message="¿Por dónde empiezo? Prioriza mis misiones activas según lo más urgente." label="¿Por dónde empiezo?" />
          <PixelButton variant="primary" onClick={() => { setEditingQuest(null); setShowWizard(true); }}>
            + NUEVA MISIÓN
          </PixelButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 border-2 font-pixel transition-all ${
              activeTab === tab.key
                ? 'border-accent-gold bg-accent-gold text-bg-deep'
                : 'border-border-pixel text-text-secondary hover:border-text-secondary hover:text-text-primary'
            }`}
            style={{ fontSize: '8px' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <PixelPanel className="p-3">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar misión..."
            className="bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-1 focus:border-accent-gold outline-none flex-1 min-w-32"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-2 py-1 focus:border-accent-gold outline-none"
          >
            <option value="">📋 Categoría</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-2 py-1 focus:border-accent-gold outline-none"
          >
            <option value="">⚡ Dificultad</option>
            <option value="EASY">Fácil</option>
            <option value="NORMAL">Normal</option>
            <option value="HARD">Difícil</option>
            <option value="EPIC">ÉPICA</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-2 py-1 focus:border-accent-gold outline-none"
          >
            <option value="">📊 Ordenar</option>
            <option value="xp">Por XP</option>
            <option value="deadline">Por Deadline</option>
            <option value="difficulty">Por Dificultad</option>
          </select>
        </div>
      </PixelPanel>

      {/* Quest Grid */}
      {loading ? (
        <SkeletonList count={4} />
      ) : displayQuests.length === 0 ? (
        <PixelPanel className="p-8 text-center">
          <p className="text-4xl mb-3">📜</p>
          <p className="font-pixel text-text-secondary" style={{ fontSize: '9px' }}>EL PERGAMINO ESTÁ VACÍO</p>
          <p className="font-vt text-text-secondary text-base mt-1">Crea tu primera misión para comenzar la aventura</p>
          <div className="mt-4">
            <PixelButton variant="primary" onClick={() => setShowWizard(true)}>
              + PRIMERA MISIÓN
            </PixelButton>
          </div>
        </PixelPanel>
      ) : (
        <AnimatePresence>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayQuests.map((quest, idx) => (
              <motion.div
                key={quest.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.04, duration: 0.18 }}
              >
                <QuestCard
                  quest={quest}
                  onComplete={handleComplete}
                  onClick={setSelectedQuest}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Quest Detail Modal */}
      <AnimatePresence>
        {selectedQuest && (
          <QuestModal
            quest={selectedQuest}
            onClose={() => setSelectedQuest(null)}
            onComplete={(q) => handleComplete(q)}
            onEdit={handleEdit}
            onArchive={handleArchive}
            onFail={handleFail}
            onQuestUpdated={handleQuestUpdated}
          />
        )}
      </AnimatePresence>

      {/* Quest Wizard */}
      <AnimatePresence>
        {showWizard && (
          <QuestWizard
            onSubmit={handleWizardSubmit}
            onClose={() => { setShowWizard(false); setEditingQuest(null); }}
            initialData={editingQuest ? {
              type: editingQuest.type,
              title: editingQuest.title,
              description: editingQuest.description ?? '',
              category: editingQuest.category,
              difficulty: editingQuest.difficulty,
              deadline: editingQuest.deadline?.split('T')[0] ?? '',
              subObjectives: (editingQuest.subObjectives as Array<{ title: string }>).map(s => s.title),
            } : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
