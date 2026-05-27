'use client';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CreditCard, Gamepad2, LayoutDashboard, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

const demoSteps = [
  {
    icon: ShieldCheck,
    title: { en: '1. Load demo customer', ar: '١. تحميل عميل تجريبي' },
    body: { en: 'Use the demo login button or any phone number with OTP 123456.', ar: 'استخدم زر الحساب التجريبي أو أي رقم هاتف مع رمز 123456.' },
    href: '/auth',
  },
  {
    icon: Gamepad2,
    title: { en: '2. Place a top-up order', ar: '٢. تنفيذ طلب شحن' },
    body: { en: 'Choose Mobile Legends, fill demo details, pay from wallet, then watch the order appear.', ar: 'اختر موبايل ليجندز، عبئ البيانات التجريبية، ادفع من المحفظة وشاهد ظهور الطلب.' },
    href: '/games/mobile-legends',
  },
  {
    icon: Wallet,
    title: { en: '3. Show wallet impact', ar: '٣. عرض تأثير المحفظة' },
    body: { en: 'Wallet balance and purchase transaction update after the demo order.', ar: 'يتحدث رصيد المحفظة ومعاملة الشراء بعد الطلب التجريبي.' },
    href: '/wallet',
  },
  {
    icon: LayoutDashboard,
    title: { en: '4. Review the operator view', ar: '٤. مراجعة لوحة التشغيل' },
    body: { en: 'Admin dashboard shows revenue, orders, providers, products, and promotions.', ar: 'تعرض لوحة الإدارة الإيرادات والطلبات والمزودين والمنتجات والعروض.' },
    href: '/admin',
  },
];

export default function DemoPage() {
  const { t, language, dir, theme, resetDemoData } = useApp();
  const isLight = theme === 'light';
  const text = (value: { en: string; ar: string }) => language === 'ar' ? value.ar : value.en;

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'} ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <Link href="/" className={`inline-flex items-center gap-2 text-sm mb-8 ${isLight ? 'text-slate-600 hover:text-purple-600' : 'text-white/70 hover:text-white'}`}>
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Home', 'العودة للرئيسية')}
        </Link>

        <section className="max-w-4xl">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 border ${isLight ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-purple-500/10 border-purple-500/25 text-purple-200'}`}>
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">{t('Demo approval flow', 'مسار اعتماد النسخة التجريبية')}</span>
          </div>
          <h1 className={`text-3xl md:text-5xl font-bold mt-5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t('A complete walkthrough for stakeholder approval.', 'جولة كاملة لاعتماد أصحاب القرار.')}
          </h1>
          <p className={`text-base md:text-lg mt-4 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>
            {t('This page keeps the demo focused: customer checkout, wallet behavior, order tracking, and operator controls are all ready to show.', 'هذه الصفحة تركز العرض: دفع العميل، المحفظة، تتبع الطلبات، ولوحة التشغيل جاهزة للعرض.')}
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {t('Start demo login', 'بدء تسجيل الدخول التجريبي')}
              </Button>
            </Link>
            <Button onClick={resetDemoData} variant="outline" className={isLight ? 'border-purple-200 text-purple-700' : 'border-purple-500/30 text-purple-300'}>
              {t('Reset demo data', 'إعادة ضبط بيانات التجربة')}
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-10">
          {demoSteps.map((step) => (
            <Link key={step.href} href={step.href}>
              <Card className={`h-full p-6 transition-all hover:-translate-y-1 ${isLight ? 'bg-white border-purple-100 hover:border-purple-200' : 'bg-slate-900/50 border-purple-500/15 hover:border-purple-500/30'}`}>
                <step.icon className={isLight ? 'w-6 h-6 text-purple-600' : 'w-6 h-6 text-purple-300'} />
                <h2 className={`font-bold mt-5 ${isLight ? 'text-slate-900' : 'text-white'}`}>{text(step.title)}</h2>
                <p className={`text-sm leading-6 mt-2 ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{text(step.body)}</p>
              </Card>
            </Link>
          ))}
        </section>

        <section className="grid md:grid-cols-3 gap-4 mt-8">
          {[
            { icon: CheckCircle2, label: t('Demo OTP', 'رمز التجربة'), value: '123456' },
            { icon: CreditCard, label: t('Wallet balance', 'رصيد المحفظة'), value: '250,000 IQD' },
            { icon: ShieldCheck, label: t('Production scope', 'نطاق الإنتاج'), value: t('Payments + provider APIs', 'الدفع + واجهات المزودين') },
          ].map((item) => (
            <Card key={item.label} className={`p-5 ${isLight ? 'bg-white border-purple-100' : 'bg-slate-900/50 border-purple-500/15'}`}>
              <item.icon className={isLight ? 'w-5 h-5 text-purple-600' : 'w-5 h-5 text-purple-300'} />
              <p className={`text-xs mt-4 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{item.label}</p>
              <p className={`font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.value}</p>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
