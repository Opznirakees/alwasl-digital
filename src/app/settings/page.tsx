'use client';

import Link from 'next/link';
import { ArrowLeft, Globe, MapPin, Moon, Sun } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';

export default function SettingsPage() {
  const {
    t,
    language,
    setLanguage,
    dir,
    theme,
    toggleTheme,
    countries,
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
            {t('Manage language and display preferences.', 'إدارة اللغة وتفضيلات العرض.')}
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
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
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
                  { id: 'zh' as const, label: '中文' },
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
              <div className="flex items-center gap-3 mb-4">
                <MapPin className={isLight ? 'w-5 h-5 text-purple-600' : 'w-5 h-5 text-purple-300'} />
                <h2 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('Country', 'البلد', '国家')}</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {countries.map((country) => (
                  <Button
                    key={country.id}
                    type="button"
                    onClick={() => setSelectedCountry(country)}
                    variant={selectedCountry.id === country.id ? 'default' : 'outline'}
                    className={`h-auto justify-start gap-3 py-3 ${
                      selectedCountry.id === country.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : isLight
                          ? 'border-purple-200 text-purple-700'
                          : 'border-purple-500/30 text-purple-300'
                    }`}
                  >
                    <span>{country.flag}</span>
                    <span className="text-left">
                      <span className="block text-sm font-semibold">{t(country.name, country.nameAr, country.name)}</span>
                      <span className="block text-xs opacity-70">
                        {country.currency} · {country.phoneCode}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
