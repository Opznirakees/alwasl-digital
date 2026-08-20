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
import { PriceDisplay } from '@/components/pricing/PriceDisplay';
import { supportWhatsAppHref, supportWhatsAppNumber } from '@/config/contact';
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
        <div className="mx-auto max-w-[1280px] pb-0 sm:px-4 sm:pt-4">
          <HeroBanner banner={banners[0]} />
        </div>

        <section data-v2-steps-strip className="v2-light-band border-y border-[#d9e1ec] bg-white text-[#07152e] sm:mt-4" aria-labelledby="steps-heading">
          <div className="mx-auto max-w-[1280px] px-3 py-2 sm:px-4 sm:py-6 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:items-center lg:gap-7">
            <div className="text-center sm:text-start">
              <p className="hidden text-xs font-bold text-[#9b6800] sm:block">{t('How it works', 'كيف يعمل', '充值方法')}</p>
              <h2 id="steps-heading" className="text-base font-bold sm:mt-1 sm:text-3xl lg:text-2xl">
                {t('Top up in 3 steps', 'اشحن في 3 خطوات', '3 步完成充值')}
              </h2>
              <p className="mt-2 hidden text-sm leading-5 text-[#53627a] sm:block">
                {t('Your details stay visible until you confirm.', 'تبقى بياناتك واضحة حتى التأكيد.', '确认前信息始终可见。')}
              </p>
            </div>

            <ol data-v2-mobile-process-rail className="mt-2 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3 lg:mt-0">
              {steps.map((step) => (
                <li key={step.number} className="v2-process-item flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg border border-[#d9e1ec] bg-[#f7f9fc] px-1.5 py-1.5 text-center sm:min-h-20 sm:flex-row sm:justify-start sm:gap-3 sm:px-3 sm:py-3 sm:text-start">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-[#071b46] text-[#f7b928] sm:h-11 sm:w-11 sm:rounded-lg">
                    <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="hidden text-xs font-bold text-[#9b6800] sm:block">
                      {t('Step {{number}}', 'الخطوة {{number}}', '第 {{number}} 步').replace('{{number}}', String(step.number))}
                    </p>
                    <h3 className="line-clamp-2 text-[11px] font-bold leading-3.5 text-[#07152e] sm:mt-0.5 sm:text-base sm:leading-normal">{step.title}</h3>
                    <p className="mt-1 hidden text-sm leading-5 text-[#53627a] sm:block">{step.body}</p>
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
          className="v2-amount-stage scroll-mt-20 py-4 text-white sm:py-12"
        >
          <div className="mx-auto max-w-[1280px] px-3 sm:px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="v2-kicker">{t('WAHO balance packages', 'باقات رصيد WAHO', 'WAHO 余额套餐')}</p>
              <h2 id="amount-heading" className="mt-1 text-[1.45rem] font-bold leading-tight text-white sm:mt-2 sm:text-4xl">
                {t('Choose your WAHO balance', 'اختر رصيد WAHO', '选择 WAHO 余额')}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-[#b8c5db] sm:mt-3 sm:text-sm sm:leading-6">
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
              <div className={`mt-4 grid gap-4 sm:mt-6 ${dir === 'rtl' ? 'lg:grid-cols-[240px_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)_240px]'}`}>
                <div data-v2-package-grid data-v2-package-rail className="scrollbar-hide -mx-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-5">
                  {topUpPackages.map((pkg) => {
                    const amount = formatAmount(pkg.amount);
                    return (
                      <Link
                        key={pkg.id}
                        data-testid="home-package-card"
                        href={`/top-up/${wahoTopUp?.slug ?? 'waho-top-up'}?amount=${pkg.amount}`}
                        aria-label={t('Choose {{amount}} IQD', 'اختر {{amount}} د.ع', '选择 {{amount}} IQD').replace('{{amount}}', amount)}
                        className={`v2-package-card v2-mobile-package-card group relative flex min-h-[214px] w-[calc((100vw-2rem)/3)] min-w-[108px] max-w-[120px] snap-start flex-col overflow-hidden rounded-lg border bg-[#06152f] p-2 text-center text-white shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition-colors hover:border-[#f7b928] hover:bg-[#0a2148] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b928] focus-visible:ring-offset-2 focus-visible:ring-offset-[#020817] sm:min-h-64 sm:w-auto sm:min-w-0 sm:max-w-none sm:p-3.5 ${
                          pkg.isPopular ? 'border-[#f7b928]/80 bg-[#08204a]' : 'border-[#f7b928]/38'
                        }`}
                      >
                        {pkg.isPopular && (
                          <span className="absolute end-1 top-1 rounded bg-[#f7b928] px-1 py-0.5 text-[8px] font-bold text-[#07152e] sm:end-2 sm:top-2 sm:rounded-full sm:px-2 sm:py-1 sm:text-[10px]">
                            <span className="sm:hidden">★</span>
                            <span className="hidden sm:inline">{t('Popular', 'الأكثر اختياراً', '热门')}</span>
                          </span>
                        )}
                        <div className="relative z-10 flex min-h-[60px] flex-col items-center justify-center gap-1 sm:min-h-[76px] sm:gap-2">
                          <span className="v2-package-card-app-icon relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-white/12 bg-[#020817] sm:h-12 sm:w-12 sm:rounded-lg">
                            <Image
                              data-visual-required-image
                              src="/brand/waho-app-icon.webp"
                              alt=""
                              fill
                              className="object-cover"
                              sizes="(max-width: 639px) 40px, 48px"
                            />
                          </span>
                          <span className="text-[10px] font-bold text-[#57e7cf] sm:text-xs">WAHO</span>
                        </div>
                        <div className="relative z-10 mt-1 sm:mt-2">
                          <span className="block text-[1.05rem] font-bold leading-none tabular-nums text-white sm:text-[1.7rem]">{amount}</span>
                          <span className="v2-package-card-balance mt-1.5 inline-flex items-center justify-center gap-1 text-[9px] font-semibold text-[#b8c5db] sm:mt-2 sm:gap-1.5 sm:text-xs">
                            <Gem className="h-3.5 w-3.5 text-[#4e9cff] sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">{t('WAHO balance', 'رصيد WAHO', 'WAHO 余额')}</span>
                            <span className="sm:hidden">{t('Balance', 'رصيد', '余额')}</span>
                          </span>
                        </div>
                        <div className="relative z-10 mt-auto pt-2 sm:pt-3">
                          <span className="block text-[9px] text-[#b8c5db] sm:text-[11px]">{t('You pay', 'تدفع', '您支付')}</span>
                          <PriceDisplay
                            amountIqd={pkg.salePrice || pkg.basePrice}
                            align="center"
                            compact
                            primaryClassName="text-[11px] font-bold text-[#f7b928] sm:text-sm"
                            secondaryClassName="text-[#dbe5f6]"
                          />
                          <span className="mt-2 flex min-h-8 items-center justify-center gap-1 rounded-md bg-[#f7b928] px-1 text-[10px] font-bold text-[#07152e] group-hover:bg-[#ffd05a] sm:mt-2.5 sm:min-h-9 sm:gap-1.5 sm:px-2 sm:text-xs">
                            <span className="sm:hidden">{t('Choose', 'اختر', '选择')}</span>
                            <span className="hidden sm:inline">{t('Choose amount', 'اختر المبلغ', '选择金额')}</span>
                            <ArrowRight className="h-3 w-3 rtl:rotate-180 sm:h-3.5 sm:w-3.5" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <aside data-v2-leo-mobile className={`v2-leo-panel v2-mobile-leo-panel relative flex min-h-[148px] items-center gap-3 overflow-hidden rounded-lg border border-[#f7b928]/45 bg-[#06152f] p-3 text-start shadow-[0_18px_42px_rgba(0,0,0,0.22)] sm:min-h-64 sm:flex-col sm:justify-center sm:gap-0 sm:p-5 sm:text-center ${dir === 'rtl' ? 'lg:-order-1' : ''}`}>
                  <div className="relative h-20 w-20 flex-none overflow-hidden rounded-full border-[3px] border-[#f7b928] bg-[#020817] sm:h-24 sm:w-24 sm:border-4">
                    <Image data-visual-required-image src="/brand/leo-waho-agent.jpeg" alt="" fill priority unoptimized className="object-cover object-[52%_27%]" sizes="96px" />
                  </div>
                  <div className="min-w-0 flex-1 sm:flex sm:flex-col sm:items-center">
                    <p className="flex items-center gap-1.5 text-xl font-bold text-[#f7b928] sm:mt-3 sm:gap-2 sm:text-2xl">
                      LEO <BadgeCheck className="h-4 w-4 text-[#4e9cff] sm:h-5 sm:w-5" />
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-white sm:mt-1 sm:text-sm">
                      {t('WAHO top-up contact', 'جهة التواصل لشحن WAHO', 'WAHO 充值联系人')}
                    </p>
                    <p className="mt-1.5 line-clamp-2 max-w-[220px] text-[10px] leading-4 text-[#b8c5db] sm:mt-3 sm:text-xs sm:leading-5">
                      {t('Send your WAHO ID or order ID when you need help.', 'أرسل معرف WAHO أو رقم الطلب عندما تحتاج للمساعدة.', '需要帮助时，请发送 WAHO ID 或订单号。')}
                    </p>
                    <a href={supportWhatsAppHref} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-[#f7b928] px-3 text-[11px] font-bold text-[#07152e] hover:bg-[#ffd05a] sm:mt-4 sm:min-h-12 sm:w-full sm:text-sm">
                      <MessageCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {t('Ask LEO', 'اسأل LEO', '联系 LEO')}
                    </a>
                  </div>
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
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-0 px-3 py-3 sm:px-4 sm:py-4 lg:grid-cols-4">
            {serviceItems.map((item) => (
              <div key={item.title} className="flex min-h-[76px] items-center gap-2 border-[#d9e1ec] px-2 py-2.5 lg:min-h-20 lg:gap-3 lg:border-e lg:px-3 lg:py-3 last:lg:border-e-0">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[#071b46] text-[#f7b928] sm:h-11 sm:w-11 sm:rounded-lg">
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="line-clamp-2 text-[11px] font-bold leading-4 text-[#07152e] sm:text-sm">{item.title}</h3>
                  <p className="mt-1 hidden text-xs leading-5 text-[#53627a] sm:block">{item.body}</p>
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
