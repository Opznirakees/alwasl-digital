'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  ReceiptText,
  ShieldCheck,
  UserRoundCheck,
  WalletCards,
} from 'lucide-react';
import type { Banner } from '@/types';
import { useApp } from '@/contexts/AppContext';

interface HeroBannerProps {
  banner?: Banner;
}

export function HeroBanner({ banner }: HeroBannerProps) {
  const { t, dir } = useApp();
  const metrics = [
    {
      icon: UserRoundCheck,
      title: t('Account checked', 'فحص الحساب', '检查账号'),
      body: t('Name shown before payment', 'يظهر الاسم قبل الدفع', '付款前显示名称'),
    },
    {
      icon: ShieldCheck,
      title: t('Protected order', 'طلب محمي', '订单保护'),
      body: t('WhatsApp code to confirm', 'رمز واتساب للتأكيد', '使用 WhatsApp 验证码确认'),
    },
    {
      icon: WalletCards,
      title: t('Clear price', 'سعر واضح', '价格清晰'),
      body: t('Total before confirmation', 'الإجمالي قبل التأكيد', '确认前查看总价'),
    },
    {
      icon: ReceiptText,
      title: t('Order tracking', 'تتبع الطلب', '订单跟踪'),
      body: t('With your order ID', 'باستخدام رقم الطلب', '使用订单号'),
    },
  ];

  return (
    <section
      data-v2-hero
      aria-label={banner ? t(banner.title, banner.titleAr, banner.title) : t('WAHO top-up', 'شحن WAHO', 'WAHO 充值')}
      className="v2-mobile-hero relative min-h-[390px] overflow-hidden border-y border-white/10 bg-[#020817] text-white shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:min-h-[560px] sm:rounded-lg sm:border lg:min-h-[500px]"
    >
      <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-full sm:w-[72%] lg:w-[60%]`}>
        <Image
          src="/brand/leo-waho-agent.jpeg"
          alt={t('LEO, your WAHO top-up contact', 'LEO، جهة التواصل لشحن WAHO', 'LEO，您的 WAHO 充值联系人')}
          fill
          priority
          className={`object-cover ${dir === 'rtl' ? 'object-[100%_18%]' : 'object-[0%_18%]'} sm:object-center`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 72vw, 760px"
        />
      </div>

      <div
        className={`absolute inset-0 ${
          dir === 'rtl'
            ? 'bg-[linear-gradient(90deg,rgba(2,8,23,0.08)_0%,rgba(2,8,23,0.72)_50%,#020817_88%)]'
            : 'bg-[linear-gradient(90deg,#020817_12%,rgba(2,8,23,0.88)_48%,rgba(2,8,23,0.12)_100%)]'
        }`}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,0.04)_20%,rgba(2,8,23,0.28)_64%,#020817_100%)] sm:bg-[linear-gradient(180deg,rgba(2,8,23,0.02)_28%,rgba(2,8,23,0.18)_62%,#020817_100%)]" />

      <div
        data-v2-mobile-brandmark
        aria-hidden="true"
        className="absolute end-4 top-4 z-20 h-12 w-12 overflow-hidden rounded-lg border border-[#f7b928]/55 bg-[#020817]/78 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-md sm:hidden"
      >
        <Image src="/brand/waho-app-icon.webp" alt="" fill priority className="object-cover" sizes="48px" />
      </div>

      <div
        data-v2-brand-corner
        aria-hidden="true"
        className="v2-hero-brandmark pointer-events-none absolute right-0 top-0 z-20 hidden h-[158px] w-[180px] md:block lg:h-[198px] lg:w-[224px]"
      >
        <span className="v2-hero-brandmark-accent absolute inset-0" />
        <div className="v2-hero-brandmark-surface absolute right-0 top-0 h-[calc(100%-10px)] w-[calc(100%-10px)]">
          <div className="relative h-full w-full">
            <Image
              src="/brand/alwasl-lockup.webp"
              alt=""
              fill
              priority
              className="object-contain px-5 pb-7 pt-3 lg:px-6 lg:pb-8 lg:pt-4"
              sizes="(max-width: 1023px) 170px, 214px"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-[390px] items-end px-5 pb-[94px] pt-14 sm:min-h-[560px] sm:items-center sm:px-10 sm:pb-32 sm:pt-7 lg:min-h-[500px] lg:px-12 lg:pb-28">
        <div data-v2-mobile-hero-copy className={`max-w-[610px] ${dir === 'rtl' ? 'text-right lg:ms-48' : 'text-left'}`}>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#f7b928]/40 bg-[#071b46]/78 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs">
            <ShieldCheck className="h-4 w-4 text-[#f7b928]" />
            {t('Fast and clear WAHO top-up', 'شحن WAHO بسرعة ووضوح', '快速清晰地充值 WAHO')}
          </div>

          <h1 className="mt-3 max-w-[330px] text-[1.9rem] font-bold leading-[1.06] text-white sm:mt-5 sm:max-w-2xl sm:text-5xl lg:text-5xl xl:text-6xl">
            {t('Top up your', 'اشحن رصيد', '为您的')}{' '}
            <span className="text-[#f7b928]">WAHO</span>{' '}
            {dir !== 'rtl' && t('balance', 'الرصيد', '余额充值')}
          </h1>
          <p className="mt-3 line-clamp-2 max-w-[340px] text-[13px] leading-5 text-white/78 sm:mt-5 sm:line-clamp-none sm:max-w-xl sm:text-lg sm:leading-7">
            {t(
              'Choose the balance, check the WAHO account name before payment, then follow the order with your order ID.',
              'اختر الرصيد وتحقق من اسم حساب WAHO قبل الدفع، ثم تابع الطلب باستخدام رقمه.',
              '选择余额，付款前核对 WAHO 账号名称，然后使用订单号跟踪订单。'
            )}
          </p>

          <div className="mt-4 flex gap-3 sm:mt-6 sm:flex-row">
            <Link data-testid="home-primary-topup" href="/top-up/waho-top-up" className="v2-primary-button min-h-11 flex-1 sm:min-w-44 sm:flex-none">
              {t('Choose amount', 'اختر المبلغ', '选择金额')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link href="/help" className="v2-secondary-button hidden border-white/22 bg-white/5 text-white hover:bg-white/10 sm:inline-flex sm:min-w-40">
              <CircleHelp className="h-4 w-4 text-[#f7b928]" />
              {t('How it works', 'كيف يعمل', '如何操作')}
            </Link>
          </div>

          <div className="mt-5 hidden max-w-full items-center gap-3 rounded-lg border border-white/12 bg-[#020817]/62 px-3 py-2.5 backdrop-blur-md sm:inline-flex">
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-[#f7b928]">
              <Image src="/brand/leo-waho-agent.jpeg" alt="" fill className="object-cover object-[52%_28%]" sizes="40px" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                LEO <BadgeCheck className="h-4 w-4 flex-shrink-0 text-[#f7b928]" />
              </p>
              <p className="truncate text-xs text-white/68">
                {t('Your WAHO top-up contact', 'جهة التواصل لشحن WAHO', '您的 WAHO 充值联系人')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="v2-hero-metrics absolute inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-white/12 bg-[#020817]/92 px-1.5 py-2 backdrop-blur-xl sm:px-7 sm:py-3 lg:px-10">
        {metrics.map((item) => (
          <div key={item.title} className="flex min-h-[70px] flex-col items-center justify-center gap-1 border-e border-white/10 px-1 py-1.5 text-center last:border-e-0 sm:min-h-[58px] sm:flex-row sm:justify-start sm:gap-2.5 sm:px-4 sm:py-2 sm:text-start">
            <item.icon className="h-[18px] w-[18px] flex-shrink-0 text-[#f7b928] sm:h-5 sm:w-5" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-[10px] font-bold leading-3.5 text-white sm:text-sm sm:leading-5">{item.title}</p>
              <p className="hidden text-xs leading-4 text-white/58 sm:block">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
