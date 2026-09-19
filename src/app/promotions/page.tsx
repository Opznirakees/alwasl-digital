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
      `Hello, can you check whether offer ${code} applies to my recharge?`,
      `مرحباً، هل يمكنكم التحقق من إمكانية تطبيق العرض ${code} على الشحن؟`,
      `您好，请帮我确认优惠 ${code} 是否适用于我的充值。`
    );
    return `https://wa.me/${supportWhatsAppNormalizedNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="v2-container max-w-5xl py-6 pb-24 sm:py-10 lg:pb-10">
        <Link href="/" className="v2-ghost-link">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="v2-page-header mt-4">
          <p className="v2-kicker">{t('Recharge offers', 'عروض الشحن', '充值优惠')}</p>
          <h1>
            {t('See which top-up offers are available', 'شاهد عروض الشحن المتاحة', '查看可用的充值优惠')}
          </h1>
          <p>
            {t('Found an offer you like? Send its code to WhatsApp support before paying so they can check it for you.', 'وجدت عرضاً مناسباً؟ أرسل رمزه إلى دعم واتساب قبل الدفع ليتحققوا منه لك.', '看到合适的优惠后，请在付款前将优惠码发送给 WhatsApp 客服进行确认。')}
          </p>
        </header>

        {isLoading ? (
          <div className="v2-empty mt-8" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--v2-gold-deep)] motion-reduce:animate-none" />
            <p className="mt-3 text-sm font-semibold text-[var(--v2-navy)]">{t('Checking available offers...', 'جارٍ التحقق من العروض المتاحة...', '正在查看可用优惠...')}</p>
          </div>
        ) : loadError ? (
          <div className="v2-empty mt-8">
            <span className="v2-icon-tile"><RefreshCw className="h-5 w-5" /></span>
            <h2 className="mt-4 text-lg font-bold text-[var(--v2-navy)]">{t('Offers could not be loaded', 'تعذر تحميل العروض', '无法加载优惠')}</h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--v2-muted)]">{t('Check your connection and try again.', 'تحقق من الاتصال وحاول مرة أخرى.', '请检查网络后重试。')}</p>
            <button type="button" onClick={() => setLoadAttempt((value) => value + 1)} className="v2-secondary-button mt-5">
              <RefreshCw className="h-4 w-4" />
              {t('Try again', 'حاول مرة أخرى', '重试')}
            </button>
          </div>
        ) : visiblePromotions.length === 0 ? (
          <div className="v2-empty mt-8">
            <span className="v2-icon-tile v2-icon-tile-gold h-14 w-14 rounded-2xl"><TicketPercent className="h-7 w-7" /></span>
            <h2 className="mt-4 text-lg font-bold text-[var(--v2-navy)]">{t('No active offers right now', 'لا توجد عروض نشطة الآن', '目前没有可用优惠')}</h2>
            <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--v2-muted)]">{t('You can still choose any available recharge category and amount.', 'لا يزال بإمكانك اختيار أي فئة ومبلغ شحن متاح.', '您仍可选择任意可用的充值分类和金额。')}</p>
            <Link href="/#categories" className="v2-primary-button mt-5">
              {t('Choose a category', 'اختر الفئة', '选择分类')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : (
          <section className="mt-8 grid gap-4 md:grid-cols-2" aria-label={t('Available recharge offers', 'عروض الشحن المتاحة', '可用充值优惠')}>
            {visiblePromotions.map((promotion) => {
              const state = getPromotionState(promotion.startDate, promotion.endDate, now);
              const applicableProducts = promotion.applicableGames
                .map((productId) => products.find((product) => product.id === productId))
                .filter((product): product is Game => Boolean(product));
              const product = applicableProducts.find((item) => item.slug === 'waho-top-up') ?? applicableProducts[0];
              const discountText = promotion.type === 'percentage'
                ? t('{{value}}% discount', 'خصم {{value}}%', '{{value}}% 折扣').replace('{{value}}', String(promotion.value))
                : t('{{amount}} discount', 'خصم {{amount}}', '优惠 {{amount}}').replace('{{amount}}', formatLocalAmount(promotion.value));
              const copied = copiedCode === promotion.code;

              return (
                <article key={promotion.id} className="v2-surface flex flex-col p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="v2-icon-tile v2-icon-tile-gold"><TicketPercent className="h-5 w-5" /></span>
                    <span className={`v2-status ${state === 'upcoming' ? 'v2-status-neutral' : 'v2-status-success'}`}>
                      {state === 'upcoming' ? t('Starts soon', 'يبدأ قريباً', '即将开始') : t('Available now', 'متاح الآن', '当前可用')}
                    </span>
                  </div>

                  <h2 className="mt-5 text-2xl font-extrabold tracking-tight text-[var(--v2-navy)]">{discountText}</h2>
                  <p className="mt-2 text-sm text-[var(--v2-muted)]">
                    {t('Minimum top-up', 'الحد الأدنى للشحن', '最低充值金额')}: <strong className="font-bold text-[var(--v2-navy)]">{formatLocalAmount(promotion.minPurchase)}</strong>
                  </p>

                  <button
                    type="button"
                    onClick={() => void copyCode(promotion.code)}
                    aria-label={t('Copy offer code {{code}}', 'انسخ رمز العرض {{code}}', '复制优惠码 {{code}}').replace('{{code}}', promotion.code)}
                    className="mt-5 flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--v2-gold)] bg-[var(--v2-gold-soft)] px-4 text-[var(--v2-navy)] transition-colors hover:border-solid hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)]"
                  >
                    <span className="font-mono text-base font-bold tracking-wide">{promotion.code}</span>
                    <span className="flex items-center gap-2 text-xs font-bold text-[var(--v2-gold-deep)]">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? t('Copied', 'تم النسخ', '已复制') : t('Copy', 'نسخ', '复制')}
                    </span>
                  </button>

                  <div className="mt-4 flex items-center gap-2 text-xs text-[var(--v2-muted)]">
                    <CalendarDays className="h-4 w-4 flex-shrink-0 text-[var(--v2-subtle)]" />
                    <span>{formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}</span>
                  </div>

                  <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                    <a href={supportHref(promotion.code)} target="_blank" rel="noopener noreferrer" className="v2-primary-button min-h-11 text-sm">
                      <MessageCircle className="h-4 w-4" />
                      {t('Check this offer', 'تحقق من العرض', '咨询此优惠')}
                    </a>
                    <Link href={`/top-up/${product?.slug ?? 'waho-top-up'}`} className="v2-secondary-button min-h-11 text-sm">
                      {t('Choose top-up', 'اختر الشحن', '选择充值')}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
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
