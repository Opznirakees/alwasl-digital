'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, Check, Globe, MapPin, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
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

      <main className="container mx-auto max-w-4xl px-4 py-6 sm:py-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="mt-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Your preferences', 'تفضيلاتك', '您的偏好')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white sm:text-4xl">{t('Settings', 'الإعدادات', '设置')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {t('Choose your language and which local prices you see.', 'اختر لغتك والأسعار المحلية التي تراها.', '选择语言以及您看到的当地价格。')}
          </p>
        </header>

        <div className="mt-6 space-y-5">
          <section className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><Globe className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold text-zinc-950 dark:text-white">{t('Language', 'اللغة', '语言')}</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t('All screens change immediately.', 'تتغير كل الشاشات فوراً.', '所有页面会立即切换。')}</p>
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
                    className={`flex min-h-14 items-center justify-between rounded-lg border px-4 text-start text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${selected ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-100' : 'border-black/10 text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-200 dark:hover:bg-white/5'}`}
                  >
                    <span>{option.label}</span>
                    {selected && <Check className="h-4 w-4 text-blue-700 dark:text-blue-300" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><MapPin className="h-5 w-5" /></span>
              <div>
                <h2 className="font-semibold text-zinc-950 dark:text-white">{t('Price country', 'بلد الأسعار', '价格国家')}</h2>
                <p className="mt-1 text-sm leading-5 text-zinc-500 dark:text-zinc-400">
                  {t('This chooses the local currency and top-up prices. It does not change your login number.', 'يحدد هذا العملة المحلية وأسعار الشحن، ولا يغير رقم تسجيل الدخول.', '这会选择当地货币和充值价格，不会更改您的登录号码。')}
                </p>
              </div>
            </div>

            <label htmlFor="country-search" className="mt-5 block text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {t('Find a country', 'ابحث عن بلد', '查找国家')}
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 rtl:left-auto rtl:right-3" />
              <Input
                id="country-search"
                type="search"
                value={countryQuery}
                onChange={(event) => setCountryQuery(event.target.value)}
                placeholder={t('Country, currency or code', 'البلد أو العملة أو الرمز', '国家、货币或区号')}
                className="h-12 bg-zinc-50 ps-10 dark:bg-zinc-950"
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
                    className={`flex min-h-16 items-center gap-3 rounded-lg border p-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${selected ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/15' : 'border-black/10 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5'}`}
                  >
                    <span className="text-2xl" aria-hidden="true">{country.flag}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-zinc-950 dark:text-white">{t(country.name, country.nameAr, country.nameZh)}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400" dir="ltr">{country.currency} · {country.phoneCode}</span>
                    </span>
                    {selected && <Check className="h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-300" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>

            {filteredCountries.length === 0 && (
              <div className="mt-3 rounded-lg bg-zinc-100 p-5 text-center text-sm text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                {t('No country found. Try another name or code.', 'لم يتم العثور على بلد. جرّب اسماً أو رمزاً آخر.', '未找到国家，请尝试其他名称或区号。')}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
