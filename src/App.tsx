import React, { useState, useEffect } from 'react';
import { seedDatabase } from './db/db';
import { Dashboard } from './pages/Dashboard';
import { Nutrition } from './pages/Nutrition';
import { Workouts } from './pages/Workouts';
import { Planner } from './pages/Planner';
import { Profile } from './pages/Profile';
import { Gamification } from './pages/Gamification';
import { VitalisAI } from './components/VitalisAI';
import { Welcome } from './pages/auth/Welcome';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { 
  Home, 
  Utensils, 
  Dumbbell, 
  Calendar, 
  User,
  LayoutGrid,
  Menu,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { useUser } from './hooks/useUser';
import { LevelUpModal } from './components/gamification/GamificationUI';
import { useGamification } from './hooks/useGamification';

type Page = 'dashboard' | 'nutrition' | 'workouts' | 'planner' | 'profile' | 'gamification';
type AuthState = 'welcome' | 'login' | 'register';

export default function App() {
  const { profile, isLoading } = useUser();
  const { showLevelUp, setShowLevelUp, newLevel, updateStats } = useGamification();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [authState, setAuthState] = useState<AuthState>('welcome');

  useEffect(() => {
    seedDatabase();
  }, []);

  // Track daily usage for achievements
  useEffect(() => {
    if (profile && profile.isAuthenticated) {
      const today = new Date().toISOString().split('T')[0];
      if (profile.lastActiveDate !== today) {
        updateStats({ appUsedToday: true });
      }
    }
  }, [profile?.isAuthenticated, profile?.lastActiveDate, updateStats]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-16 w-16 border-4 border-t-vibrant-orange border-white/5 rounded-3xl shadow-[0_0_40px_rgba(255,106,0,0.2)]"
        />
      </div>
    );
  }

  // If user is not authenticated, show auth flow
  if (!profile || !profile.isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-bg max-w-md mx-auto relative overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          {authState === 'welcome' && (
            <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Welcome onLogin={() => setAuthState('login')} onRegister={() => setAuthState('register')} />
            </motion.div>
          )}
          {authState === 'login' && (
            <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Login onBack={() => setAuthState('welcome')} />
            </motion.div>
          )}
          {authState === 'register' && (
            <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Register onBack={() => setAuthState('welcome')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', icon: LayoutGrid, label: 'Resumo' },
    { id: 'nutrition', icon: Utensils, label: 'Dieta' },
    { id: 'workouts', icon: Dumbbell, label: 'Treino' },
    { id: 'planner', icon: Calendar, label: 'Agenda' },
    { id: 'gamification', icon: Trophy, label: 'Conquistas' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans selection:bg-vibrant-orange/10 selection:text-white flex overflow-hidden">
      
      <AnimatePresence>
        {showLevelUp && (
          <LevelUpModal level={newLevel} onClose={() => setShowLevelUp(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-72 h-screen bg-dark-surface border-r border-white/[0.04] p-8 flex-col justify-between sticky top-0 z-50">
        <div>
           <div className="flex items-center gap-3.5 mb-14 px-2">
             <div className="h-9 w-9 bg-vibrant-orange rounded-xl flex items-center justify-center text-white shadow-lg shadow-vibrant-orange/20">
                <LayoutGrid size={20} />
             </div>
             <h2 className="text-xl font-bold tracking-tight text-premium">VITALIS</h2>
           </div>
           
           <nav className="space-y-1.5 font-medium">
              {navItems.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as Page)}
                    className={cn(
                      "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all text-[13px] group text-left relative",
                      isActive ? "bg-white/[0.04] text-white" : "text-muted-text hover:text-white hover:bg-white/[0.02]"
                    )}
                  >
                    <item.icon size={18} className={cn("transition-all duration-300", isActive ? "text-vibrant-orange scale-110" : "opacity-30 group-hover:opacity-60")} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-indicator-desktop"
                        className="absolute left-0 w-1 h-5 bg-vibrant-orange rounded-full" 
                      />
                    )}
                  </button>
                );
              })}
           </nav>
        </div>

        <div className="pt-8 border-t border-white/[0.04]">
           <button 
             onClick={() => setCurrentPage('profile')}
             className="w-full p-4 bg-white/[0.02] hover:bg-white/[0.04] rounded-[16px] border border-white/[0.04] transition-all group"
           >
              <div className="flex gap-3 items-center">
                 <div className="h-9 w-9 bg-dark-elevated rounded-xl flex items-center justify-center border border-white/[0.05]">
                    <User size={18} className="text-muted-text opacity-40 group-hover:opacity-100 transition-opacity" />
                 </div>
                 <div className="text-left overflow-hidden">
                    <p className="text-xs font-bold text-white leading-none truncate">{profile.name}</p>
                    <p className="text-[10px] font-medium text-muted-text mt-1.5 uppercase tracking-[0.1em]">Protocolo Lvl {profile.level}</p>
                 </div>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header - Visible only on Mobile */}
        <header className="lg:hidden flex justify-between items-center px-8 py-6 border-b border-white/[0.04] bg-dark-bg/80 backdrop-blur-xl sticky top-0 z-40">
           <div className="flex items-center gap-3">
              <div className="h-7 w-7 bg-vibrant-orange rounded-lg flex items-center justify-center text-white">
                <LayoutGrid size={14} />
              </div>
              <h2 className="text-lg font-bold tracking-tight text-premium">VITALIS</h2>
           </div>
           <button className="h-10 w-10 bg-white/[0.03] border border-white/[0.05] rounded-xl flex items-center justify-center active:scale-95 transition-transform">
              <Menu size={18} className="text-vibrant-orange" />
           </button>
        </header>

        {/* Dynamic Inner Scroll Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <main className="max-w-4xl mx-auto p-6 md:p-12 relative pb-40 lg:pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
              >
                {(() => {
                  switch (currentPage) {
                    case 'dashboard': return <Dashboard />;
                    case 'nutrition': return <Nutrition />;
                    case 'workouts': return <Workouts />;
                    case 'planner': return <Planner />;
                    case 'gamification': return <Gamification />;
                    case 'profile': return <Profile />;
                    default: return <Dashboard />;
                  }
                })()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Modern Bottom Navigation Bar - Mobile Only */}
      <nav className="fixed bottom-8 left-8 right-8 z-50 lg:hidden pointer-events-none">
        <div className="max-w-md mx-auto bg-dark-surface/80 backdrop-blur-2xl rounded-[24px] flex items-center justify-center p-2 border border-white/[0.05] shadow-premium pointer-events-auto">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className="relative flex-1 flex flex-col items-center py-4 px-2 group transition-all"
              >
                <div className={cn(
                  "relative z-10 transition-all duration-400",
                  isActive ? "text-vibrant-orange scale-110" : "text-muted-text/40 hover:text-white/60"
                )}>
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {isActive && (
                  <motion.div 
                    layoutId="nav-bg-mobile"
                    className="absolute inset-x-1 inset-y-1 bg-white/[0.03] rounded-2xl -z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {isActive && (
                  <motion.div 
                    layoutId="nav-indicator-mobile"
                    className="absolute -bottom-1 w-1 h-1 bg-vibrant-orange rounded-full shadow-[0_0_8px_rgba(255,77,0,0.4)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>


      {/* Smart Suggestion Fab */}
      <VitalisAI />
    </div>
  );
}
