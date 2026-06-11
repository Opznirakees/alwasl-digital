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

const wahoScreenshots = [
  'https://play-lh.googleusercontent.com/lIMMJNhZ_y4OJSwz_BOmxBfC043fH833-xLy05ev3hnF9SHbWbQayj8kWkPDyT_N0o-bmZ8SuojTmcsl6ttK=w750-h1624-rw',
  'https://play-lh.googleusercontent.com/aDoXznur5K5tgL5NCVa2pLoJSGByBvVagBhUw-l9TZg1jkrpS3cTLcnMFUZHFnB3j42blKgGMu0aPxyrtOi6xhM=w750-h1624-rw',
];

const serviceRows = [
  { icon: Coins, label: 'WAHO Coins', value: '15,000' },
  { icon: Gift, label: 'Gift Bundles', value: '60' },
  { icon: Radio, label: 'Live Rooms', value: '30d' },
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

      <div className="relative hidden min-h-[420px] md:block">
        <div className="absolute left-8 top-10 h-[360px] w-[166px] overflow-hidden rounded-[2rem] border-[10px] border-zinc-950 bg-zinc-950 shadow-[0_18px_45px_rgba(0,0,0,0.18)]">
          <Image
            src={wahoScreenshots[0]}
            alt={t('WAHO live stream app screenshot', 'لقطة شاشة لتطبيق WAHO', 'WAHO 应用截图')}
            fill
            className="object-cover"
            sizes="166px"
            priority
          />
        </div>

        <div className="absolute right-4 top-0 h-[390px] w-[180px] overflow-hidden rounded-[2.15rem] border-[10px] border-zinc-950 bg-zinc-950 shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
          <Image
            src={wahoScreenshots[1]}
            alt={t('WAHO voice room app screenshot', 'لقطة شاشة لغرف WAHO الصوتية', 'WAHO 语音房截图')}
            fill
            className="object-cover"
            sizes="180px"
            priority
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 mx-auto w-[82%] rounded-lg border border-black/10 bg-white/95 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-black/10 bg-white">
                <Image
                  src="/brand/alwasl-mark.jpg"
                  alt={t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية', 'Al-Wasl 数字服务')}
                  fill
                  className="object-contain p-1"
                  sizes="40px"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-950">{t('WAHO fulfillment', 'تنفيذ WAHO', 'WAHO 交付')}</p>
                <p className="text-xs text-zinc-500">{t('API-ready services', 'خدمات جاهزة للـ API', 'API 就绪服务')}</p>
              </div>
            </div>
            <BadgeCheck className="h-5 w-5 text-blue-600" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {serviceRows.map((row) => (
              <div key={row.label} className="rounded-md bg-zinc-100 px-3 py-2">
                <row.icon className="mb-2 h-4 w-4 text-blue-600" />
                <p className="truncate text-[11px] font-medium text-zinc-700">{t(row.label, row.label, row.label)}</p>
                <p className="font-mono text-xs font-semibold text-zinc-950">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] font-medium text-zinc-600">
            {[
              { icon: Zap, label: t('Quick', 'سريع', '快速') },
              { icon: ShieldCheck, label: t('Secure', 'آمن', '安全') },
              { icon: Sparkles, label: t('Clean', 'واضح', '清晰') },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-center gap-1">
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
