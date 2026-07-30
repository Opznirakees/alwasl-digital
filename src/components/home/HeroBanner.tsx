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
      className="relative min-h-[560px] overflow-hidden rounded-lg border border-white/10 bg-[#020817] text-white shadow-[0_28px_90px_rgba(0,0,0,0.35)] sm:min-h-[560px] lg:min-h-[500px]"
    >
      <div className={`absolute inset-y-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} w-full sm:w-[72%] lg:w-[60%]`}>
        <Image
          src="/brand/leo-waho-agent.jpeg"
          alt={t('LEO, your WAHO top-up contact', 'LEO، جهة التواصل لشحن WAHO', 'LEO，您的 WAHO 充值联系人')}
          fill
          priority
          className={`object-cover ${dir === 'rtl' ? 'object-[44%_32%]' : 'object-[56%_32%]'} sm:object-center`}
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

      <div className="relative z-10 flex min-h-[560px] items-center px-5 pb-36 pt-7 sm:min-h-[560px] sm:px-10 sm:pb-32 lg:min-h-[500px] lg:px-12 lg:pb-28">
        <div className={`max-w-[610px] ${dir === 'rtl' ? 'text-right lg:ms-48' : 'text-left'}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#f7b928]/35 bg-[#071b46]/72 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            <ShieldCheck className="h-4 w-4 text-[#f7b928]" />
            {t('Fast and clear WAHO top-up', 'شحن WAHO بسرعة ووضوح', '快速清晰地充值 WAHO')}
          </div>

          <h1 className="mt-4 max-w-2xl text-[2rem] font-bold leading-[1.08] text-white sm:mt-5 sm:text-5xl lg:text-5xl xl:text-6xl">
            {t('Top up your', 'اشحن رصيد', '为您的')}{' '}
            <span className="text-[#f7b928]">WAHO</span>{' '}
            {dir !== 'rtl' && t('balance', 'الرصيد', '余额充值')}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/76 sm:mt-5 sm:text-lg sm:leading-7">
            {t(
              'Choose the balance, check the WAHO account name before payment, then follow the order with your order ID.',
              'اختر الرصيد وتحقق من اسم حساب WAHO قبل الدفع، ثم تابع الطلب باستخدام رقمه.',
              '选择余额，付款前核对 WAHO 账号名称，然后使用订单号跟踪订单。'
            )}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link data-testid="home-primary-topup" href="/top-up/waho-top-up" className="v2-primary-button sm:min-w-44">
              {t('Choose amount', 'اختر المبلغ', '选择金额')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link href="/help" className="v2-secondary-button border-white/22 bg-white/5 text-white hover:bg-white/10 sm:min-w-40">
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

      <div className="v2-hero-metrics absolute inset-x-0 bottom-0 z-20 grid grid-cols-2 border-t border-white/12 bg-[#020817]/90 px-3 py-3 backdrop-blur-xl sm:grid-cols-4 sm:px-7 sm:py-3 lg:px-10">
        {metrics.map((item) => (
          <div key={item.title} className="flex min-h-[62px] items-center gap-2.5 border-white/10 px-2 py-2 sm:min-h-[58px] sm:border-e sm:px-4 last:sm:border-e-0">
            <item.icon className="h-5 w-5 flex-shrink-0 text-[#f7b928]" />
            <div className="min-w-0">
              <p className="text-xs font-bold leading-5 text-white sm:text-sm">{item.title}</p>
              <p className="text-[11px] leading-4 text-white/58 sm:text-xs">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
