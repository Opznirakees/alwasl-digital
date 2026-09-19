'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Globe, MapPin, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';

export default function SettingsPage() {
  const {
    t,
    language,
    setLanguage,
    dir,
    countries,
    selectedCountry,
    setSelectedCountry,
  } = useApp();
  const [countryQuery, setCountryQuery] = useState('');

  const filteredCountries = useMemo(() => {
    const query = countryQuery.trim().toLocaleLowerCase();
    if (!query) return countries;

    return countries.map((country) => country).filter((country) => [
      country.name,
      country.nameAr,
      country.phoneCode,
      country.currency,
    ].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [countries, countryQuery]);

  const languageOptions = [
    { id: 'en' as const, label: 'English', description: 'English' },
    { id: 'ar' as const, label: 'العربية', description: 'Arabic' },
    { id: 'zh' as const, label: '中文', description: 'Chinese' },
  ];

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="v2-container max-w-4xl py-6 pb-24 sm:py-10 lg:pb-10">
        <Link href="/" className="v2-ghost-link">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="v2-page-header mt-4">
          <p className="v2-kicker">{t('Your preferences', 'تفضيلاتك', '您的偏好')}</p>
          <h1>{t('Settings', 'الإعدادات', '设置')}</h1>
          <p>
            {t('Choose your language and which local prices you see.', 'اختر لغتك والأسعار المحلية التي تراها.', '选择语言以及您看到的当地价格。')}
          </p>
        </header>

        <div className="mt-6 space-y-5">
          <section className="v2-surface p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="v2-icon-tile v2-icon-tile-gold"><Globe className="h-5 w-5" /></span>
              <div>
                <h2 className="text-base font-bold text-[var(--v2-navy)]">{t('Language', 'اللغة', '语言')}</h2>
                <p className="mt-0.5 text-sm text-[var(--v2-muted)]">{t('All screens change immediately.', 'تتغير كل الشاشات فوراً.', '所有页面会立即切换。')}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t('Choose language', 'اختر اللغة', '选择语言')}>
              {languageOptions.map((option) => {
                const selected = language === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setLanguage(option.id)}
                    className={`flex min-h-14 items-center justify-between rounded-xl border px-4 text-start text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)] ${selected ? 'border-[var(--v2-gold)] bg-[var(--v2-gold-soft)] text-[var(--v2-navy)]' : 'border-[var(--v2-border)] text-[var(--v2-navy)] hover:bg-[var(--v2-surface-raised)]'}`}
                  >
                    <span>{option.label}</span>
                    {selected && <Check className="h-4 w-4 text-[var(--v2-gold-deep)]" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="v2-surface p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="v2-icon-tile v2-icon-tile-blue"><MapPin className="h-5 w-5" /></span>
              <div>
                <h2 className="text-base font-bold text-[var(--v2-navy)]">{t('Price country', 'بلد الأسعار', '价格国家')}</h2>
                <p className="mt-0.5 text-sm leading-5 text-[var(--v2-muted)]">
                  {t('This chooses the local currency and top-up prices. It does not change your login number.', 'يحدد هذا العملة المحلية وأسعار الشحن، ولا يغير رقم تسجيل الدخول.', '这会选择当地货币和充值价格，不会更改您的登录号码。')}
                </p>
              </div>
            </div>

            <label htmlFor="country-search" className="mt-5 block text-sm font-semibold text-[var(--v2-navy)]">
              {t('Find a country', 'ابحث عن بلد', '查找国家')}
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--v2-subtle)]" />
              <Input
                id="country-search"
                type="search"
                value={countryQuery}
                onChange={(event) => setCountryQuery(event.target.value)}
                placeholder={t('Country, currency or code', 'البلد أو العملة أو الرمز', '国家、货币或区号')}
                className="v2-input h-12 ps-10"
                autoComplete="off"
              />
            </div>

            <div className="mt-3 grid max-h-80 gap-2 overflow-y-auto pe-1 sm:grid-cols-2" role="radiogroup" aria-label={t('Choose price country', 'اختر بلد الأسعار', '选择价格国家')}>
              {filteredCountries.map((country) => {
                const selected = selectedCountry.id === country.id;
                return (
                  <button
                    key={country.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setSelectedCountry(country)}
                    className={`flex min-h-16 items-center gap-3 rounded-xl border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)] ${selected ? 'border-[var(--v2-gold)] bg-[var(--v2-gold-soft)]' : 'border-[var(--v2-border)] hover:bg-[var(--v2-surface-raised)]'}`}
                  >
                    <span className="text-2xl" aria-hidden="true">{country.flag}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[var(--v2-navy)]">{t(country.name, country.nameAr, country.nameZh)}</span>
                      <span className="mt-0.5 block text-xs text-[var(--v2-muted)]" dir="ltr">{country.currency} · {country.phoneCode}</span>
                    </span>
                    {selected && <Check className="h-4 w-4 flex-shrink-0 text-[var(--v2-gold-deep)]" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {filteredCountries.length === 0 && (
              <div className="v2-empty mt-3 min-h-0 py-6 text-sm text-[var(--v2-muted)]">
                {t('No country found. Try another name or code.', 'لم يتم العثور على بلد. جرّب اسماً أو رمزاً آخر.', '未找到国家，请尝试其他名称或区号。')}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
