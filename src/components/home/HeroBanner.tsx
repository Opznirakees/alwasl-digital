'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { wahoScreenshots } from '@/data/waho-images';
import {
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

const heroScreenshots = [
  { src: wahoScreenshots.liveStream, label: 'WAHO live stream screenshot' },
  { src: wahoScreenshots.onlineParties, label: 'WAHO online party screenshot' },
  { src: wahoScreenshots.casualGames, label: 'WAHO casual games screenshot' },
];

export function HeroBanner() {
  const { t, dir } = useApp();

  return (
    <section className="grid items-center gap-8 py-4 md:grid-cols-[1fr_0.9fr] md:gap-12 md:py-8 lg:min-h-[460px]">
      <div className={`min-w-0 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            {t('Fast WAHO top-ups', 'شحن WAHO سريع', '快速 WAHO 充值')}
        </div>

        <h2 className="mt-5 max-w-3xl break-words text-4xl font-semibold leading-tight text-zinc-950 sm:text-5xl lg:text-6xl">
          {t('Top up WAHO in a few clear steps', 'اشحن WAHO بخطوات واضحة وسريعة', '几步即可快速充值 WAHO')}
        </h2>

        <p className="mt-5 max-w-2xl break-words text-base leading-7 text-zinc-600 md:text-lg">
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

      <div className="min-w-0 space-y-4">
        <div className="-mx-4 overflow-x-auto px-4 pb-2 md:hidden">
          <div className="grid auto-cols-[132px] grid-flow-col gap-3">
            {heroScreenshots.map((shot) => (
              <div key={shot.src} className="rounded-lg border border-black/10 bg-white p-1.5">
                <div className="relative aspect-[750/1624] overflow-hidden rounded-md bg-zinc-100">
                  <Image
                    src={shot.src}
                    alt={shot.label}
                    fill
                    className="object-cover"
                    sizes="132px"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:block">
          <div className="rounded-lg border border-black/10 bg-white p-5">
            <div className="grid items-center gap-4 lg:grid-cols-[1fr_112px]">
              <div className="relative mx-auto w-full max-w-[196px]">
                <div className="relative aspect-[750/1624] overflow-hidden rounded-[30px] border-[6px] border-zinc-950 bg-zinc-950 shadow-sm">
                  <Image
                    src={wahoScreenshots.liveStream}
                    alt="WAHO live stream screenshot"
                    fill
                    className="object-cover"
                    sizes="245px"
                    priority
                  />
                </div>
              </div>

              <div className="mx-auto grid w-full max-w-[104px] grid-cols-2 gap-3 lg:grid-cols-1">
                {[wahoScreenshots.onlineParties, wahoScreenshots.casualGames].map((src) => (
                  <div key={src} className="relative aspect-[750/1624] overflow-hidden rounded-lg border border-black/10 bg-zinc-100">
                    <Image
                      src={src}
                      alt="WAHO app screenshot"
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 border-t border-black/10 pt-4">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-black/10 bg-white">
                  <Image
                    src="/brand/alwasl-logo.jpg"
                    alt={t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية', 'Al-Wasl 数字服务')}
                    fill
                    className="object-contain p-1"
                    sizes="56px"
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
          </div>
        </div>
      </div>
    </section>
  );
}
