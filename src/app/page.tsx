'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  Banknote,
  BadgeCheck,
  Headphones,
  Loader2,
  LockKeyhole,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from 'lucide-react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { supportWhatsAppHref, supportWhatsAppNumber } from '@/config/contact';
import { useApp } from '@/contexts/AppContext';
import type { Banner, CatalogCategory } from '@/types';

export default function HomePage() {
  const {
    t,
    dir,
    language,
    selectedCountry,
    isAuthenticated,
    isAccountLoading,
  } = useApp();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    async function loadHome() {
      setIsLoading(true);
      setHasError(false);
      try {
        const [categoryResponse, bannerResponse] = await Promise.all([
          fetch(`/api/categories?country=${selectedCountry.id}`, { signal: controller.signal }),
          fetch('/api/banners', { signal: controller.signal }),
        ]);
        if (!categoryResponse.ok) throw new Error('CATEGORY_LOAD_FAILED');
        const [categoryPayload, bannerPayload] = await Promise.all([
          categoryResponse.json(),
          bannerResponse.ok ? bannerResponse.json() : Promise.resolve({ banners: [] }),
        ]);
        if (!active) return;
        setCategories(categoryPayload.categories ?? []);
        setBanners(bannerPayload.banners ?? []);
      } catch {
        if (!active) return;
        setCategories([]);
        setBanners([]);
        setHasError(true);
      } finally {
        window.clearTimeout(timeout);
        if (active) setIsLoading(false);
      }
    }

    void loadHome();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [loadAttempt, selectedCountry.id]);

  const localizedCategory = (category: CatalogCategory) => ({
    name: language === 'ar' ? category.nameAr : language === 'zh' ? category.nameZh || category.name : category.name,
    description: language === 'ar'
      ? category.descriptionAr
      : language === 'zh'
        ? category.descriptionZh || category.description
        : category.description,
  });
  const categoryHref = (category: CatalogCategory) => {
    const target = `/categories/${category.slug}`;
    return isAuthenticated || category.priceVisibility === 'PUBLIC'
      ? target
      : `/auth?next=${encodeURIComponent(target)}`;
  };

  const steps = [
    {
      icon: Smartphone,
      title: t('Choose a category', 'اختر الفئة', '选择分类'),
      body: t('Pick WAHO, Asiacell, or another available service.', 'اختر واهو أو آسيا سيل أو أي خدمة متاحة.', '选择 WAHO、Asiacell 或其他可用服务。'),
    },
    {
      icon: LockKeyhole,
      title: t('Login with WhatsApp', 'سجل الدخول عبر واتساب', '使用 WhatsApp 登录'),
      body: t('A secure code confirms who is placing the order.', 'يؤكد الرمز الآمن هوية صاحب الطلب.', '安全验证码用于确认下单者身份。'),
    },
    {
      icon: ReceiptText,
      title: t('Place your cash order', 'أرسل طلب الدفع النقدي', '提交现金订单'),
      body: t('Check the amount, place the order, and arrange cash payment.', 'تحقق من المبلغ وأرسل الطلب ثم نسّق الدفع النقدي.', '确认金额并提交订单，然后安排现金付款。'),
    },
  ];

  const promises = [
    { icon: ShieldCheck, color: '#9bd8f2', title: t('Secure confirmation', 'تأكيد آمن', '安全确认'), body: t('Important actions use a WhatsApp code.', 'الإجراءات المهمة تستخدم رمز واتساب.', '重要操作使用 WhatsApp 验证码。') },
    { icon: WalletCards, color: '#f6b7cc', title: t('Country prices', 'أسعار حسب البلد', '按国家定价'), body: t('Currency follows your WhatsApp country.', 'تتبع العملة بلد رقم واتساب.', '货币跟随您的 WhatsApp 国家。') },
    { icon: ReceiptText, color: '#8fe3d2', title: t('Clear order status', 'حالة طلب واضحة', '清晰订单状态'), body: t('See when an order is being handled or ready.', 'شاهد متى تتم معالجة الطلب أو يصبح جاهزاً.', '查看订单何时处理中或已完成。') },
    { icon: Headphones, color: '#c4b5fd', title: t('WhatsApp support', 'دعم واتساب', 'WhatsApp 支持'), body: t('Send the order ID when you need help.', 'أرسل رقم الطلب عندما تحتاج للمساعدة.', '需要帮助时发送订单号。') },
  ];

  return (
    <div data-v2-home className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main>
        <div className="mx-auto max-w-[1280px] sm:px-4 sm:pt-4">
          <HeroBanner banners={banners} />
        </div>

        <section className="border-y border-[#e4e5ef] bg-[#fbfbfe] text-[#07152e]" aria-labelledby="steps-heading">
          <div className="mx-auto max-w-[1280px] px-3 py-5 sm:px-4 sm:py-7 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center lg:gap-7">
            <div className="text-center sm:text-start">
              <p className="text-xs font-bold text-[#94610b]">{t('Simple from the first tap', 'بسيط من أول ضغطة', '从第一次点击就很简单')}</p>
              <h2 id="steps-heading" className="mt-1 text-xl font-bold sm:text-3xl lg:text-2xl">{t('Recharge in 3 steps', 'اشحن في 3 خطوات', '3 步完成充值')}</h2>
            </div>
            <ol data-v2-process-steps className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 lg:mt-0">
              {steps.map((step, index) => (
                <li key={step.title} className="flex min-h-[92px] flex-col items-center justify-center border border-[#e2e4ee] bg-white px-2 py-3 text-center shadow-[0_8px_24px_rgba(21,24,45,0.06)] sm:min-h-[112px] sm:flex-row sm:justify-start sm:gap-3 sm:px-4 sm:text-start">
                  <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-md text-[#07152e] ${index === 0 ? 'bg-[#70d5ff]' : index === 1 ? 'bg-[#ff9cbd]' : 'bg-[#75dfc8]'}`}><step.icon className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="mt-1 text-[11px] font-bold leading-4 sm:mt-0 sm:text-sm">{step.title}</p>
                    <p className="mt-1 hidden text-xs leading-5 text-[#58677d] sm:block">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="categories" className="scroll-mt-20 bg-[linear-gradient(180deg,#f4f7fb_0%,#ffffff_100%)] py-9 text-[#07152e] sm:py-14" aria-labelledby="categories-heading">
          <div className="mx-auto max-w-[1280px] px-3 sm:px-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-[#1769d2]">{t('Recharge categories', 'فئات الشحن', '充值分类')}</p>
                <h2 id="categories-heading" className="mt-2 text-2xl font-bold sm:text-4xl">{t('What would you like to recharge?', 'ماذا تريد أن تشحن؟', '您想充值什么？')}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#53627a] sm:text-base">
                  {isAuthenticated
                    ? t('Choose a category to see the available balances and your local prices.', 'اختر فئة لرؤية الأرصدة المتاحة وأسعارك المحلية.', '选择分类以查看可用余额和本地价格。')
                    : t('Public prices open immediately. Protected categories ask you to log in first.', 'تظهر الأسعار العامة فوراً، وتطلب الفئات المحمية تسجيل الدخول أولاً.', '公开价格会立即显示，受保护分类会先要求登录。')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex max-w-max items-center gap-2 rounded-md border border-[#75cdb9] bg-[#e8faf5] px-3 py-2 text-xs font-semibold text-[#176b58]">
                  <Banknote className="h-4 w-4" />
                  {t('Cash payment is currently available', 'الدفع النقدي متاح حالياً', '目前支持现金付款')}
                </div>
                {!isAccountLoading && !isAuthenticated && (
                  <div className="inline-flex max-w-max items-center gap-2 rounded-md border border-[#f5b3c9] bg-[#fff0f5] px-3 py-2 text-xs font-semibold text-[#a83d67]">
                    <LockKeyhole className="h-4 w-4" />
                    {t('Some prices require login', 'بعض الأسعار تتطلب تسجيل الدخول', '部分价格需要登录')}
                  </div>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite">
                {[0, 1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-lg border border-[#d9e1ec] bg-[#eaf1f8] motion-reduce:animate-none" />)}
                <span className="sr-only">{t('Loading categories', 'جارٍ تحميل الفئات', '正在加载分类')}</span>
              </div>
            ) : categories.length > 0 ? (
              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category, index) => {
                  const content = localizedCategory(category);
                  const isAsiacell = category.slug === 'asiacell';
                  const panelColor = isAsiacell ? '#fff0f3' : category.slug === 'waho' ? '#eef8ff' : '#f4f0ff';
                  const fallbackAccent = isAsiacell ? '#ff6f91' : index % 2 ? '#ff98bc' : '#70dcff';
                  return (
                    <Link
                      key={category.id}
                      href={categoryHref(category)}
                      data-testid="catalog-category-card"
                      className="group relative grid min-h-[232px] grid-cols-[minmax(0,1fr)_112px] overflow-hidden rounded-lg border border-[#d9e1ec] bg-[var(--category-panel)] p-5 shadow-[0_16px_42px_rgba(28,55,92,0.10)] transition-[transform,border-color,box-shadow] hover:-translate-y-1 hover:border-[var(--category-accent)] hover:shadow-[0_22px_50px_rgba(28,55,92,0.15)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--category-accent)] sm:grid-cols-[minmax(0,1fr)_160px]"
                      style={{ '--category-accent': category.accentColor || fallbackAccent, '--category-panel': panelColor } as CSSProperties}
                    >
                      <span className="absolute inset-x-0 top-0 h-1 bg-[var(--category-accent)]" />
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(0deg,color-mix(in_srgb,var(--category-accent)_12%,transparent),transparent)]" />
                      <span className="relative z-10 flex min-w-0 flex-col items-start justify-center text-start">
                        <span className="inline-flex rounded-md bg-[var(--category-accent)] px-2 py-1 text-[10px] font-bold text-[#07152e]">
                          {t('{{count}} service', '{{count}} خدمة', '{{count}} 项服务').replace('{{count}}', String(category.productCount))}
                        </span>
                        <span className="mt-3 text-xl font-bold text-[#07152e] sm:text-2xl">{content.name}</span>
                        <span className="mt-2 line-clamp-3 text-xs leading-5 text-[#53627a] sm:text-sm">{content.description}</span>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#1769d2]">
                          {isAuthenticated || category.priceVisibility === 'PUBLIC'
                            ? t('View prices', 'عرض الأسعار', '查看价格')
                            : t('Login and view', 'سجل الدخول واعرض', '登录并查看')}
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </span>
                      </span>
                      <span className="relative self-center overflow-hidden rounded-lg border border-white bg-white p-3 shadow-[0_12px_30px_rgba(28,55,92,0.12)]" style={{ aspectRatio: '1 / 1' }}>
                        {/* Category images are configured by admins and may live on a managed CDN. */}
                        <img src={category.image} alt="" className={`h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04] ${isAsiacell ? 'p-1' : ''}`} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-7 flex flex-col gap-4 rounded-lg border border-[#d9e1ec] bg-white p-5 shadow-[0_12px_34px_rgba(28,55,92,0.08)] sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-[#07152e]">{hasError ? t('Categories could not be loaded.', 'تعذر تحميل الفئات.', '无法加载分类。') : t('No categories are available right now.', 'لا توجد فئات متاحة الآن.', '目前没有可用分类。')}</p>
                <Button type="button" variant="outline" onClick={() => setLoadAttempt((value) => value + 1)} className="border-[#d9e1ec] bg-white text-[#07152e] hover:bg-[#eef4fa] hover:text-[#07152e]"><RefreshCw className="h-4 w-4" />{t('Try again', 'حاول مرة أخرى', '重试')}</Button>
              </div>
            )}
          </div>
        </section>

        <section className="border-y border-[#d9e1ec] bg-white text-[#07152e]" aria-label={t('Service promises', 'وعود الخدمة', '服务承诺')}>
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 px-3 py-3 sm:px-4 lg:grid-cols-4">
            {promises.map((item) => (
              <div key={item.title} className="flex min-h-[86px] items-center gap-2 border-[#d9e1ec] px-2 py-3 lg:border-e lg:px-4 last:lg:border-e-0">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md text-[#07152e]" style={{ backgroundColor: item.color }}><item.icon className="h-5 w-5" /></span>
                <div className="min-w-0"><h3 className="text-xs font-bold sm:text-sm">{item.title}</h3><p className="mt-1 hidden text-xs leading-5 text-[#58677d] sm:block">{item.body}</p></div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#d9e1ec] bg-white pb-20 text-[#07152e] lg:pb-0">
        <div className="mx-auto grid max-w-[1280px] gap-5 px-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-[#d9e1ec] bg-white shadow-[0_8px_20px_rgba(28,55,92,0.10)]"><Image src="/brand/alwasl-mark.jpg" alt="" fill className="object-contain p-1" sizes="44px" /></div>
            <div><p className="text-sm font-bold">{t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}</p><p className="text-xs text-[#53627a]">{t('Digital recharge for your country', 'شحن رقمي مناسب لبلدك', '适合您所在国家的数字充值')}</p></div>
          </div>
          <a href={supportWhatsAppHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#d9e1ec] bg-[#f7fafc] px-3 text-xs font-semibold text-[#07152e] hover:bg-[#eef4fa]">
            <span className="relative h-8 w-8 overflow-hidden rounded-full border border-[#f7b928]/65"><Image src="/brand/leo-waho-agent.jpeg" alt="" fill className="object-cover object-[52%_27%]" sizes="32px" /></span>
            <span><span className="flex items-center gap-1 font-bold">LEO <BadgeCheck className="h-3.5 w-3.5 text-[#1769d2]" /></span><span className="text-[10px] text-[#53627a]">{supportWhatsAppNumber}</span></span>
            <MessageCircle className="h-4 w-4 text-[#21856f]" />
          </a>
        </div>
      </footer>
    </div>
  );
}
