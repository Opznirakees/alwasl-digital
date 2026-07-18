'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  Package,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { AccountPageLoading } from '@/components/account/AccountPageLoading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { getOrderStatusGuidance } from '@/lib/easy-use';
import type { Game, OrderStatus } from '@/types';

const statusIcons = {
  pending: Clock3,
  processing: RefreshCw,
  completed: CheckCircle2,
  failed: XCircle,
  refunded: RotateCcw,
  cancelled: XCircle,
} satisfies Record<OrderStatus, typeof Clock3>;

const statusClasses: Record<OrderStatus, string> = {
  pending: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200',
  processing: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-400/25 dark:bg-blue-500/10 dark:text-blue-200',
  completed: 'border-green-200 bg-green-50 text-green-800 dark:border-green-400/25 dark:bg-green-500/10 dark:text-green-200',
  failed: 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/25 dark:bg-red-500/10 dark:text-red-200',
  refunded: 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200',
  cancelled: 'border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/10 dark:text-zinc-200',
};

export default function OrdersPage() {
  const { t, language, dir, user, isAccountLoading, selectedCountry, orders, formatLocalAmount } = useApp();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [products, setProducts] = useState<Game[]>([]);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const filteredOrders = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      const response = await fetch(`/api/products?country=${selectedCountry.id}`);
      if (!response.ok) return;
      const payload = await response.json();
      if (active) setProducts(payload.products ?? []);
    }
    void loadProducts();
    return () => {
      active = false;
    };
  }, [selectedCountry.id]);

  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusLabel = (status: OrderStatus) => ({
    pending: t('Waiting for payment', 'بانتظار الدفع', '等待付款'),
    processing: t('Top-up in progress', 'الشحن قيد التنفيذ', '正在充值'),
    completed: t('Top-up completed', 'اكتمل الشحن', '充值完成'),
    failed: t('Needs attention', 'يحتاج إلى متابعة', '需要处理'),
    refunded: t('Payment returned', 'تمت إعادة المبلغ', '款项已退回'),
    cancelled: t('Order cancelled', 'تم إلغاء الطلب', '订单已取消'),
  })[status];

  const paymentLabel = (method: string) => ({
    wallet: t('Wallet', 'المحفظة', '钱包'),
    zaincash: 'ZainCash',
    asiahawala: 'AsiaHawala',
    card: t('Bank card', 'بطاقة مصرفية', '银行卡'),
    usdt: 'USDT',
  })[method] ?? method;

  const copyOrderId = async (orderId: string) => {
    await navigator.clipboard.writeText(orderId);
    toast.success(t('Order ID copied', 'تم نسخ رقم الطلب', '订单号已复制'));
  };

  if (isAccountLoading) return <AccountPageLoading />;

  if (!user) {
    return (
      <div className={`min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="container mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">{t('Log in to see your orders', 'سجل الدخول لرؤية طلباتك', '登录后查看订单')}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{t('Your WAHO order IDs and live statuses are kept here.', 'تجد هنا أرقام طلبات WAHO وحالاتها.', '您的 WAHO 订单号和实时状态会显示在这里。')}</p>
          <Button asChild className="mt-5 bg-blue-600 text-white hover:bg-blue-700">
            <Link href="/auth?next=%2Forders">{t('Log in', 'تسجيل الدخول', '登录')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#f5f5f7] dark:bg-zinc-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="mt-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Your activity', 'نشاطك', '您的记录')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white sm:text-4xl">{t('My orders', 'طلباتي', '我的订单')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">{t('See what is happening with every WAHO top-up.', 'تابع ما يحدث في كل عملية شحن WAHO.', '查看每笔 WAHO 充值的进度。')}</p>
        </header>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as OrderStatus | 'all')} className="mt-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg border border-black/10 bg-white p-1 dark:border-white/10 dark:bg-zinc-900 sm:inline-flex sm:w-auto">
            {[
              { value: 'all', label: t('All', 'الكل', '全部') },
              { value: 'pending', label: t('Waiting', 'انتظار', '等待中') },
              { value: 'processing', label: t('In progress', 'قيد التنفيذ', '处理中') },
              { value: 'completed', label: t('Completed', 'مكتمل', '已完成') },
              { value: 'failed', label: t('Attention', 'متابعة', '需处理') },
            ].map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="min-h-11 w-full px-3 last:col-span-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-500/15 dark:data-[state=active]:text-blue-200 sm:w-auto sm:last:col-span-1">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredOrders.length > 0 ? (
          <div className="mt-5 space-y-4">
            {filteredOrders.map((order) => {
              const product = products.find((item) => item.id === order.gameId);
              const pkg = product?.packages.find((item) => item.id === order.packageId);
              const StatusIcon = statusIcons[order.status];
              const repeatHref = `/top-up/${product?.slug ?? 'waho-top-up'}${pkg?.amount ? `?amount=${pkg.amount}` : ''}`;

              return (
                <article key={order.id} className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/10">
                      <Image src="/brand/alwasl-mark.jpg" alt="" fill className="object-contain p-1" sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="font-semibold text-zinc-950 dark:text-white">{t('WAHO balance top-up', 'شحن رصيد WAHO', 'WAHO 余额充值')}</h2>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-blue-700 dark:text-blue-300">{pkg ? `${new Intl.NumberFormat(locale).format(pkg.amount)} IQD` : order.packageName}</p>
                        </div>
                        <Badge variant="outline" className={`w-fit gap-1.5 ${statusClasses[order.status]}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${order.status === 'processing' ? 'animate-spin' : ''}`} />
                          {statusLabel(order.status)}
                        </Badge>
                      </div>

                      <p className="mt-4 rounded-lg bg-zinc-100 p-3 text-sm leading-6 text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
                        {getOrderStatusGuidance(order.status, language)}
                      </p>

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-zinc-500 dark:text-zinc-400">{t('Order ID', 'رقم الطلب', '订单号')}</dt>
                          <dd className="mt-1 flex min-w-0 items-center gap-1">
                            <span className="min-w-0 break-all font-mono text-xs font-semibold text-zinc-950 dark:text-white">{order.id}</span>
                            <button onClick={() => void copyOrderId(order.id)} aria-label={t('Copy order ID', 'نسخ رقم الطلب', '复制订单号')} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-white/10 dark:hover:text-blue-300">
                              <Copy className="h-4 w-4" />
                            </button>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-zinc-500 dark:text-zinc-400">{t('WAHO ID', 'معرف WAHO', 'WAHO ID')}</dt>
                          <dd className="mt-1 break-all font-medium text-zinc-950 dark:text-white">{order.gameUserId || '-'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-zinc-500 dark:text-zinc-400">{t('Placed on', 'تاريخ الطلب', '下单时间')}</dt>
                          <dd className="mt-1 text-zinc-700 dark:text-zinc-300">{formatDate(order.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-zinc-500 dark:text-zinc-400">{t('Payment and total', 'الدفع والإجمالي', '付款及总计')}</dt>
                          <dd className="mt-1 font-medium text-zinc-950 dark:text-white">{paymentLabel(order.paymentMethod)} · <span className="tabular-nums">{formatLocalAmount(order.finalPrice)}</span></dd>
                        </div>
                      </dl>

                      <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
                        <Button asChild variant="outline">
                          <Link href={repeatHref}>
                            <RefreshCw className="h-4 w-4" />
                            {t('Top up this amount again', 'اشحن هذا المبلغ مرة أخرى', '再次充值此金额')}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-lg border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-zinc-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400"><Package className="h-6 w-6" /></div>
            <h2 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">{orders.length ? t('No orders with this status', 'لا توجد طلبات بهذه الحالة', '没有此状态的订单') : t('No orders yet', 'لا توجد طلبات بعد', '暂无订单')}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-300">{orders.length ? t('Choose another status above.', 'اختر حالة أخرى أعلاه.', '请在上方选择其他状态。') : t('Your first WAHO top-up will appear here.', 'ستظهر أول عملية شحن WAHO هنا.', '您的第一笔 WAHO 充值会显示在这里。')}</p>
            {!orders.length && <Button asChild className="mt-5 bg-blue-600 text-white hover:bg-blue-700"><Link href="/top-up/waho-top-up">{t('Start a top-up', 'ابدأ الشحن', '开始充值')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link></Button>}
          </section>
        )}
      </main>
    </div>
  );
}
