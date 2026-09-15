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
import { NotificationPermissionModal, useNotificationModalState } from './components/ui/NotificationPermissionModal';
import { useKeyboardAdjust } from './hooks/useKeyboardAdjust';

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
const AgendaPage       = lazy(() => import('./pages/Agenda'));
const LifePage         = lazy(() => import('./pages/Life'));
const GoalsPage        = lazy(() => import('./pages/Goals'));
const RitualsPage      = lazy(() => import('./pages/Rituals'));
const GlowUpPage       = lazy(() => import('./pages/GlowUp'));
const WisdomPage       = lazy(() => import('./pages/Wisdom'));
const CustomZonesPage  = lazy(() => import('./pages/CustomZones'));
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

function SafePage({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
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
          <Route path="/"             element={<SafePage><DashboardPage /></SafePage>} />
          <Route path="/character"    element={<SafePage><CharacterPage /></SafePage>} />
          <Route path="/quests"       element={<SafePage><QuestsPage /></SafePage>} />
          <Route path="/quests/new"   element={<SafePage><QuestsPage /></SafePage>} />
          <Route path="/habits"       element={<SafePage><HabitsPage /></SafePage>} />
          <Route path="/achievements" element={<SafePage><AchievementsPage /></SafePage>} />
          <Route path="/history"      element={<SafePage><HistoryPage /></SafePage>} />
          <Route path="/gym"          element={<SafePage><GymPage /></SafePage>} />
          <Route path="/finances"     element={<SafePage><FinancesPage /></SafePage>} />
          <Route path="/sleep"        element={<SafePage><SleepPage /></SafePage>} />
          <Route path="/food"         element={<SafePage><FoodPage /></SafePage>} />
          <Route path="/learning"     element={<SafePage><LearningPage /></SafePage>} />
          <Route path="/journal"      element={<SafePage><JournalPage /></SafePage>} />
          <Route path="/love"         element={<SafePage><LovePage /></SafePage>} />
          <Route path="/shop"         element={<SafePage><ShopPage /></SafePage>} />
          <Route path="/settings"     element={<SafePage><SettingsPage /></SafePage>} />
          <Route path="/leaderboard"  element={<SafePage><LeaderboardPage /></SafePage>} />
          <Route path="/challenges"   element={<SafePage><ChallengesPage /></SafePage>} />
          <Route path="/guild"        element={<SafePage><GuildPage /></SafePage>} />
          <Route path="/stats"        element={<SafePage><StatsPage /></SafePage>} />
          <Route path="/season"       element={<SafePage><SeasonPage /></SafePage>} />
          <Route path="/agenda"       element={<SafePage><AgendaPage /></SafePage>} />
          <Route path="/life"         element={<SafePage><LifePage /></SafePage>} />
          <Route path="/custom-zones" element={<SafePage><CustomZonesPage /></SafePage>} />
          <Route path="/goals"    element={<Navigate to="/quests?filter=meta" replace />} />
          <Route path="/metas"    element={<Navigate to="/quests?filter=meta" replace />} />
          <Route path="/rituals"  element={<Navigate to="/habits?filter=ritual" replace />} />
          <Route path="/rituales" element={<Navigate to="/habits?filter=ritual" replace />} />
          <Route path="/glow-up"  element={<SafePage><GlowUpPage /></SafePage>} />
          <Route path="/wisdom"   element={<SafePage><WisdomPage /></SafePage>} />
          <Route path="/about"    element={<SafePage><AboutPage /></SafePage>} />
          <Route path="/faq"      element={<SafePage><FAQPage /></SafePage>} />
          <Route path="*"         element={<SafePage><NotFoundPage /></SafePage>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const pathname = window.location.pathname;
  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !user.onboardingCompleted && pathname !== '/onboarding') {
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
  useKeyboardAdjust();
  const { initAudio } = useUIStore();
  const { user, isLoading, isAuthenticated } = useAuthStore();
  const { show: showNotifModal, setShow: setShowNotifModal } = useNotificationModalState();

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

      {isAuthenticated && showNotifModal && (
        <NotificationPermissionModal onClose={() => setShowNotifModal(false)} />
      )}

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
