import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '../../hooks/useToast';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { PixelPanel } from '../../components/ui/PixelPanel';
import { PixelButton } from '../../components/ui/PixelButton';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import type { Transaction, Budget, FinancialGoal } from '@lifequest/shared';
import * as financeService from '../../services/finance.service';
import { SageContextButton } from '../../components/sage/SageContextButton';
import { DebtsPanel, RecurringPanel, ProjectionPanel, PaydayModal } from '../../components/finances/FinancesExtras';

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: '🍔', TRANSPORT: '🚌', ENTERTAINMENT: '🎮', HEALTH: '🏥',
  EDUCATION: '📚', CLOTHING: '👕', HOUSING: '🏠', UTILITIES: '💡',
  SAVINGS: '💰', INVESTMENT: '📈', SUBSCRIPTIONS: '💳', OTHER: '📦',
};

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: 'Comida', TRANSPORT: 'Transporte', ENTERTAINMENT: 'Ocio', HEALTH: 'Salud',
  EDUCATION: 'Educación', CLOTHING: 'Ropa', HOUSING: 'Vivienda', UTILITIES: 'Servicios',
  SAVINGS: 'Ahorro', INVESTMENT: 'Inversión', SUBSCRIPTIONS: 'Suscripciones', OTHER: 'Otros',
};

const COP_COLORS = ['#ffd23f', '#6bcf7f', '#4d96ff', '#ff6b6b', '#c77dff', '#ff9f43', '#48dbfb', '#ff9ff3', '#1dd1a1', '#feca57', '#54a0ff', '#5f27cd'];

