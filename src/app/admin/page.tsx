'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  promotions,
} from '@/data/mock-data';
import type { DashboardStats, Game, Order, Provider, User, WalletTransaction } from '@/types';
import { shouldLoadAdminSummary } from './admin-access';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Wallet,
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Download,
  MessageCircle,
  TicketPercent,
  Globe,
  Bell,
  Menu,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Server,
  Zap,
} from 'lucide-react';

export default function AdminDashboard() {
  const { t, language, dir, user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalOrders: 0,
    completedOrders: 0,
    failedOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    avgOrderValue: 0,
    conversionRate: 0,
    refundRate: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Game[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [adminError, setAdminError] = useState<string | null>(null);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      if (!user) {
        setAdminError(t('Please login as an admin to view this dashboard.', 'يرجى تسجيل الدخول كمسؤول لعرض لوحة التحكم.', '请以管理员身份登录以查看此仪表板。'));
        return;
      }

      if (!shouldLoadAdminSummary(user)) {
        setAdminError(t('Admin access is required to view this dashboard.', 'تحتاج إلى صلاحيات المسؤول لعرض لوحة التحكم.', '需要管理员权限才能查看此仪表板。'));
        return;
      }

      const response = await fetch('/api/admin/summary', { credentials: 'include' });
      const payload = await response.json().catch(() => null);

      if (!active) return;

      if (!response.ok) {
        setAdminError(payload?.error ?? 'Admin data unavailable');
        return;
      }

      setDashboardStats(payload.stats);
      setOrders(payload.orders ?? []);
      setProducts(payload.products ?? []);
      setProviders(payload.providers ?? []);
      setUsers(payload.users ?? []);
      setWalletTransactions(payload.walletTransactions ?? []);
      setAdminError(null);
    }

    void loadSummary();

    return () => {
      active = false;
    };
  }, [t, user]);

  const revenueData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      date.setHours(0, 0, 0, 0);
      return {
        date: date.toISOString(),
        revenue: 0,
        orders: 0,
        refunds: 0,
      };
    });

    for (const order of orders) {
      const day = days.find((item) => item.date.slice(0, 10) === order.createdAt.slice(0, 10));
      if (!day) continue;
      day.orders += 1;
      if (order.paymentStatus === 'completed') day.revenue += order.finalPrice;
      if (order.status === 'refunded') day.refunds += 1;
    }

    return days;
  }, [orders]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'online':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'processing':
      case 'degraded':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'failed':
      case 'offline':
      case 'refunded':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pending: { en: 'Pending', ar: 'قيد الانتظار' },
      processing: { en: 'Processing', ar: 'قيد المعالجة' },
      completed: { en: 'Completed', ar: 'مكتمل' },
      failed: { en: 'Failed', ar: 'فشل' },
      refunded: { en: 'Refunded', ar: 'مسترد' },
      cancelled: { en: 'Cancelled', ar: 'ملغي' },
      online: { en: 'online', ar: 'متصل' },
      offline: { en: 'offline', ar: 'غير متصل' },
      degraded: { en: 'degraded', ar: 'متذبذب' },
    };

    return t(labels[status]?.en ?? status, labels[status]?.ar ?? status);
  };

  const getOrderGameName = (order: Order) => {
    const game = products.find(item => item.id === order.gameId);
    return game ? t(game.name, game.nameAr) : t(order.gameName, order.gameName);
  };

  const getOrderPackageName = (order: Order) => {
    const game = products.find(item => item.id === order.gameId);
    const gamePackage = game?.packages.find(item => item.id === order.packageId);
    return gamePackage ? t(gamePackage.name, gamePackage.nameAr) : t(order.packageName, order.packageName);
  };

  const getPaymentMethodLabel = (method: string) => {
    return t(method, method);
  };

  const sidebarItems = [
    { id: 'overview', icon: LayoutDashboard, label: t('Overview', 'نظرة عامة') },
    { id: 'orders', icon: ShoppingCart, label: t('Orders', 'الطلبات') },
    { id: 'products', icon: MessageCircle, label: t('Top-up amounts', 'مبالغ الشحن', '充值金额') },
    { id: 'users', icon: Users, label: t('Users', 'المستخدمين') },
    { id: 'providers', icon: Server, label: t('Providers', 'الموردين') },
    { id: 'promotions', icon: TicketPercent, label: t('WAHO Offers', 'عروض WAHO') },
    { id: 'wallets', icon: Wallet, label: t('Wallets', 'المحافظ') },
    { id: 'reports', icon: TrendingUp, label: t('Reports', 'التقارير') },
    { id: 'settings', icon: Settings, label: t('Settings', 'الإعدادات') },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-emerald-800/30 bg-slate-950/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 h-16">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-emerald-900/50"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white p-1 overflow-hidden ring-1 ring-blue-900/10">
                <img
                  src="/brand/alwasl-mark.jpg"
                  alt={t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-sm font-bold text-white">{t('Admin Dashboard', 'لوحة التحكم')}</h1>
                <p className="hidden truncate text-[10px] text-amber-300/80 sm:block">{t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input
                placeholder={t('Search...', 'بحث...')}
                className="w-64 pl-10 bg-slate-800/50 border-emerald-800/30 text-white text-sm"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative flex-shrink-0 text-white hover:bg-emerald-900/50">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                <Globe className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('View Site', 'عرض الموقع')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] bg-slate-900/50 border-r border-emerald-800/30 transition-all duration-300 md:block ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-white/70 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`min-w-0 flex-1 p-4 transition-all duration-300 sm:p-6 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
          {adminError && (
            <Card className="mb-6 border-rose-500/30 bg-rose-500/10 p-4">
              <p className="text-sm text-rose-200">{adminError}</p>
            </Card>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: t('Total Revenue', 'إجمالي الإيرادات'),
                    value: formatCurrency(dashboardStats.totalRevenue),
                    suffix: 'IQD',
                    change: '+12.5%',
                    trend: 'up',
                    icon: DollarSign,
                  },
                  {
                    label: t('Total Orders', 'إجمالي الطلبات'),
                    value: formatCurrency(dashboardStats.totalOrders),
                    change: '+8.2%',
                    trend: 'up',
                    icon: ShoppingCart,
                  },
                  {
                    label: t('Active Users', 'المستخدمين النشطين'),
                    value: formatCurrency(dashboardStats.activeUsers),
                    change: '+15.3%',
                    trend: 'up',
                    icon: Users,
                  },
                  {
                    label: t('Refund Rate', 'معدل الاسترداد'),
                    value: `${dashboardStats.refundRate}%`,
                    change: '-0.5%',
                    trend: 'down',
                    icon: RefreshCw,
                  },
                ].map((stat, i) => (
                  <Card key={i} className="bg-slate-900/50 border-emerald-800/20 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-white/50">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {stat.value}
                          {stat.suffix && <span className="text-sm text-white/50 ml-1">{stat.suffix}</span>}
                        </p>
                      </div>
                      <div className={`p-2 rounded-lg ${stat.trend === 'up' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        <stat.icon className={`w-5 h-5 ${stat.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-400" />
                      )}
                      <span className={`text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {stat.change}
                      </span>
                      <span className="text-xs text-white/30">{t('vs last month', 'مقارنة بالشهر الماضي')}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 bg-slate-900/50 border-emerald-800/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">{t('Revenue Overview', 'نظرة عامة على الإيرادات')}</h3>
                    <Button variant="outline" size="sm" className="border-emerald-500/30 text-emerald-400">
                      <Download className="w-4 h-4 mr-2" />
                      {t('Export', 'تصدير')}
                    </Button>
                  </div>
                  <div className="h-64 flex items-end gap-2">
                    {revenueData.map((data, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all hover:opacity-80"
                          style={{ height: `${(data.revenue / 25000000) * 100}%` }}
                        />
                        <span className="text-[10px] text-white/50">
                          {new Date(data.date).toLocaleDateString(locale, { weekday: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Provider Status */}
                <Card className="bg-slate-900/50 border-emerald-800/20 p-6">
                  <h3 className="text-lg font-bold text-white mb-4">{t('Provider Status', 'حالة الموردين')}</h3>
                  <div className="space-y-4">
                    {providers.map((provider) => (
                      <div key={provider.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            provider.status === 'online' ? 'bg-emerald-400' :
                            provider.status === 'degraded' ? 'bg-amber-400' : 'bg-rose-400'
                          }`} />
                          <span className="text-sm text-white">{t(provider.name, provider.name)}</span>
                        </div>
                        <Badge variant="outline" className={getStatusColor(provider.status)}>
                          {getStatusLabel(provider.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="bg-slate-900/50 border-emerald-800/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">{t('Recent Orders', 'الطلبات الأخيرة')}</h3>
                  <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
                    {t('View All', 'عرض الكل')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-white/50">{t('Order ID', 'رقم الطلب')}</TableHead>
                      <TableHead className="text-white/50">{t('WAHO Top-Up', 'شحن WAHO', 'WAHO 充值')}</TableHead>
                      <TableHead className="text-white/50">{t('Amount', 'المبلغ')}</TableHead>
                      <TableHead className="text-white/50">{t('Status', 'الحالة')}</TableHead>
                      <TableHead className="text-white/50">{t('Date', 'التاريخ')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="border-emerald-800/20">
                        <TableCell className="font-mono text-sm text-white">{order.id}</TableCell>
                        <TableCell className="text-white">{getOrderGameName(order)}</TableCell>
                        <TableCell className="text-emerald-400 font-medium">
                          {formatCurrency(order.finalPrice)} IQD
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/50 text-sm">{formatDate(order.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{t('Orders Management', 'إدارة الطلبات')}</h2>
                <div className="flex items-center gap-3">
                  <Button variant="outline" className="border-emerald-500/30 text-emerald-400">
                    <Filter className="w-4 h-4 mr-2" />
                    {t('Filter', 'تصفية')}
                  </Button>
                  <Button variant="outline" className="border-emerald-500/30 text-emerald-400">
                    <Download className="w-4 h-4 mr-2" />
                    {t('Export', 'تصدير')}
                  </Button>
                </div>
              </div>

              <Card className="bg-slate-900/50 border-emerald-800/20 p-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-white/50">{t('Order ID', 'رقم الطلب')}</TableHead>
                      <TableHead className="text-white/50">{t('WAHO Top-Up', 'شحن WAHO', 'WAHO 充值')}</TableHead>
                      <TableHead className="text-white/50">{t('Top-up amount', 'مبلغ الشحن', '充值金额')}</TableHead>
                      <TableHead className="text-white/50">{t('WAHO ID', 'معرف WAHO')}</TableHead>
                      <TableHead className="text-white/50">{t('Amount', 'المبلغ')}</TableHead>
                      <TableHead className="text-white/50">{t('Payment', 'الدفع')}</TableHead>
                      <TableHead className="text-white/50">{t('Status', 'الحالة')}</TableHead>
                      <TableHead className="text-white/50">{t('Date', 'التاريخ')}</TableHead>
                      <TableHead className="text-white/50">{t('Actions', 'الإجراءات')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="border-emerald-800/20">
                        <TableCell className="font-mono text-sm text-white">{order.id}</TableCell>
                        <TableCell className="text-white">{getOrderGameName(order)}</TableCell>
                        <TableCell className="text-emerald-400">{getOrderPackageName(order)}</TableCell>
                        <TableCell className="text-white/70">{order.gameUserId || '-'}</TableCell>
                        <TableCell className="text-emerald-400 font-medium">
                          {formatCurrency(order.finalPrice)} IQD
                        </TableCell>
                        <TableCell className="text-white/70">{getPaymentMethodLabel(order.paymentMethod)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white/50 text-sm">{formatDate(order.createdAt)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
                            {t('View', 'عرض')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{t('WAHO Top-Up Amounts', 'إدارة مبالغ شحن WAHO', 'WAHO 充值金额管理')}</h2>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('Add top-up amount', 'إضافة مبلغ شحن', '添加充值金额')}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.slice(0, 6).map((game) => (
                  <Card key={game.id} className="bg-slate-900/50 border-emerald-800/20 p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden">
                        <img src={game.image} alt={t(game.name, game.nameAr)} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{t(game.name, game.nameAr)}</h3>
                        <p className="text-xs text-white/50">{t(game.publisher, game.publisher)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                            {game.packages.length} {t('top-up amounts', 'مبالغ شحن', '充值金额')}
                          </Badge>
                          {game.isPopular && (
                            <Badge className="text-[10px] bg-amber-500/20 text-amber-400 border-0">
                              {t('Popular', 'شائع')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{t('Delivery Partners', 'شركاء التسليم')}</h2>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  <Server className="w-4 h-4 mr-2" />
                  {t('Add Provider', 'إضافة مورد')}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <Card key={provider.id} className="bg-slate-900/50 border-emerald-800/20 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{t(provider.name, provider.name)}</h3>
                        <p className="text-xs text-white/50">{t('Connected top-up route', 'مسار شحن متصل')}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(provider.status)}>
                        {getStatusLabel(provider.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-white/50">{t('Success Rate', 'معدل النجاح')}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={provider.successRate} className="h-2" />
                          <span className="text-sm text-emerald-400">{provider.successRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-white/50">{t('Avg Response', 'متوسط الاستجابة')}</p>
                        <p className="text-sm text-white mt-1">{provider.avgResponseTime}s</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-emerald-800/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">{t('Priority:', 'الأولوية:')}</span>
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                          #{provider.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">{t('Active:', 'نشط:')}</span>
                        <Switch checked={provider.isActive} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'promotions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{t('Promotions', 'العروض')}</h2>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                  <TicketPercent className="w-4 h-4 mr-2" />
                  {t('Create Promotion', 'إنشاء عرض')}
                </Button>
              </div>

              <Card className="bg-slate-900/50 border-emerald-800/20 p-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-white/50">{t('Code', 'الكود')}</TableHead>
                      <TableHead className="text-white/50">{t('Type', 'النوع')}</TableHead>
                      <TableHead className="text-white/50">{t('Value', 'القيمة')}</TableHead>
                      <TableHead className="text-white/50">{t('Usage', 'الاستخدام')}</TableHead>
                      <TableHead className="text-white/50">{t('Valid Until', 'صالح حتى')}</TableHead>
                      <TableHead className="text-white/50">{t('Status', 'الحالة')}</TableHead>
                      <TableHead className="text-white/50">{t('Actions', 'الإجراءات')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promo) => (
                      <TableRow key={promo.id} className="border-emerald-800/20">
                        <TableCell className="font-mono font-bold text-emerald-400">{promo.code}</TableCell>
                        <TableCell className="text-white">{promo.type === 'percentage' ? '%' : t('Fixed', 'مبلغ ثابت')}</TableCell>
                        <TableCell className="text-white">
                          {promo.type === 'percentage' ? `${promo.value}%` : `${formatCurrency(promo.value)} IQD`}
                        </TableCell>
                        <TableCell className="text-white/70">
                          {promo.usedCount} / {promo.usageLimit}
                        </TableCell>
                        <TableCell className="text-white/50 text-sm">
                          {new Date(promo.endDate).toLocaleDateString(locale)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={promo.isActive ? getStatusColor('completed') : getStatusColor('failed')}>
                            {promo.isActive ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch checked={promo.isActive} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">{t('Users', 'المستخدمين')}</h2>
              <Card className="bg-slate-900/50 border-emerald-800/20 p-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-white/50">{t('Name', 'الاسم')}</TableHead>
                      <TableHead className="text-white/50">{t('Phone Number', 'رقم الهاتف')}</TableHead>
                      <TableHead className="text-white/50">{t('Wallet', 'المحفظة')}</TableHead>
                      <TableHead className="text-white/50">{t('Total Spent', 'إجمالي الإنفاق')}</TableHead>
                      <TableHead className="text-white/50">{t('Last Login', 'آخر دخول')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((account) => (
                      <TableRow key={account.id} className="border-emerald-800/20">
                        <TableCell className="text-white">{account.name}</TableCell>
                        <TableCell className="text-white/70">{account.phone}</TableCell>
                        <TableCell className="text-emerald-400">{formatCurrency(account.walletBalance)} IQD</TableCell>
                        <TableCell className="text-white/70">{formatCurrency(account.totalSpent)} IQD</TableCell>
                        <TableCell className="text-white/50 text-sm">{formatDate(account.lastLogin)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'wallets' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">{t('Wallets', 'المحافظ')}</h2>
              <Card className="bg-slate-900/50 border-emerald-800/20 p-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-white/50">{t('Reference', 'المرجع')}</TableHead>
                      <TableHead className="text-white/50">{t('Description', 'الوصف')}</TableHead>
                      <TableHead className="text-white/50">{t('Amount', 'المبلغ')}</TableHead>
                      <TableHead className="text-white/50">{t('Balance', 'الرصيد')}</TableHead>
                      <TableHead className="text-white/50">{t('Date', 'التاريخ')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-emerald-800/20">
                        <TableCell className="font-mono text-xs text-white/70">{transaction.reference ?? transaction.id}</TableCell>
                        <TableCell className="text-white">{t(transaction.description, transaction.descriptionAr)}</TableCell>
                        <TableCell className={transaction.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)} IQD
                        </TableCell>
                        <TableCell className="text-white/70">{formatCurrency(transaction.balance)} IQD</TableCell>
                        <TableCell className="text-white/50 text-sm">{formatDate(transaction.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'orders' && activeTab !== 'products' && activeTab !== 'providers' && activeTab !== 'promotions' && activeTab !== 'users' && activeTab !== 'wallets' && (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <Activity className="w-10 h-10 text-white/20" />
              </div>
              <h3 className="text-xl font-semibold text-white">{t('Coming Soon', 'قريباً')}</h3>
              <p className="text-sm text-white/50 mt-1">
                {t('This section is under development', 'هذا القسم قيد التطوير')}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
