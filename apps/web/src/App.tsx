import { Suspense, lazy, useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { useBootstrapAuth } from './hooks/useAuth';
import { GameLayout } from './components/layout/GameLayout';
import { SplashScreen } from './components/animations/SplashScreen';
import { SageWidget } from './components/sage/SageWidget';
import { FeedbackButton } from './components/ui/FeedbackButton';
import { ErrorBoundary } from './components/ErrorBoundary';

const LoginPage        = lazy(() => import('./pages/Login'));
const RegisterPage     = lazy(() => import('./pages/Register'));
const DashboardPage    = lazy(() => import('./pages/Dashboard'));
const CharacterPage    = lazy(() => import('./pages/Character'));
const OnboardingPage   = lazy(() => import('./pages/Onboarding'));
const QuestsPage       = lazy(() => import('./pages/Quests'));
const HabitsPage       = lazy(() => import('./pages/Habits'));
const AchievementsPage = lazy(() => import('./pages/Achievements'));
const HistoryPage      = lazy(() => import('./pages/History'));
const GymPage          = lazy(() => import('./pages/Gym'));
const FinancesPage     = lazy(() => import('./pages/Finances'));
const SleepPage        = lazy(() => import('./pages/Sleep'));
const FoodPage         = lazy(() => import('./pages/Food'));
const LearningPage     = lazy(() => import('./pages/Learning'));
const JournalPage      = lazy(() => import('./pages/Journal'));
const LovePage         = lazy(() => import('./pages/Love'));
const ShopPage         = lazy(() => import('./pages/Shop'));
const SettingsPage     = lazy(() => import('./pages/Settings'));
const LeaderboardPage  = lazy(() => import('./pages/Leaderboard'));
const ChallengesPage   = lazy(() => import('./pages/Challenges'));
const GuildPage        = lazy(() => import('./pages/Guild'));
const StatsPage        = lazy(() => import('./pages/Stats'));
const SeasonPage       = lazy(() => import('./pages/Season'));
const IntegrationsPage = lazy(() => import('./pages/Settings/Integrations'));
const AgendaPage       = lazy(() => import('./pages/Agenda'));
const LifePage         = lazy(() => import('./pages/Life'));
const GoalsPage        = lazy(() => import('./pages/Goals'));
const RitualsPage      = lazy(() => import('./pages/Rituals'));
const GlowUpPage       = lazy(() => import('./pages/GlowUp'));
const WisdomPage       = lazy(() => import('./pages/Wisdom'));
const NotFoundPage     = lazy(() => import('./pages/NotFound'));
const AboutPage        = lazy(() => import('./pages/About'));
const FAQPage          = lazy(() => import('./pages/FAQ'));

// Page transition variants (context-aware)
const pageVariants = {
  initial: { opacity: 0, y: 8, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 1.01,
    transition: { duration: 0.15 },
  },
};

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep">
      <motion.div
        className="rounded-full border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        Loading LifeQuest...
      </motion.div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ width: '100%' }}
      >
        <Routes location={location}>
          <Route path="/"             element={<DashboardPage />} />
          <Route path="/character"    element={<CharacterPage />} />
          <Route path="/quests"       element={<QuestsPage />} />
          <Route path="/quests/new"   element={<QuestsPage />} />
          <Route path="/habits"       element={<HabitsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/history"      element={<HistoryPage />} />
          <Route path="/gym"          element={<GymPage />} />
          <Route path="/finances"     element={<FinancesPage />} />
          <Route path="/sleep"        element={<SleepPage />} />
          <Route path="/food"         element={<FoodPage />} />
          <Route path="/learning"     element={<LearningPage />} />
          <Route path="/journal"      element={<JournalPage />} />
          <Route path="/love"         element={<LovePage />} />
          <Route path="/shop"         element={<ShopPage />} />
          <Route path="/settings"     element={<SettingsPage />} />
          <Route path="/leaderboard"  element={<LeaderboardPage />} />
          <Route path="/challenges"   element={<ChallengesPage />} />
          <Route path="/guild"        element={<GuildPage />} />
          <Route path="/stats"                    element={<StatsPage />} />
          <Route path="/season"                   element={<SeasonPage />} />
          <Route path="/settings/integrations"    element={<IntegrationsPage />} />
          <Route path="/agenda"                   element={<AgendaPage />} />
          <Route path="/life"                     element={<LifePage />} />
          <Route path="/goals"                    element={<GoalsPage />} />
          <Route path="/rituals"                  element={<RitualsPage />} />
          <Route path="/glow-up"                  element={<GlowUpPage />} />
          <Route path="/wisdom"                   element={<WisdomPage />} />
          <Route path="/about"                    element={<AboutPage />} />
          <Route path="/faq"                      element={<FAQPage />} />
          <Route path="*"             element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const pathname = window.location.pathname;
  const isIntegrationRoute = pathname === '/settings/integrations';
  
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.onboardingCompleted && pathname !== '/onboarding' && !isIntegrationRoute) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.onboardingCompleted) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  useBootstrapAuth();
  const { initAudio } = useUIStore();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    const theme = (user as any)?.activeTheme ?? 'aurora';
    document.documentElement.setAttribute('data-theme', theme);
  }, [(user as any)?.activeTheme]);

  const [splashDone, setSplashDone] = useState(false);
  const isLoadingRef = useRef(isLoading);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  useEffect(() => {
    initAudio();
    // Force splash done after 6s no matter what (hard safety net)
    const hardTimeout = setTimeout(() => setSplashDone(true), 6000);
    return () => clearTimeout(hardTimeout);
  }, [initAudio]);

  // Watch for auth + 2.2s delay, then release splash
  useEffect(() => {
    if (splashDone) return;
    const minDelay = setTimeout(() => {
      // At this point 2.2s have passed; wait for auth if still loading
      if (!isLoadingRef.current) {
        setSplashDone(true);
      } else {
        const check = setInterval(() => {
          if (!isLoadingRef.current) {
            clearInterval(check);
            setSplashDone(true);
          }
        }, 100);
        // Safety: clear if somehow never resolves
        const bail = setTimeout(() => { clearInterval(check); setSplashDone(true); }, 4000);
        return () => { clearInterval(check); clearTimeout(bail); };
      }
    }, 2200);
    return () => clearTimeout(minDelay);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showSplash = !splashDone;

  return (
    <ErrorBoundary>
      {showSplash && <SplashScreen onDone={() => setSplashDone(true)} />}

      {!showSplash && (
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login"      element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register"   element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <ErrorBoundary>
                    <GameLayout>
                      <AnimatedRoutes />
                    </GameLayout>
                  </ErrorBoundary>
                  <SageWidget />
                  <FeedbackButton />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      )}
    </ErrorBoundary>
  );
}
