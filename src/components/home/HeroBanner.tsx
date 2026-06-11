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
  Gift,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

const serviceRows = [
  { icon: Coins, label: 'WAHO Coins', value: '15,000' },
  { icon: Gift, label: 'Gift Bundles', value: '60' },
  { icon: Radio, label: 'Live Rooms', value: '30d' },
];

export function HeroBanner() {
  const { t, dir } = useApp();

  return (
    <section className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="grid min-h-[420px] items-stretch lg:grid-cols-[1.02fr_0.98fr]">
        <div className={`flex flex-col justify-center px-6 py-10 md:px-12 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
          <div className="inline-flex w-fit items-center gap-2 rounded-md border border-black/10 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-600">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            {t('WAHO API-ready service catalog', 'كتالوج خدمات WAHO جاهز للـ API', '支持 WAHO API 的服务目录')}
          </div>

          <h2 className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-4xl md:text-6xl">
            {t('Clear WAHO recharge, without visual noise', 'شحن WAHO واضح بدون ازدحام بصري', '清晰的 WAHO 充值体验')}
          </h2>

          <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 md:text-lg">
            {t(
              'Coins, gifts, room boosts, party games, and VIP packages in one calm, structured checkout.',
              'عملات وهدايا وتعزيز غرف وألعاب جماعية وباقات VIP ضمن تجربة دفع هادئة ومنظمة.',
              '金币、礼物、房间提升、派对游戏和 VIP 套餐集中在清晰的购买流程中。'
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
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden border-t border-black/10 bg-[#f5f5f7] p-4 lg:block lg:border-l lg:border-t-0 lg:p-8">
          <div className="flex h-full min-h-[340px] flex-col justify-between rounded-lg border border-black/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-black/10 bg-white">
                  <Image
                    src="/brand/alwasl-mark.jpg"
                    alt={t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية', 'Al-Wasl 数字服务')}
                    fill
                    className="object-contain p-1"
                    sizes="48px"
                    priority
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-950">{t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}</p>
                  <p className="text-xs text-zinc-500">{t('WAHO fulfillment desk', 'مكتب تنفيذ WAHO', 'WAHO 交付台')}</p>
                </div>
              </div>
              <div className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {t('Online', 'متصل', '在线')}
              </div>
            </div>

            <div className="my-6 space-y-3">
              {serviceRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border border-black/10 bg-zinc-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-black/10">
                      <row.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">{t(row.label, row.label, row.label)}</p>
                      <p className="text-xs text-zinc-500">{t('Ready for validation', 'جاهز للتحقق', '可验证')}</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold text-zinc-700">{row.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: BadgeCheck, label: t('Secure', 'آمن', '安全') },
                { icon: Zap, label: t('Quick', 'سريع', '快速') },
                { icon: Sparkles, label: t('Clean', 'واضح', '清晰') },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-black/10 bg-white p-3 text-center">
                  <item.icon className="mx-auto h-4 w-4 text-blue-600" />
                  <p className="mt-2 text-xs font-medium text-zinc-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
