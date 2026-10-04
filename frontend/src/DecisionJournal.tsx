import { useState, useEffect, useCallback } from 'react';
import { NotebookPen, Plus, Trash2, Download, AlertTriangle, Moon, Check, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { JournalEntry } from '@/lib/types';

const STORAGE_KEY = 'suraksha-journal';

function loadEntries(): JournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as JournalEntry[];
  } catch {
    return [];
  }
}

function saveEntries(entries: JournalEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function DecisionJournal() {
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCoolingOff, setShowCoolingOff] = useState(false);
  const [showLateNight, setShowLateNight] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Form fields
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [horizon, setHorizon] = useState<'short' | 'medium' | 'long'>('long');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [changeMind, setChangeMind] = useState('');
  const [isLoss, setIsLoss] = useState(false);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  const checkCoolingOff = useCallback((): boolean => {
    const recentLoss = entries.some((e) => {
      if (!e.isLoss) return false;
      const entryDate = new Date(e.date);
      const daysDiff = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff < 30;
    });
    return recentLoss;
  }, [entries]);

  const isLateNight = new Date().getHours() >= 23 || new Date().getHours() < 5;

  const handleSave = useCallback(() => {
    if (!amount || !reason) return;

    const hasRecentLoss = checkCoolingOff();
    if (hasRecentLoss && !showCoolingOff) {
      setShowCoolingOff(true);
      return;
    }

    if (isLateNight && !showLateNight && !showCoolingOff) {
      setShowLateNight(true);
      return;
    }

    const entry: JournalEntry = {
      id: `entry-${Date.now()}`,
      date: new Date().toISOString(),
      amount: parseInt(amount, 10) || 0,
      reason,
      horizon,
      expectedOutcome,
      changeMind,
      verified: false,
      isLoss,
    };

    const updated = [entry, ...entries];
    setEntries(updated);
    saveEntries(updated);

    // Reset form
    setAmount('');
    setReason('');
    setExpectedOutcome('');
    setChangeMind('');
    setIsLoss(false);
    setHorizon('long');
    setShowForm(false);
    setShowCoolingOff(false);
    setShowLateNight(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
  }, [amount, reason, horizon, expectedOutcome, changeMind, isLoss, entries, checkCoolingOff, showCoolingOff, showLateNight, isLateNight]);

  const handleDelete = useCallback(
    (id: string) => {
      const updated = entries.filter((e) => e.id !== id);
      setEntries(updated);
      saveEntries(updated);
    },
    [entries]
  );

  const handleDeleteAll = useCallback(() => {
    if (window.confirm(t('journal.confirmDeleteAll'))) {
      setEntries([]);
      saveEntries([]);
    }
  }, [t]);

  const handleExport = useCallback(() => {
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suraksha-journal-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  const formatDate = (iso: string): string => {
    const d = new Date(iso);
    return lang === 'hi'
      ? d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const horizonLabel = (h: 'short' | 'medium' | 'long') => {
    if (h === 'short') return t('journal.horizonShort');
    if (h === 'medium') return t('journal.horizonMedium');
    return t('journal.horizonLong');
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center">
            <NotebookPen className="w-5 h-5 text-primary-600" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h2 className={`text-lg font-bold text-gray-900 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('journal.title')}
            </h2>
            <p className={`text-xs text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('journal.subtitle')}
            </p>
          </div>
        </div>

        {/* Privacy note */}
        <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-success-50 border border-success-100">
          <Check className="w-4 h-4 text-success-600 shrink-0" />
          <p className={`text-xs text-success-700 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('journal.privacyNote')}
          </p>
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className={`mt-4 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-200 active:scale-[0.98] transition-all ${lang === 'hi' ? 'font-hi' : ''}`}
          >
            <Plus className="w-5 h-5" />
            {t('journal.addEntry')}
          </button>
        ) : (
          <div className="mt-4 space-y-3 animate-slide-up">
            {/* Amount */}
            <div>
              <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('journal.amount')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={t('journal.amountPlaceholder')}
                  className={`w-full pl-7 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm ${lang === 'hi' ? 'font-hi' : ''}`}
                />
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('journal.reason')}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('journal.reasonPlaceholder')}
                rows={2}
                className={`w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none placeholder:text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}
              />
            </div>

            {/* Horizon */}
            <div>
              <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('journal.horizon')}
              </label>
              <div className="flex gap-2">
                {(['short', 'medium', 'long'] as const).map((h) => (
                  <button
                    key={h}
                    onClick={() => setHorizon(h)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                      horizon === h
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${lang === 'hi' ? 'font-hi' : ''}`}
                  >
                    {horizonLabel(h)}
                  </button>
                ))}
              </div>
            </div>

            {/* Expected outcome */}
            <div>
              <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('journal.expectedOutcome')}
              </label>
              <input
                type="text"
                value={expectedOutcome}
                onChange={(e) => setExpectedOutcome(e.target.value)}
                placeholder={t('journal.expectedOutcomePlaceholder')}
                className={`w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm placeholder:text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}
              />
            </div>

            {/* Change mind */}
            <div>
              <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('journal.changeMind')}
              </label>
              <textarea
                value={changeMind}
                onChange={(e) => setChangeMind(e.target.value)}
                placeholder={t('journal.changeMindPlaceholder')}
                rows={2}
                className={`w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none placeholder:text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}
              />
            </div>

            {/* Loss checkbox */}
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-warning-50 border border-warning-100 cursor-pointer">
              <input
                type="checkbox"
                checked={isLoss}
                onChange={(e) => setIsLoss(e.target.checked)}
                className="w-4 h-4 rounded accent-warning-500"
              />
              <span className={`text-sm text-warning-800 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {lang === 'hi' ? 'यह नुकसान दर्ज कर रहे हैं' : 'Logging a loss / scam loss'}
              </span>
            </label>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={!amount || !reason}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all ${
                  amount && reason
                    ? 'bg-primary-600 hover:bg-primary-700'
                    : 'bg-gray-300 cursor-not-allowed'
                } ${lang === 'hi' ? 'font-hi' : ''}`}
              >
                {t('journal.save')}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className={`px-5 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors ${lang === 'hi' ? 'font-hi' : ''}`}
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}

        {savedFlash && (
          <div className="mt-3 p-3 rounded-xl bg-success-50 border border-success-200 flex items-center gap-2 animate-slide-up">
            <Check className="w-4 h-4 text-success-600" />
            <p className={`text-sm text-success-700 ${lang === 'hi' ? 'font-hi' : ''}`}>{t('journal.saved')}</p>
          </div>
        )}
      </div>

      {/* Cooling-off modal */}
      {showCoolingOff && (
        <div className="bg-warning-50 border-2 border-warning-300 rounded-2xl p-5 animate-slide-up">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-full bg-warning-200 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-warning-700" />
            </div>
            <h3 className={`text-base font-bold text-warning-800 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('journal.coolingOff')}
            </h3>
          </div>
          <p className={`text-sm text-warning-800 mb-3 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('journal.coolingOffMsg')}
          </p>
          <div className="space-y-2 mb-4">
            {[t('journal.coolingOffQuestion1'), t('journal.coolingOffQuestion2'), t('journal.coolingOffQuestion3')].map((q, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/60">
                <span className="w-5 h-5 rounded-full bg-warning-300 text-warning-800 text-xs flex items-center justify-center shrink-0 font-bold">
                  {i + 1}
                </span>
                <p className={`text-sm text-warning-900 ${lang === 'hi' ? 'font-hi' : ''}`}>{q}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className={`flex-1 py-3 rounded-xl font-semibold text-white bg-warning-600 hover:bg-warning-700 transition-all ${lang === 'hi' ? 'font-hi' : ''}`}
            >
              {t('journal.coolingOffConfirm')}
            </button>
            <button
              onClick={() => { setShowCoolingOff(false); setShowForm(false); }}
              className={`flex-1 py-3 rounded-xl font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all ${lang === 'hi' ? 'font-hi' : ''}`}
            >
              {t('journal.coolingOffWait')}
            </button>
          </div>
        </div>
      )}

      {/* Late night alert */}
      {showLateNight && !showCoolingOff && (
        <div className="bg-primary-900 border-2 border-primary-700 rounded-2xl p-5 animate-slide-up text-white">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-700 flex items-center justify-center">
              <Moon className="w-5 h-5 text-primary-200" />
            </div>
            <h3 className={`text-base font-bold ${lang === 'hi' ? 'font-hi' : ''}`}>
              {lang === 'hi' ? 'देर रात सचेतक' : 'Late Night Reminder'}
            </h3>
          </div>
          <p className={`text-sm text-primary-100 mb-4 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('journal.lateNightAlert')}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className={`flex-1 py-3 rounded-xl font-semibold bg-primary-500 hover:bg-primary-400 transition-all ${lang === 'hi' ? 'font-hi' : ''}`}
            >
              {t('journal.coolingOffConfirm')}
            </button>
            <button
              onClick={() => { setShowLateNight(false); setShowForm(false); }}
              className={`flex-1 py-3 rounded-xl font-medium bg-primary-800 hover:bg-primary-700 border border-primary-600 transition-all ${lang === 'hi' ? 'font-hi' : ''}`}
            >
              {t('journal.coolingOffWait')}
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold text-gray-800 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('journal.yourEntries')}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                title={t('journal.exportData')}
              >
                <Download className="w-3.5 h-3.5" />
                <span className={lang === 'hi' ? 'font-hi' : ''}>{t('journal.exportData')}</span>
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-error-50 text-error-600 hover:bg-error-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className={lang === 'hi' ? 'font-hi' : ''}>{t('journal.deleteAll')}</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`p-3.5 rounded-xl border animate-slide-up ${
                  entry.isLoss
                    ? 'bg-error-50 border-error-100'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{entry.amount.toLocaleString('en-IN')}
                      </span>
                      {entry.isLoss && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-error-200 text-error-700 font-medium ${lang === 'hi' ? 'font-hi' : ''}`}>
                          {lang === 'hi' ? 'नुकसान' : 'Loss'}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm text-gray-700 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>{entry.reason}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(entry.date)}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className={lang === 'hi' ? 'font-hi' : ''}>{horizonLabel(entry.horizon)}</span>
                      {entry.expectedOutcome && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className={lang === 'hi' ? 'font-hi' : ''}>{entry.expectedOutcome}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 transition-colors shrink-0"
                    aria-label={t('journal.deleteEntry')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {entries.length === 0 && !showForm && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <NotebookPen className="w-8 h-8 text-gray-300" />
          </div>
          <p className={`text-sm text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}>
            {t('journal.noEntries')}
          </p>
        </div>
      )}
    </div>
  );
}
