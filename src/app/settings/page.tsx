'use client';

import Link from 'next/link';
import { ArrowLeft, Globe, Moon, Sun } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';
import { countries } from '@/data/mock-data';

export default function SettingsPage() {
  const {
    t,
    language,
    setLanguage,
    dir,
    theme,
    toggleTheme,
    selectedCountry,
    setSelectedCountry,
  } = useApp();
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'} ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Link href="/" className={`inline-flex items-center gap-2 text-sm mb-8 ${isLight ? 'text-slate-600 hover:text-purple-600' : 'text-white/70 hover:text-white'}`}>
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Home', 'العودة للرئيسية')}
        </Link>

        <div className="max-w-3xl">
          <h1 className={`text-3xl md:text-4xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t('Settings', 'الإعدادات')}
          </h1>
          <p className={`mt-3 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            {t('Manage language, region, and display preferences.', 'إدارة اللغة والمنطقة وتفضيلات العرض.')}
          </p>

          <div className="space-y-4 mt-8">
            <Card className={`p-6 ${isLight ? 'bg-white border-purple-100' : 'bg-slate-900/50 border-purple-500/15'}`}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('Theme', 'الثيم')}</h2>
                  <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{t('Switch between dark and light mode.', 'التبديل بين الوضع الداكن والفاتح.')}</p>
                </div>
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? <Moon className="w-5 h-5 text-purple-300" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <Switch checked={theme === 'light'} onCheckedChange={toggleTheme} />
                </div>
              </div>
            </Card>

            <Card className={`p-6 ${isLight ? 'bg-white border-purple-100' : 'bg-slate-900/50 border-purple-500/15'}`}>
              <div className="flex items-center gap-3 mb-4">
                <Globe className={isLight ? 'w-5 h-5 text-purple-600' : 'w-5 h-5 text-purple-300'} />
                <h2 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('Language', 'اللغة')}</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'en' as const, label: 'English' },
                  { id: 'ar' as const, label: 'العربية' },
                ].map((item) => (
                  <Button
                    key={item.id}
                    onClick={() => setLanguage(item.id)}
                    variant={language === item.id ? 'default' : 'outline'}
                    className={language === item.id ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' : isLight ? 'border-purple-200 text-purple-700' : 'border-purple-500/30 text-purple-300'}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className={`p-6 ${isLight ? 'bg-white border-purple-100' : 'bg-slate-900/50 border-purple-500/15'}`}>
              <h2 className={`font-bold mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('Country', 'الدولة')}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {countries.filter((country) => country.isActive).map((country) => (
                  <button
                    key={country.id}
                    onClick={() => setSelectedCountry(country)}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                      selectedCountry.id === country.id
                        ? 'border-purple-500 bg-purple-500/10'
                        : isLight
                          ? 'border-purple-100 bg-white hover:border-purple-200'
                          : 'border-purple-500/15 bg-slate-800/40 hover:border-purple-500/30'
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <span className={isLight ? 'text-slate-800' : 'text-white'}>
                      {language === 'ar' ? country.nameAr : country.name}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
