'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
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

export function HeroBanner({ banners }: HeroBannerProps) {
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

  return (
    <section
      data-v2-hero
      data-campaign-banner={isCampaignBanner ? active.id : undefined}
      aria-roledescription="carousel"
      aria-label={t('Recharge offers', 'عروض الشحن', '充值优惠')}
      className={`relative min-h-[610px] overflow-hidden border-y border-[#d9e1ec] bg-white text-[#07152e] shadow-[0_24px_70px_rgba(28,55,92,0.14)] sm:min-h-[560px] sm:rounded-lg sm:border lg:min-h-[520px] ${isRedCampaign ? 'selection:bg-[#ff5f8f]/25' : 'selection:bg-[#62d9ff]/30'}`}
    >
      {isCampaignBanner ? (
        <div dir="ltr" className="absolute inset-0 grid grid-rows-[220px_minmax(0,1fr)] lg:grid-cols-[46%_54%] lg:grid-rows-1">
          <div data-campaign-visual className="relative overflow-hidden bg-[#eaf1f8]">
            <img
              data-visual-required-image
              src={imageSource}
              alt=""
              className="h-full w-auto min-w-full object-cover object-left"
            />
            <div className="absolute inset-y-0 right-0 w-[64%] bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.94)_40%,#ffffff_82%)] lg:w-[48%]" />
            <div className={`absolute inset-0 bg-[linear-gradient(180deg,transparent_48%,#ffffff_100%)] lg:bg-[linear-gradient(90deg,transparent_58%,#ffffff_100%)] ${isRedCampaign ? 'shadow-[inset_0_0_70px_rgba(255,95,127,0.10)]' : 'shadow-[inset_0_0_70px_rgba(112,213,255,0.14)]'}`} />
          </div>

          <div
            dir={dir}
            aria-live="polite"
            className={`relative flex min-w-0 flex-col justify-center px-5 pb-[116px] pt-5 text-start sm:px-8 lg:px-12 lg:pb-28 lg:pt-8 ${
              isRedCampaign
                ? 'bg-[linear-gradient(145deg,#fff0f4_0%,#ffffff_58%,#f8fbff_100%)]'
                : 'bg-[linear-gradient(145deg,#eaf8ff_0%,#ffffff_58%,#f8fbff_100%)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg border bg-white shadow-lg ${isRedCampaign ? 'border-[#ff789d]/35 shadow-[#ff345f]/15' : 'border-[#73dfff]/35 shadow-[#4bcfff]/15'}`}>
                <Image src="/brand/alwasl-mark.jpg" alt="" width={40} height={40} className="h-9 w-9 object-contain" />
              </span>
              <span>
                <span className="block text-[11px] font-bold uppercase text-[#6b778a]">Al-Wasl Digital</span>
                <span className={`mt-0.5 block text-xs font-semibold ${isRedCampaign ? 'text-[#a83d67]' : 'text-[#1769d2]'}`}>
                  {t('Official recharge service', 'خدمة شحن موثوقة', '正规充值服务')}
                </span>
              </span>
            </div>

            <div className={`mt-4 inline-flex max-w-max items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold ${isRedCampaign ? 'border-[#f5b3c9] bg-[#fff0f5] text-[#a83d67]' : 'border-[#9bd8f2] bg-[#edf9ff] text-[#1769d2]'}`}>
              {isRedCampaign ? <BadgeCheck className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
              {isRedCampaign
                ? t('Selected WAHO offers', 'عروض واهو مختارة', '精选 WAHO 优惠')
                : t('Fast and protected', 'سريع ومحمي', '快捷且安全')}
            </div>

            <h1 className="mt-3 max-w-[640px] text-[1.85rem] font-bold leading-[1.12] text-[#07152e] sm:text-[2.4rem] lg:text-[3.15rem]">
              {localizedTitle}
            </h1>
            <p className="mt-2 max-w-[590px] text-sm leading-6 text-[#53627a] sm:text-base sm:leading-7">
              {localizedSubtitle}
            </p>

            <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#d9e1ec] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#34445c] shadow-[0_6px_16px_rgba(28,55,92,0.06)]">
                <Clock3 className={`h-4 w-4 ${isRedCampaign ? 'text-[#d54f78]' : 'text-[#1769d2]'}`} />
                {t('Fast handling', 'تنفيذ سريع', '快速处理')}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#d9e1ec] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#34445c] shadow-[0_6px_16px_rgba(28,55,92,0.06)]">
                <BadgeCheck className={`h-4 w-4 ${isRedCampaign ? 'text-[#b97700]' : 'text-[#7657d4]'}`} />
                {t('Registered company', 'شركة مسجلة', '正规注册企业')}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5 sm:mt-6">
              <Link data-testid="home-primary-topup" href={primaryHref} className={`v2-primary-button min-h-11 min-w-40 ${isRedCampaign ? 'v2-primary-button-red' : 'v2-primary-button-blue'}`}>
                {t('View recharge options', 'عرض خيارات الشحن', '查看充值选项')}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link href="/help" className="v2-secondary-button min-h-11 border-[#d9e1ec] bg-white text-[#07152e] hover:bg-[#eef4fa]">
                <CircleHelp className={`h-4 w-4 ${isRedCampaign ? 'text-[#d54f78]' : 'text-[#1769d2]'}`} />
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
          <div className={`absolute inset-0 ${dir === 'rtl' ? 'bg-[linear-gradient(90deg,rgba(255,255,255,0.12),rgba(255,255,255,0.88)_52%,#ffffff_94%)]' : 'bg-[linear-gradient(90deg,#ffffff_6%,rgba(255,255,255,0.88)_48%,rgba(255,255,255,0.12))]'}`} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_36%,#ffffff_100%)]" />

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
              <div className="inline-flex items-center gap-2 rounded-full border border-[#9bd8f2] bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#1769d2] shadow-[0_8px_20px_rgba(28,55,92,0.08)] backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-[#d54f78]" />
                {t('Secure digital recharge', 'شحن رقمي آمن', '安全数字充值')}
              </div>
              <h1 className="mt-4 max-w-[560px] text-[2rem] font-bold leading-[1.08] text-[#07152e] sm:mt-5 sm:text-5xl lg:text-[3.4rem]">{localizedTitle}</h1>
              <p className="mt-3 max-w-[560px] text-sm leading-6 text-[#53627a] sm:mt-5 sm:text-lg sm:leading-7">{localizedSubtitle}</p>
              <div className="mt-5 flex flex-wrap gap-3 sm:mt-7">
                <Link data-testid="home-primary-topup" href={primaryHref} className="v2-primary-button min-h-12 min-w-44">
                  {t('Choose category', 'اختر الفئة', '选择分类')}
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link href="/help" className="v2-secondary-button min-h-12 border-[#d9e1ec] bg-white/90 text-[#07152e] hover:bg-[#eef4fa]">
                  <CircleHelp className="h-4 w-4 text-[#1769d2]" />
                  {t('How it works', 'كيف يعمل', '如何操作')}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute inset-x-3 bottom-[82px] z-30 flex items-center justify-between sm:inset-x-7 sm:bottom-[84px]">
          <button type="button" onClick={goPrevious} title={t('Previous banner', 'البانر السابق', '上一张横幅')} aria-label={t('Previous banner', 'البانر السابق', '上一张横幅')} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e1ec] bg-white/90 text-[#07152e] shadow-[0_8px_20px_rgba(28,55,92,0.12)] backdrop-blur-md hover:bg-white sm:h-10 sm:w-10">
            <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </button>
          <div className="flex gap-2" role="tablist" aria-label={t('Choose banner', 'اختر البانر', '选择横幅')}>
            {slides.map((slide, index) => (
              <button key={slide.id} type="button" onClick={() => setActiveIndex(index)} aria-label={`${t('Banner', 'بانر', '横幅')} ${index + 1}`} aria-selected={index === activeIndex} role="tab" className={`h-2.5 rounded-full transition-[width,background-color] ${index === activeIndex ? `w-8 ${isRedCampaign ? 'bg-[#d54f78]' : 'bg-[#1769d2]'}` : 'w-2.5 bg-[#b8c5d8] hover:bg-[#7d8ba0]'}`} />
            ))}
          </div>
          <button type="button" onClick={goNext} title={t('Next banner', 'البانر التالي', '下一张横幅')} aria-label={t('Next banner', 'البانر التالي', '下一张横幅')} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9e1ec] bg-white/90 text-[#07152e] shadow-[0_8px_20px_rgba(28,55,92,0.12)] backdrop-blur-md hover:bg-white sm:h-10 sm:w-10">
            <ChevronRight className="h-5 w-5 rtl:rotate-180" />
          </button>
        </div>
      )}

      <div data-v2-hero-metrics className="absolute inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-[#d9e1ec] bg-white/95 px-1 py-2 backdrop-blur-xl sm:px-6 sm:py-3">
        {metrics.map((item, index) => (
          <div key={item.title} className="flex min-h-[66px] flex-col items-center justify-center gap-1 border-e border-[#d9e1ec] px-1 text-center last:border-e-0 sm:min-h-[56px] sm:flex-row sm:gap-2.5 sm:px-4 sm:text-start">
            <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${index % 2 ? 'text-[#d54f78]' : 'text-[#1769d2]'} sm:h-5 sm:w-5`} />
            <p className="max-w-full break-words text-[9px] font-bold leading-3 text-[#07152e] sm:text-sm sm:leading-5">{item.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
