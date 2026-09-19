'use client';

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
  pending: 'v2-status v2-status-warning',
  processing: 'v2-status v2-status-info',
  completed: 'v2-status v2-status-success',
  failed: 'v2-status v2-status-danger',
  refunded: 'v2-status v2-status-neutral',
  cancelled: 'v2-status v2-status-neutral',
};

export default function OrdersPage() {
  const { t, language, dir, user, isAccountLoading, selectedCountry, orders, formatLocalAmount } = useApp();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [products, setProducts] = useState<Game[]>([]);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const filteredOrders = filter === 'all' ? orders : orders.filter((order) => order.status === filter);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch(`/api/products?country=${selectedCountry.id}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (active) setProducts(payload.products ?? []);
      } catch {
        if (active) setProducts([]);
      }
    }

    void loadProducts();
    return () => {
      active = false;
      controller.abort();
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
    qicard: 'QiCard',
    cash: t('Cash', 'نقداً', '现金'),
  })[method] ?? method;

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast.success(t('Order ID copied', 'تم نسخ رقم الطلب', '订单号已复制'));
    } catch {
      toast.error(t('Could not copy the order ID', 'تعذر نسخ رقم الطلب', '无法复制订单号'));
    }
  };

  if (isAccountLoading) return <AccountPageLoading />;

  if (!user) {
    return (
      <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="v2-container flex min-h-[65vh] max-w-xl flex-col items-center justify-center py-10 text-center">
          <section className="v2-surface flex w-full flex-col items-center p-6 sm:p-8">
            <span className="v2-icon-tile v2-icon-tile-gold h-14 w-14 rounded-2xl">
              <Package className="h-7 w-7" />
            </span>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[var(--v2-navy)]">{t('Log in to see your orders', 'سجل الدخول لرؤية طلباتك', '登录后查看订单')}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--v2-muted)]">{t('Your order IDs and current delivery statuses are kept here.', 'تجد هنا أرقام طلباتك وحالات التسليم الحالية.', '您的订单号和当前交付状态会显示在这里。')}</p>
            <Link href="/auth?next=%2Forders" className="v2-primary-button mt-6 w-full sm:w-auto">
              {t('Log in', 'تسجيل الدخول', '登录')}<ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="v2-container max-w-5xl py-6 pb-24 sm:py-10 lg:pb-10">
        <Link href="/" className="v2-ghost-link">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="v2-page-header mt-4">
          <p className="v2-kicker">{t('Your activity', 'نشاطك', '您的记录')}</p>
          <h1>{t('My orders', 'طلباتي', '我的订单')}</h1>
          <p>{t('See what is happening with every recharge order.', 'تابع ما يحدث في كل طلب شحن.', '查看每笔充值订单的进度。')}</p>
        </header>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as OrderStatus | 'all')} className="mt-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl border border-[var(--v2-border)] bg-white p-1.5 shadow-[var(--v2-shadow-xs)] sm:inline-flex sm:w-auto sm:rounded-full">
            {[
              { value: 'all', label: t('All', 'الكل', '全部') },
              { value: 'pending', label: t('Waiting', 'انتظار', '等待中') },
              { value: 'processing', label: t('In progress', 'قيد التنفيذ', '处理中') },
              { value: 'completed', label: t('Completed', 'مكتمل', '已完成') },
              { value: 'failed', label: t('Attention', 'متابعة', '需处理') },
            ].map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="min-h-11 w-full rounded-full px-4 text-sm font-semibold text-[var(--v2-muted)] last:col-span-2 data-[state=active]:bg-[var(--v2-navy)] data-[state=active]:text-white data-[state=active]:shadow-[var(--v2-shadow-sm)] sm:w-auto sm:last:col-span-1">
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredOrders.length > 0 ? (
          <div className="mt-6 space-y-4">
            {filteredOrders.map((order) => {
              const product = products.find((item) => item.id === order.gameId);
              const pkg = product?.packages.find((item) => item.id === order.packageId);
              const StatusIcon = statusIcons[order.status];
              const repeatHref = `/top-up/${product?.slug ?? order.gameId}${pkg?.amount ? `?amount=${pkg.amount}` : ''}`;
              const productName = product
                ? language === 'ar' ? product.nameAr : language === 'zh' ? product.nameZh || product.name : product.name
                : order.gameName;
              const packageLabel = pkg
                ? `${new Intl.NumberFormat(locale).format(pkg.amount)} ${language === 'ar' ? pkg.unitAr : pkg.unit}`
                : order.packageName;
              const hasAccountReference = Boolean(order.gameUserId && order.gameUserId !== 'manual-delivery');

              return (
                <article key={order.id} className="v2-surface p-5 sm:p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--v2-border)] bg-white shadow-[var(--v2-shadow-xs)]">
                      <img data-visual-required-image src={product?.image ?? '/brand/alwasl-mark.jpg'} alt="" className="h-full w-full object-contain p-1" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-[var(--v2-navy)]">{productName}</h2>
                          <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--v2-gold-deep)]">{packageLabel}</p>
                        </div>
                        <span className={`w-fit flex-shrink-0 ${statusClasses[order.status]}`}>
                          <StatusIcon className={`h-3.5 w-3.5 ${order.status === 'processing' ? 'animate-spin motion-reduce:animate-none' : ''}`} />
                          {statusLabel(order.status)}
                        </span>
                      </div>

                      <p className="mt-4 rounded-xl bg-[var(--v2-surface-raised)] p-3.5 text-sm leading-6 text-[var(--v2-navy)]">
                        {getOrderStatusGuidance(order.status, language, order.fulfillmentMode)}
                      </p>

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-semibold text-[var(--v2-subtle)]">{t('Order ID', 'رقم الطلب', '订单号')}</dt>
                          <dd className="mt-1 flex min-w-0 items-center gap-1">
                            <span className="min-w-0 break-all font-mono text-xs font-semibold text-[var(--v2-navy)]">{order.id}</span>
                            <button onClick={() => void copyOrderId(order.id)} aria-label={t('Copy order ID', 'نسخ رقم الطلب', '复制订单号')} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-[var(--v2-muted)] transition-colors hover:bg-[var(--v2-navy-soft)] hover:text-[var(--v2-navy)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)]">
                              <Copy className="h-4 w-4" />
                            </button>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-[var(--v2-subtle)]">{hasAccountReference ? t('Account ID', 'معرف الحساب', '账号 ID') : t('Delivery', 'التسليم', '交付')}</dt>
                          <dd className="mt-1 break-all font-medium text-[var(--v2-navy)]">{hasAccountReference ? order.gameUserId : t('Through WhatsApp', 'عبر واتساب', '通过 WhatsApp')}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-[var(--v2-subtle)]">{t('Placed on', 'تاريخ الطلب', '下单时间')}</dt>
                          <dd className="mt-1 text-[var(--v2-muted)]">{formatDate(order.createdAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold text-[var(--v2-subtle)]">{t('Payment and total', 'الدفع والإجمالي', '付款及总计')}</dt>
                          <dd className="mt-1 font-medium text-[var(--v2-navy)]">{paymentLabel(order.paymentMethod)} · <span className="font-bold tabular-nums">{formatLocalAmount(order.finalPrice)}</span></dd>
                        </div>
                      </dl>

                      <div className="mt-5 border-t border-[var(--v2-border)] pt-4">
                        <Link href={repeatHref} className="v2-secondary-button min-h-11 w-full text-sm sm:w-auto">
                          <RefreshCw className="h-4 w-4" />
                          {t('Top up this amount again', 'اشحن هذا المبلغ مرة أخرى', '再次充值此金额')}
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="v2-empty mt-6 min-h-72">
            <span className="v2-icon-tile v2-icon-tile-gold h-14 w-14 rounded-2xl"><Package className="h-6 w-6" /></span>
            <h2 className="mt-4 text-lg font-bold text-[var(--v2-navy)]">{orders.length ? t('No orders with this status', 'لا توجد طلبات بهذه الحالة', '没有此状态的订单') : t('No orders yet', 'لا توجد طلبات بعد', '暂无订单')}</h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[var(--v2-muted)]">{orders.length ? t('Choose another status above.', 'اختر حالة أخرى أعلاه.', '请在上方选择其他状态。') : t('Your first recharge order will appear here.', 'سيظهر أول طلب شحن لك هنا.', '您的第一笔充值订单会显示在这里。')}</p>
            {!orders.length && <Link href="/#categories" className="v2-primary-button mt-6">{t('Choose a category', 'اختر الفئة', '选择分类')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>}
          </section>
        )}
      </main>
    </div>
  );
}
