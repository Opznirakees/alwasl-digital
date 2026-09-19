'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  Banknote,
  BadgeCheck,
  Headphones,
  LockKeyhole,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  WalletCards,
  Zap,
} from 'lucide-react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { Header } from '@/components/layout/Header';
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
    { icon: ShieldCheck, tone: 'v2-icon-tile-blue', title: t('Secure confirmation', 'تأكيد آمن', '安全确认'), body: t('Important actions use a WhatsApp code.', 'الإجراءات المهمة تستخدم رمز واتساب.', '重要操作使用 WhatsApp 验证码。') },
    { icon: WalletCards, tone: 'v2-icon-tile-gold', title: t('Country prices', 'أسعار حسب البلد', '按国家定价'), body: t('Currency follows your WhatsApp country.', 'تتبع العملة بلد رقم واتساب.', '货币跟随您的 WhatsApp 国家。') },
    { icon: ReceiptText, tone: 'v2-icon-tile-green', title: t('Clear order status', 'حالة طلب واضحة', '清晰订单状态'), body: t('See when an order is being handled or ready.', 'شاهد متى تتم معالجة الطلب أو يصبح جاهزاً.', '查看订单何时处理中或已完成。') },
    { icon: Headphones, tone: 'v2-icon-tile', title: t('WhatsApp support', 'دعم واتساب', 'WhatsApp 支持'), body: t('Send the order ID when you need help.', 'أرسل رقم الطلب عندما تحتاج للمساعدة.', '需要帮助时发送订单号。') },
  ];

  const footerLinks = [
    { href: '/help', label: t('Help', 'مساعدة', '帮助') },
    { href: '/faq', label: t('FAQ', 'الأسئلة الشائعة', '常见问题') },
    { href: '/about', label: t('About', 'من نحن', '关于我们') },
    { href: '/contact', label: t('Contact', 'تواصل معنا', '联系我们') },
    { href: '/terms', label: t('Terms', 'الشروط', '条款') },
    { href: '/privacy', label: t('Privacy', 'الخصوصية', '隐私') },
  ];

  return (
    <div data-v2-home className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main>
        <div className="mx-auto max-w-[1200px] sm:px-6 sm:pt-5">
          <HeroBanner banners={banners} isLoading={isLoading} />
        </div>

        <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6 sm:pt-10" aria-labelledby="steps-heading">
          <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center lg:gap-8">
            <div className="text-center sm:text-start">
              <p className="v2-kicker justify-center sm:justify-start">{t('Simple from the first tap', 'بسيط من أول ضغطة', '从第一次点击就很简单')}</p>
              <h2 id="steps-heading" className="v2-title mt-2 text-2xl sm:text-3xl">{t('Recharge in 3 steps', 'اشحن في 3 خطوات', '3 步完成充值')}</h2>
            </div>
            <ol data-v2-process-steps className="mt-5 grid grid-cols-3 gap-2 sm:gap-3 lg:mt-0">
              {steps.map((step, index) => (
                <li key={step.title} className="v2-step-card">
                  <span className="v2-step-number" aria-hidden="true">0{index + 1}</span>
                  <span className={`v2-icon-tile ${index === 0 ? 'v2-icon-tile-blue' : index === 1 ? 'v2-icon-tile-gold' : 'v2-icon-tile-green'}`}><step.icon className="h-5 w-5" /></span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold leading-4 text-[var(--v2-navy)] sm:text-sm">{step.title}</p>
                    <p className="mt-1 hidden text-xs leading-5 text-[var(--v2-muted)] sm:block">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="categories" className="scroll-mt-24 py-10 sm:py-16" aria-labelledby="categories-heading">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="v2-kicker">{t('Recharge categories', 'فئات الشحن', '充值分类')}</p>
                <h2 id="categories-heading" className="v2-title mt-3 text-[1.75rem] sm:text-4xl">{t('What would you like to recharge?', 'ماذا تريد أن تشحن؟', '您想充值什么？')}</h2>
                <p className="mt-3 text-[15px] leading-7 text-[var(--v2-muted)] sm:text-base">
                  {isAuthenticated
                    ? t('Choose a category to see the available balances and your local prices.', 'اختر فئة لرؤية الأرصدة المتاحة وأسعارك المحلية.', '选择分类以查看可用余额和本地价格。')
                    : t('Public prices open immediately. Protected categories ask you to log in first.', 'تظهر الأسعار العامة فوراً، وتطلب الفئات المحمية تسجيل الدخول أولاً.', '公开价格会立即显示，受保护分类会先要求登录。')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="v2-chip v2-chip-green">
                  <Banknote className="h-4 w-4" />
                  {t('Cash payment is currently available', 'الدفع النقدي متاح حالياً', '目前支持现金付款')}
                </span>
                {!isAccountLoading && !isAuthenticated && (
                  <span className="v2-chip v2-chip-pink">
                    <LockKeyhole className="h-4 w-4" />
                    {t('Some prices require login', 'بعض الأسعار تتطلب تسجيل الدخول', '部分价格需要登录')}
                  </span>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-live="polite">
                {[0, 1, 2].map((item) => <div key={item} className="v2-skeleton h-60 motion-reduce:animate-none" />)}
                <span className="sr-only">{t('Loading categories', 'جارٍ تحميل الفئات', '正在加载分类')}</span>
              </div>
            ) : categories.length > 0 ? (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category, index) => {
                  const content = localizedCategory(category);
                  const isAsiacell = category.slug === 'asiacell';
                  const fallbackAccent = isAsiacell ? '#ff6f91' : index % 2 ? '#ff98bc' : '#70dcff';
                  const canOpen = isAuthenticated || category.priceVisibility === 'PUBLIC';
                  return (
                    <Link
                      key={category.id}
                      href={categoryHref(category)}
                      data-testid="catalog-category-card"
                      className="v2-category-card group"
                      style={{ '--category-accent': category.accentColor || fallbackAccent } as CSSProperties}
                    >
                      <span className="relative z-10 flex min-w-0 flex-col items-start justify-center text-start">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[11px] font-bold text-[var(--v2-navy)] shadow-[var(--v2-shadow-xs)] backdrop-blur">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--category-accent)]" />
                          {t('{{count}} service', '{{count}} خدمة', '{{count}} 项服务').replace('{{count}}', String(category.productCount))}
                        </span>
                        <span className="v2-title mt-4 text-2xl sm:text-[1.75rem]">{content.name}</span>
                        <span className="mt-2 line-clamp-3 text-[13px] leading-6 text-[var(--v2-muted)] sm:text-sm">{content.description}</span>
                        <span className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--v2-navy)] px-4 text-xs font-bold text-white transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
                          {canOpen ? <Zap className="h-3.5 w-3.5 text-[var(--v2-gold)]" /> : <LockKeyhole className="h-3.5 w-3.5 text-[var(--v2-gold)]" />}
                          {canOpen
                            ? t('View prices', 'عرض الأسعار', '查看价格')
                            : t('Login and view', 'سجل الدخول واعرض', '登录并查看')}
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </span>
                      </span>
                      <span className="v2-category-art">
                        {/* Category images are configured by admins and may live on a managed CDN. */}
                        <img src={category.image} alt="" className={`h-full w-full object-contain ${isAsiacell ? 'p-1' : ''}`} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="v2-empty mt-8">
                <span className="v2-icon-tile v2-icon-tile-gold"><RefreshCw className="h-5 w-5" /></span>
                <p className="mt-4 text-base font-bold text-[var(--v2-navy)]">{hasError ? t('Categories could not be loaded.', 'تعذر تحميل الفئات.', '无法加载分类。') : t('No categories are available right now.', 'لا توجد فئات متاحة الآن.', '目前没有可用分类。')}</p>
                <p className="mt-1 text-sm text-[var(--v2-muted)]">{t('Check your connection and try again.', 'تحقق من الاتصال وحاول مرة أخرى.', '请检查网络后重试。')}</p>
                <button type="button" onClick={() => setLoadAttempt((value) => value + 1)} className="v2-secondary-button mt-5 min-h-11"><RefreshCw className="h-4 w-4" />{t('Try again', 'حاول مرة أخرى', '重试')}</button>
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6 sm:pb-16" aria-label={t('Service promises', 'وعود الخدمة', '服务承诺')}>
          <div className="v2-surface grid grid-cols-2 gap-y-1 px-3 py-3 sm:px-4 lg:grid-cols-4">
            {promises.map((item) => (
              <div key={item.title} className="v2-feature">
                <span className={`v2-icon-tile ${item.tone}`}><item.icon className="h-5 w-5" /></span>
                <div className="min-w-0"><h3 className="text-xs font-bold text-[var(--v2-navy)] sm:text-sm">{item.title}</h3><p className="mt-1 hidden text-xs leading-5 text-[var(--v2-muted)] sm:block">{item.body}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6 sm:pb-16" aria-labelledby="support-heading">
          <div className="v2-surface relative overflow-hidden p-6 sm:p-8 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
            <span aria-hidden="true" className="pointer-events-none absolute -end-16 -top-16 h-56 w-56 rounded-full bg-[var(--v2-gold)]/15 blur-3xl" />
            <div className="relative">
              <p className="v2-kicker">{t('WhatsApp support', 'دعم واتساب', 'WhatsApp 支持')}</p>
              <h2 id="support-heading" className="v2-title mt-3 text-2xl sm:text-3xl">{t('Questions? Message LEO on WhatsApp.', 'أسئلة؟ راسل ليو على واتساب.', '有疑问？在 WhatsApp 上联系 LEO。')}</h2>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-[var(--v2-muted)]">{t('Send your order ID and a short description. Never share a password or verification code.', 'أرسل رقم الطلب ووصفاً قصيراً. لا تشارك كلمة مرور أو رمز تحقق أبداً.', '发送订单号和简短说明。切勿分享密码或验证码。')}</p>
            </div>
            <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-0 lg:flex-col lg:items-stretch">
              <a href={supportWhatsAppHref} target="_blank" rel="noopener noreferrer" className="v2-primary-button min-h-12 bg-[linear-gradient(180deg,#34c76a_0%,#1f9d55_60%,#178a49_100%)] text-white shadow-[0_12px_26px_-10px_rgba(31,157,85,0.7)]">
                <MessageCircle className="h-4 w-4" />
                {t('Open WhatsApp', 'افتح واتساب', '打开 WhatsApp')}
              </a>
              <Link href="/help" className="v2-secondary-button min-h-12">
                {t('How it works', 'كيف يعمل', '如何操作')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="v2-footer pb-24 lg:pb-0">
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12">
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] lg:gap-12">
            <div>
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/15 bg-white shadow-[var(--v2-shadow-md)]"><Image src="/brand/alwasl-mark.jpg" alt="" fill className="object-contain p-1" sizes="48px" /></div>
                <div>
                  <p className="text-base font-bold tracking-tight">{t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}</p>
                  <p className="text-xs text-white/65">{t('Digital recharge for your country', 'شحن رقمي مناسب لبلدك', '适合您所在国家的数字充值')}</p>
                </div>
              </div>
              <p className="mt-5 hidden max-w-md text-sm leading-6 text-white/70 sm:block">
                {t('Registered company. Choose a category, see prices for your country, pay securely and track every order.', 'شركة مسجلة. اختر الفئة وشاهد أسعار بلدك وادفع بأمان وتابع كل طلب.', '正规注册企业。选择分类，查看您所在国家的价格，安全付款并跟踪每笔订单。')}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85"><ShieldCheck className="h-3.5 w-3.5 text-[var(--v2-gold)]" />{t('Secure confirmation', 'تأكيد آمن', '安全确认')}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85"><BadgeCheck className="h-3.5 w-3.5 text-[var(--v2-gold)]" />{t('Registered company', 'شركة مسجلة', '正规注册企业')}</span>
              </div>
            </div>

            <nav aria-label={t('Footer navigation', 'تنقل التذييل', '页脚导航')}>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/50">{t('Explore', 'استكشف', '探索')}</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:mt-4 sm:gap-y-2.5">
                {footerLinks.map((item) => (
                  <li key={item.href}><Link href={item.href} className="v2-footer-link inline-flex min-h-9 items-center">{item.label}</Link></li>
                ))}
              </ul>
            </nav>

            <a href={supportWhatsAppHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 items-center gap-3 self-start rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white transition-colors hover:bg-white/10">
              <span className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[var(--v2-gold)]/70"><Image src="/brand/leo-waho-agent.jpeg" alt="" fill className="object-cover object-[52%_27%]" sizes="32px" /></span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-bold">LEO <BadgeCheck className="h-3.5 w-3.5 text-[var(--v2-sky)]" /></span>
                <span className="block text-xs text-white/65" dir="ltr">{supportWhatsAppNumber}</span>
              </span>
              <MessageCircle className="h-5 w-5 text-[#4ade80]" />
            </a>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-white/55 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:pt-6">
            <p>© {new Date().getFullYear()} Al-Wasl Digital. {t('All rights reserved.', 'جميع الحقوق محفوظة.', '保留所有权利。')}</p>
            <p className="flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" />{t('Secure WhatsApp verification on every order', 'تحقق آمن عبر واتساب لكل طلب', '每笔订单均通过 WhatsApp 安全验证')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
