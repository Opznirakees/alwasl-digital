'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Coins,
  CreditCard,
  Gift,
  ListChecks,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

const serviceRows = [
  { icon: Coins, label: { en: 'WAHO Coins', ar: 'عملات WAHO', zh: 'WAHO 金币' }, value: { en: '15,000', ar: '15,000', zh: '15,000' } },
  { icon: Gift, label: { en: 'Gift Bundles', ar: 'باقات الهدايا', zh: '礼物套餐' }, value: { en: '60', ar: '60', zh: '60' } },
  { icon: Radio, label: { en: 'Live Rooms', ar: 'الغرف المباشرة', zh: '直播房间' }, value: { en: '30d', ar: '30 يوم', zh: '30天' } },
];

const processSteps = [
  { icon: ListChecks, label: { en: 'Choose', ar: 'اختر', zh: '选择' } },
  { icon: CreditCard, label: { en: 'Check', ar: 'تحقق', zh: '确认' } },
  { icon: BadgeCheck, label: { en: 'Top up', ar: 'اشحن', zh: '充值' } },
];

export function HeroBanner() {
  const { t, dir } = useApp();

  return (
    <section className="grid items-center gap-8 py-4 md:grid-cols-[1fr_0.9fr] md:gap-12 md:py-8 lg:min-h-[460px]">
      <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            {t('Fast WAHO top-ups', 'شحن WAHO سريع', '快速 WAHO 充值')}
        </div>

        <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl lg:text-6xl">
          {t('Top up WAHO in a few clear steps', 'اشحن WAHO بخطوات واضحة وسريعة', '几步即可快速充值 WAHO')}
        </h2>

        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
          {t(
            'Choose coins, gifts, room boosts, games, VIP medals, or profile upgrades, then enter the WAHO details and pay securely.',
            'اختر العملات أو الهدايا أو تعزيز الغرف أو الألعاب أو VIP والميداليات، ثم أدخل بيانات WAHO وادفع بأمان.',
            '选择金币、礼物、房间提升、游戏、VIP 勋章或资料升级，然后输入 WAHO 信息并安全支付。'
          )}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/games">
            <Button
              size="lg"
              className="w-full rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-none hover:bg-blue-700 sm:w-auto"
            >
              {t('Top up WAHO', 'اشحن WAHO', '充值 WAHO')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link
            href="/help"
            className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            {t('How it works', 'كيف تعمل الخدمة', '服务流程')}
          </Link>
        </div>

        <div className="mt-8 grid max-w-xl grid-cols-1 gap-2 text-sm text-zinc-600 sm:grid-cols-3">
          {[
            t('Trusted delivery', 'تسليم موثوق', '可靠交付'),
            t('Fast top-up', 'شحن سريع', '快速充值'),
            t('24/7 support', 'دعم 24/7', '24/7 支持'),
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden md:block">
        <div className="rounded-lg border border-black/10 bg-white p-5">
          <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-black/10 bg-white">
                <Image
                  src="/brand/alwasl-logo.jpg"
                  alt={t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية', 'Al-Wasl 数字服务')}
                  fill
                  className="object-contain p-1"
                  sizes="64px"
                  priority
                />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-blue-600">WAHO</p>
                <p className="text-base font-semibold text-zinc-950">{t('Service desk', 'مكتب الخدمات', '服务台')}</p>
                <p className="text-sm text-zinc-500">{t('Clear choices for WAHO top-ups', 'خيارات واضحة لشحن WAHO', '清晰的 WAHO 充值选择')}</p>
              </div>
            </div>
            <div className="rounded-md border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600">
              {t('Ready', 'جاهز', '就绪')}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {serviceRows.map((row) => (
              <div key={row.label.en} className="rounded-md border border-black/10 bg-zinc-50 px-3 py-3">
                <row.icon className="mb-2 h-4 w-4 text-blue-600" />
                <p className="truncate text-[11px] font-medium text-zinc-700">{t(row.label.en, row.label.ar, row.label.zh)}</p>
                <p className="font-mono text-xs font-semibold text-zinc-950">{t(row.value.en, row.value.ar, row.value.zh)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-zinc-50 p-4">
            <div className="grid grid-cols-3 gap-3">
              {processSteps.map((item, index) => (
                <div key={item.label.en} className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-500 ring-1 ring-black/10">
                      {index + 1}
                    </span>
                    <item.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-zinc-950">{t(item.label.en, item.label.ar, item.label.zh)}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {index === 0 && t('Pick your package', 'اختر الباقة', '选择套餐')}
                    {index === 1 && t('Confirm WAHO ID', 'أكد معرف WAHO', '确认 WAHO ID')}
                    {index === 2 && t('Complete order', 'أكمل الطلب', '完成订单')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-zinc-600">
            {[
              { icon: Zap, label: t('Quick', 'سريع', '快速') },
              { icon: ShieldCheck, label: t('Secure', 'آمن', '安全') },
              { icon: Sparkles, label: t('Clear', 'واضح', '清晰') },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-center gap-1 rounded-md bg-white py-2 ring-1 ring-black/10">
                <item.icon className="h-3.5 w-3.5 text-blue-600" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
