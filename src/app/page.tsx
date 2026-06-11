'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { HeroBanner } from '@/components/home/HeroBanner';
import { games } from '@/data/mock-data';
import { wahoShowcaseImages } from '@/data/waho-images';
import {
  ArrowRight,
  Zap,
  BadgeCheck,
  CheckCircle2,
  Headphones,
  MessageCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function HomePage() {
  const { t, dir, language } = useApp();
  const wahoTopUp = games[0];
  const topUpPackages = wahoTopUp.packages.filter((pkg) => pkg.inStock);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const formatAmount = (amount: number) => new Intl.NumberFormat(locale).format(amount);

  return (
    <div className={`min-h-screen ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-5 md:py-8 space-y-9 md:space-y-12">
        {/* Hero Banner */}
        <HeroBanner />

        <section className="grid items-center gap-6 md:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-2xl">
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
              {t('Recognized on WAHO', 'معروف على WAHO', 'WAHO 知名用户')}
            </div>
            <h2 className="mt-4 text-2xl font-semibold leading-tight text-zinc-950 dark:text-white md:text-3xl">
              {t('LEO, the trusted face behind these WAHO top-ups', 'LEO، الوجه الموثوق خلف شحن WAHO', 'LEO，WAHO 充值背后的可信面孔')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-600 dark:text-zinc-300 md:text-base">
              {t(
                'Customers who know LEO on WAHO can recognize the service immediately: clear amounts, quick support, and a focused top-up experience.',
                'العملاء الذين يعرفون LEO على WAHO يتعرفون على الخدمة فوراً: مبالغ واضحة ودعم سريع وتجربة شحن مركزة.',
                '熟悉 WAHO 上 LEO 的用户可以立即识别这项服务：金额清晰、支持快速、充值体验专注。'
              )}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
              {[
                t('Verified WAHO presence', 'حضور موثق على WAHO', 'WAHO 认证形象'),
                t('Fast recharge support', 'دعم شحن سريع', '快速充值支持'),
                t('Clear IQD top-up values', 'مبالغ شحن واضحة بالدينار', '清晰 IQD 充值金额'),
              ].map((item) => (
                <span key={item} className="rounded-md border border-black/10 bg-white px-3 py-2 text-zinc-600 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-300">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <figure className="order-first min-w-0 md:order-none">
            <div className="relative aspect-[1200/921] overflow-hidden rounded-lg border border-black/10 bg-zinc-950 shadow-sm dark:border-white/10">
              <Image
                src="/brand/leo-waho-agent.jpeg"
                alt={t('LEO trusted WAHO top-up agent', 'LEO وكيل شحن WAHO الموثوق', 'LEO 可信 WAHO 充值代理')}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 90vw, 100vw"
              />
              <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-md border border-white/15 bg-zinc-950/78 px-3 py-3 text-white backdrop-blur">
                <div>
                  <p className="text-lg font-semibold leading-none">LEO</p>
                  <p className="mt-1 text-xs text-white/70">
                    {t('WAHO top-up contact', 'جهة شحن WAHO', 'WAHO 充值联系人')}
                  </p>
                </div>
                <span className="rounded-md bg-[#ffcc00] px-2.5 py-1 text-xs font-semibold text-zinc-950">
                  {t('Trusted', 'موثوق', '可信赖')}
                </span>
              </div>
            </div>
            <figcaption className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {t('LEO is highlighted as a familiar WAHO user and trusted top-up contact.', 'يظهر LEO كمستخدم معروف على WAHO وجهة موثوقة للشحن.', 'LEO 被展示为 WAHO 熟悉用户和可信充值联系人。')}
            </figcaption>
          </figure>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 overflow-hidden rounded-lg border border-black/10 bg-white md:grid-cols-4">
          {[
            { icon: <BadgeCheck className="w-4 h-4" />, label: t('High Quality', 'جودة عالية'), value: t('Trusted', 'موثوق') },
            { icon: <Zap className="w-4 h-4" />, label: t('Fast top-up', 'شحن سريع'), value: t('Quick', 'سريع') },
            { icon: <Sparkles className="w-4 h-4" />, label: t('Competitive Prices', 'أسعار تنافسية'), value: t('Fair', 'مناسبة') },
            { icon: <Headphones className="w-4 h-4" />, label: t('Technical Support', 'دعم فني'), value: '24/7' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`border-black/10 p-4 ${i % 2 === 1 ? 'border-l' : ''} ${i > 1 ? 'border-t' : ''} ${i > 0 ? 'md:border-l' : ''} md:border-t-0`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-50 text-blue-600">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-950">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-5">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-zinc-950">
              {t('WAHO top-up flow', 'مسار شحن WAHO', 'WAHO 充值流程')}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {t(
                'The flow stays focused on one task: confirm the WAHO account and complete the top-up clearly.',
                'يبقى المسار مركزاً على مهمة واحدة: تأكيد حساب WAHO وإكمال الشحن بوضوح.',
                '流程专注于一件事：确认 WAHO 账号并清晰完成充值。'
              )}
            </p>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <div className="grid auto-cols-[148px] grid-flow-col gap-3 md:grid-flow-row md:grid-cols-7 md:auto-cols-auto">
              {wahoShowcaseImages.map((item) => (
                <article key={item.src} className="rounded-lg border border-black/10 bg-white p-1.5">
                  <div className="relative aspect-[750/1624] overflow-hidden rounded-md bg-zinc-100">
                    <Image
                      src={item.src}
                      alt={t(`WAHO ${item.label.en}`, `WAHO ${item.label.ar}`, `WAHO ${item.label.zh}`)}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 14vw, 148px"
                    />
                  </div>
                  <p className="truncate px-1.5 py-2 text-center text-xs font-medium text-zinc-700">
                    {t(item.label.en, item.label.ar, item.label.zh)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Direct WAHO top-up section */}
        <section className="grid gap-6 rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1.1fr_0.9fr] md:p-6">
          <div>
            <div className="inline-flex w-fit items-center gap-2 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
              <Zap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
              {t('One WAHO recharge flow', 'مسار شحن WAHO واحد', '一个 WAHO 充值流程')}
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-white">
              {t('Choose the WAHO amount', 'اختر مبلغ شحن WAHO', '选择 WAHO 充值金额')}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {t(
                'Select the balance amount, enter the WAHO ID, and continue to payment without extra product steps.',
                'اختر مبلغ الرصيد وأدخل معرف WAHO ثم تابع الدفع بدون خطوات منتجات إضافية.',
                '选择余额金额，输入 WAHO ID，然后直接继续支付。'
              )}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {topUpPackages.map((pkg) => (
                <Link
                  key={pkg.id}
                  href={`/top-up/${wahoTopUp.slug}`}
                  className="group rounded-lg border border-black/10 bg-zinc-50 p-4 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-zinc-950 dark:hover:border-blue-300/60 dark:hover:bg-blue-950/30"
                >
                  <p className="text-xl font-semibold text-zinc-950 dark:text-white">
                    {formatAmount(pkg.amount)}
                  </p>
                  <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-300">
                    {t(pkg.unit, pkg.unitAr, 'IQD 充值')}
                  </p>
                  <div className="mt-4 flex items-center text-xs font-semibold text-zinc-500 transition-colors group-hover:text-blue-700 dark:text-zinc-400 dark:group-hover:text-blue-200">
                    {t('Start top-up', 'ابدأ الشحن', '开始充值')}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-zinc-50 p-4 ring-1 ring-black/10 dark:bg-zinc-950 dark:ring-white/10">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
              {t('Ready in three steps', 'جاهز بثلاث خطوات', '三步完成')}
            </h3>
            <div className="mt-4 space-y-3">
              {[
                t('Choose an IQD top-up amount', 'اختر مبلغ شحن بالدينار', '选择 IQD 充值金额'),
                t('Confirm the WAHO account ID', 'أكد معرف حساب WAHO', '确认 WAHO 账号 ID'),
                t('Pay securely and track the order', 'ادفع بأمان وتابع الطلب', '安全支付并跟踪订单'),
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-300" />
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">{item}</span>
                </div>
              ))}
            </div>
            <Link
              href={`/top-up/${wahoTopUp.slug}`}
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {t('Top up WAHO', 'اشحن WAHO', '充值 WAHO')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* WhatsApp Contact */}
        <section className="overflow-hidden rounded-lg border border-black/10 bg-white p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-50 text-[#1f8f3a]">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">{t('Need WAHO Support?', 'تحتاج دعم WAHO؟')}</h3>
                <p className="text-sm text-zinc-600">{t('Contact us for WAHO top-ups, orders, or account help.', 'تواصل معنا لدعم شحن WAHO أو الطلبات أو الحساب.')}</p>
              </div>
            </div>
            <a
              href="https://wa.me/9647812345678"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-black/10 bg-white px-6 py-3 font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
            >
              {t('Chat on WhatsApp', 'تواصل عبر واتساب')}
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 rounded-xl bg-white p-1 overflow-hidden ring-1 ring-blue-900/10">
                  <Image
                    src="/brand/alwasl-mark.jpg"
                    alt={t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}
                    fill
                    className="object-contain"
                    sizes="48px"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-950">{t('Al-Wasl Digital', 'الوصل')}</h3>
                  <p className="text-[10px] text-blue-700">{t('Electronic services', 'للخدمات الإلكترونية')}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-500">
                {t('Fast WAHO top-ups with clear amounts, local payment options, and customer support.', 'شحن WAHO سريع بمبالغ واضحة وخيارات دفع محلية ودعم للعملاء.', '快速 WAHO 充值，金额清晰，支持本地支付和客户服务。')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-zinc-950">{t('WAHO Links', 'روابط WAHO')}</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/top-up" className="transition-colors hover:text-blue-600">{t('WAHO Top-Up', 'شحن WAHO', 'WAHO 充值')}</Link></li>
                <li><Link href="/promotions" className="transition-colors hover:text-blue-600">{t('WAHO Offers', 'عروض WAHO')}</Link></li>
                <li><Link href="/help" className="transition-colors hover:text-blue-600">{t('How it works', 'كيف تعمل الخدمة')}</Link></li>
                <li><Link href="/contact" className="transition-colors hover:text-blue-600">{t('Contact', 'اتصل بنا')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-zinc-950">{t('Support', 'الدعم')}</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/faq" className="transition-colors hover:text-blue-600">{t('FAQ', 'الأسئلة الشائعة')}</Link></li>
                <li><Link href="/help" className="transition-colors hover:text-blue-600">{t('Help Center', 'مركز المساعدة')}</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-blue-600">{t('Terms of Service', 'شروط الخدمة')}</Link></li>
                <li><Link href="/privacy" className="transition-colors hover:text-blue-600">{t('Privacy Policy', 'سياسة الخصوصية')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-zinc-950">{t('Payment Methods', 'طرق الدفع')}</h4>
              <div className="flex flex-wrap gap-2">
                {['ZainCash', 'AsiaHawala', 'Visa', 'Mastercard', 'USDT'].map((method) => (
                  <span key={method} className="px-3 py-1.5 rounded-md border border-black/10 bg-zinc-50 text-xs text-zinc-600">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-black/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-400">
              © 2026 {t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}
            </p>
            <div className="flex items-center gap-4">
              {['Facebook', 'Twitter', 'Instagram', 'WhatsApp'].map((social) => (
                <Link key={social} href="#" className="transition-colors text-xs text-zinc-400 hover:text-blue-600">
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/9647812345678"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 whatsapp-btn z-50"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
