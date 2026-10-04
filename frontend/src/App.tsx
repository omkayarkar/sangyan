import { useState, useEffect } from 'react';
import { Header } from '@/Header';
import { BottomNav, type TabId } from '@/BottomNav';
import { HomePage } from '@/HomePage';
import { ScamVerifier } from '@/ScamVerifier';
import { TipProfiler } from '@/TipProfiler';
import { VoiceExplainer } from '@/VoiceExplainer';
import { DecisionJournal } from '@/DecisionJournal';
import { GrievanceAssistant } from '@/GrievanceAssistant';
import { useLanguage } from '@/contexts/LanguageContext';

function AppContent() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabId>('home');
  const [showProfiler, setShowProfiler] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [tab]);

  const handleNavigate = (newTab: TabId) => {
    if (newTab === 'verify' && showProfiler) {
      setShowProfiler(false);
    }
    setTab(newTab);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 pt-20 pb-24 safe-bottom">
        {tab === 'home' && <HomePage onNavigate={handleNavigate} />}

        {tab === 'verify' && (
          <div className="space-y-5">
            {/* Sub-tab toggle: Verifier vs Tip Profiler */}
            <div className="flex gap-2 p-1 bg-white rounded-xl border border-gray-100 shadow-sm">
              <button
                onClick={() => setShowProfiler(false)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  !showProfiler
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t('verify.title')}
              </button>
              <button
                onClick={() => setShowProfiler(true)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  showProfiler
                    ? 'bg-accent-500 text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {t('tipProfiler.title')}
              </button>
            </div>
            {showProfiler ? <TipProfiler /> : <ScamVerifier />}
          </div>
        )}

        {tab === 'learn' && <VoiceExplainer />}
        {tab === 'journal' && <DecisionJournal />}
        {tab === 'help' && <GrievanceAssistant />}
      </main>

      <BottomNav active={tab} onChange={handleNavigate} />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
