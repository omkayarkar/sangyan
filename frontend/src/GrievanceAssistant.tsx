import { useState, useCallback } from 'react';
import { LifeBuoy, FileText, Download, Copy, Check, ExternalLink, Phone, ShieldCheck, UserPlus, Archive } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function GrievanceAssistant() {
  const { t, lang } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [scamDetails, setScamDetails] = useState('');
  const [entityName, setEntityName] = useState('');
  const [amountLost, setAmountLost] = useState('');
  const [date, setDate] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    if (!scamDetails.trim()) return;

    const draft =
      lang === 'hi'
        ? `सेवा में,
SEBI SCORES शिकायत प्रणाली

विषय: निवेश धोखाधड़ी की शिकायत

आवेदक का नाम: ${name || '—'}
शिकायत का विवरण:
${scamDetails}

घोटाले की इकाई/व्यक्ति: ${entityName || '—'}
हानि की राशि: ₹${amountLost || '—'}
घटना की तारीख: ${date || '—'}

अनुरोध है कि मेरी शिकायत का विचार किया जाए और उचित कार्रवाई की जाए। मैं सभी आवश्यक दस्तावेज़ प्रदान करने को तैयार हूं।

धन्यवाद,
${name || '—'}`
        : `To,
SEBI SCORES Complaint System

Subject: Complaint regarding investment fraud

Applicant Name: ${name || '—'}
Complaint Details:
${scamDetails}

Entity/Person involved in fraud: ${entityName || '—'}
Amount Lost: ₹${amountLost || '—'}
Date of Incident: ${date || '—'}

I request you to kindly consider my complaint and take appropriate action. I am willing to provide all necessary documents.

Thank you,
${name || '—'}`;

    setGeneratedDraft(draft);
  }, [name, scamDetails, entityName, amountLost, date, lang]);

  const handleCopy = useCallback(() => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [generatedDraft]);

  const emergencyContacts = [
    { label: t('help.contactScores'), icon: ExternalLink, url: 'https://scores.gov.in' },
    { label: t('help.contactSebi'), icon: Phone, url: null },
    { label: t('help.contactCyber'), icon: Phone, url: 'https://cybercrime.gov.in' },
    { label: t('help.contactPolice'), icon: Phone, url: null },
  ];

  const iepfSteps = [
    t('help.iepfStep1'),
    t('help.iepfStep2'),
    t('help.iepfStep3'),
    t('help.iepfStep4'),
  ];

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-lg bg-error-100 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-error-600" strokeWidth={2} />
          </div>
          <div>
            <h2 className={`text-lg font-bold text-gray-900 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('help.title')}
            </h2>
            <p className={`text-xs text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('help.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* SCORES complaint */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h3 className={`text-base font-bold text-gray-900 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('help.scoresTitle')}
            </h3>
            <p className={`text-sm text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('help.scoresDesc')}
            </p>
          </div>
        </div>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-200 active:scale-[0.98] transition-all ${lang === 'hi' ? 'font-hi' : ''}`}
          >
            <FileText className="w-5 h-5" />
            {t('help.scoresStart')}
          </button>
        ) : (
          <div className="space-y-3 animate-slide-up">
            <div>
              <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('help.complaintForm.name')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('help.complaintForm.namePlaceholder')}
                className={`w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm placeholder:text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('help.complaintForm.scamDetails')}
              </label>
              <textarea
                value={scamDetails}
                onChange={(e) => setScamDetails(e.target.value)}
                placeholder={t('help.complaintForm.scamDetailsPlaceholder')}
                rows={3}
                className={`w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm resize-none placeholder:text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('help.complaintForm.entityName')}
              </label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder={t('help.complaintForm.entityNamePlaceholder')}
                className={`w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm placeholder:text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {t('help.complaintForm.amountLost')}
                </label>
                <input
                  type="number"
                  value={amountLost}
                  onChange={(e) => setAmountLost(e.target.value)}
                  placeholder={t('help.complaintForm.amountLostPlaceholder')}
                  className={`w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm placeholder:text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium text-gray-600 mb-1 ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {t('help.complaintForm.date')}
                </label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder={t('help.complaintForm.datePlaceholder')}
                  className={`w-full p-3 rounded-xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm placeholder:text-gray-400 ${lang === 'hi' ? 'font-hi' : ''}`}
                />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!scamDetails.trim()}
              className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all ${
                scamDetails.trim()
                  ? 'bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-200'
                  : 'bg-gray-300 cursor-not-allowed'
              } ${lang === 'hi' ? 'font-hi' : ''}`}
            >
              {t('help.complaintForm.generate')}
            </button>
          </div>
        )}

        {/* Generated draft */}
        {generatedDraft && (
          <div className="mt-4 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`text-sm font-bold text-gray-800 ${lang === 'hi' ? 'font-hi' : ''}`}>
                {t('help.complaintForm.generated')}
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className={lang === 'hi' ? 'font-hi' : ''}>{t('help.complaintForm.copyDraft')}</span>
                </button>
              </div>
            </div>
            <pre
              className={`p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-80 overflow-y-auto ${lang === 'hi' ? 'font-hi' : ''}`}
            >
              {generatedDraft}
            </pre>
            <a
              href="https://scores.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md transition-all ${lang === 'hi' ? 'font-hi' : ''}`}
            >
              <ExternalLink className="w-5 h-5" />
              {t('help.complaintForm.submitToScores')}
            </a>
          </div>
        )}
      </div>

      {/* IEPF Recovery */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5 text-accent-600" />
          </div>
          <div>
            <h3 className={`text-base font-bold text-gray-900 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('help.iepfTitle')}
            </h3>
            <p className={`text-sm text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('help.iepfDesc')}
            </p>
          </div>
        </div>
        <h4 className={`text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 ${lang === 'hi' ? 'font-hi' : ''}`}>
          {t('help.iepfSteps')}
        </h4>
        <div className="space-y-2">
          {iepfSteps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-accent-50">
              <span className="w-6 h-6 rounded-full bg-accent-200 text-accent-700 text-xs flex items-center justify-center shrink-0 font-bold">
                {i + 1}
              </span>
              <p className={`text-sm text-gray-700 ${lang === 'hi' ? 'font-hi' : ''}`}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nominee Registration */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-success-100 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-success-600" />
          </div>
          <div>
            <h3 className={`text-base font-bold text-gray-900 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('help.nomineeTitle')}
            </h3>
            <p className={`text-sm text-gray-500 ${lang === 'hi' ? 'font-hi' : ''}`}>
              {t('help.nomineeDesc')}
            </p>
          </div>
        </div>
        <div className="p-3 rounded-lg bg-success-50 border border-success-100">
          <p className={`text-sm text-success-800 flex items-start gap-2 ${lang === 'hi' ? 'font-hi' : ''}`}>
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            {t('help.nomineeCheck')}
          </p>
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <h3 className={`text-base font-bold text-gray-900 mb-3 ${lang === 'hi' ? 'font-hi' : ''}`}>
          {t('help.emergencyContacts')}
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {emergencyContacts.map((contact, i) => {
            const Icon = contact.icon;
            const content = (
              <>
                <Icon className="w-4 h-4 shrink-0" />
                <span className={`text-xs font-medium text-center ${lang === 'hi' ? 'font-hi' : ''}`}>
                  {contact.label}
                </span>
              </>
            );
            return contact.url ? (
              <a
                key={i}
                href={contact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-primary-50 border border-primary-100 hover:bg-primary-100 transition-colors"
              >
                {content}
              </a>
            ) : (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 border border-gray-100"
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
        <p className={`text-xs text-gray-500 leading-relaxed ${lang === 'hi' ? 'font-hi' : ''}`}>
          {t('help.disclaimer')}
        </p>
      </div>
    </div>
  );
}
