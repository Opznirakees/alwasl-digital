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
  { icon: Coins, label: 'WAHO Coins', value: { en: '15,000', ar: '15,000', zh: '15,000' } },
  { icon: Gift, label: 'Gift Bundles', value: { en: '60', ar: '60', zh: '60' } },
  { icon: Radio, label: 'Live Rooms', value: { en: '30d', ar: '30 يوم', zh: '30天' } },
];

const processSteps = [
  { icon: ListChecks, label: 'Validate' },
  { icon: CreditCard, label: 'Price' },
  { icon: BadgeCheck, label: 'Deliver' },
];

export function HeroBanner() {
  const { t, dir } = useApp();

  return (
    <section className="grid items-center gap-8 py-4 md:grid-cols-[1fr_0.9fr] md:gap-12 md:py-8 lg:min-h-[460px]">
      <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            {t('WAHO API-ready service catalog', 'كتالوج خدمات WAHO جاهز للـ API', '支持 WAHO API 的服务目录')}
        </div>

        <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl lg:text-6xl">
          {t('WAHO recharge that feels clear and controlled', 'شحن WAHO بتجربة واضحة ومنظمة', '清晰可控的 WAHO 充值体验')}
        </h2>

        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-600 md:text-lg">
          {t(
            'Coins, gifts, room boosts, casual games, VIP medals, and profile upgrades arranged for the incoming WAHO API.',
            'عملات وهدايا وتعزيز غرف وألعاب جماعية وميداليات VIP وترقيات ملف مرتبة للربط القادم مع WAHO API.',
            '金币、礼物、房间提升、休闲游戏、VIP 勋章和资料升级，已按即将接入的 WAHO API 结构整理。'
          )}
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/games">
            <Button
              size="lg"
              className="w-full rounded-md bg-blue-600 px-5 text-sm font-semibold text-white shadow-none hover:bg-blue-700 sm:w-auto"
            >
              {t('Browse WAHO Services', 'تصفح خدمات WAHO', '浏览 WAHO 服务')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link
            href="/about"
            className="inline-flex h-10 items-center justify-center rounded-md border border-black/10 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            {t('API Roadmap', 'خطة API', 'API 路线图')}
          </Link>
        </div>

        <div className="mt-8 grid max-w-xl grid-cols-1 gap-2 text-sm text-zinc-600 sm:grid-cols-3">
          {[
            t('Trusted delivery', 'تسليم موثوق', '可靠交付'),
            t('Fast fulfillment', 'إنجاز سريع', '快速完成'),
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
                <p className="text-sm text-zinc-500">{t('Clean catalog for API delivery', 'كتالوج واضح للتسليم عبر API', '面向 API 交付的清晰目录')}</p>
              </div>
            </div>
            <div className="rounded-md border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600">
              {t('Ready', 'جاهز', '就绪')}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {serviceRows.map((row) => (
              <div key={row.label} className="rounded-md border border-black/10 bg-zinc-50 px-3 py-3">
                <row.icon className="mb-2 h-4 w-4 text-blue-600" />
                <p className="truncate text-[11px] font-medium text-zinc-700">{t(row.label, row.label)}</p>
                <p className="font-mono text-xs font-semibold text-zinc-950">{t(row.value.en, row.value.ar, row.value.zh)}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-lg bg-zinc-50 p-4">
            <div className="grid grid-cols-3 gap-3">
              {processSteps.map((item, index) => (
                <div key={item.label} className="min-w-0">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-500 ring-1 ring-black/10">
                      {index + 1}
                    </span>
                    <item.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-zinc-950">{t(item.label, item.label)}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {index === 0 && t('WAHO ID check', 'فحص معرف WAHO', 'WAHO ID 校验')}
                    {index === 1 && t('Clear package price', 'سعر الباقة واضح', '清晰套餐价格')}
                    {index === 2 && t('Order handoff', 'تسليم الطلب', '订单交付')}
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
