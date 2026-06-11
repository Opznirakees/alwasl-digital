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
  const { t, language, dir, selectedCountry } = useApp();
  const now = new Date();

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
    <div className={`min-h-screen bg-[#f5f5f7] ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-blue-600">
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Home', 'العودة للرئيسية')}
        </Link>

        <section className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-1.5 text-zinc-600">
            <TicketPercent className="w-4 h-4" />
            <span className="text-sm font-semibold">{t('Active offers', 'العروض النشطة')}</span>
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-zinc-950 md:text-5xl">
            {t('Promotions and coupon codes', 'العروض وكوبونات الخصم')}
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600 md:text-lg">
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
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : isExpired
                ? 'bg-zinc-100 text-zinc-500 border-black/10'
                : 'bg-[#34c759]/10 text-[#1f8f3a] border-[#34c759]/25';
            const applicableGames = promotion.applicableGames
              .map((gameId) => games.find((game) => game.id === gameId))
              .filter(Boolean);
            const discountText = promotion.type === 'percentage'
              ? `${promotion.value}% ${t('off', 'خصم')}`
              : `${formatCurrency(promotion.value)} ${selectedCountry.currencySymbol} ${t('off', 'خصم')}`;

            return (
              <Card key={promotion.id} className="relative overflow-hidden border-black/10 bg-white p-6 shadow-none">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100">
                      <Gift className="w-6 h-6 text-blue-600" />
                    </div>
                    <Badge variant="outline" className={stateClass}>{stateLabel}</Badge>
                  </div>

                  <h2 className="mt-6 text-3xl font-semibold text-zinc-950">{discountText}</h2>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-dashed border-blue-200 bg-blue-50 px-3 py-2 text-blue-700">
                    <span className="font-mono font-bold">{promotion.code}</span>
                    <button onClick={() => copyCode(promotion.code)} aria-label={t('Copy code', 'نسخ الكود')}>
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-zinc-600">
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
                            <Badge variant="outline" className="border-black/10 text-zinc-600">
                              {language === 'ar' ? game.nameAr : game.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <Badge variant="outline" className="border-black/10 text-zinc-600">
                        {t('All products', 'كل المنتجات')}
                      </Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => copyCode(promotion.code)}
                    className="mt-6 w-full bg-blue-600 text-white shadow-none hover:bg-blue-700"
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
