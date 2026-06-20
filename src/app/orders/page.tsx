'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Game, OrderStatus } from '@/types';
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function OrdersPage() {
  const { t, language, dir, selectedCountry, orders, formatLocalAmount } = useApp();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [products, setProducts] = useState<Game[]>([]);

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      const response = await fetch(`/api/products?country=${selectedCountry.id}`);
      if (response.ok) {
        const payload = await response.json();
        if (active) setProducts(payload.products ?? []);
      }
    }

    void loadProducts();

    return () => {
      active = false;
    };
  }, [selectedCountry.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'processing':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'failed':
      case 'cancelled':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'refunded':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, { en: string; ar: string }> = {
      pending: { en: 'Pending', ar: 'قيد الانتظار' },
      processing: { en: 'Processing', ar: 'قيد المعالجة' },
      completed: { en: 'Completed', ar: 'مكتمل' },
      failed: { en: 'Failed', ar: 'فشل' },
      refunded: { en: 'Refunded', ar: 'مسترد' },
      cancelled: { en: 'Cancelled', ar: 'ملغي' },
    };
    return t(labels[status].en, labels[status].ar);
  };

  const getPaymentMethodLabel = (method: string) => {
    return t(method, method);
  };

  const copyOrderId = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
    toast.success(t('Order ID copied!', 'تم نسخ رقم الطلب!'));
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              {t('Back to Home', 'العودة للرئيسية')}
            </Link>
            <h1 className="text-3xl font-bold text-white">{t('My Orders', 'طلباتي')}</h1>
            <p className="text-sm text-white/50 mt-1">
              {t('View and track your order history', 'عرض وتتبع سجل طلباتك')}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as OrderStatus | 'all')} className="mb-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-slate-800/50 border border-emerald-800/20 p-1 sm:inline-flex sm:h-9 sm:w-auto sm:grid-cols-none">
            <TabsTrigger value="all" className="min-h-10 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              {t('All', 'الكل')}
            </TabsTrigger>
            <TabsTrigger value="completed" className="min-h-10 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              {t('Completed', 'مكتمل')}
            </TabsTrigger>
            <TabsTrigger value="processing" className="min-h-10 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              {t('Processing', 'قيد المعالجة')}
            </TabsTrigger>
            <TabsTrigger value="failed" className="min-h-10 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">
              {t('Failed', 'فشل')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const game = products.find(g => g.id === order.gameId);
              const gamePackage = game?.packages.find(pkg => pkg.id === order.packageId);
              const orderGameName = game ? t(game.name, game.nameAr) : t(order.gameName, order.gameName);
              const orderPackageName = gamePackage ? t(gamePackage.name, gamePackage.nameAr) : t(order.packageName, order.packageName);
              return (
                <Card key={order.id} className="bg-slate-900/50 border-emerald-800/20 p-6 hover:border-emerald-500/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* WAHO top-up image */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={game?.image || '/brand/alwasl-mark.jpg'}
                        alt={orderGameName}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Order Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-white">{orderGameName}</h3>
                          <p className="text-sm text-emerald-400">{orderPackageName}</p>
                        </div>
                        <Badge variant="outline" className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-white/50">{t('Order ID:', 'رقم الطلب:')}</span>
                          <span className="font-mono text-white">{order.id}</span>
                          <button
                            onClick={() => copyOrderId(order.id)}
                            aria-label={t('Copy order ID', 'نسخ رقم الطلب')}
                            className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-white/10 transition-colors"
                          >
                            <Copy className="w-4 h-4 text-white/50" />
                          </button>
                        </div>
                        {order.gameUserId && (
                          <div className="flex items-center gap-2">
                            <span className="text-white/50">{t('WAHO ID:', 'معرف WAHO:')}</span>
                            <span className="text-white">{order.gameUserId}</span>
                            {order.gameUsername && (
                              <span className="text-emerald-400">({order.gameUsername})</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4 text-sm text-white/50">
                          <span>{formatDate(order.createdAt)}</span>
                          <span>{getPaymentMethodLabel(order.paymentMethod)}</span>
                        </div>
                        <div className="text-right">
                          {order.discount > 0 && (
                            <p className="text-xs text-emerald-400">
                              -{formatLocalAmount(order.discount, { absolute: true })} {t('discount', 'خصم')}
                            </p>
                          )}
                          <p className="text-lg font-bold text-emerald-400">
                            {formatLocalAmount(order.finalPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-emerald-800/20">
                    {order.status === 'completed' && (
                      <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('Reorder', 'إعادة الطلب')}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {t('View Details', 'عرض التفاصيل')}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white">{t('No orders found', 'لا توجد طلبات')}</h3>
            <p className="text-sm text-white/50 mt-1">
              {t('Recharge WAHO to see your orders here', 'اشحن WAHO لرؤية طلباتك هنا')}
            </p>
            <Link href="/">
              <Button className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-600">
                {t('Browse WAHO top-ups', 'تصفح شحن WAHO', '浏览 WAHO 充值')}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
