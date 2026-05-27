'use client';

import Link from 'next/link';
import { ArrowLeft, CalendarDays, Copy, Gift, TicketPercent } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { games, promotions } from '@/data/mock-data';
import { useApp } from '@/contexts/AppContext';

export default function PromotionsPage() {
  const { t, language, dir, theme, selectedCountry } = useApp();
  const isLight = theme === 'light';
  const now = new Date();

  const textColor = isLight ? 'text-slate-900' : 'text-white';
  const mutedColor = isLight ? 'text-slate-600' : 'text-white/60';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-IQ').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-IQ', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success(t('Promotion code copied!', 'تم نسخ كود العرض!'));
  };

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'} ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <Link href="/" className={`inline-flex items-center gap-2 text-sm mb-8 transition-colors ${isLight ? 'text-slate-600 hover:text-purple-600' : 'text-white/70 hover:text-white'}`}>
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Home', 'العودة للرئيسية')}
        </Link>

        <section className="max-w-3xl">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 border ${isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-purple-500/10 border-purple-500/25 text-purple-200'}`}>
            <TicketPercent className="w-4 h-4" />
            <span className="text-sm font-semibold">{t('Active offers', 'العروض النشطة')}</span>
          </div>
          <h1 className={`text-3xl md:text-5xl font-bold mt-5 ${textColor}`}>
            {t('Promotions and coupon codes', 'العروض وكوبونات الخصم')}
          </h1>
          <p className={`text-base md:text-lg mt-4 ${mutedColor}`}>
            {t('Use these demo offers during checkout and adapt them later for real campaigns.', 'استخدم هذه العروض التجريبية أثناء الدفع وعدلها لاحقاً للحملات الحقيقية.')}
          </p>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-10">
          {promotions.map((promotion) => {
            const startsAt = new Date(promotion.startDate);
            const endsAt = new Date(promotion.endDate);
            const isUpcoming = startsAt > now;
            const isExpired = endsAt < now;
            const stateLabel = isUpcoming
              ? t('Upcoming', 'قادم')
              : isExpired
                ? t('Expired', 'منتهي')
                : t('Live now', 'نشط الآن');
            const stateClass = isUpcoming
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : isExpired
                ? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            const applicableGames = promotion.applicableGames
              .map((gameId) => games.find((game) => game.id === gameId))
              .filter(Boolean);
            const discountText = promotion.type === 'percentage'
              ? `${promotion.value}% ${t('off', 'خصم')}`
              : `${formatCurrency(promotion.value)} ${selectedCountry.currencySymbol} ${t('off', 'خصم')}`;

            return (
              <Card key={promotion.id} className={`relative overflow-hidden p-6 ${isLight ? 'bg-white border-purple-100 shadow-sm' : 'bg-slate-900/50 border-purple-500/15'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="outline" className={stateClass}>{stateLabel}</Badge>
                  </div>

                  <h2 className={`text-3xl font-bold mt-6 ${textColor}`}>{discountText}</h2>
                  <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed mt-4 ${isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-purple-500/10 border-purple-500/30 text-purple-200'}`}>
                    <span className="font-mono font-bold tracking-widest">{promotion.code}</span>
                    <button onClick={() => copyCode(promotion.code)} aria-label={t('Copy code', 'نسخ الكود')}>
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`space-y-2 text-sm mt-5 ${mutedColor}`}>
                    <p>{t('Minimum purchase', 'الحد الأدنى')}: {formatCurrency(promotion.minPurchase)} {selectedCountry.currencySymbol}</p>
                    {promotion.maxDiscount && (
                      <p>{t('Maximum discount', 'الحد الأقصى للخصم')}: {formatCurrency(promotion.maxDiscount)} {selectedCountry.currencySymbol}</p>
                    )}
                    <p className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                    </p>
                  </div>

                  <div className="mt-5">
                    {applicableGames.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {applicableGames.map((game) => game && (
                          <Link key={game.id} href={`/games/${game.slug}`}>
                            <Badge variant="outline" className={isLight ? 'border-purple-200 text-purple-700' : 'border-purple-500/30 text-purple-300'}>
                              {language === 'ar' ? game.nameAr : game.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline" className={isLight ? 'border-purple-200 text-purple-700' : 'border-purple-500/30 text-purple-300'}>
                        {t('All products', 'كل المنتجات')}
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => copyCode(promotion.code)}
                    className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t('Copy code', 'نسخ الكود')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </section>
      </main>
    </div>
  );
}
