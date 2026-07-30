'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Loader2,
  MessageCircle,
  RefreshCw,
  TicketPercent,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { supportWhatsAppNormalizedNumber } from '@/config/contact';
import { useApp } from '@/contexts/AppContext';
import type { Game, Promotion } from '@/types';
import { formatPromotionDate, getPromotionState } from './promotion-state';

export default function PromotionsPage() {
  const { t, language, dir, selectedCountry, formatLocalAmount } = useApp();
  const [products, setProducts] = useState<Game[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [copiedCode, setCopiedCode] = useState('');
  const [now] = useState(() => new Date());

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    async function loadOffers() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const [productsResponse, promotionsResponse] = await Promise.all([
          fetch(`/api/products?country=${selectedCountry.id}`, { signal: controller.signal }),
          fetch('/api/promotions', { signal: controller.signal }),
        ]);
        if (!productsResponse.ok || !promotionsResponse.ok) throw new Error('OFFERS_UNAVAILABLE');

        const [productsPayload, promotionsPayload] = await Promise.all([
          productsResponse.json(),
          promotionsResponse.json(),
        ]);

        if (!active) return;
        setProducts(productsPayload?.products ?? []);
        setPromotions(promotionsPayload?.promotions ?? []);
      } catch {
        if (!active) return;
        setProducts([]);
        setPromotions([]);
        setLoadError(true);
      } finally {
        window.clearTimeout(timeoutId);
        if (active) setIsLoading(false);
      }
    }

    void loadOffers();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedCountry.id, loadAttempt]);

  const visiblePromotions = promotions.filter((promotion) => (
    promotion.isActive && getPromotionState(promotion.startDate, promotion.endDate, now) !== 'expired'
  ));

  const formatDate = (dateString: string) => formatPromotionDate(
    dateString,
    language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ'
  );

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode((current) => current === code ? '' : current), 2000);
      toast.success(t('Offer code copied', 'تم نسخ رمز العرض', '优惠码已复制'));
    } catch {
      toast.error(t('The code could not be copied', 'تعذر نسخ الرمز', '无法复制优惠码'));
    }
  };

  const supportHref = (code: string) => {
    const message = t(
      `Hello, can you check whether WAHO offer ${code} applies to my top-up?`,
      `مرحباً، هل يمكنكم التحقق من إمكانية تطبيق عرض WAHO ${code} على الشحن؟`,
      `您好，请帮我确认 WAHO 优惠 ${code} 是否适用于我的充值。`
    );
    return `https://wa.me/${supportWhatsAppNormalizedNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="mt-4 max-w-3xl">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('WAHO offers', 'عروض WAHO', 'WAHO 优惠')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white sm:text-4xl">
            {t('See which top-up offers are available', 'شاهد عروض الشحن المتاحة', '查看可用的充值优惠')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            {t('Found an offer you like? Send its code to WhatsApp support before paying so they can check it for you.', 'وجدت عرضاً مناسباً؟ أرسل رمزه إلى دعم واتساب قبل الدفع ليتحققوا منه لك.', '看到合适的优惠后，请在付款前将优惠码发送给 WhatsApp 客服进行确认。')}
          </p>
        </header>

        {isLoading ? (
          <div className="mt-8 flex min-h-56 flex-col items-center justify-center rounded-lg border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-zinc-900" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 motion-reduce:animate-none" />
            <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">{t('Checking available offers...', 'جارٍ التحقق من العروض المتاحة...', '正在查看可用优惠...')}</p>
          </div>
        ) : loadError ? (
          <div className="mt-8 flex min-h-56 flex-col items-center justify-center rounded-lg border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-zinc-900">
            <RefreshCw className="h-6 w-6 text-zinc-400" />
            <h2 className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">{t('Offers could not be loaded', 'تعذر تحميل العروض', '无法加载优惠')}</h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">{t('Check your connection and try again.', 'تحقق من الاتصال وحاول مرة أخرى.', '请检查网络后重试。')}</p>
            <Button type="button" variant="outline" onClick={() => setLoadAttempt((value) => value + 1)} className="mt-4">
              <RefreshCw className="h-4 w-4" />
              {t('Try again', 'حاول مرة أخرى', '重试')}
            </Button>
          </div>
        ) : visiblePromotions.length === 0 ? (
          <div className="mt-8 flex min-h-56 flex-col items-center justify-center rounded-lg border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-zinc-900">
            <TicketPercent className="h-7 w-7 text-blue-700 dark:text-blue-300" />
            <h2 className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">{t('No active offers right now', 'لا توجد عروض نشطة الآن', '目前没有可用优惠')}</h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-zinc-500 dark:text-zinc-400">{t('You can still choose any available WAHO top-up amount.', 'لا يزال بإمكانك اختيار أي مبلغ شحن WAHO متاح.', '您仍可选择任意可用的 WAHO 充值金额。')}</p>
            <Button asChild className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
              <Link href="/top-up/waho-top-up">
                {t('Choose an amount', 'اختر المبلغ', '选择金额')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        ) : (
          <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label={t('Available WAHO offers', 'عروض WAHO المتاحة', '可用 WAHO 优惠')}>
            {visiblePromotions.map((promotion) => {
              const state = getPromotionState(promotion.startDate, promotion.endDate, now);
              const applicableProducts = promotion.applicableGames
                .map((productId) => products.find((product) => product.id === productId))
                .filter((product): product is Game => Boolean(product));
              const product = applicableProducts.find((item) => item.slug === 'waho-top-up') ?? applicableProducts[0];
              const discountText = promotion.type === 'percentage'
                ? t(`${promotion.value}% discount`, `خصم ${promotion.value}%`, `${promotion.value}% 折扣`)
                : t(`${formatLocalAmount(promotion.value)} discount`, `خصم ${formatLocalAmount(promotion.value)}`, `优惠 ${formatLocalAmount(promotion.value)}`);
              const copied = copiedCode === promotion.code;

              return (
                <article key={promotion.id} className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><TicketPercent className="h-5 w-5" /></span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${state === 'upcoming' ? 'bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300' : 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'}`}>
                      {state === 'upcoming' ? t('Starts soon', 'يبدأ قريباً', '即将开始') : t('Available now', 'متاح الآن', '当前可用')}
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">{discountText}</h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {t('Minimum top-up', 'الحد الأدنى للشحن', '最低充值金额')}: <strong className="font-semibold text-zinc-950 dark:text-white">{formatLocalAmount(promotion.minPurchase)}</strong>
                  </p>

                  <button
                    type="button"
                    onClick={() => void copyCode(promotion.code)}
                    aria-label={t(`Copy offer code ${promotion.code}`, `انسخ رمز العرض ${promotion.code}`, `复制优惠码 ${promotion.code}`)}
                    className="mt-5 flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-dashed border-blue-300 bg-blue-50 px-4 text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-500/50 dark:bg-blue-500/10 dark:text-blue-100"
                  >
                    <span className="font-mono text-base font-semibold tracking-wide">{promotion.code}</span>
                    <span className="flex items-center gap-2 text-xs font-semibold">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? t('Copied', 'تم النسخ', '已复制') : t('Copy', 'نسخ', '复制')}
                    </span>
                  </button>

                  <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <CalendarDays className="h-4 w-4 flex-shrink-0" />
                    <span>{formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}</span>
                  </div>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <Button asChild className="bg-[#1f8f3a] text-white hover:bg-[#187631]">
                      <a href={supportHref(promotion.code)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                        {t('Check this offer', 'تحقق من العرض', '咨询此优惠')}
                      </a>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/top-up/${product?.slug ?? 'waho-top-up'}`}>
                        {t('Choose top-up', 'اختر الشحن', '选择充值')}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
