'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Headphones,
  Loader2,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { supportWhatsAppHref } from '@/config/contact';
import { useApp } from '@/contexts/AppContext';
import type { Banner, Game } from '@/types';

export default function HomePage() {
  const { t, dir, language, selectedCountry } = useApp();
  const [wahoTopUp, setWahoTopUp] = useState<Game | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoadingHome, setIsLoadingHome] = useState(true);
  const [homeError, setHomeError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const topUpPackages = wahoTopUp?.packages.filter((item) => item.inStock) ?? [];
  const formatAmount = (amount: number) => new Intl.NumberFormat(locale).format(amount);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    async function loadHomeData() {
      setIsLoadingHome(true);
      setHomeError(false);
      try {
        const bannersRequest = Promise.race([
          fetch('/api/banners'),
          new Promise<Response>((_, reject) => {
            controller.signal.addEventListener('abort', () => reject(new Error('REQUEST_TIMEOUT')), { once: true });
          }),
        ]);
        const [productResponse, bannersResponse] = await Promise.all([
          fetch(`/api/products/waho-top-up?country=${selectedCountry.id}`, { signal: controller.signal }),
          bannersRequest,
        ]);
        const [productPayload, bannersPayload] = await Promise.all([
          productResponse.ok ? productResponse.json() : Promise.resolve(null),
          bannersResponse.ok ? bannersResponse.json() : Promise.resolve(null),
        ]);

        if (!active) return;
        setWahoTopUp(productPayload?.product ?? null);
        setBanners(bannersPayload?.banners ?? []);
        setHomeError(!productPayload?.product);
      } catch {
        if (!active) return;
        setWahoTopUp(null);
        setBanners([]);
        setHomeError(true);
      } finally {
        window.clearTimeout(timeoutId);
        if (active) setIsLoadingHome(false);
      }
    }

    void loadHomeData();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [selectedCountry.id, loadAttempt]);

  const steps = [
    {
      icon: WalletCards,
      number: '1',
      title: t('Choose an amount', 'اختر المبلغ', '选择金额'),
      body: t('Tap the balance you want to add.', 'اضغط على الرصيد الذي تريد إضافته.', '点击您想充值的金额。'),
    },
    {
      icon: UserRoundCheck,
      number: '2',
      title: t('Check the WAHO ID', 'تحقق من معرف WAHO', '检查 WAHO ID'),
      body: t('Enter the ID and check the account name.', 'أدخل المعرف وتحقق من اسم الحساب.', '输入 ID 并核对账号名称。'),
    },
    {
      icon: CreditCard,
      number: '3',
      title: t('Pay and follow', 'ادفع وتابع', '付款并跟踪'),
      body: t('Pay, then follow the order with its order ID.', 'ادفع ثم تابع الطلب باستخدام رقمه.', '付款后使用订单号跟踪。'),
    },
  ];

  return (
    <div className={`min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto space-y-14 px-4 py-4 sm:py-6 md:space-y-20 md:py-8">
        <HeroBanner banner={banners[0]} />

        <section aria-labelledby="amount-heading">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                {t('Start here', 'ابدأ من هنا', '从这里开始')}
              </p>
              <h2 id="amount-heading" className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white sm:text-3xl">
                {t('How much WAHO balance do you need?', 'كم تحتاج من رصيد WAHO؟', '您需要充值多少 WAHO 余额？')}
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {t('Choose now. You can still change the amount on the next screen.', 'اختر الآن. يمكنك تغيير المبلغ في الشاشة التالية.', '现在选择，下一页仍可更改金额。')}
            </p>
          </div>

          {isLoadingHome ? (
            <div className="mt-6" role="status" aria-live="polite">
              <p className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600 motion-reduce:animate-none" />
                {t('Checking available amounts...', 'جارٍ التحقق من المبالغ المتاحة...', '正在查看可用金额...')}
              </p>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 10rem), 1fr))' }}>
                {[1, 2, 3, 4, 5].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg bg-white motion-reduce:animate-none dark:bg-zinc-900" />)}
              </div>
            </div>
          ) : topUpPackages.length > 0 ? (
            <div className="mt-6 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 10rem), 1fr))' }}>
              {topUpPackages.map((pkg) => {
                const amount = formatAmount(pkg.amount);
                return (
                  <Link
                    key={pkg.id}
                    href={`/top-up/${wahoTopUp?.slug ?? 'waho-top-up'}?amount=${pkg.amount}`}
                    aria-label={t(`Choose ${amount} IQD`, `اختر ${amount} د.ع`, `选择 ${amount} IQD`)}
                    className="group relative flex min-h-28 flex-col justify-between rounded-lg border border-black/10 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-zinc-900 dark:hover:border-blue-400 dark:hover:bg-blue-500/10"
                  >
                    {pkg.isPopular && (
                      <span className="absolute end-3 top-3 rounded-full bg-[#ffd33d] px-2 py-1 text-[10px] font-semibold text-[#071b46]">
                        {t('Popular', 'الأكثر اختياراً', '热门')}
                      </span>
                    )}
                    <span className="text-2xl font-semibold tabular-nums text-zinc-950 dark:text-white">{amount}</span>
                    <span className="mt-4 inline-flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
                      IQD
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4 rounded-lg border border-black/10 bg-white p-5 text-sm text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-zinc-950 dark:text-white">{homeError ? t('Amounts could not be loaded', 'تعذر تحميل المبالغ', '无法加载金额') : t('No amounts are available right now', 'لا توجد مبالغ متاحة الآن', '目前没有可用金额')}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{t('Try again before starting your top-up.', 'حاول مرة أخرى قبل بدء الشحن.', '开始充值前请重试。')}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setLoadAttempt((value) => value + 1)}>
                <RefreshCw className="h-4 w-4" />
                {t('Try again', 'حاول مرة أخرى', '重试')}
              </Button>
            </div>
          )}
        </section>

        <section aria-labelledby="steps-heading">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {t('Three simple steps', 'ثلاث خطوات بسيطة', '简单三步')}
            </p>
            <h2 id="steps-heading" className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white sm:text-3xl">
              {t('You always know what comes next', 'تعرف دائماً ما هي الخطوة التالية', '每一步都清楚明白')}
            </h2>
          </div>

          <ol className="mt-7 grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-zinc-400 dark:text-zinc-500">
                    {t(`Step ${step.number}`, `الخطوة ${step.number}`, `第 ${step.number} 步`)}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-zinc-950 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1fr_auto] md:items-center md:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#eaf8ee] text-[#1f8f3a] dark:bg-[#34c759]/15 dark:text-[#52d273]">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">
                {t('Need help from LEO?', 'تحتاج مساعدة من LEO؟', '需要 LEO 的帮助？')}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {t('Send your WAHO ID or order ID on WhatsApp. We will help you find the next step.', 'أرسل معرف WAHO أو رقم الطلب عبر واتساب وسنساعدك في الخطوة التالية.', '通过 WhatsApp 发送 WAHO ID 或订单号，我们会帮助您完成下一步。')}
              </p>
            </div>
          </div>
          <a
            href={supportWhatsAppHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#1f8f3a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#187631] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34c759] focus-visible:ring-offset-2 dark:ring-offset-zinc-900"
          >
            <MessageCircle className="h-4 w-4" />
            {t('Chat on WhatsApp', 'تواصل عبر واتساب', 'WhatsApp 咨询')}
          </a>
        </section>

        <section aria-label={t('Service promises', 'وعود الخدمة', '服务承诺')} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: t('Checked first', 'فحص أولاً', '先检查'), body: t('We check the WAHO account before payment.', 'نفحص حساب WAHO قبل الدفع.', '付款前检查 WAHO 账号。') },
            { icon: BadgeCheck, title: t('Clear order status', 'حالة طلب واضحة', '订单状态清晰'), body: t('Follow every top-up with an order ID.', 'تابع كل شحن باستخدام رقم الطلب.', '使用订单号跟踪每次充值。') },
            { icon: Headphones, title: t('Real support', 'دعم حقيقي', '真人客服'), body: t('WhatsApp help when something needs attention.', 'مساعدة عبر واتساب عند الحاجة.', '需要时可通过 WhatsApp 获得帮助。') },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3 rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700 dark:text-blue-300" />
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">{item.body}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="mt-16 border-t border-black/10 bg-white dark:border-white/10 dark:bg-zinc-900 md:mt-24">
        <div className="container mx-auto grid gap-8 px-4 py-9 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-black/10 bg-white">
                <Image src="/brand/alwasl-mark.jpg" alt="" fill className="object-contain p-1" sizes="40px" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">{t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('WAHO balance top-ups', 'شحن رصيد WAHO', 'WAHO 余额充值')}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {t('Simple WAHO top-ups with clear amounts, order tracking, and WhatsApp support.', 'شحن WAHO ببساطة مع مبالغ واضحة وتتبع للطلب ودعم واتساب.', '简单的 WAHO 充值，金额清晰，可跟踪订单并提供 WhatsApp 支持。')}
            </p>
          </div>

          <nav aria-label={t('Footer links', 'روابط التذييل', '页脚链接')} className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-3">
            <Link href="/top-up/waho-top-up" className="flex min-h-11 items-center text-zinc-600 hover:text-blue-700 dark:text-zinc-300 dark:hover:text-blue-300">{t('Top up', 'اشحن', '充值')}</Link>
            <Link href="/orders" className="flex min-h-11 items-center text-zinc-600 hover:text-blue-700 dark:text-zinc-300 dark:hover:text-blue-300">{t('Orders', 'الطلبات', '订单')}</Link>
            <Link href="/help" className="flex min-h-11 items-center text-zinc-600 hover:text-blue-700 dark:text-zinc-300 dark:hover:text-blue-300">{t('Help', 'مساعدة', '帮助')}</Link>
            <Link href="/contact" className="flex min-h-11 items-center text-zinc-600 hover:text-blue-700 dark:text-zinc-300 dark:hover:text-blue-300">{t('Contact', 'تواصل', '联系')}</Link>
            <Link href="/terms" className="flex min-h-11 items-center text-zinc-600 hover:text-blue-700 dark:text-zinc-300 dark:hover:text-blue-300">{t('Terms', 'الشروط', '条款')}</Link>
            <Link href="/privacy" className="flex min-h-11 items-center text-zinc-600 hover:text-blue-700 dark:text-zinc-300 dark:hover:text-blue-300">{t('Privacy', 'الخصوصية', '隐私')}</Link>
          </nav>
        </div>
        <div className="container mx-auto border-t border-black/10 px-4 py-5 text-xs text-zinc-400 dark:border-white/10 dark:text-zinc-500">
          © 2026 {t('Al-Wasl Digital Services. All rights reserved.', 'الوصل للخدمات الإلكترونية. جميع الحقوق محفوظة.', 'Al-Wasl 数字服务。版权所有。')}
        </div>
      </footer>
    </div>
  );
}