function formatCOP(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

function TransactionModal({ onClose, onSave }: { onClose: () => void; onSave: (t: Transaction) => void }) {
  useEscapeKey(onClose);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('FOOD');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  async function save() {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      const t = await financeService.createTransaction({ type, amount: Number(amount), category, description: description || undefined, date });
      onSave(t);
      toast.success(type === 'INCOME' ? '¡Ingreso registrado!' : 'Gasto registrado');
    } catch {
      toast.error('Error al guardar transacción');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="bg-bg-panel border-2 border-border-pixel w-full max-w-md space-y-4 p-5"
        onClick={e => e.stopPropagation()}
      >
        <p className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>NUEVA TRANSACCIÓN</p>

        {/* Type toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setType('INCOME')}
            className={`flex-1 py-2 border-2 font-pixel transition-all ${type === 'INCOME' ? 'border-accent-green bg-accent-green/20 text-accent-green' : 'border-border-pixel text-text-secondary'}`}
            style={{ fontSize: '8px' }}
          >
            🟢 INGRESO
          </button>
          <button
            onClick={() => setType('EXPENSE')}
            className={`flex-1 py-2 border-2 font-pixel transition-all ${type === 'EXPENSE' ? 'border-accent-red bg-accent-red/20 text-accent-red' : 'border-border-pixel text-text-secondary'}`}
            style={{ fontSize: '8px' }}
          >
            🔴 GASTO
          </button>
        </div>

        {/* Amount */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-vt text-text-secondary text-lg">$</span>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="0"
            autoFocus
            className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-2xl pl-8 pr-16 py-3 focus:border-accent-gold outline-none text-right"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 font-pixel text-text-secondary" style={{ fontSize: '8px' }}>COP</span>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-4 gap-1">
          {Object.entries(CATEGORY_ICONS).map(([key, icon]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex flex-col items-center p-2 border transition-all ${category === key ? 'border-accent-gold bg-accent-gold/10' : 'border-border-pixel hover:border-text-secondary'}`}
            >
              <span className="text-lg">{icon}</span>
              <span className="font-pixel text-text-secondary mt-0.5" style={{ fontSize: '6px' }}>{CATEGORY_LABELS[key]}</span>
            </button>
          ))}
        </div>

        {/* Description */}
        <input
          type="text"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Descripción (opcional)"
          className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none"
        />

        {/* Date */}
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none"
        />

        <div className="flex gap-2">
          <PixelButton variant="ghost" onClick={onClose} className="flex-1">Cancelar</PixelButton>
          <PixelButton variant="primary" onClick={save} disabled={!amount || saving} className="flex-1">
            {saving ? 'Guardando...' : 'GUARDAR'}
          </PixelButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function FinancesPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'dashboard' | 'transactions' | 'budgets' | 'goals' | 'debts' | 'recurring' | 'projection'>('dashboard');
  const [showPayday, setShowPayday] = useState(false);
  const [dashboard, setDashboard] = useState<{ summary: { income: number; expenses: number; balance: number; byCategory: Record<string, number> }; budgets: (Budget & { spent: number })[]; goals: FinancialGoal[]; recent: Transaction[] } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', targetAmount: '', description: '' });
  const [showContributeModal, setShowContributeModal] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, txs, gl] = await Promise.all([
        financeService.fetchFinanceDashboard(),
        financeService.fetchTransactions(),
        financeService.fetchFinancialGoals(),
      ]);
      setDashboard(dash);
      setTransactions(txs);
      setGoals(gl);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const day = new Date().getDate();
    if (day === 1 || day === 15 || day === 30) setShowPayday(true);
  }, []);

  function handleTransactionSaved(t: Transaction) {
    // Optimistic: already added by modal, refresh
    setTransactions(prev => [t, ...prev]);
    setShowAddTransaction(false);
    load(); // Sync dashboard
  }

  async function handleDeleteTransaction(id: string) {
    setTransactions(prev => prev.filter(t => t.id !== id));
    try {
      await financeService.deleteTransaction(id);
      load();
    } catch {
      toast.error('Error al eliminar');
      load();
    }
  }

  async function handleCreateGoal() {
    if (!goalForm.title || !goalForm.targetAmount) return;
    try {
      const g = await financeService.createFinancialGoal({ title: goalForm.title, targetAmount: Number(goalForm.targetAmount), description: goalForm.description || undefined });
      setGoals(prev => [...prev, g]);
      setShowGoalModal(false);
      setGoalForm({ title: '', targetAmount: '', description: '' });
      toast.success('¡Meta creada!');
    } catch {
      toast.error('Error al crear meta');
    }
  }

  async function handleContribute() {
    if (!showContributeModal || !contributeAmount) return;
    const amount = Number(contributeAmount);
    // Optimistic
    setGoals(prev => prev.map(g => g.id === showContributeModal ? { ...g, currentAmount: g.currentAmount + amount } : g));
    setShowContributeModal(null);
    setContributeAmount('');
    try {
      await financeService.contributeToGoal(showContributeModal, amount);
      toast.success('¡Aporte agregado!');
      load();
    } catch {
      toast.error('Error al agregar aporte');
      load();
    }
  }

  if (loading && !dashboard) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const categoryData = dashboard ? Object.entries(dashboard.summary.byCategory).map(([k, v]) => ({ name: CATEGORY_LABELS[k] ?? k, value: v })) : [];

  return (
    <div className="space-y-4">
      {/* Header minimal */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-pixel text-accent-gold" style={{ fontSize: '14px' }}>💰 LA BÓVEDA</h1>
          <p className="font-vt text-text-secondary text-base">Finanzas en COP — dinero real</p>
        </div>
        <div className="flex items-center gap-2">
          <SageContextButton message="¿Cómo voy con mi dinero este mes? Analiza mis gastos e ingresos y dame recomendaciones concretas." label="¿Cómo voy?" />
          <PixelButton variant="primary" onClick={() => setShowAddTransaction(true)}>
            + TRANSACCIÓN
          </PixelButton>
        </div>
      </div>

      {/* ── Balance Hero Card ── */}
      {dashboard && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-6 text-center space-y-4"
          style={{
            background: 'linear-gradient(145deg, var(--bg-panel-light) 0%, var(--bg-panel) 100%)',
            border: '1px solid var(--border)',
          }}
        >
          {/* Balance principal animado */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)] font-medium">Balance del mes</p>
            <div
              className={`font-vt ${dashboard.summary.balance >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}
              style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', lineHeight: 1.1 }}
            >
              <AnimatedCounter
                value={dashboard.summary.balance}
                separator="."
                prefix="$ "
                duration={0.8}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--border)]" />

          {/* Ingresos & Gastos */}
          <div className="flex justify-center gap-10">
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-green)] inline-block" />
                <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-medium">Ingresos</p>
              </div>
              <div className="font-vt text-[var(--accent-green)] text-xl">
                <AnimatedCounter value={dashboard.summary.income} separator="." prefix="$ " duration={0.6} />
              </div>
            </div>

            <div className="w-px bg-[var(--border)]" />

            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-red)] inline-block" />
                <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-medium">Gastos</p>
              </div>
              <div className="font-vt text-[var(--accent-red)] text-xl">
                <AnimatedCounter value={dashboard.summary.expenses} separator="." prefix="$ " duration={0.6} />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {([['dashboard', '📊 Resumen'], ['transactions', '💸 Transacciones'], ['budgets', '📋 Presupuestos'], ['goals', '🎯 Metas'], ['debts', '💳 Deudas'], ['recurring', '🔄 Recurrentes'], ['projection', '📈 Proyección']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-shrink-0 px-3 py-1.5 border-2 font-pixel transition-all ${tab === key ? 'border-accent-gold bg-accent-gold text-bg-deep' : 'border-border-pixel text-text-secondary hover:border-text-secondary'}`}
            style={{ fontSize: '8px' }}
          >

            {label}
          </button>
        ))}
      </div>

      {/* Dashboard tab */}
      {tab === 'dashboard' && dashboard && (
        <div className="space-y-4">
          {categoryData.length > 0 && (
            <PixelPanel className="p-4">
              <p className="font-pixel text-text-secondary mb-3" style={{ fontSize: '8px' }}>GASTOS POR CATEGORÍA</p>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COP_COLORS[i % COP_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCOP(v)} contentStyle={{ background: 'var(--bg-panel)', border: '2px solid var(--border)', fontFamily: 'VT323', fontSize: '16px', color: 'var(--text-primary)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-1">
                  {categoryData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1">
                      <span className="w-3 h-3 flex-shrink-0" style={{ background: COP_COLORS[i % COP_COLORS.length] }} />
                      <span className="font-vt text-text-secondary text-base">{d.name}: {formatCOP(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </PixelPanel>
          )}

          {/* Recent transactions */}
          <PixelPanel className="p-4">
            <p className="font-pixel text-text-secondary mb-2" style={{ fontSize: '8px' }}>MOVIMIENTOS RECIENTES</p>
            <div className="space-y-2">
              {dashboard.recent.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between py-1 border-b border-border-pixel/30">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[t.category] ?? '📦'}</span>
                    <div>
                      <p className="font-vt text-text-primary text-base">{t.description ?? CATEGORY_LABELS[t.category]}</p>
                      <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>{new Date(t.date).toLocaleDateString('es-CO')}</p>
                    </div>
                  </div>
                  <p className={`font-vt text-lg ${t.type === 'INCOME' ? 'text-accent-green' : 'text-accent-red'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCOP(t.amount)}
                  </p>
                </div>
              ))}
            </div>
          </PixelPanel>
        </div>
      )}

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <PixelPanel className="p-8 text-center">
              <p className="text-4xl mb-2">💸</p>
              <p className="font-pixel text-text-secondary" style={{ fontSize: '9px' }}>SIN TRANSACCIONES</p>
            </PixelPanel>
          ) : (
            <AnimatePresence>
              {transactions.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <PixelPanel className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{CATEGORY_ICONS[t.category] ?? '📦'}</span>
                      <div>
                        <p className="font-vt text-text-primary text-lg">{t.description ?? CATEGORY_LABELS[t.category]}</p>
                        <p className="font-pixel text-text-secondary" style={{ fontSize: '7px' }}>
                          {CATEGORY_LABELS[t.category]} · {new Date(t.date).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`font-vt text-xl ${t.type === 'INCOME' ? 'text-accent-green' : 'text-accent-red'}`}>
                        {t.type === 'INCOME' ? '+' : '-'}{formatCOP(t.amount)}
                      </p>
                      <button
                        onClick={() => handleDeleteTransaction(t.id)}
                        className="font-pixel text-accent-red hover:opacity-70 transition-opacity"
                        style={{ fontSize: '8px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </PixelPanel>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Budgets tab */}
      {tab === 'budgets' && dashboard && (
        <div className="space-y-3">
          {dashboard.budgets.length === 0 ? (
            <PixelPanel className="p-8 text-center">
              <p className="text-4xl mb-2">📋</p>
              <p className="font-pixel text-text-secondary" style={{ fontSize: '9px' }}>SIN PRESUPUESTOS</p>
              <p className="font-vt text-text-secondary text-base mt-1">Crea presupuestos para controlar tus gastos</p>
            </PixelPanel>
          ) : (
            dashboard.budgets.map(b => {
              const pct = b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
              const color = pct >= 90 ? 'text-accent-red' : pct >= 70 ? 'text-accent-gold' : 'text-accent-green';
              const barColor = pct >= 90 ? 'bg-accent-red' : pct >= 70 ? 'bg-accent-gold' : 'bg-accent-green';
              return (
                <PixelPanel key={b.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[b.category]}</span>
                      <p className="font-vt text-text-primary text-lg">{CATEGORY_LABELS[b.category]}</p>
                    </div>
                    <p className={`font-pixel ${color}`} style={{ fontSize: '8px' }}>{Math.round(pct)}%</p>
                  </div>
                  <div className="stat-bar h-3">
                    <motion.div className={`h-full ${barColor}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="font-vt text-text-secondary text-base">{formatCOP(b.spent)} gastado</span>
                    <span className="font-vt text-text-secondary text-base">de {formatCOP(b.amount)}</span>
                  </div>
                </PixelPanel>
              );
            })
          )}
        </div>
      )}

      {/* Goals tab */}
      {tab === 'goals' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <PixelButton variant="secondary" onClick={() => setShowGoalModal(true)}>+ META</PixelButton>
          </div>
          {goals.length === 0 ? (
            <PixelPanel className="p-8 text-center">
              <p className="text-4xl mb-2">🎯</p>
              <p className="font-pixel text-text-secondary" style={{ fontSize: '9px' }}>SIN METAS DE AHORRO</p>
            </PixelPanel>
          ) : (
            goals.map(g => {
              const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
              return (
                <PixelPanel key={g.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-vt text-text-primary text-xl">{g.title}</p>
                    {g.isCompleted && <span className="font-pixel text-accent-gold" style={{ fontSize: '8px' }}>✓ COMPLETADA</span>}
                  </div>
                  {g.description && <p className="font-vt text-text-secondary text-base mb-2">{g.description}</p>}
                  <div className="stat-bar h-4 mb-1">
                    <motion.div className="h-full bg-accent-gold" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="font-vt text-text-secondary text-base">{formatCOP(g.currentAmount)}</span>
                    <span className="font-pixel text-accent-gold" style={{ fontSize: '8px' }}>{Math.round(pct)}%</span>
                    <span className="font-vt text-text-secondary text-base">{formatCOP(g.targetAmount)}</span>
                  </div>
                  {!g.isCompleted && (
                    <PixelButton variant="secondary" onClick={() => setShowContributeModal(g.id)} className="w-full">
                      + AGREGAR APORTE
                    </PixelButton>
                  )}
                </PixelPanel>
              );
            })
          )}
        </div>
      )}

      {/* Debts tab */}
      {tab === 'debts' && <DebtsPanel />}

      {/* Recurring tab */}
      {tab === 'recurring' && <RecurringPanel />}

      {/* Projection tab */}
      {tab === 'projection' && <ProjectionPanel />}

      {/* Transaction modal */}
      <AnimatePresence>
        {showAddTransaction && <TransactionModal onClose={() => setShowAddTransaction(false)} onSave={handleTransactionSaved} />}
      </AnimatePresence>

      {/* Payday modal */}
      <AnimatePresence>
        {showPayday && <PaydayModal onClose={() => setShowPayday(false)} />}
      </AnimatePresence>

      {/* Goal modal */}
      <AnimatePresence>
        {showGoalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowGoalModal(false)}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-bg-panel border-2 border-border-pixel p-5 w-full max-w-sm space-y-3" onClick={e => e.stopPropagation()}>
              <p className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>NUEVA META DE AHORRO</p>
              <input value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} placeholder="Nombre de la meta" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-lg px-3 py-2 focus:border-accent-gold outline-none" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-vt text-text-secondary">$</span>
                <input type="number" value={goalForm.targetAmount} onChange={e => setGoalForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="0" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-xl pl-8 py-2 focus:border-accent-gold outline-none" />
              </div>
              <input value={goalForm.description} onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción (opcional)" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-base px-3 py-2 focus:border-accent-gold outline-none" />
              <div className="flex gap-2">
                <PixelButton variant="ghost" onClick={() => setShowGoalModal(false)} className="flex-1">Cancelar</PixelButton>
                <PixelButton variant="primary" onClick={handleCreateGoal} className="flex-1">Crear Meta</PixelButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contribute modal */}
      <AnimatePresence>
        {showContributeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowContributeModal(null)}>
            <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-bg-panel border-2 border-border-pixel p-5 w-full max-w-xs space-y-3" onClick={e => e.stopPropagation()}>
              <p className="font-pixel text-accent-gold" style={{ fontSize: '10px' }}>AGREGAR APORTE</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-vt text-text-secondary">$</span>
                <input autoFocus type="number" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleContribute()} placeholder="0" className="w-full bg-bg-deep border-2 border-border-pixel text-text-primary font-vt text-2xl pl-8 py-2 focus:border-accent-gold outline-none" />
              </div>
              <div className="flex gap-2">
                <PixelButton variant="ghost" onClick={() => setShowContributeModal(null)} className="flex-1">Cancelar</PixelButton>
                <PixelButton variant="primary" onClick={handleContribute} className="flex-1">Agregar</PixelButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
