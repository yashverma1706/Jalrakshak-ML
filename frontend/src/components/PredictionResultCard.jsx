import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function PredictionResultCard({ result, land }) {
  const { lang, t } = useLanguage();
  if (!result) return null;

  const { prediction, decision, weather } = result;
  const need = prediction?.irrigation_need || 'Unknown';
  const action = decision?.action || 'REVIEW_RECOMMENDED';
  const reason = decision?.reason || '';
  const rainfall24h = weather?.rainfall_next_24h_mm ?? 0;

  const badgeConfig = {
    High: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      pill: 'bg-rose-600 text-white',
      border: 'border-rose-300',
      icon: AlertCircle,
      label: t('highNeedLabel'),
      desc: t('highNeedDesc'),
      needBadge: lang === 'hi' ? 'तुरंत सिंचाई' : 'High Need',
    },
    Medium: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      pill: 'bg-amber-600 text-white',
      border: 'border-amber-300',
      icon: AlertTriangle,
      label: t('mediumNeedLabel'),
      desc: t('mediumNeedDesc'),
      needBadge: lang === 'hi' ? 'मध्यम सिंचाई' : 'Medium Need',
    },
    Low: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      pill: 'bg-emerald-600 text-white',
      border: 'border-emerald-300',
      icon: CheckCircle2,
      label: t('lowNeedLabel'),
      desc: t('lowNeedDesc'),
      needBadge: lang === 'hi' ? 'पर्याप्त नमी' : 'Low Need',
    },
  }[need] || {
    bg: 'bg-slate-50 border-slate-200 text-slate-800',
    pill: 'bg-slate-600 text-white',
    border: 'border-slate-300',
    icon: Sparkles,
    label: need,
    desc: 'Review prediction data.',
    needBadge: need,
  };

  const IconComponent = badgeConfig.icon;

  // Friendly Hindi action mapping
  const actionDisplay = lang === 'hi'
    ? {
        REVIEW_RECOMMENDED: 'समीक्षा अनुशंसित',
        INSUFFICIENT_DATA: 'अपर्याप्त डेटा',
      }[action] || action.replace('_', ' ')
    : action.replace('_', ' ');

  return (
    <div className={`rounded-2xl border-2 ${badgeConfig.border} bg-white shadow-lg overflow-hidden animate-in fade-in duration-200`}>

      {/* Top Status Header */}
      <div className={`p-5 ${badgeConfig.bg} border-b flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-xs ${badgeConfig.pill}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${badgeConfig.pill}`}>
                {badgeConfig.needBadge}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {lang === 'hi' ? 'खेत:' : 'Plot:'} {land?.name || 'Selected Field'}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {badgeConfig.label}
            </h2>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="text-xs text-slate-500 font-medium">{t('agronomicProtocol')}</div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {actionDisplay}
          </span>
        </div>
      </div>

      {/* Decision & Agronomic Reason */}
      <div className="p-5 space-y-4">

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {t('aiAdvisoryHeader')}
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            {reason}
          </p>
          {rainfall24h > 0 && (
            <p className="text-xs text-sky-700 font-semibold pt-1">
              🌧️ {lang === 'hi'
                ? `सूचना: अगले 24 घंटों में ${rainfall24h} मिमी बारिश होने का पूर्वानुमान है। भारी पंप चलाने से पहले इसका ध्यान रखें ताकि जलभराव न हो और बिजली बचे।`
                : `Note: ${rainfall24h} mm of rainfall is forecasted within the next 24 hours. Factor this in before running heavy irrigation pumps.`}
            </p>
          )}
        </div>

        {/* Actionable Recommendations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className="font-bold text-slate-800">{t('bestWindow')}:</span>
            <p className="text-slate-600 mt-0.5">
              {t('bestWindowDesc')}
            </p>
          </div>
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
            <span className="font-bold text-slate-800">{t('waterRetention')}:</span>
            <p className="text-slate-600 mt-0.5">
              {land?.soilType === 'Clay'
                ? (lang === 'hi' ? 'चिकनी मिट्टी पानी लंबे समय तक रोके रखती है। आवश्यकता से अधिक पानी देने से बचें।' : 'Clay soil holds water longer. Avoid over-watering.')
                : land?.soilType === 'Sandy'
                ? (lang === 'hi' ? 'बलुई मिट्टी तेजी से सूखती है। बार-बार हल्की सिंचाई की सिफारिश की जाती है।' : 'Sandy soil drains quickly. Frequent light watering is recommended.')
                : (lang === 'hi' ? 'दोमट/गाद मिट्टी जल निकासी और नमी को अच्छी तरह संतुलित रखती है।' : 'Loamy/Silt soil balances drainage well.')}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
