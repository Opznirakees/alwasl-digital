'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Gem,
  Headphones,
  Loader2,
  MessageCircle,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react';
import { HeroBanner } from '@/components/home/HeroBanner';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { supportWhatsAppHref, supportWhatsAppNumber } from '@/config/contact';
import { useApp } from '@/contexts/AppContext';
import type { Banner, Game } from '@/types';

export default function HomePage() {
  const { t, dir, language, selectedCountry, formatLocalAmount } = useApp();
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
      title: t('Choose balance', 'اختر الرصيد', '选择余额'),
      body: t('Tap the amount you want.', 'اضغط على المبلغ الذي تريده.', '点击您需要的金额。'),
    },
    {
      icon: UserRoundCheck,
      number: '2',
      title: t('Check WAHO ID', 'تحقق من معرف WAHO', '检查 WAHO ID'),
      body: t('Confirm the right account.', 'أكد الحساب الصحيح.', '确认正确的账号。'),
    },
    {
      icon: ReceiptText,
      number: '3',
      title: t('Confirm order', 'أكد الطلب', '确认订单'),
      body: t('Pay and keep the order ID.', 'ادفع واحتفظ برقم الطلب.', '付款并保存订单号。'),
    },
  ];

  const serviceItems = [
    {
      icon: CreditCard,
      title: t('Pay from your wallet', 'ادفع من محفظتك', '使用钱包付款'),
      body: t('See your balance and total before you confirm.', 'شاهد رصيدك والإجمالي قبل التأكيد.', '确认前查看钱包余额和总价。'),
    },
    {
      icon: ShieldCheck,
      title: t('Protected confirmation', 'تأكيد محمي', '安全确认'),
      body: t('A WhatsApp code protects the order.', 'يحمي رمز واتساب الطلب.', '使用 WhatsApp 验证码保护订单。'),
    },
    {
      icon: ReceiptText,
      title: t('Track your order', 'تتبع طلبك', '跟踪订单'),
      body: t('Use one clear order ID.', 'استخدم رقم طلب واضحاً.', '使用清晰的订单号。'),
    },
    {
      icon: Headphones,
      title: t('Help from LEO', 'مساعدة من LEO', 'LEO 为您提供帮助'),
      body: t('Send your ID on WhatsApp.', 'أرسل معرفك عبر واتساب.', '通过 WhatsApp 发送您的 ID。'),
    },
  ];

  return (
    <div data-v2-home className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main>
        <div className="mx-auto max-w-[1280px] px-3 pb-0 pt-3 sm:px-4 sm:pt-5">
          <HeroBanner banner={banners[0]} />
        </div>

        <section data-v2-steps-strip className="v2-light-band mt-3 border-y border-[#d9e1ec] bg-white text-[#07152e] sm:mt-4" aria-labelledby="steps-heading">
          <div className="mx-auto max-w-[1280px] px-4 py-5 sm:py-6 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-center lg:gap-7">
            <div>
              <p className="text-xs font-bold text-[#9b6800]">{t('How it works', 'كيف يعمل', '充值方法')}</p>
              <h2 id="steps-heading" className="mt-1 text-2xl font-bold sm:text-3xl lg:text-2xl">
                {t('Top up in 3 steps', 'اشحن في 3 خطوات', '3 步完成充值')}
              </h2>
              <p className="mt-2 text-sm leading-5 text-[#53627a]">
                {t('Your details stay visible until you confirm.', 'تبقى بياناتك واضحة حتى التأكيد.', '确认前信息始终可见。')}
              </p>
            </div>

            <ol className="mt-5 grid gap-3 md:grid-cols-3 lg:mt-0">
              {steps.map((step) => (
                <li key={step.number} className="v2-process-item flex min-h-20 items-center gap-3 rounded-lg border border-[#d9e1ec] bg-[#f7f9fc] px-3 py-3">
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#071b46] text-[#f7b928]">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#9b6800]">
                      {t(`Step ${step.number}`, `الخطوة ${step.number}`, `第 ${step.number} 步`)}
                    </p>
                    <h3 className="mt-0.5 font-bold text-[#07152e]">{step.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-[#53627a]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="amounts"
          data-v2-amount-stage
          aria-labelledby="amount-heading"
          className="v2-amount-stage scroll-mt-20 py-10 text-white sm:py-12"
        >
          <div className="mx-auto max-w-[1280px] px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="v2-kicker">{t('WAHO balance packages', 'باقات رصيد WAHO', 'WAHO 余额套餐')}</p>
              <h2 id="amount-heading" className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                {t('Choose your WAHO balance', 'اختر رصيد WAHO', '选择 WAHO 余额')}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#b8c5db]">
                {t('Tap one amount to continue. You can change it in the next step.', 'اضغط على مبلغ للمتابعة. يمكنك تغييره في الخطوة التالية.', '点击一个金额继续，下一步仍可更改。')}
              </p>
            </div>

            {isLoadingHome ? (
              <div className="mt-7" role="status" aria-live="polite">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#b8c5db]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#f7b928] motion-reduce:animate-none" />
                  {t('Checking available amounts...', 'جارٍ التحقق من المبالغ المتاحة...', '正在查看可用金额...')}
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((item) => (
                    <div key={item} className="h-64 animate-pulse rounded-lg border border-white/10 bg-[#06152f] motion-reduce:animate-none" />
                  ))}
                </div>
              </div>
            ) : topUpPackages.length > 0 ? (
              <div className={`mt-6 grid gap-4 ${dir === 'rtl' ? 'lg:grid-cols-[240px_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_240px]'}`}>
                <div data-v2-package-grid className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
                  {topUpPackages.map((pkg) => {
                    const amount = formatAmount(pkg.amount);
                    const price = formatLocalAmount(pkg.salePrice || pkg.basePrice);
                    return (
                      <Link
                        key={pkg.id}
                        data-testid="home-package-card"
                        href={`/top-up/${wahoTopUp?.slug ?? 'waho-top-up'}?amount=${pkg.amount}`}
                        aria-label={t(`Choose ${amount} IQD`, `اختر ${amount} د.ع`, `选择 ${amount} IQD`)}
                        className={`v2-package-card group relative flex min-h-64 flex-col overflow-hidden rounded-lg border bg-[#06152f] p-3.5 text-center text-white shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition-colors hover:border-[#f7b928] hover:bg-[#0a2148] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817] ${
                          pkg.isPopular ? 'border-[#f7b928]/80 bg-[#08204a]' : 'border-[#f7b928]/38'
                        } ${
                          topUpPackages.length % 2 === 1
                            ? 'last:col-span-2 last:mx-auto last:w-[calc(50%-0.3125rem)] sm:last:col-span-1 sm:last:w-full'
                            : ''
                        }`}
                      >
                        {pkg.isPopular && (
                          <span className="absolute end-2 top-2 rounded-full bg-[#f7b928] px-2 py-1 text-[10px] font-bold text-[#07152e]">
                            {t('Popular', 'الأكثر اختياراً', '热门')}
                          </span>
                        )}
                        <div className="relative z-10 flex min-h-[76px] flex-col items-center justify-center gap-2">
                          <span className="v2-package-card-app-icon relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-white/12 bg-[#020817]">
                            <Image
                              data-visual-required-image
                              src="/brand/waho-app-icon.webp"
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </span>
                          <span className="text-xs font-bold text-[#57e7cf]">WAHO</span>
                        </div>
                        <div className="relative z-10 mt-2">
                          <span className="block text-2xl font-bold leading-none tabular-nums text-white sm:text-[1.7rem]">{amount}</span>
                          <span className="v2-package-card-balance mt-2 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#b8c5db]">
                            <Gem className="h-4 w-4 text-[#4e9cff]" />
                            {t('WAHO balance', 'رصيد WAHO', 'WAHO 余额')}
                          </span>
                        </div>
                        <div className="relative z-10 mt-auto pt-3">
                          <span className="block text-[11px] text-[#b8c5db]">{t('You pay', 'تدفع', '您支付')}</span>
                          <span className="mt-1 block text-sm font-bold tabular-nums text-[#f7b928]">{price}</span>
                          <span className="mt-2.5 flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-[#f7b928] px-2 text-xs font-bold text-[#07152e] group-hover:bg-[#ffd05a]">
                            {t('Choose amount', 'اختر المبلغ', '选择金额')}
                            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <aside className={`v2-leo-panel relative flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-lg border border-[#f7b928]/45 bg-[#06152f] p-5 text-center shadow-[0_18px_42px_rgba(0,0,0,0.22)] ${dir === 'rtl' ? 'lg:-order-1' : ''}`}>
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-[#f7b928] bg-[#020817]">
                    <Image data-visual-required-image src="/brand/leo-waho-agent.jpeg" alt="" fill priority unoptimized className="object-cover object-[52%_27%]" sizes="96px" />
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-2xl font-bold text-[#f7b928]">
                    LEO <BadgeCheck className="h-5 w-5 text-[#4e9cff]" />
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {t('WAHO top-up contact', 'جهة التواصل لشحن WAHO', 'WAHO 充值联系人')}
                  </p>
                  <p className="mt-3 max-w-[220px] text-xs leading-5 text-[#b8c5db]">
                    {t('Send your WAHO ID or order ID when you need help.', 'أرسل معرف WAHO أو رقم الطلب عندما تحتاج للمساعدة.', '需要帮助时，请发送 WAHO ID 或订单号。')}
                  </p>
                  <a href={supportWhatsAppHref} target="_blank" rel="noopener noreferrer" className="v2-primary-button mt-4 w-full">
                    <MessageCircle className="h-4 w-4" />
                    {t('Ask LEO', 'اسأل LEO', '联系 LEO')}
                  </a>
                </aside>
              </div>
            ) : (
              <div className="mt-7 flex flex-col gap-4 rounded-lg border border-white/12 bg-[#06152f] p-5 text-sm text-[#b8c5db] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-white">
                    {homeError ? t('Amounts could not be loaded', 'تعذر تحميل المبالغ', '无法加载金额') : t('No amounts are available right now', 'لا توجد مبالغ متاحة الآن', '目前没有可用金额')}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#b8c5db]">{t('Try again before starting your top-up.', 'حاول مرة أخرى قبل بدء الشحن.', '开始充值前请重试。')}</p>
                </div>
                <Button type="button" variant="outline" onClick={() => setLoadAttempt((value) => value + 1)} className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                  <RefreshCw className="h-4 w-4" />
                  {t('Try again', 'حاول مرة أخرى', '重试')}
                </Button>
              </div>
            )}
          </div>
        </section>

        <section data-v2-service-strip aria-label={t('Service promises', 'وعود الخدمة', '服务承诺')} className="v2-service-strip relative border-y border-[#d9e1ec] bg-white text-[#07152e]">
          <div className="mx-auto grid max-w-[1280px] gap-0 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
            {serviceItems.map((item) => (
              <div key={item.title} className="flex min-h-20 items-center gap-3 border-[#d9e1ec] px-3 py-3 lg:border-e last:lg:border-e-0">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-[#071b46] text-[#f7b928]">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#07152e]">{item.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#53627a]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="border-t border-[#f7b928]/20 bg-[#020817] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-6 px-4 py-6 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-white/15 bg-white">
                <Image src="/brand/alwasl-mark.jpg" alt="" fill className="object-contain p-1" sizes="44px" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}</p>
                <p className="text-xs text-[#b8c5db]">{t('WAHO balance top-ups', 'شحن رصيد WAHO', 'WAHO 余额充值')}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#b8c5db]">
              {t('Choose the balance, check the account, and follow the order clearly.', 'اختر الرصيد وتحقق من الحساب وتابع الطلب بوضوح.', '选择余额，检查账号，并清楚跟踪订单。')}
            </p>
            <a href={supportWhatsAppHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#f7b928] hover:text-[#ffd05a]">
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp</span>
              <span dir="ltr">{supportWhatsAppNumber}</span>
            </a>
          </div>
          <nav aria-label={t('Footer links', 'روابط التذييل', '页脚链接')} className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-[#b8c5db] sm:grid-cols-3">
            <Link href="/top-up/waho-top-up" className="hover:text-[#f7b928]">{t('Top up', 'اشحن', '充值')}</Link>
            <Link href="/orders" className="hover:text-[#f7b928]">{t('Orders', 'الطلبات', '订单')}</Link>
            <Link href="/help" className="hover:text-[#f7b928]">{t('Help', 'مساعدة', '帮助')}</Link>
            <Link href="/contact" className="hover:text-[#f7b928]">{t('Contact', 'اتصل بنا', '联系我们')}</Link>
            <Link href="/terms" className="hover:text-[#f7b928]">{t('Terms', 'الشروط', '条款')}</Link>
            <Link href="/privacy" className="hover:text-[#f7b928]">{t('Privacy', 'الخصوصية', '隐私')}</Link>
          </nav>
        </div>
        <div className="mx-auto max-w-[1280px] border-t border-white/10 px-4 py-3 text-xs text-white/45">
          © 2026 Al-Wasl Digital Services. {t('All rights reserved.', 'جميع الحقوق محفوظة.', '保留所有权利。')}
        </div>
      </footer>
    </div>
  );
}
