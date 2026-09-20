'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from 'lucide-react';
import type { Banner } from '@/types';
import { useApp } from '@/contexts/AppContext';

interface HeroBannerProps {
  banners: Banner[];
  isLoading?: boolean;
}

const fallbackBanner: Banner = {
  id: 'fallback',
  title: 'Recharge your digital balance',
  titleAr: 'اشحن رصيدك الرقمي',
  titleZh: '为数字余额充值',
  subtitle: 'Choose a category, compare available prices, and log in with WhatsApp to order.',
  subtitleAr: 'اختر الفئة وقارن الأسعار المتاحة ثم سجل الدخول عبر واتساب للطلب.',
  subtitleZh: '选择分类，比较可用价格，然后通过 WhatsApp 登录下单。',
  image: '/brand/recharge-hero-v3.webp',
  mobileImage: '/brand/recharge-hero-mobile-v3.webp',
  link: '/#categories',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2030-01-01T00:00:00.000Z',
  isActive: true,
  order: 0,
};

export function HeroBanner({ banners, isLoading = false }: HeroBannerProps) {
  const { t, dir, language, isAuthenticated } = useApp();
  const slides = useMemo(() => banners.length > 0 ? banners : [fallbackBanner], [banners]);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = slides[activeIndex] ?? slides[0];

  useEffect(() => {
    if (activeIndex < slides.length) return;
    setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const bannerLink = active.link || '/#categories';
  const requiresLogin = bannerLink.startsWith('/top-up') || bannerLink.startsWith('/categories');
  const primaryHref = requiresLogin && !isAuthenticated
    ? `/auth?next=${encodeURIComponent(bannerLink)}`
    : bannerLink;
  const isCampaignBanner = active.id === 'campaign-waho-fast-blue' || active.id === 'campaign-waho-offers-red';
  const isRedCampaign = active.id === 'campaign-waho-offers-red';
  const localizedTitle = language === 'ar' ? active.titleAr : language === 'zh' ? active.titleZh : active.title;
  const localizedSubtitle = language === 'ar'
    ? active.subtitleAr || fallbackBanner.subtitleAr || ''
    : language === 'zh'
      ? active.subtitleZh || fallbackBanner.subtitleZh || ''
      : active.subtitle || fallbackBanner.subtitle || '';
  const imageSource = active.image || fallbackBanner.image;

  const goPrevious = () => setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  const goNext = () => setActiveIndex((current) => (current + 1) % slides.length);
  const metrics = [
    { icon: Smartphone, title: t('Choose a category', 'اختر الفئة', '选择分类') },
    { icon: ShieldCheck, title: t('WhatsApp login', 'دخول عبر واتساب', 'WhatsApp 登录') },
    { icon: WalletCards, title: t('Local prices', 'أسعار محلية', '本地价格') },
    { icon: ReceiptText, title: t('Track your order', 'تابع طلبك', '跟踪订单') },
  ];
  const accentText = isRedCampaign ? 'text-[#d54f78]' : 'text-[var(--v2-blue)]';

  if (isLoading && banners.length === 0) {
    return (
      <section
        data-v2-hero
        aria-busy="true"
        aria-label={t('Recharge offers', 'عروض الشحن', '充值优惠')}
        className="v2-hero v2-skeleton min-h-[610px] border-y border-[var(--v2-border)] sm:min-h-[560px] sm:rounded-[var(--v2-radius-xl)] sm:border lg:min-h-[520px]"
      >
        <span className="sr-only">{t('Loading offers', 'جارٍ تحميل العروض', '正在加载优惠')}</span>
      </section>
    );
  }

  return (
    <section
      data-v2-hero
      data-campaign-banner={isCampaignBanner ? active.id : undefined}
      aria-roledescription="carousel"
      aria-label={t('Recharge offers', 'عروض الشحن', '充值优惠')}
      className={`v2-hero min-h-[610px] border-y border-[var(--v2-border)] sm:min-h-[560px] sm:rounded-[var(--v2-radius-xl)] sm:border lg:min-h-[520px] ${isRedCampaign ? 'selection:bg-[#ff5f8f]/25' : 'selection:bg-[#62d9ff]/30'}`}
    >
      {isCampaignBanner ? (
        <div dir="ltr" className="absolute inset-0 grid grid-rows-[220px_minmax(0,1fr)] lg:grid-cols-[48%_52%] lg:grid-rows-1">
          <div
            data-campaign-visual
            data-campaign-edge="crisp"
            className="v2-hero-visual border-b border-[var(--v2-border)] lg:border-b-0 lg:border-e"
          >
            <img
              data-visual-required-image
              src={imageSource}
              alt=""
              className="h-full w-full object-cover object-center lg:object-contain"
            />
          </div>

          <div
            dir={dir}
            aria-live="polite"
            className={`relative flex min-w-0 flex-col justify-center px-5 pb-[128px] pt-6 text-start sm:px-9 sm:pb-[116px] sm:pt-8 lg:px-14 lg:pb-28 ${isRedCampaign ? 'v2-hero-copy-red' : 'v2-hero-copy'}`}
          >
            <div className={`v2-animate-in inline-flex max-w-max items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${isRedCampaign ? 'border-[#f5b3c9] bg-[#fff0f5] text-[#b0325f]' : 'border-[#bfe4f9] bg-[#edf9ff] text-[var(--v2-blue)]'}`}>
              {isRedCampaign ? <BadgeCheck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {isRedCampaign
                ? t('Selected WAHO offers', 'عروض واهو مختارة', '精选 WAHO 优惠')
                : t('Official recharge service', 'خدمة شحن موثوقة', '正规充值服务')}
            </div>

            <h1 className="v2-title v2-animate-in v2-delay-1 mt-4 max-w-[560px] text-[1.9rem] sm:text-[2.7rem] lg:text-[3.4rem]">
              {localizedTitle}
            </h1>
            <p className="v2-animate-in v2-delay-2 mt-3 max-w-[460px] text-[15px] leading-6 text-[var(--v2-muted)] sm:text-base sm:leading-7">
              {localizedSubtitle}
            </p>

            <div className="v2-animate-in v2-delay-3 mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-7">
              <Link data-testid="home-primary-topup" href={primaryHref} className={`v2-primary-button min-h-11 min-w-40 sm:min-h-12 sm:min-w-48 ${isRedCampaign ? 'v2-primary-button-red' : 'v2-primary-button-blue'}`}>
                {t('View recharge options', 'عرض خيارات الشحن', '查看充值选项')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link href="/help" className="v2-ghost-link text-[var(--v2-navy)] hover:text-[var(--v2-blue)]">
                <CircleHelp className={`h-4 w-4 ${accentText}`} />
                {t('How it works', 'كيف يعمل', '如何操作')}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute inset-0" aria-live="polite">
            <picture key={active.id}>
              {active.mobileImage && <source media="(max-width: 639px)" srcSet={active.mobileImage} />}
              <img data-visual-required-image src={imageSource} alt="" className="h-full w-full object-cover object-center" />
            </picture>
          </div>
          <div className="v2-hero-fade absolute inset-0" />
          <div className="v2-hero-fade-bottom absolute inset-0" />

          <div data-v2-brand-corner aria-hidden="true" className="v2-hero-brandmark pointer-events-none absolute right-0 top-0 z-20 hidden h-[168px] w-[192px] md:block lg:h-[198px] lg:w-[224px]">
            <span className="v2-hero-brandmark-accent absolute inset-0" />
            <div className="v2-hero-brandmark-surface absolute right-0 top-0 h-[calc(100%-10px)] w-[calc(100%-10px)]">
              <div className="relative h-full w-full">
                <Image src="/brand/alwasl-lockup.webp" alt="" fill priority className="object-contain px-5 pb-7 pt-3 lg:px-6 lg:pb-8 lg:pt-4" sizes="(max-width: 1023px) 182px, 214px" />
              </div>
            </div>
          </div>

          <div className="relative z-10 flex min-h-[610px] items-end px-5 pb-[120px] pt-20 sm:min-h-[560px] sm:items-center sm:px-10 sm:pb-32 sm:pt-8 lg:min-h-[520px] lg:px-12">
            <div className={`max-w-[630px] text-start ${dir === 'rtl' ? 'md:mr-[190px] lg:mr-[220px]' : ''}`}>
              <div className="v2-chip v2-chip-blue v2-animate-in">
                <ShieldCheck className="h-4 w-4" />
                {t('Secure digital recharge', 'شحن رقمي آمن', '安全数字充值')}
              </div>
              <h1 className="v2-title v2-animate-in v2-delay-1 mt-4 max-w-[560px] text-[2.1rem] sm:mt-5 sm:text-5xl lg:text-[3.5rem]">{localizedTitle}</h1>
              <p className="v2-animate-in v2-delay-2 mt-3 max-w-[480px] text-[15px] leading-7 text-[var(--v2-muted)] sm:mt-4 sm:text-lg sm:leading-8">{localizedSubtitle}</p>
              <div className="v2-animate-in v2-delay-3 mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-7">
                <Link data-testid="home-primary-topup" href={primaryHref} className="v2-primary-button min-h-12 min-w-44">
                  {t('Choose category', 'اختر الفئة', '选择分类')}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link href="/help" className="v2-ghost-link text-[var(--v2-navy)] hover:text-[var(--v2-blue)]">
                  <CircleHelp className="h-4 w-4 text-[var(--v2-blue)]" />
                  {t('How it works', 'كيف يعمل', '如何操作')}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute inset-x-3 bottom-[88px] z-30 flex items-center justify-center sm:inset-x-7 sm:bottom-[84px] sm:justify-between">
          <button type="button" onClick={goPrevious} title={t('Previous banner', 'البانر السابق', '上一张横幅')} aria-label={t('Previous banner', 'البانر السابق', '上一张横幅')} className="v2-carousel-button hidden sm:flex">
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <div className="flex gap-2 rounded-full border border-[var(--v2-border)] bg-[var(--v2-surface)] px-2.5 py-2" role="tablist" aria-label={t('Choose banner', 'اختر البانر', '选择横幅')}>
            {slides.map((slide, index) => (
              <button key={slide.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`${t('Banner', 'بانر', '横幅')} ${index + 1}`} aria-selected={index === activeIndex} role="tab" className={`h-2 rounded-full transition-[width,background-color] duration-300 ${index === activeIndex ? `w-7 ${isRedCampaign ? 'bg-[#d54f78]' : 'bg-[var(--v2-navy)]'}` : 'w-2 bg-[var(--v2-border-strong)] hover:bg-[var(--v2-subtle)]'}`} />
            ))}
          </div>
          <button type="button" onClick={goNext} title={t('Next banner', 'البانر التالي', '下一张横幅')} aria-label={t('Next banner', 'البانر التالي', '下一张横幅')} className="v2-carousel-button hidden sm:flex">
            <ChevronRight className="h-5 w-5 rtl:rotate-180" />
          </button>
        </div>
      )}

      <div data-v2-hero-metrics className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-[var(--v2-border)] bg-[var(--v2-surface)] px-1 py-2 sm:px-6 sm:py-3">
        {metrics.map((item, index) => (
          <div key={item.title} className="v2-hero-metric">
            <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${index % 2 ? 'bg-[#fff0f5] text-[#d54f78]' : 'bg-[var(--v2-blue-soft)] text-[var(--v2-blue)]'}`}>
              <item.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            </span>
            <p className="max-w-full break-words text-[9px] font-bold leading-3 text-[var(--v2-navy)] sm:text-sm sm:leading-5">{item.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
