'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
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
}

const fallbackBanner: Banner = {
  id: 'fallback',
  title: 'Recharge your digital balance',
  titleAr: 'اشحن رصيدك الرقمي',
  subtitle: 'Choose a category, compare available prices, and log in with WhatsApp to order.',
  subtitleAr: 'اختر الفئة وقارن الأسعار المتاحة ثم سجل الدخول عبر واتساب للطلب.',
  image: '/brand/recharge-hero-v3.webp',
  mobileImage: '/brand/recharge-hero-mobile-v3.webp',
  link: '/#categories',
  startDate: '2026-01-01T00:00:00.000Z',
  endDate: '2030-01-01T00:00:00.000Z',
  isActive: true,
  order: 0,
};

export function HeroBanner({ banners }: HeroBannerProps) {
  const { t, dir, isAuthenticated } = useApp();
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
    }, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const bannerLink = active.link || '/#categories';
  const requiresLogin = bannerLink.startsWith('/top-up') || bannerLink.startsWith('/categories');
  const primaryHref = requiresLogin && !isAuthenticated
    ? `/auth?next=${encodeURIComponent(bannerLink)}`
    : bannerLink;

  const goPrevious = () => setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
  const goNext = () => setActiveIndex((current) => (current + 1) % slides.length);
  const metrics = [
    { icon: Smartphone, title: t('Choose a category', 'اختر الفئة', '选择分类') },
    { icon: ShieldCheck, title: t('WhatsApp login', 'دخول عبر واتساب', 'WhatsApp 登录') },
    { icon: WalletCards, title: t('Local prices', 'أسعار محلية', '本地价格') },
    { icon: ReceiptText, title: t('Track your order', 'تابع طلبك', '跟踪订单') },
  ];

  return (
    <section
      data-v2-hero
      aria-roledescription="carousel"
      aria-label={t('Recharge offers', 'عروض الشحن', '充值优惠')}
      className="relative min-h-[430px] overflow-hidden border-y border-white/10 bg-[#020817] text-white shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:min-h-[540px] sm:rounded-lg sm:border lg:min-h-[510px]"
    >
      <div className="absolute inset-0" aria-live="polite">
        <picture key={active.id}>
          {active.mobileImage && <source media="(max-width: 639px)" srcSet={active.mobileImage} />}
          {/* Admin banners may use an external CDN, so a native responsive image keeps the source configurable. */}
          <img data-visual-required-image src={active.image} alt="" className={`h-full w-full object-cover object-center ${dir === 'rtl' ? '-scale-x-100' : ''}`} />
        </picture>
      </div>
      <div className={`absolute inset-0 ${dir === 'rtl' ? 'bg-[linear-gradient(90deg,rgba(2,8,23,0.18),rgba(2,8,23,0.80)_52%,#020817_94%)]' : 'bg-[linear-gradient(90deg,#020817_6%,rgba(2,8,23,0.84)_48%,rgba(2,8,23,0.16))]'}`} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,0.05)_36%,#020817_100%)]" />

      <div data-v2-brand-corner aria-hidden="true" className="v2-hero-brandmark pointer-events-none absolute right-0 top-0 z-20 hidden h-[168px] w-[192px] md:block lg:h-[198px] lg:w-[224px]">
        <span className="v2-hero-brandmark-accent absolute inset-0" />
        <div className="v2-hero-brandmark-surface absolute right-0 top-0 h-[calc(100%-10px)] w-[calc(100%-10px)]">
          <div className="relative h-full w-full">
            <Image src="/brand/alwasl-lockup.webp" alt="" fill priority className="object-contain px-5 pb-7 pt-3 lg:px-6 lg:pb-8 lg:pt-4" sizes="(max-width: 1023px) 182px, 214px" />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[430px] items-end px-5 pb-[112px] pt-20 sm:min-h-[540px] sm:items-center sm:px-10 sm:pb-32 sm:pt-8 lg:min-h-[510px] lg:px-12">
        <div className={`max-w-[630px] text-start ${dir === 'rtl' ? 'md:mr-[190px] lg:mr-[220px]' : ''}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#9bd8f2]/45 bg-[#071b46]/82 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-[#f6b7cc]" />
            {t('Secure digital recharge', 'شحن رقمي آمن', '安全数字充值')}
          </div>
          <h1 className="mt-4 max-w-[560px] text-[2rem] font-bold leading-[1.08] text-white sm:mt-5 sm:text-5xl lg:text-[3.4rem]">
            {t(active.title, active.titleAr, active.id === 'fallback' ? '充值数字余额' : active.title)}
          </h1>
          <p className="mt-3 max-w-[560px] text-sm leading-6 text-white/80 sm:mt-5 sm:text-lg sm:leading-7">
            {t(
              active.subtitle || fallbackBanner.subtitle || '',
              active.subtitleAr || fallbackBanner.subtitleAr || '',
              active.id === 'fallback'
                ? '选择分类，使用 WhatsApp 登录，然后查看适合您所在国家的价格。'
                : active.subtitle || fallbackBanner.subtitle || ''
            )}
          </p>
          <div className="mt-5 flex flex-wrap gap-3 sm:mt-7">
            <Link data-testid="home-primary-topup" href={primaryHref} className="v2-primary-button min-h-12 min-w-44">
              {t('Choose category', 'اختر الفئة', '选择分类')}
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link href="/help" className="v2-secondary-button min-h-12 border-white/22 bg-white/5 text-white hover:bg-white/10">
              <CircleHelp className="h-4 w-4 text-[#9bd8f2]" />
              {t('How it works', 'كيف يعمل', '如何操作')}
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute inset-x-4 bottom-[88px] z-30 flex items-center justify-between sm:inset-x-8 sm:bottom-[84px]">
          <button type="button" onClick={goPrevious} title={t('Previous banner', 'البانر السابق', '上一张横幅')} aria-label={t('Previous banner', 'البانر السابق', '上一张横幅')} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#020817]/72 text-white backdrop-blur-md hover:bg-[#071b46]">
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <div className="flex gap-2" role="tablist" aria-label={t('Choose banner', 'اختر البانر', '选择横幅')}>
            {slides.map((slide, index) => (
              <button key={slide.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`${t('Banner', 'بانر', '横幅')} ${index + 1}`} aria-selected={index === activeIndex} role="tab" className={`h-2.5 rounded-full transition-[width,background-color] ${index === activeIndex ? 'w-8 bg-[#f6b7cc]' : 'w-2.5 bg-white/40 hover:bg-white/70'}`} />
            ))}
          </div>
          <button type="button" onClick={goNext} title={t('Next banner', 'البانر التالي', '下一张横幅')} aria-label={t('Next banner', 'البانر التالي', '下一张横幅')} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#020817]/72 text-white backdrop-blur-md hover:bg-[#071b46]">
            <ChevronRight className="h-5 w-5 rtl:rotate-180" />
          </button>
        </div>
      )}

      <div data-v2-hero-metrics className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-white/12 bg-[#020817]/94 px-1 py-2 backdrop-blur-xl sm:px-6 sm:py-3">
        {metrics.map((item, index) => (
          <div key={item.title} className="flex min-h-[70px] flex-col items-center justify-center gap-1 border-e border-white/10 px-1 text-center last:border-e-0 sm:min-h-[58px] sm:flex-row sm:gap-2.5 sm:px-4 sm:text-start">
            <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${index % 2 ? 'text-[#f6b7cc]' : 'text-[#9bd8f2]'} sm:h-5 sm:w-5`} />
            <p className="max-w-full break-words text-[9px] font-bold leading-3 text-white sm:text-sm sm:leading-5">{item.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
