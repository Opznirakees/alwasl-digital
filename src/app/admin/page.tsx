'use client';

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { CountryPricingMap } from '@/components/admin/CountryPricingMap';
import { AccessBlockManager } from '@/components/admin/AccessBlockManager';
import { ContentManager } from '@/components/admin/ContentManager';
import { CatalogCategoryManager } from '@/components/admin/CatalogCategoryManager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Banner, CatalogCategory, Country, CustomPricingRule, DashboardStats, ExchangeRate, Game, ManualDeposit, MonitoringDashboard, Order, Promotion, Provider, ProviderBalanceAlert, User, WalletTransaction } from '@/types';
import { shouldLoadAdminSummary } from './admin-access';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Banknote,
  Wallet,
  TrendingUp,
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
  Megaphone,
  Globe,
  Bell,
  Menu,
  X,
  ChevronRight,
  Plus,
  Trash2,
  Activity,
  Server,
  Zap,
  Ban,
  FilePenLine,
  Layers3,
} from 'lucide-react';

type AdminRoleValue = 'USER' | 'ADMIN' | 'STAFF';
type StaffRoleValue = 'OWNER' | 'OPERATIONS' | 'SUPPORT' | 'FINANCE' | 'MARKETING' | 'VIEWER';
type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

function currentMinuteForInput() {
  const now = new Date();
  now.setSeconds(0, 0);
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

interface AdminReportBucket {
  key: string;
  label: string;
  start: string;
  end: string;
  orders: number;
  completedOrders: number;
  failedOrders: number;
  refundedOrders: number;
  revenue: number;
  walletRevenue: number;
  externalPaymentRevenue: number;
  manualDeposits: number;
  manualDepositAmount: number;
  newUsers: number;
}

interface AdminReportPayload {
  period: ReportPeriod;
  from: string;
  to: string;
  summary: {
    orders: number;
    completedOrders: number;
    failedOrders: number;
    refundedOrders: number;
    revenue: number;
    walletRevenue: number;
    externalPaymentRevenue: number;
    manualDeposits: number;
    manualDepositAmount: number;
    newUsers: number;
    avgOrderValue: number;
    conversionRate: number;
    refundRate: number;
  };
  buckets: AdminReportBucket[];
}

const staffRoleOptions: StaffRoleValue[] = ['OPERATIONS', 'SUPPORT', 'FINANCE', 'MARKETING', 'VIEWER', 'OWNER'];
const reportPeriodOptions: ReportPeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];

function utcDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function getReportWindow(period: ReportPeriod) {
  const now = new Date();
  const today = startOfUtcDay(now);

  if (period === 'daily') {
    return { from: utcDateOnly(addUtcDays(today, -13)), to: utcDateOnly(addUtcDays(today, 1)) };
  }

  if (period === 'weekly') {
    const day = today.getUTCDay() || 7;
    const currentWeek = addUtcDays(today, 1 - day);
    return { from: utcDateOnly(addUtcDays(currentWeek, -49)), to: utcDateOnly(addUtcDays(currentWeek, 7)) };
  }

  if (period === 'monthly') {
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return {
      from: utcDateOnly(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1))),
      to: utcDateOnly(new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1))),
    };
  }

  return {
    from: utcDateOnly(new Date(Date.UTC(now.getUTCFullYear() - 4, 0, 1))),
    to: utcDateOnly(new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1))),
  };
}

export default function AdminDashboard() {
  const { t, language, dir, user, isAccountLoading } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerBalanceAlerts, setProviderBalanceAlerts] = useState<ProviderBalanceAlert[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [customPricingRules, setCustomPricingRules] = useState<CustomPricingRule[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [manualDeposits, setManualDeposits] = useState<ManualDeposit[]>([]);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('daily');
  const [adminReport, setAdminReport] = useState<AdminReportPayload | null>(null);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [monitoringDashboard, setMonitoringDashboard] = useState<MonitoringDashboard | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isMonitoringLoading, setIsMonitoringLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);
  const [providerDialogOpen, setProviderDialogOpen] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [promotionDialogOpen, setPromotionDialogOpen] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [monitoringDialogOpen, setMonitoringDialogOpen] = useState(false);
  const [pendingAccessBlockValue, setPendingAccessBlockValue] = useState<string | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [fulfillmentOrder, setFulfillmentOrder] = useState<Order | null>(null);
  const [fulfillmentCode, setFulfillmentCode] = useState('');
  const [fulfillmentNote, setFulfillmentNote] = useState('');
  const [topupForm, setTopupForm] = useState({
    productId: 'waho-top-up',
    amount: '10000',
    basePrice: '10000',
    salePrice: '',
    inStock: true,
    isPopular: false,
    name: '',
    nameAr: '',
    unit: 'balance',
    unitAr: 'رصيد',
  });
  const [productForm, setProductForm] = useState({
    slug: '',
    name: '',
    nameAr: '',
    nameZh: '',
    description: '',
    descriptionAr: '',
    descriptionZh: '',
    image: '/brand/alwasl-mark.jpg',
    banner: '/brand/recharge-hero-v3.webp',
    category: 'TOP_UP',
    catalogCategoryId: 'waho',
    fulfillmentMode: 'MANUAL_TOPUP',
    requiresUserId: true,
    publisher: 'Al-Wasl Digital',
    userIdLabel: 'Account ID',
    userIdLabelAr: 'معرف الحساب',
    userIdPlaceholder: 'Enter the account ID',
    userIdPlaceholderAr: 'أدخل معرف الحساب',
    countries: 'iq,sa,ae,eg,jo,kw',
    isActive: false,
  });
  const [providerForm, setProviderForm] = useState({
    name: 'WAHO provider route',
    type: 'WAHA_WHATSAPP',
    apiEndpoint: '',
    priority: '10',
    balance: '0',
    lowBalanceThreshold: '0',
    isActive: false,
  });
  const [pricingForm, setPricingForm] = useState({
    name: 'Distributor WAHO price',
    targetType: 'DISTRIBUTOR',
    priceType: 'FIXED_PRICE',
    value: '0',
    productId: 'waho-top-up',
    packageId: '',
    userId: '',
    priority: '20',
    isActive: true,
    applyMembershipDiscount: false,
  });
  const [promotionForm, setPromotionForm] = useState({
    code: 'WAHO10',
    type: 'percentage',
    value: '10',
    minPurchase: '5000',
    maxDiscount: '',
    usageLimit: '100',
    endDate: '2026-12-31T23:59',
    isActive: true,
  });
  const [bannerForm, setBannerForm] = useState({
    title: 'Recharge your digital balance',
    titleAr: 'اشحن رصيدك الرقمي',
    titleZh: '为数字余额充值',
    subtitle: 'Choose a category and see the right price for your country.',
    subtitleAr: 'اختر الفئة وشاهد السعر المناسب لبلدك.',
    subtitleZh: '选择分类，查看适合您所在国家的价格。',
    image: '/brand/recharge-hero-v3.webp',
    mobileImage: '',
    link: '/#categories',
    gameId: '',
    startDate: '2026-01-01T00:00',
    endDate: '2026-12-31T23:59',
    isActive: true,
    order: '1',
  });
  const [exchangeRateForm, setExchangeRateForm] = useState({
    baseCurrencyCode: 'USD',
    quoteCurrencyCode: 'IQD',
    rate: '1310',
    effectiveFrom: currentMinuteForInput(),
    note: '',
    isActive: true,
  });
  const [monitoringForm, setMonitoringForm] = useState({
    name: 'Al-Wasl production health',
    url: '',
    method: 'GET',
    expectedStatus: '200',
    timeoutMs: '5000',
    intervalMinutes: '5',
    isActive: true,
  });
  const [monitoringSettingsForm, setMonitoringSettingsForm] = useState({
    logRetentionDays: '30',
    uptimeEnabled: true,
  });
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';

  const reloadSummary = useCallback(async (shouldApply: () => boolean = () => true) => {
    if (isAccountLoading) return;

    setIsSummaryLoading(true);
    if (!user) {
      setAdminError(t('Please login as an admin to view this dashboard.', 'يرجى تسجيل الدخول كمسؤول لعرض لوحة التحكم.', '请以管理员身份登录以查看此仪表板。'));
      setIsSummaryLoading(false);
      return;
    }

    if (!shouldLoadAdminSummary(user)) {
      setAdminError(t('Admin access is required to view this dashboard.', 'تحتاج إلى صلاحيات المسؤول لعرض لوحة التحكم.', '需要管理员权限才能查看此仪表板。'));
      setIsSummaryLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/summary', { credentials: 'include' });
      const payload = await response.json().catch(() => null);

      if (!shouldApply()) return;

      if (!response.ok) {
        setAdminError(payload?.error ?? t('Admin dashboard data could not be loaded.', 'تعذر تحميل بيانات لوحة التحكم.', '无法加载管理仪表板数据。'));
        return;
      }

      setDashboardStats(payload.stats);
      setOrders(payload.orders ?? []);
      setProducts(payload.products ?? []);
      setCategories(payload.categories ?? []);
      setProviders(payload.providers ?? []);
      setProviderBalanceAlerts(payload.providerBalanceAlerts ?? []);
      setPromotions(payload.promotions ?? []);
      setCustomPricingRules(payload.customPricingRules ?? []);
      setBanners(payload.banners ?? []);
      setCountries(payload.countries ?? []);
      setExchangeRates(payload.exchangeRates ?? []);
      setUsers(payload.users ?? []);
      setWalletTransactions(payload.walletTransactions ?? []);
      setManualDeposits(payload.manualDeposits ?? []);
      setAdminError(null);
    } catch {
      if (!shouldApply()) return;
      setAdminError(t('Admin dashboard data could not be loaded.', 'تعذر تحميل بيانات لوحة التحكم.', '无法加载管理仪表板数据。'));
    } finally {
      if (shouldApply()) setIsSummaryLoading(false);
    }
  }, [isAccountLoading, t, user]);

  useEffect(() => {
    let active = true;

    void reloadSummary(() => active);

    return () => {
      active = false;
    };
  }, [reloadSummary]);

  const loadAdminReport = useCallback(async (
    period: ReportPeriod = reportPeriod,
    shouldApply: () => boolean = () => true
  ) => {
    if (!user || !shouldLoadAdminSummary(user)) return;

    const range = getReportWindow(period);
    const params = new URLSearchParams({
      period,
      from: range.from,
      to: range.to,
    });

    setIsReportLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?${params.toString()}`, { credentials: 'include' });
      const payload = await response.json().catch(() => null) as { report?: AdminReportPayload; error?: string } | null;

      if (!shouldApply()) return;

      if (!response.ok || !payload?.report) {
        setAdminError(payload?.error ?? 'Report data unavailable');
        return;
      }

      setAdminReport(payload.report);
      setAdminError(null);
    } catch (error) {
      if (!shouldApply()) return;
      const message = error instanceof Error ? error.message : 'Report data unavailable';
      setAdminError(message);
    } finally {
      if (shouldApply()) setIsReportLoading(false);
    }
  }, [reportPeriod, user]);

  useEffect(() => {
    if (activeTab !== 'reports') return;

    let active = true;
    void loadAdminReport(reportPeriod, () => active);

    return () => {
      active = false;
    };
  }, [activeTab, loadAdminReport, reportPeriod]);

  const loadAdminMonitoring = useCallback(async (shouldApply: () => boolean = () => true) => {
    if (!user || !shouldLoadAdminSummary(user)) return;

    setIsMonitoringLoading(true);
    try {
      const response = await fetch('/api/admin/monitoring', { credentials: 'include' });
      const payload = await response.json().catch(() => null) as { monitoring?: MonitoringDashboard; error?: string } | null;

      if (!shouldApply()) return;

      if (!response.ok || !payload?.monitoring) {
        setAdminError(payload?.error ?? 'Monitoring data unavailable');
        return;
      }

      setMonitoringDashboard(payload.monitoring);
      setMonitoringSettingsForm({
        logRetentionDays: String(payload.monitoring.settings.logRetentionDays),
        uptimeEnabled: payload.monitoring.settings.uptimeEnabled,
      });
      setMonitoringForm((current) => ({
        ...current,
        url: current.url || payload.monitoring?.external.healthEndpoint || '',
      }));
      setAdminError(null);
    } catch (error) {
      if (!shouldApply()) return;
      const message = error instanceof Error ? error.message : 'Monitoring data unavailable';
      setAdminError(message);
    } finally {
      if (shouldApply()) setIsMonitoringLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab !== 'monitoring') return;

    let active = true;
    void loadAdminMonitoring(() => active);

    return () => {
      active = false;
    };
  }, [activeTab, loadAdminMonitoring]);

  const retryAdminData = () => {
    if (activeTab === 'reports') return loadAdminReport(reportPeriod);
    if (activeTab === 'monitoring') return loadAdminMonitoring();
    return reloadSummary();
  };

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

  const revenueMax = useMemo(
    () => Math.max(1, ...revenueData.map((data) => data.revenue)),
    [revenueData]
  );

  const reportMaxRevenue = useMemo(() => (
    Math.max(1, ...(adminReport?.buckets.map((bucket) => bucket.revenue) ?? [0]))
  ), [adminReport]);

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

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  async function adminJsonRequest<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      ...init,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? 'Admin action failed');
    return payload as T;
  }

  async function runAdminMutation(action: () => Promise<void>) {
    setIsMutating(true);
    try {
      await action();
      await reloadSummary();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Admin action failed';
      setAdminError(message);
      toast.error(message);
    } finally {
      setIsMutating(false);
    }
  }

  async function runMonitoringMutation(action: () => Promise<void>) {
    setIsMutating(true);
    try {
      await action();
      await loadAdminMonitoring();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Monitoring action failed';
      setAdminError(message);
      toast.error(message);
    } finally {
      setIsMutating(false);
    }
  }

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAdminMutation(async () => {
      await adminJsonRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          slug: productForm.slug,
          name: productForm.name,
          nameAr: productForm.nameAr,
          nameZh: productForm.nameZh,
          description: productForm.description,
          descriptionAr: productForm.descriptionAr,
          descriptionZh: productForm.descriptionZh,
          image: productForm.image,
          banner: productForm.banner,
          category: productForm.category,
          catalogCategoryId: productForm.catalogCategoryId,
          fulfillmentMode: productForm.fulfillmentMode,
          publisher: productForm.publisher,
          requiresUserId: productForm.requiresUserId,
          userIdLabel: productForm.userIdLabel,
          userIdLabelAr: productForm.userIdLabelAr,
          userIdPlaceholder: productForm.userIdPlaceholder,
          userIdPlaceholderAr: productForm.userIdPlaceholderAr,
          countries: productForm.countries.split(',').map((country) => country.trim().toLowerCase()).filter(Boolean),
          isActive: productForm.isActive,
          isFeatured: false,
          isPopular: false,
        }),
      });
      setProductDialogOpen(false);
      setProductForm((current) => ({
        ...current,
        slug: '',
        name: '',
        nameAr: '',
        nameZh: '',
        description: '',
        descriptionAr: '',
        descriptionZh: '',
        isActive: false,
      }));
      toast.success(t('Product saved', 'تم حفظ المنتج', '产品已保存'));
    });
  }

  async function createTopupPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const product = products.find((item) => item.id === topupForm.productId) ?? products.find((item) => item.id === 'waho-top-up') ?? products[0];
    if (!product) return;

    await runAdminMutation(async () => {
      await adminJsonRequest('/api/admin/topup-packages', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id,
          name: topupForm.name || undefined,
          nameAr: topupForm.nameAr || undefined,
          amount: Number(topupForm.amount),
          unit: topupForm.unit,
          unitAr: topupForm.unitAr,
          basePrice: Number(topupForm.basePrice || topupForm.amount),
          salePrice: topupForm.salePrice ? Number(topupForm.salePrice) : null,
          inStock: topupForm.inStock,
          isPopular: topupForm.isPopular,
        }),
      });
      setTopupDialogOpen(false);
      toast.success(t('Top-up amount saved', 'تم حفظ مبلغ الشحن', '充值金额已保存'));
    });
  }

  async function updateTopupPackage(packageId: string, payload: Record<string, unknown>) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/topup-packages/${packageId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast.success(t('Top-up amount updated', 'تم تحديث مبلغ الشحن', '充值金额已更新'));
    });
  }

  async function createCustomPricingRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAdminMutation(async () => {
      await adminJsonRequest('/api/admin/pricing-rules', {
        method: 'POST',
        body: JSON.stringify({
          name: pricingForm.name,
          targetType: pricingForm.targetType,
          priceType: pricingForm.priceType,
          value: Number(pricingForm.value),
          productId: pricingForm.productId || null,
          packageId: pricingForm.packageId || null,
          userId: pricingForm.targetType === 'USER' ? pricingForm.userId || null : null,
          priority: Number(pricingForm.priority),
          isActive: pricingForm.isActive,
          applyMembershipDiscount: pricingForm.applyMembershipDiscount,
        }),
      });
      setPricingDialogOpen(false);
      toast.success(t('Pricing rule saved', 'تم حفظ قاعدة التسعير', '价格规则已保存'));
    });
  }

  async function updateCustomPricingRule(ruleId: string, payload: Record<string, unknown>) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/pricing-rules/${ruleId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast.success(t('Pricing rule updated', 'تم تحديث قاعدة التسعير', '价格规则已更新'));
    });
  }

  async function toggleProductActive(productId: string, isActive: boolean) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      toast.success(t('Product status updated', 'تم تحديث حالة المنتج', '产品状态已更新'));
    });
  }

  async function createProviderAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAdminMutation(async () => {
      await adminJsonRequest('/api/admin/providers', {
        method: 'POST',
        body: JSON.stringify({
          name: providerForm.name,
          type: providerForm.type,
          apiEndpoint: providerForm.apiEndpoint,
          priority: Number(providerForm.priority),
          balance: Number(providerForm.balance),
          lowBalanceThreshold: Number(providerForm.lowBalanceThreshold),
          isActive: providerForm.isActive,
          supportedProducts: ['waho-top-up'],
        }),
      });
      setProviderDialogOpen(false);
      toast.success(t('Provider route saved', 'تم حفظ مسار المورد', '供应商路线已保存'));
    });
  }

  async function toggleProviderActive(providerId: string, isActive: boolean) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/providers/${providerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      toast.success(t('Provider status updated', 'تم تحديث حالة المورد', '供应商状态已更新'));
    });
  }

  function localDateTimeToIso(value: string) {
    return new Date(value).toISOString();
  }

  async function createPromotion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAdminMutation(async () => {
      await adminJsonRequest('/api/admin/promotions', {
        method: 'POST',
        body: JSON.stringify({
          code: promotionForm.code.trim().toUpperCase(),
          type: promotionForm.type,
          value: Number(promotionForm.value),
          minPurchase: Number(promotionForm.minPurchase),
          maxDiscount: promotionForm.maxDiscount ? Number(promotionForm.maxDiscount) : null,
          usageLimit: Number(promotionForm.usageLimit),
          startDate: new Date().toISOString(),
          endDate: localDateTimeToIso(promotionForm.endDate),
          isActive: promotionForm.isActive,
          applicableGames: ['waho-top-up'],
        }),
      });
      setPromotionDialogOpen(false);
      toast.success(t('Promotion saved', 'تم حفظ العرض', '优惠已保存'));
    });
  }

  async function togglePromotionActive(promotionId: string, isActive: boolean) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/promotions/${promotionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      toast.success(t('Promotion status updated', 'تم تحديث حالة العرض', '优惠状态已更新'));
    });
  }

  async function createBanner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAdminMutation(async () => {
      await adminJsonRequest(editingBannerId ? `/api/admin/banners/${editingBannerId}` : '/api/admin/banners', {
        method: editingBannerId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          title: bannerForm.title,
          titleAr: bannerForm.titleAr,
          titleZh: bannerForm.titleZh,
          subtitle: bannerForm.subtitle,
          subtitleAr: bannerForm.subtitleAr,
          subtitleZh: bannerForm.subtitleZh,
          image: bannerForm.image,
          mobileImage: bannerForm.mobileImage,
          link: bannerForm.link,
          gameId: bannerForm.gameId,
          startDate: localDateTimeToIso(bannerForm.startDate),
          endDate: localDateTimeToIso(bannerForm.endDate),
          isActive: bannerForm.isActive,
          order: Number(bannerForm.order),
        }),
      });
      setBannerDialogOpen(false);
      setEditingBannerId(null);
      toast.success(editingBannerId
        ? t('Banner updated', 'تم تحديث الإعلان', '横幅已更新')
        : t('Banner created', 'تم إنشاء الإعلان', '横幅已创建'));
    });
  }

  function openBannerEditor(banner?: Banner) {
    if (!banner) {
      setEditingBannerId(null);
      setBannerForm((current) => ({
        ...current,
        title: '',
        titleAr: '',
        titleZh: '',
        subtitle: '',
        subtitleAr: '',
        subtitleZh: '',
        mobileImage: '',
        gameId: '',
      }));
      setBannerDialogOpen(true);
      return;
    }

    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title,
      titleAr: banner.titleAr,
      titleZh: banner.titleZh,
      subtitle: banner.subtitle ?? '',
      subtitleAr: banner.subtitleAr ?? '',
      subtitleZh: banner.subtitleZh ?? '',
      image: banner.image,
      mobileImage: banner.mobileImage ?? '',
      link: banner.link ?? '',
      gameId: banner.gameId ?? '',
      startDate: new Date(banner.startDate).toISOString().slice(0, 16),
      endDate: new Date(banner.endDate).toISOString().slice(0, 16),
      isActive: banner.isActive,
      order: String(banner.order),
    });
    setBannerDialogOpen(true);
  }

  async function toggleBannerActive(bannerId: string, isActive: boolean) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/banners/${bannerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      toast.success(t('Banner status updated', 'تم تحديث حالة الإعلان', '横幅状态已更新'));
    });
  }

  async function saveCatalogCategory(
    categoryId: string | null,
    payload: {
      slug?: string;
      name: string;
      nameAr: string;
      nameZh: string;
      description: string;
      descriptionAr: string;
      descriptionZh: string;
      image: string;
      accentColor: string;
      sortOrder: number;
      isActive: boolean;
      priceVisibility: 'PUBLIC' | 'AUTHENTICATED';
    }
  ) {
    let succeeded = false;
    await runAdminMutation(async () => {
      await adminJsonRequest(categoryId ? `/api/admin/categories/${categoryId}` : '/api/admin/categories', {
        method: categoryId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      succeeded = true;
      toast.success(categoryId
        ? t('Category updated', 'تم تحديث الفئة', '分类已更新')
        : t('Category created', 'تم إنشاء الفئة', '分类已创建'));
    });
    return succeeded;
  }

  async function toggleCatalogCategory(category: CatalogCategory, isActive: boolean) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      toast.success(t('Category visibility updated', 'تم تحديث ظهور الفئة', '分类可见性已更新'));
    });
  }

  async function fulfillManualOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fulfillmentOrder) return;

    let succeeded = false;
    await runAdminMutation(async () => {
      const payload = await adminJsonRequest<{ order: Order; retried: boolean }>(
        `/api/admin/orders/${fulfillmentOrder.id}/fulfill`,
        {
          method: 'POST',
          body: JSON.stringify({
            code: fulfillmentCode,
            note: fulfillmentNote,
          }),
        }
      );
      succeeded = true;
      toast.success(payload.retried
        ? t('WhatsApp delivery sent again', 'تمت إعادة الإرسال عبر واتساب', 'WhatsApp 已重新发送')
        : t('Order completed and customer notified', 'اكتمل الطلب وتم إشعار العميل', '订单已完成并通知客户'));
    });

    if (succeeded) {
      setFulfillmentOrder(null);
      setFulfillmentCode('');
      setFulfillmentNote('');
    }
  }

  async function confirmCashOrder(orderId: string) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/orders/${orderId}/cash-payment`, {
        method: 'POST',
        headers: { 'Idempotency-Key': globalThis.crypto.randomUUID() },
      });
      toast.success(t('Cash receipt confirmed', 'تم تأكيد استلام المبلغ النقدي', '现金收款已确认'));
    });
  }

  async function updateExchangeRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runAdminMutation(async () => {
      await adminJsonRequest('/api/admin/exchange-rates', {
        method: 'POST',
        body: JSON.stringify({
          baseCurrencyCode: exchangeRateForm.baseCurrencyCode,
          quoteCurrencyCode: exchangeRateForm.quoteCurrencyCode,
          rate: Number(exchangeRateForm.rate),
          effectiveFrom: new Date(exchangeRateForm.effectiveFrom).toISOString(),
          isActive: exchangeRateForm.isActive,
          note: exchangeRateForm.note,
        }),
      });
      setExchangeRateForm((current) => ({
        ...current,
        effectiveFrom: currentMinuteForInput(),
      }));
      toast.success(t('Exchange rate updated', 'تم تحديث سعر الصرف', '汇率已更新'));
    });
  }

  async function createMonitoringTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runMonitoringMutation(async () => {
      await adminJsonRequest('/api/admin/monitoring', {
        method: 'POST',
        body: JSON.stringify({
          name: monitoringForm.name,
          url: monitoringForm.url,
          method: monitoringForm.method,
          expectedStatus: Number(monitoringForm.expectedStatus),
          timeoutMs: Number(monitoringForm.timeoutMs),
          intervalMinutes: Number(monitoringForm.intervalMinutes),
          isActive: monitoringForm.isActive,
        }),
      });
      setMonitoringDialogOpen(false);
      toast.success(t('Monitoring target saved', 'تم حفظ هدف المراقبة', '监控目标已保存'));
    });
  }

  async function updateMonitoringTarget(targetId: string, payload: Record<string, unknown>) {
    await runMonitoringMutation(async () => {
      await adminJsonRequest(`/api/admin/monitoring/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast.success(t('Monitoring target updated', 'تم تحديث هدف المراقبة', '监控目标已更新'));
    });
  }

  async function deleteMonitoringTarget(targetId: string) {
    await runMonitoringMutation(async () => {
      await adminJsonRequest(`/api/admin/monitoring/${targetId}`, {
        method: 'DELETE',
      });
      toast.success(t('Monitoring target removed', 'تم حذف هدف المراقبة', '监控目标已删除'));
    });
  }

  async function runMonitoringChecks(targetId?: string) {
    await runMonitoringMutation(async () => {
      await adminJsonRequest('/api/admin/monitoring/run', {
        method: 'POST',
        body: JSON.stringify(targetId ? { targetId } : {}),
      });
      toast.success(t('Monitoring checks completed', 'اكتملت فحوصات المراقبة', '监控检查已完成'));
    });
  }

  async function updateMonitoringSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await runMonitoringMutation(async () => {
      await adminJsonRequest('/api/admin/monitoring', {
        method: 'PATCH',
        body: JSON.stringify({
          logRetentionDays: Number(monitoringSettingsForm.logRetentionDays),
          uptimeEnabled: monitoringSettingsForm.uptimeEnabled,
        }),
      });
      toast.success(t('Monitoring settings updated', 'تم تحديث إعدادات المراقبة', '监控设置已更新'));
    });
  }

  async function pruneMonitoringLogs() {
    await runMonitoringMutation(async () => {
      await adminJsonRequest('/api/admin/monitoring/retention', {
        method: 'POST',
      });
      toast.success(t('Old monitoring logs pruned', 'تم حذف سجلات المراقبة القديمة', '旧监控日志已清理'));
    });
  }

  async function toggleCountryActive(countryId: string, isActive: boolean) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/countries/${countryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      toast.success(t('Country status updated', 'تم تحديث حالة البلد', '国家状态已更新'));
    });
  }

  async function toggleUserBlocked(userId: string, isBlocked: boolean) {
    if (isBlocked) {
      const account = users.find((item) => item.id === userId);
      if (!account) return;
      setPendingAccessBlockValue(account.phone);
      setActiveTab('access');
      toast.info(t(
        'Add a clear reason before blocking this customer.',
        'أضف سبباً واضحاً قبل حظر هذا العميل.',
        '封锁该客户前，请填写明确原因。'
      ));
      return;
    }

    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/users/${userId}/block`, {
        method: 'PATCH',
        body: JSON.stringify({
          isBlocked: false,
        }),
      });
      toast.success(t('Customer unblocked', 'تم إلغاء حظر العميل', '客户已解除封锁'));
    });
  }

  async function updateUserAccountType(userId: string, accountType: 'CUSTOMER' | 'DISTRIBUTOR') {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/users/${userId}/account-type`, {
        method: 'PATCH',
        body: JSON.stringify({ accountType }),
      });
      toast.success(t('Account type updated', 'تم تحديث نوع الحساب', '账号类型已更新'));
    });
  }

  async function updateUserPermissions(
    userId: string,
    role: AdminRoleValue,
    staffRole: StaffRoleValue | null,
    staffPermissions: string[] = []
  ) {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/users/${userId}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({
          role,
          staffRole: role === 'STAFF' ? staffRole ?? 'SUPPORT' : null,
          staffPermissions: role === 'STAFF' ? staffPermissions : [],
        }),
      });
      toast.success(t('Access updated', 'تم تحديث الصلاحيات', '权限已更新'));
    });
  }

  async function reviewManualDeposit(depositId: string, status: 'APPROVED' | 'REJECTED') {
    await runAdminMutation(async () => {
      await adminJsonRequest(`/api/admin/manual-deposits/${depositId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          reason: status === 'REJECTED' ? 'Rejected by admin from dashboard' : undefined,
        }),
      });
      toast.success(
        status === 'APPROVED'
          ? t('Manual deposit approved', 'تم اعتماد الإيداع اليدوي', '手动充值已批准')
          : t('Manual deposit rejected', 'تم رفض الإيداع اليدوي', '手动充值已拒绝')
      );
    });
  }

  async function downloadAdminExport(type: 'orders' | 'users' | 'wallets' | 'providers' | 'promotions' | 'banners' | 'currencies' | 'pricing' | 'revenue') {
    try {
      const response = await fetch(`/api/admin/export?type=${type}`, { credentials: 'include' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Export failed');
      }
      const expectedExcelType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes(expectedExcelType)) {
        throw new Error('Export file type is invalid');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alwasl-${type}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      setAdminError(message);
      toast.error(message);
    }
  }

  async function downloadAdminReportExport(period: ReportPeriod = reportPeriod) {
    try {
      const range = getReportWindow(period);
      const params = new URLSearchParams({
        period,
        from: range.from,
        to: range.to,
      });
      const response = await fetch(`/api/admin/reports/export?${params.toString()}`, { credentials: 'include' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Report export failed');
      }
      const expectedExcelType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes(expectedExcelType)) {
        throw new Error('Report export file type is invalid');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `alwasl-report-${period}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Report export failed';
      setAdminError(message);
      toast.error(message);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'online':
      case 'up':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'processing':
      case 'degraded':
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'failed':
      case 'offline':
      case 'refunded':
      case 'down':
      case 'error':
      case 'critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ar: string; zh?: string }> = {
      pending: { en: 'Pending', ar: 'قيد الانتظار', zh: '待处理' },
      processing: { en: 'Processing', ar: 'قيد المعالجة', zh: '处理中' },
      completed: { en: 'Completed', ar: 'مكتمل', zh: '已完成' },
      failed: { en: 'Failed', ar: 'فشل', zh: '失败' },
      refunded: { en: 'Refunded', ar: 'مسترد', zh: '已退款' },
      cancelled: { en: 'Cancelled', ar: 'ملغي', zh: '已取消' },
      online: { en: 'online', ar: 'متصل', zh: '在线' },
      offline: { en: 'offline', ar: 'غير متصل', zh: '离线' },
      degraded: { en: 'degraded', ar: 'متذبذب', zh: '不稳定' },
      up: { en: 'up', ar: 'يعمل', zh: '正常' },
      down: { en: 'down', ar: 'متوقف', zh: '故障' },
      unknown: { en: 'unknown', ar: 'غير معروف', zh: '未知' },
      info: { en: 'info', ar: 'معلومة', zh: '信息' },
      warning: { en: 'warning', ar: 'تحذير', zh: '警告' },
      error: { en: 'error', ar: 'خطأ', zh: '错误' },
      critical: { en: 'critical', ar: 'حرج', zh: '严重' },
    };

    return t(labels[status]?.en ?? status, labels[status]?.ar ?? status, labels[status]?.zh ?? status);
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

  const hasOrderAccountReference = (order: Order) => (
    Boolean(order.gameUserId && order.gameUserId !== 'manual-delivery')
  );

  const getOrderReferenceLabel = (order: Order) => (
    hasOrderAccountReference(order)
      ? t('Account ID', 'معرف الحساب', '账号 ID')
      : t('Delivery', 'التسليم', '交付')
  );

  const getOrderReferenceValue = (order: Order) => (
    hasOrderAccountReference(order)
      ? order.gameUserId
      : t('Through WhatsApp', 'عبر واتساب', '通过 WhatsApp')
  );

  const canManuallyFulfill = (order: Order) => (
    (order.fulfillmentMode === 'manual_code' || order.fulfillmentMode === 'manual_topup') &&
    order.paymentStatus === 'completed' &&
    (order.status === 'processing' || order.status === 'completed')
  );

  const canConfirmCashPayment = (order: Order) => (
    order.paymentMethod === 'cash' &&
    order.paymentStatus === 'pending' &&
    order.status === 'pending'
  );

  const openManualFulfillment = (order: Order) => {
    setFulfillmentOrder(order);
    setFulfillmentCode('');
    setFulfillmentNote(order.fulfillmentNote ?? '');
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, { en: string; ar: string; zh: string }> = {
      wallet: { en: 'Wallet', ar: 'المحفظة', zh: '钱包' },
      zaincash: { en: 'ZainCash', ar: 'زين كاش', zh: 'ZainCash' },
      asiahawala: { en: 'AsiaHawala', ar: 'آسيا حوالة', zh: 'AsiaHawala' },
      card: { en: 'Bank card', ar: 'بطاقة مصرفية', zh: '银行卡' },
      usdt: { en: 'USDT', ar: 'USDT', zh: 'USDT' },
      qicard: { en: 'QiCard', ar: 'QiCard', zh: 'QiCard' },
      cash: { en: 'Cash', ar: 'نقداً', zh: '现金' },
    };
    const label = labels[method];
    return label ? t(label.en, label.ar, label.zh) : method;
  };

  const pricingProduct = products.find((product) => product.id === pricingForm.productId) ?? products[0];
  const pricingPackages = pricingProduct?.packages ?? [];

  const getPricingRuleValue = (rule: CustomPricingRule) => {
    if (rule.priceType === 'percentage_discount') return `${rule.value}%`;
    return `${formatCurrency(rule.value)} IQD`;
  };

  const getPricingRuleTarget = (rule: CustomPricingRule) => {
    if (rule.targetType === 'user') return rule.userPhone ?? rule.userId ?? t('Specific user', 'مستخدم محدد', '指定用户');
    if (rule.targetType === 'distributor') return t('Distributors', 'الموزعون', '分销商');
    if (rule.targetType === 'customer') return t('Customers', 'العملاء', '客户');
    return t('All accounts', 'كل الحسابات', '全部账号');
  };

  const currencyOptions = useMemo(() => {
    const options = new Map<string, { code: string; symbol: string; name: string }>();
    options.set('IQD', { code: 'IQD', symbol: 'د.ع', name: 'Iraqi Dinar' });
    options.set('USD', { code: 'USD', symbol: '$', name: 'US Dollar' });
    for (const country of countries) {
      options.set(country.currency, {
        code: country.currency,
        symbol: country.currencySymbol,
        name: country.currencyName ?? country.currency,
      });
    }
    for (const rate of exchangeRates) {
      for (const code of [rate.baseCurrencyCode, rate.quoteCurrencyCode]) {
        if (!options.has(code)) options.set(code, { code, symbol: code, name: code });
      }
    }
    return Array.from(options.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [countries, exchangeRates]);

  const getManagedExchangeRate = (baseCurrencyCode: string, quoteCurrencyCode: string) => {
    if (baseCurrencyCode === quoteCurrencyCode) return 1;
    const now = Date.now();
    const current = exchangeRates
      .filter((rate) => {
        const starts = new Date(rate.effectiveFrom).getTime();
        const ends = rate.effectiveUntil ? new Date(rate.effectiveUntil).getTime() : Number.POSITIVE_INFINITY;
        const samePair = (rate.baseCurrencyCode === baseCurrencyCode && rate.quoteCurrencyCode === quoteCurrencyCode)
          || (rate.baseCurrencyCode === quoteCurrencyCode && rate.quoteCurrencyCode === baseCurrencyCode);
        return samePair && rate.isActive && starts <= now && ends > now;
      })
      .sort((left, right) => new Date(right.effectiveFrom).getTime() - new Date(left.effectiveFrom).getTime())[0];
    if (!current) return 0;
    return current.baseCurrencyCode === baseCurrencyCode ? current.rate : 1 / current.rate;
  };

  const sidebarItems = [
    { id: 'overview', icon: LayoutDashboard, label: t('Overview', 'نظرة عامة') },
    { id: 'orders', icon: ShoppingCart, label: t('Orders', 'الطلبات') },
    { id: 'categories', icon: Layers3, label: t('Categories', 'الفئات', '分类') },
    { id: 'products', icon: MessageCircle, label: t('Top-up amounts', 'مبالغ الشحن', '充值金额') },
    { id: 'pricing', icon: DollarSign, label: t('Custom pricing', 'تسعير خاص', '自定义价格') },
    { id: 'users', icon: Users, label: t('Users', 'المستخدمين') },
    { id: 'access', icon: Ban, label: t('Access blocks', 'حظر الوصول', '访问封锁') },
    { id: 'providers', icon: Server, label: t('Providers', 'الموردين') },
    { id: 'promotions', icon: TicketPercent, label: t('Promotions', 'العروض', '促销') },
    { id: 'banners', icon: Megaphone, label: t('Banners', 'الإعلانات', '横幅') },
    { id: 'content', icon: FilePenLine, label: t('Website text', 'نصوص الموقع', '网站文本') },
    { id: 'currencies', icon: DollarSign, label: t('Currencies', 'العملات', '货币') },
    { id: 'wallets', icon: Wallet, label: t('Wallets', 'المحافظ') },
    { id: 'reports', icon: TrendingUp, label: t('Reports', 'التقارير') },
    { id: 'monitoring', icon: Activity, label: t('Monitoring', 'المراقبة', '监控') },
  ];

  const canViewAdminDashboard = shouldLoadAdminSummary(user);
  const adminAlertCount = dashboardStats.failedOrders + providerBalanceAlerts.length;
  const openAdminAlerts = () => {
    setActiveTab(providerBalanceAlerts.length > 0 ? 'providers' : 'orders');
  };

  return (
    <div
      data-v2-admin
      className={`v2-admin-page min-h-screen bg-[#f4f7fb] ${dir === 'rtl' ? 'rtl' : 'ltr'}`}
    >
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#d9e1ec] bg-white">
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 h-16">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={mobileNavOpen
                ? t('Close admin navigation', 'أغلق قائمة الإدارة', '关闭管理导航')
                : t('Open admin navigation', 'افتح قائمة الإدارة', '打开管理导航')}
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-admin-navigation"
              className="text-[#07152e] hover:bg-[#eaf1f8] md:hidden"
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen
                ? t('Collapse admin sidebar', 'طي الشريط الجانبي', '收起管理侧栏')
                : t('Expand admin sidebar', 'توسيع الشريط الجانبي', '展开管理侧栏')}
              aria-expanded={sidebarOpen}
              className="hidden text-[#07152e] hover:bg-[#eaf1f8] md:inline-flex"
            >
              <Menu className="h-5 w-5" />
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
                <h1 className="truncate text-sm font-bold text-[#07152e]">{t('Admin Dashboard', 'لوحة التحكم')}</h1>
                <p className="hidden truncate text-[10px] text-[#94610b] sm:block">{t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={openAdminAlerts}
              aria-label={t('Admin alerts: {{count}}', 'تنبيهات الإدارة: {{count}}', '管理提醒：{{count}}').replace('{{count}}', String(adminAlertCount))}
              className="relative flex-shrink-0 text-[#07152e] hover:bg-[#eaf1f8]"
            >
              <Bell className="w-5 h-5" />
              {adminAlertCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold">
                  {adminAlertCount > 99 ? '99+' : adminAlertCount}
                </span>
              )}
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="border-[#f7b928]/35 text-[#94610b] hover:bg-[#f7b928]/10 hover:text-[#ffd05a]">
                <Globe className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('View Site', 'عرض الموقع')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {mobileNavOpen && (
        <div id="mobile-admin-navigation" className="fixed inset-x-0 bottom-0 top-16 z-40 md:hidden">
          <button
            type="button"
            aria-label={t('Close admin navigation', 'أغلق قائمة الإدارة', '关闭管理导航')}
            onClick={() => setMobileNavOpen(false)}
            className="absolute inset-0 bg-black/70"
          />
          <aside className={`absolute inset-y-0 w-[min(20rem,calc(100vw-2rem))] border-[#d9e1ec] bg-white shadow-md ${dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'}`}>
            <nav aria-label={t('Admin sections', 'أقسام الإدارة', '管理栏目')} className="h-full space-y-1 overflow-y-auto p-4">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={activeTab === item.id ? 'page' : undefined}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-md px-4 text-start text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b928] ${
                      activeTab === item.id
                      ? 'border border-[#f7b928]/30 bg-[#f7b928]/10 text-[#94610b]'
                      : 'text-[#34445c] hover:bg-[#eaf1f8] hover:text-[#07152e]'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <aside
          data-admin-sidebar
          className={`fixed top-16 z-40 hidden h-[calc(100vh-4rem)] border-[#d9e1ec] bg-white shadow-sm transition-all duration-300 md:block ${
            dir === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'
          } ${
            sidebarOpen ? 'w-64' : 'w-20'
          }`}
        >
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex min-h-12 w-full items-center gap-3 rounded-md px-4 py-3 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b928] ${
                  activeTab === item.id
                    ? 'border border-[#f7b928]/30 bg-[#f7b928]/10 text-[#94610b]'
                    : 'text-[#34445c] hover:bg-[#eef4fa] hover:text-[#07152e]'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className={`min-w-0 flex-1 p-4 transition-all duration-300 sm:p-6 ${
          dir === 'rtl'
            ? sidebarOpen ? 'md:mr-64' : 'md:mr-20'
            : sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}>
          {isSummaryLoading && (
            <Card role="status" aria-live="polite" className="mb-6 border-[#f7b928]/20 bg-[#eef4fa]/80 p-5">
              <div className="flex items-center gap-3 text-sm font-medium text-[#34445c]">
                <RefreshCw className="h-4 w-4 animate-spin text-[#94610b] motion-reduce:animate-none" />
                {t('Loading admin dashboard...', 'جارٍ تحميل لوحة التحكم...', '正在加载管理仪表板...')}
              </div>
            </Card>
          )}

          {adminError && (
            <Card data-admin-error role="alert" className="mb-6 border-rose-500/30 bg-rose-500/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-rose-700">{adminError}</p>
                {user && canViewAdminDashboard ? (
                  <Button
                    type="button"
                    variant="outline"
                    aria-label={t('Try loading admin data again', 'حاول تحميل بيانات الإدارة مرة أخرى', '重新加载管理数据')}
                    onClick={() => void retryAdminData()}
                    disabled={isSummaryLoading}
                    className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {t('Try again', 'حاول مرة أخرى', '重试')}
                  </Button>
                ) : (
                  <Button asChild className="bg-[#f7b928] text-[#07152e] hover:bg-[#ffd05a]">
                    <Link href="/auth?next=%2Fadmin">{t('Admin login', 'دخول المسؤول', '管理员登录')}</Link>
                  </Button>
                )}
              </div>
            </Card>
          )}

          {canViewAdminDashboard && !isSummaryLoading && (
            <>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: t('Total Revenue', 'إجمالي الإيرادات'),
                    value: formatCurrency(dashboardStats.totalRevenue),
                    suffix: 'IQD',
                    note: t('Confirmed payments', 'المدفوعات المؤكدة', '已确认付款'),
                    icon: DollarSign,
                  },
                  {
                    label: t('Total Orders', 'إجمالي الطلبات'),
                    value: formatCurrency(dashboardStats.totalOrders),
                    note: t('All recorded top-ups', 'جميع عمليات الشحن المسجلة', '全部充值记录'),
                    icon: ShoppingCart,
                  },
                  {
                    label: t('Active Users', 'المستخدمين النشطين'),
                    value: formatCurrency(dashboardStats.activeUsers),
                    note: t('Users with recent activity', 'مستخدمون لديهم نشاط حديث', '近期活跃用户'),
                    icon: Users,
                  },
                  {
                    label: t('Refund Rate', 'معدل الاسترداد'),
                    value: `${dashboardStats.refundRate}%`,
                    note: t('Share of refunded orders', 'نسبة الطلبات المستردة', '退款订单占比'),
                    icon: RefreshCw,
                  },
                ].map((stat, i) => (
                  <Card key={i} className="bg-[#f7faff] border-emerald-800/20 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-[#53627a]">{stat.label}</p>
                        <p className="text-2xl font-bold text-[#07152e] mt-1">
                          {stat.value}
                          {stat.suffix && <span className="text-sm text-[#53627a] ml-1">{stat.suffix}</span>}
                        </p>
                      </div>
                      <div className="rounded-lg bg-blue-500/10 p-2">
                        <stat.icon className="h-5 w-5 text-blue-700" />
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-[#6b778a]">{stat.note}</p>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 bg-[#f7faff] border-emerald-800/20 p-6">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-bold text-[#07152e]">{t('Revenue Overview', 'نظرة عامة على الإيرادات')}</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void downloadAdminExport('revenue')}
                      className="border-emerald-500/30 text-emerald-400"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('Export', 'تصدير')}
                    </Button>
                  </div>
                  <div className="flex h-64 items-end gap-2">
                    {revenueData.map((data, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-[#ca8a04] to-[#facc15] transition-opacity hover:opacity-80"
                          style={{ height: `${Math.max(data.revenue > 0 ? 6 : 1, (data.revenue / revenueMax) * 100)}%` }}
                          title={`${formatCurrency(data.revenue)} IQD`}
                        />
                        <span className="text-[10px] text-[#53627a]">
                          {new Date(data.date).toLocaleDateString(locale, { weekday: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Provider Status */}
                <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                  <h3 className="text-lg font-bold text-[#07152e] mb-4">{t('Provider Status', 'حالة الموردين')}</h3>
                  <div className="space-y-4">
                    {providers.slice(0, 5).map((provider) => (
                      <div key={provider.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            provider.status === 'online' ? 'bg-emerald-400' :
                            provider.status === 'degraded' ? 'bg-amber-400' : 'bg-rose-400'
                          }`} />
                          <span className="text-sm text-[#07152e]">{t(provider.name, provider.name)}</span>
                        </div>
                        <Badge variant="outline" className={getStatusColor(provider.status)}>
                          {getStatusLabel(provider.status)}
                        </Badge>
                      </div>
                    ))}
                    {providers.length > 5 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('providers')}
                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        {t(
                          `View all ${providers.length} providers`,
                          `عرض جميع الموردين (${providers.length})`,
                          `查看全部 ${providers.length} 个供应商`
                        )}
                      </button>
                    )}
                  </div>
                </Card>
              </div>

              {/* Recent Orders */}
              <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[#07152e]">{t('Recent Orders', 'الطلبات الأخيرة')}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('orders')}
                    className="text-emerald-700 hover:text-emerald-800"
                  >
                    {t('View All', 'عرض الكل')}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <Table className="min-w-[42rem]">
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-[#53627a]">{t('Order ID', 'رقم الطلب')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Product', 'المنتج', '产品')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Amount', 'المبلغ')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Status', 'الحالة')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Date', 'التاريخ')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id} className="border-emerald-800/20">
                        <TableCell className="font-mono text-sm text-[#07152e]">{order.id}</TableCell>
                        <TableCell className="text-[#07152e]">{getOrderGameName(order)}</TableCell>
                        <TableCell className="text-emerald-400 font-medium">
                          {formatCurrency(order.finalPrice)} IQD
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#53627a] text-sm">{formatDate(order.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-[#07152e]">{t('Orders Management', 'إدارة الطلبات')}</h2>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void downloadAdminExport('orders')}
                    className="border-[#f7b928]/35 text-[#94610b] hover:bg-[#f7b928]/10 hover:text-[#ffd05a]"
                  >
                    <Download className="h-4 w-4" />
                    {t('Export', 'تصدير')}
                  </Button>
                </div>
              </div>

              {orders.length > 0 ? (
                <>
                  <div className="space-y-3 sm:hidden">
                    {orders.map((order) => (
                      <Card
                        key={order.id}
                        data-admin-mobile-order
                        className="border-[#f7b928]/18 bg-[#eef4fa] p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-all font-mono text-xs font-semibold text-[#07152e]">{order.id}</p>
                            <p className="mt-1 text-sm font-semibold text-[#94610b]">{getOrderPackageName(order)}</p>
                          </div>
                          <Badge variant="outline" className={`flex-shrink-0 ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#d9e1ec] pt-4 text-sm">
                          <div className="min-w-0">
                            <dt className="text-xs text-[#6b778a]">{getOrderReferenceLabel(order)}</dt>
                            <dd className="mt-1 break-all font-medium text-[#07152e]">{getOrderReferenceValue(order)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#6b778a]">{t('Amount', 'المبلغ', '金额')}</dt>
                            <dd className="mt-1 font-semibold tabular-nums text-[#94610b]">{formatCurrency(order.finalPrice)} IQD</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#6b778a]">{t('Payment', 'الدفع', '付款')}</dt>
                            <dd className="mt-1 text-[#34445c]">{getPaymentMethodLabel(order.paymentMethod)}</dd>
                          </div>
                          <div>
                            <dt className="text-xs text-[#6b778a]">{t('Date', 'التاريخ', '日期')}</dt>
                            <dd className="mt-1 text-[#34445c]">{formatDate(order.createdAt)}</dd>
                          </div>
                        </dl>
                        {canConfirmCashPayment(order) && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={isMutating}
                            onClick={() => void confirmCashOrder(order.id)}
                            className="mt-4 w-full bg-[#52d273] text-[#04131f] hover:bg-[#77e294]"
                          >
                            <Banknote className="h-4 w-4" />
                            {t('Confirm cash received', 'تأكيد استلام النقد', '确认收到现金')}
                          </Button>
                        )}
                        {canManuallyFulfill(order) && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openManualFulfillment(order)}
                            className="mt-4 w-full bg-[#f7b928] text-[#07152e] hover:bg-[#ffd05a]"
                          >
                            <Zap className="h-4 w-4" />
                            {order.status === 'completed'
                              ? t('Send delivery again', 'إعادة إرسال التسليم', '重新发送交付')
                              : order.fulfillmentMode === 'manual_code'
                                ? t('Deliver code', 'تسليم الرمز', '交付代码')
                                : t('Mark top-up complete', 'إكمال الشحن', '完成充值')}
                          </Button>
                        )}
                      </Card>
                    ))}
                  </div>

                  <Card data-admin-desktop-orders className="hidden border-[#f7b928]/15 bg-[#eef4fa]/78 p-5 sm:block">
                    <Table className="min-w-[58rem]">
                      <TableHeader>
                        <TableRow className="border-[#d9e1ec]">
                          <TableHead className="text-[#53627a]">{t('Order ID', 'رقم الطلب')}</TableHead>
                          <TableHead className="text-[#53627a]">{t('Product', 'المنتج', '产品')}</TableHead>
                          <TableHead className="text-[#53627a]">{t('Top-up amount', 'مبلغ الشحن', '充值金额')}</TableHead>
                          <TableHead className="text-[#53627a]">{t('Account / delivery', 'الحساب / التسليم', '账号 / 交付')}</TableHead>
                          <TableHead className="text-[#53627a]">{t('Amount', 'المبلغ')}</TableHead>
                          <TableHead className="text-[#53627a]">{t('Payment', 'الدفع')}</TableHead>
                          <TableHead className="text-[#53627a]">{t('Status', 'الحالة')}</TableHead>
                          <TableHead className="text-[#53627a]">{t('Date', 'التاريخ')}</TableHead>
                          <TableHead className="text-[#53627a]">{t('Action', 'الإجراء', '操作')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id} className="border-[#d9e1ec]">
                            <TableCell className="font-mono text-sm text-[#07152e]">{order.id}</TableCell>
                            <TableCell className="text-[#07152e]">{getOrderGameName(order)}</TableCell>
                            <TableCell className="text-[#94610b]">{getOrderPackageName(order)}</TableCell>
                            <TableCell className="text-[#34445c]">{getOrderReferenceValue(order)}</TableCell>
                            <TableCell className="font-medium text-[#94610b]">
                              {formatCurrency(order.finalPrice)} IQD
                            </TableCell>
                            <TableCell className="text-[#34445c]">{getPaymentMethodLabel(order.paymentMethod)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(order.status)}>
                                {getStatusLabel(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-[#53627a]">{formatDate(order.createdAt)}</TableCell>
                            <TableCell>
                              {canConfirmCashPayment(order) ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={isMutating}
                                  onClick={() => void confirmCashOrder(order.id)}
                                  className="bg-[#52d273] text-[#04131f] hover:bg-[#77e294]"
                                >
                                  <Banknote className="h-4 w-4" />
                                  {t('Confirm cash', 'تأكيد النقد', '确认现金')}
                                </Button>
                              ) : canManuallyFulfill(order) ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openManualFulfillment(order)}
                                  className="border-[#f7b928]/35 text-[#94610b] hover:bg-[#f7b928]/10 hover:text-[#ffd05a]"
                                >
                                  {order.status === 'completed'
                                    ? t('Resend', 'إعادة الإرسال', '重新发送')
                                    : order.fulfillmentMode === 'manual_code'
                                      ? t('Deliver code', 'تسليم الرمز', '交付代码')
                                      : t('Complete', 'إكمال', '完成')}
                                </Button>
                              ) : (
                                <span className="text-xs text-[#7b8798]">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                </>
              ) : (
                <Card className="border-[#f7b928]/15 bg-[#eef4fa]/78 p-8 text-center">
                  <ShoppingCart className="mx-auto h-6 w-6 text-[#94610b]" />
                  <p className="mt-3 font-semibold text-[#07152e]">{t('No orders yet', 'لا توجد طلبات بعد', '暂无订单')}</p>
                </Card>
              )}
            </div>
          )}

          <Dialog open={Boolean(fulfillmentOrder)} onOpenChange={(open) => {
            if (!open) {
              setFulfillmentOrder(null);
              setFulfillmentCode('');
              setFulfillmentNote('');
            }
          }}>
            <DialogContent className="border-[#f7b928]/20 bg-white text-[#07152e]">
              <DialogHeader>
                <DialogTitle>
                  {fulfillmentOrder?.fulfillmentMode === 'manual_code'
                    ? t('Deliver purchased code', 'تسليم الرمز المشترى', '交付购买代码')
                    : t('Complete manual top-up', 'إكمال الشحن اليدوي', '完成手动充值')}
                </DialogTitle>
                <DialogDescription className="text-[#53627a]">
                  {t(
                    'The customer receives a WhatsApp confirmation immediately after you complete this order.',
                    'يتلقى العميل تأكيداً عبر واتساب فور إكمال هذا الطلب.',
                    '完成订单后，客户会立即收到 WhatsApp 确认。'
                  )}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={fulfillManualOrder} className="space-y-4">
                {fulfillmentOrder?.fulfillmentMode === 'manual_code' && (
                  <div className="space-y-2">
                    <Label htmlFor="fulfillment-code">{t('Purchased code', 'الرمز المشترى', '购买代码')}</Label>
                    <Input
                      id="fulfillment-code"
                      value={fulfillmentCode}
                      onChange={(event) => setFulfillmentCode(event.target.value)}
                      minLength={3}
                      required
                      autoComplete="off"
                      className="border-[#d9e1ec] bg-[#f7faff] font-mono text-[#07152e]"
                    />
                    <p className="text-xs text-[#6b778a]">
                      {t('The code is encrypted in the database and sent only to this customer.', 'يتم تشفير الرمز في قاعدة البيانات وإرساله لهذا العميل فقط.', '代码在数据库中加密，仅发送给该客户。')}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="fulfillment-note">{t('Internal note', 'ملاحظة داخلية', '内部备注')}</Label>
                  <Input
                    id="fulfillment-note"
                    value={fulfillmentNote}
                    onChange={(event) => setFulfillmentNote(event.target.value)}
                    placeholder={t('Optional operator note', 'ملاحظة اختيارية للموظف', '可选操作备注')}
                    className="border-[#d9e1ec] bg-[#f7faff] text-[#07152e]"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setFulfillmentOrder(null)} className="border-[#d9e1ec] bg-[#f7faff] text-[#07152e] hover:bg-[#eaf1f8] hover:text-[#07152e]">
                    {t('Cancel', 'إلغاء', '取消')}
                  </Button>
                  <Button type="submit" disabled={isMutating} className="bg-[#f7b928] text-[#07152e] hover:bg-[#ffd05a]">
                    {isMutating ? t('Sending...', 'جارٍ الإرسال...', '发送中...') : t('Complete and notify', 'إكمال وإشعار', '完成并通知')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {activeTab === 'categories' && (
            <CatalogCategoryManager
              categories={categories}
              isMutating={isMutating}
              onSave={saveCatalogCategory}
              onToggle={toggleCatalogCategory}
            />
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#07152e]">{t('Products and top-up amounts', 'المنتجات ومبالغ الشحن', '产品和充值金额')}</h2>
                  <p className="mt-1 text-sm text-[#53627a]">
                    {t(
                      'Connect each product to a category and choose automatic or manual delivery.',
                      'اربط كل منتج بفئة واختر التسليم التلقائي أو اليدوي.',
                      '将每个产品关联到分类，并选择自动或手动交付。'
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => setProductDialogOpen(true)}
                    className="border-emerald-500/30 text-emerald-400"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    {t('Add product', 'إضافة منتج', '添加产品')}
                  </Button>
                  <Button
                    onClick={() => setTopupDialogOpen(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t('Add top-up amount', 'إضافة مبلغ شحن', '添加充值金额')}
                  </Button>
                </div>
              </div>

              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-emerald-800/30 bg-white text-[#07152e]">
                  <DialogHeader>
                    <DialogTitle>{t('Add product', 'إضافة منتج', '添加产品')}</DialogTitle>
                    <DialogDescription className="text-[#53627a]">
                      {t(
                        'New products remain hidden until you have checked their packages and delivery method.',
                        'تبقى المنتجات الجديدة مخفية حتى تتحقق من الباقات وطريقة التسليم.',
                        '新产品会保持隐藏，直到你检查套餐和交付方式。'
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createProduct} className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="product-slug">{t('Slug', 'المعرف', '短链接')}</Label>
                        <Input
                          id="product-slug"
                          value={productForm.slug}
                          onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                          placeholder="new-top-up-product"
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-category">{t('Category', 'الفئة', '分类')}</Label>
                        <select
                          id="product-category"
                          value={productForm.category}
                          onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                        >
                          <option value="TOP_UP">{t('Top-up', 'شحن', '充值')}</option>
                          <option value="APP">{t('App', 'تطبيق', '应用')}</option>
                          <option value="GAME">{t('Game', 'لعبة', '游戏')}</option>
                          <option value="SOCIAL_MEDIA">{t('Social media', 'تواصل اجتماعي', '社交媒体')}</option>
                          <option value="VOUCHER">{t('Voucher', 'قسيمة', '券码')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-name">{t('English name', 'الاسم بالإنجليزية', '英文名称')}</Label>
                        <Input
                          id="product-name"
                          value={productForm.name}
                          onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-name-ar">{t('Arabic name', 'الاسم بالعربية', '阿拉伯语名称')}</Label>
                        <Input
                          id="product-name-ar"
                          value={productForm.nameAr}
                          onChange={(event) => setProductForm((current) => ({ ...current, nameAr: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-catalog-category">{t('Storefront category', 'فئة واجهة المتجر', '店铺分类')}</Label>
                        <select
                          id="product-catalog-category"
                          value={productForm.catalogCategoryId}
                          onChange={(event) => setProductForm((current) => ({ ...current, catalogCategoryId: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                          required
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-fulfillment">{t('Delivery method', 'طريقة التسليم', '交付方式')}</Label>
                        <select
                          id="product-fulfillment"
                          value={productForm.fulfillmentMode}
                          onChange={(event) => setProductForm((current) => ({ ...current, fulfillmentMode: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                        >
                          <option value="MANUAL_CODE">{t('Manual code by WhatsApp', 'رمز يدوي عبر واتساب', '通过 WhatsApp 手动发码')}</option>
                          <option value="MANUAL_TOPUP">{t('Manual account top-up', 'شحن حساب يدوي', '手动账号充值')}</option>
                          <option value="WAHO_API">{t('WAHO API (automatic)', 'واجهة WAHO (تلقائي)', 'WAHO API（自动）')}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-description">{t('English description', 'الوصف بالإنجليزية', '英文描述')}</Label>
                        <Input
                          id="product-description"
                          value={productForm.description}
                          onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-description-ar">{t('Arabic description', 'الوصف بالعربية', '阿拉伯语描述')}</Label>
                        <Input
                          id="product-description-ar"
                          value={productForm.descriptionAr}
                          onChange={(event) => setProductForm((current) => ({ ...current, descriptionAr: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-name-zh">{t('Chinese name', 'الاسم بالصينية', '中文名称')}</Label>
                        <Input
                          id="product-name-zh"
                          value={productForm.nameZh}
                          onChange={(event) => setProductForm((current) => ({ ...current, nameZh: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-description-zh">{t('Chinese description', 'الوصف بالصينية', '中文描述')}</Label>
                        <Input
                          id="product-description-zh"
                          value={productForm.descriptionZh}
                          onChange={(event) => setProductForm((current) => ({ ...current, descriptionZh: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-image">{t('Image path', 'مسار الصورة', '图片路径')}</Label>
                        <Input
                          id="product-image"
                          value={productForm.image}
                          onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-countries">{t('Countries', 'الدول', '国家')}</Label>
                        <Input
                          id="product-countries"
                          value={productForm.countries}
                          onChange={(event) => setProductForm((current) => ({ ...current, countries: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-emerald-800/30 bg-white px-3 py-2">
                      <div>
                        <Label htmlFor="product-requires-user-id">{t('Ask for an account ID', 'طلب معرف الحساب', '要求账号 ID')}</Label>
                        <p className="mt-1 text-xs text-[#6b778a]">{t('Turn this off for products delivered as a purchased code.', 'أوقفه للمنتجات التي تُسلّم كرمز مشترى.', '购买代码类产品请关闭此项。')}</p>
                      </div>
                      <Switch
                        id="product-requires-user-id"
                        checked={productForm.requiresUserId}
                        onCheckedChange={(checked) => setProductForm((current) => ({ ...current, requiresUserId: checked }))}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-user-label">{t('Account label', 'تسمية الحساب', '账号标签')}</Label>
                        <Input
                          id="product-user-label"
                          value={productForm.userIdLabel}
                          onChange={(event) => setProductForm((current) => ({ ...current, userIdLabel: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-user-label-ar">{t('Arabic account label', 'تسمية الحساب بالعربية', '阿拉伯语账号标签')}</Label>
                        <Input
                          id="product-user-label-ar"
                          value={productForm.userIdLabelAr}
                          onChange={(event) => setProductForm((current) => ({ ...current, userIdLabelAr: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-emerald-800/30 bg-white px-3 py-2">
                      <div>
                        <Label htmlFor="product-active">{t('Activate publicly', 'تفعيل للعامة', '公开启用')}</Label>
                        <p className="mt-1 text-xs text-[#6b778a]">{t('Leave off until provider and pricing are approved.', 'اتركه مغلقاً حتى يتم اعتماد المورد والتسعير.', '供应商和价格批准前请保持关闭。')}</p>
                      </div>
                      <Switch
                        id="product-active"
                        checked={productForm.isActive}
                        onCheckedChange={(checked) => setProductForm((current) => ({ ...current, isActive: checked }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isMutating} className="bg-emerald-600 hover:bg-emerald-500">
                        {t('Save product', 'حفظ المنتج', '保存产品')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={topupDialogOpen} onOpenChange={setTopupDialogOpen}>
                <DialogContent className="border-emerald-800/30 bg-white text-[#07152e]">
                  <DialogHeader>
                    <DialogTitle>{t('Add top-up amount', 'إضافة مبلغ شحن', '添加充值金额')}</DialogTitle>
                    <DialogDescription className="text-[#53627a]">
                      {t('Create the balance and customer price for the selected product.', 'أنشئ الرصيد وسعر العميل للمنتج المحدد.', '为所选产品创建余额和客户价格。')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createTopupPackage} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="topup-product">{t('Product', 'المنتج', '产品')}</Label>
                        <select
                          id="topup-product"
                          value={topupForm.productId}
                          onChange={(event) => setTopupForm((current) => ({ ...current, productId: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                        >
                          {[...products].sort((a, b) => Number(b.id === 'waho-top-up') - Number(a.id === 'waho-top-up')).map((product) => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="topup-name">{t('Package name', 'اسم الباقة', '套餐名称')}</Label>
                        <Input
                          id="topup-name"
                          value={topupForm.name}
                          onChange={(event) => setTopupForm((current) => ({ ...current, name: event.target.value }))}
                          placeholder={t('Generated when empty', 'يُنشأ تلقائياً عند تركه فارغاً', '留空时自动生成')}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="topup-name-ar">{t('Arabic package name', 'اسم الباقة بالعربية', '阿拉伯语套餐名称')}</Label>
                        <Input
                          id="topup-name-ar"
                          dir="rtl"
                          value={topupForm.nameAr}
                          onChange={(event) => setTopupForm((current) => ({ ...current, nameAr: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="topup-amount">{t('Amount', 'المبلغ')}</Label>
                        <Input
                          id="topup-amount"
                          type="number"
                          min="1"
                          value={topupForm.amount}
                          onChange={(event) => setTopupForm((current) => ({ ...current, amount: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="topup-price">{t('Price', 'السعر')}</Label>
                        <Input
                          id="topup-price"
                          type="number"
                          min="1"
                          value={topupForm.basePrice}
                          onChange={(event) => setTopupForm((current) => ({ ...current, basePrice: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="topup-sale-price">{t('Sale price', 'سعر العرض', '优惠价')}</Label>
                        <Input
                          id="topup-sale-price"
                          type="number"
                          min="1"
                          value={topupForm.salePrice}
                          onChange={(event) => setTopupForm((current) => ({ ...current, salePrice: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="topup-unit">{t('Balance unit', 'وحدة الرصيد', '余额单位')}</Label>
                        <Input
                          id="topup-unit"
                          value={topupForm.unit}
                          onChange={(event) => setTopupForm((current) => ({ ...current, unit: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="topup-unit-ar">{t('Arabic balance unit', 'وحدة الرصيد بالعربية', '阿拉伯语余额单位')}</Label>
                        <Input
                          id="topup-unit-ar"
                          dir="rtl"
                          value={topupForm.unitAr}
                          onChange={(event) => setTopupForm((current) => ({ ...current, unitAr: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-emerald-800/30 bg-white px-3 py-2">
                        <Label htmlFor="topup-stock">{t('Available', 'متاح', '可用')}</Label>
                        <Switch
                          id="topup-stock"
                          checked={topupForm.inStock}
                          onCheckedChange={(checked) => setTopupForm((current) => ({ ...current, inStock: checked }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-emerald-800/30 bg-white px-3 py-2">
                      <Label htmlFor="topup-popular">{t('Mark as popular', 'تمييز كشائع', '标记为热门')}</Label>
                      <Switch
                        id="topup-popular"
                        checked={topupForm.isPopular}
                        onCheckedChange={(checked) => setTopupForm((current) => ({ ...current, isPopular: checked }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isMutating} className="bg-emerald-600 hover:bg-emerald-500">
                        {t('Save', 'حفظ', '保存')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.slice(0, 6).map((game) => (
                  <Card key={game.id} className="bg-[#f7faff] border-emerald-800/20 p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-lg bg-[#eef4fa] overflow-hidden">
                        <img src={game.image} alt={t(game.name, game.nameAr)} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-[#07152e]">{t(game.name, game.nameAr)}</h3>
                        <p className="text-xs text-[#53627a]">{t(game.publisher, game.publisher)}</p>
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
                      <Switch
                        checked={game.isActive}
                        disabled={isMutating}
                        onCheckedChange={(checked) => void toggleProductActive(game.id, checked)}
                      />
                    </div>
                    <div className="mt-4 space-y-2 border-t border-emerald-800/20 pt-4">
                      {game.packages.map((pkg) => (
                        <div key={pkg.id} className="flex items-center justify-between gap-3 rounded-md bg-[#f7faff] px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#07152e]">{t(pkg.name, pkg.nameAr)}</p>
                            <p className="text-xs text-[#53627a]">{formatCurrency(pkg.basePrice)} {pkg.currency}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={pkg.inStock ? getStatusColor('completed') : getStatusColor('failed')}>
                              {pkg.inStock ? t('Available', 'متاح', '可用') : t('Hidden', 'مخفي', '隐藏')}
                            </Badge>
                            <Switch
                              checked={pkg.inStock}
                              disabled={isMutating}
                              onCheckedChange={(checked) => void updateTopupPackage(pkg.id, { inStock: checked })}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#07152e]">{t('Custom pricing', 'تسعير خاص', '自定义价格')}</h2>
                  <p className="mt-1 text-sm text-[#53627a]">
                    {t('Set WAHO prices for distributors, customer groups, or a specific user.', 'حدد أسعار WAHO للموزعين أو مجموعات العملاء أو مستخدم محدد.', '为分销商、客户组或指定用户设置 WAHO 价格。')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void downloadAdminExport('pricing')}
                    className="border-emerald-500/30 text-emerald-400"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('Export', 'تصدير')}
                  </Button>
                  <Button
                    onClick={() => setPricingDialogOpen(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    {t('Add pricing rule', 'إضافة قاعدة تسعير', '添加价格规则')}
                  </Button>
                </div>
              </div>

              <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
                <DialogContent className="border-emerald-800/30 bg-white text-[#07152e]">
                  <DialogHeader>
                    <DialogTitle>{t('Add pricing rule', 'إضافة قاعدة تسعير', '添加价格规则')}</DialogTitle>
                    <DialogDescription className="text-[#53627a]">
                      {t('Rules are applied server-side before the order is stored.', 'يتم تطبيق القواعد من الخادم قبل حفظ الطلب.', '规则会在服务器端应用后再保存订单。')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createCustomPricingRule} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pricing-name">{t('Name', 'الاسم', '名称')}</Label>
                      <Input
                        id="pricing-name"
                        value={pricingForm.name}
                        onChange={(event) => setPricingForm((current) => ({ ...current, name: event.target.value }))}
                        className="bg-white border-emerald-800/30 text-[#07152e]"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="pricing-target">{t('Target', 'الفئة', '目标')}</Label>
                        <select
                          id="pricing-target"
                          value={pricingForm.targetType}
                          onChange={(event) => setPricingForm((current) => ({ ...current, targetType: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                        >
                          <option value="DISTRIBUTOR">{t('Distributors', 'الموزعون', '分销商')}</option>
                          <option value="CUSTOMER">{t('Customers', 'العملاء', '客户')}</option>
                          <option value="USER">{t('Specific user', 'مستخدم محدد', '指定用户')}</option>
                          <option value="ALL">{t('All accounts', 'كل الحسابات', '全部账号')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pricing-user">{t('User', 'المستخدم', '用户')}</Label>
                        <select
                          id="pricing-user"
                          value={pricingForm.userId}
                          disabled={pricingForm.targetType !== 'USER'}
                          onChange={(event) => setPricingForm((current) => ({ ...current, userId: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e] disabled:opacity-40"
                        >
                          <option value="">{t('Select user', 'اختر مستخدماً', '选择用户')}</option>
                          {users.map((account) => (
                            <option key={account.id} value={account.id}>{account.phone}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pricing-product">{t('Product', 'المنتج', '产品')}</Label>
                        <select
                          id="pricing-product"
                          value={pricingForm.productId}
                          onChange={(event) => setPricingForm((current) => ({ ...current, productId: event.target.value, packageId: '' }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                        >
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>{product.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pricing-package">{t('Top-up amount', 'مبلغ الشحن', '充值金额')}</Label>
                        <select
                          id="pricing-package"
                          value={pricingForm.packageId}
                          onChange={(event) => setPricingForm((current) => ({ ...current, packageId: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                        >
                          <option value="">{t('All amounts', 'كل المبالغ', '全部金额')}</option>
                          {pricingPackages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pricing-type">{t('Rule type', 'نوع القاعدة', '规则类型')}</Label>
                        <select
                          id="pricing-type"
                          value={pricingForm.priceType}
                          onChange={(event) => setPricingForm((current) => ({ ...current, priceType: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                        >
                          <option value="FIXED_PRICE">{t('Fixed price', 'سعر ثابت', '固定价格')}</option>
                          <option value="PERCENTAGE_DISCOUNT">{t('Percentage discount', 'خصم بنسبة', '百分比折扣')}</option>
                          <option value="FIXED_DISCOUNT">{t('Fixed discount', 'خصم ثابت', '固定折扣')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pricing-value">{t('Value', 'القيمة', '数值')}</Label>
                        <Input
                          id="pricing-value"
                          type="number"
                          min="0"
                          value={pricingForm.value}
                          onChange={(event) => setPricingForm((current) => ({ ...current, value: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pricing-priority">{t('Priority', 'الأولوية', '优先级')}</Label>
                        <Input
                          id="pricing-priority"
                          type="number"
                          min="0"
                          value={pricingForm.priority}
                          onChange={(event) => setPricingForm((current) => ({ ...current, priority: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-emerald-800/30 bg-white px-3 py-2">
                        <Label htmlFor="pricing-active">{t('Active', 'نشط', '启用')}</Label>
                        <Switch
                          id="pricing-active"
                          checked={pricingForm.isActive}
                          onCheckedChange={(checked) => setPricingForm((current) => ({ ...current, isActive: checked }))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-emerald-800/30 bg-white px-3 py-2">
                      <Label htmlFor="pricing-membership">{t('Also apply membership discount', 'تطبيق خصم العضوية أيضاً', '同时应用会员折扣')}</Label>
                      <Switch
                        id="pricing-membership"
                        checked={pricingForm.applyMembershipDiscount}
                        onCheckedChange={(checked) => setPricingForm((current) => ({ ...current, applyMembershipDiscount: checked }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isMutating} className="bg-emerald-600 hover:bg-emerald-500">
                        {t('Save', 'حفظ', '保存')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Card className="overflow-hidden border-emerald-800/20 bg-[#f7faff]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-[#34445c]">{t('Rule', 'القاعدة', '规则')}</TableHead>
                      <TableHead className="text-[#34445c]">{t('Target', 'الفئة', '目标')}</TableHead>
                      <TableHead className="text-[#34445c]">{t('Scope', 'النطاق', '范围')}</TableHead>
                      <TableHead className="text-[#34445c]">{t('Value', 'القيمة', '数值')}</TableHead>
                      <TableHead className="text-[#34445c]">{t('Status', 'الحالة', '状态')}</TableHead>
                      <TableHead className="text-right text-[#34445c]">{t('Active', 'نشط', '启用')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customPricingRules.map((rule) => (
                      <TableRow key={rule.id} className="border-emerald-800/10">
                        <TableCell>
                          <p className="font-medium text-[#07152e]">{rule.name}</p>
                          <p className="text-xs text-[#6b778a]">{rule.priceType.replace(/_/g, ' ')}</p>
                        </TableCell>
                        <TableCell className="text-[#34445c]">{getPricingRuleTarget(rule)}</TableCell>
                        <TableCell className="text-[#34445c]">
                          {rule.packageName ?? rule.productName ?? t('All recharge products', 'كل منتجات الشحن', '全部充值产品')}
                        </TableCell>
                        <TableCell className="font-semibold text-emerald-700">{getPricingRuleValue(rule)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={rule.isActive ? getStatusColor('completed') : getStatusColor('failed')}>
                            {rule.isActive ? t('Active', 'نشط', '启用') : t('Disabled', 'معطل', '已停用')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={rule.isActive}
                            disabled={isMutating}
                            onCheckedChange={(checked) => void updateCustomPricingRule(rule.id, { isActive: checked })}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {customPricingRules.length === 0 && (
                      <TableRow className="border-emerald-800/10">
                        <TableCell colSpan={6} className="py-8 text-center text-[#53627a]">
                          {t('No custom pricing rules yet', 'لا توجد قواعد تسعير خاصة بعد', '暂无自定义价格规则')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-[#07152e]">{t('Delivery Partners', 'شركاء التسليم')}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void downloadAdminExport('providers')}
                    className="border-emerald-500/30 text-emerald-400"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('Export', 'تصدير')}
                  </Button>
                  <Button
                    onClick={() => setProviderDialogOpen(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    <Server className="w-4 h-4 mr-2" />
                    {t('Add Provider', 'إضافة مورد')}
                  </Button>
                </div>
              </div>

              <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
                <DialogContent className="border-emerald-800/30 bg-white text-[#07152e]">
                  <DialogHeader>
                    <DialogTitle>{t('Add Provider', 'إضافة مورد')}</DialogTitle>
                    <DialogDescription className="text-[#53627a]">
                      {t('Add a fulfillment route with its own priority and balance threshold.', 'أضف مسار تنفيذ بأولوية وحد رصيد خاص به.', '添加履约路线，并设置其优先级和余额阈值。')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createProviderAccount} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="provider-name">{t('Name', 'الاسم')}</Label>
                      <Input
                        id="provider-name"
                        value={providerForm.name}
                        onChange={(event) => setProviderForm((current) => ({ ...current, name: event.target.value }))}
                        className="bg-white border-emerald-800/30 text-[#07152e]"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="provider-type">{t('Type', 'النوع')}</Label>
                        <select
                          id="provider-type"
                          value={providerForm.type}
                          onChange={(event) => setProviderForm((current) => ({ ...current, type: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                        >
                          <option value="WAHA_WHATSAPP">WAHA WhatsApp</option>
                          <option value="WAHO_API">WAHO API</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider-priority">{t('Priority', 'الأولوية')}</Label>
                        <Input
                          id="provider-priority"
                          type="number"
                          min="1"
                          value={providerForm.priority}
                          onChange={(event) => setProviderForm((current) => ({ ...current, priority: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider-balance">{t('Balance', 'الرصيد')}</Label>
                        <Input
                          id="provider-balance"
                          type="number"
                          min="0"
                          value={providerForm.balance}
                          onChange={(event) => setProviderForm((current) => ({ ...current, balance: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider-threshold">{t('Low balance threshold', 'حد الرصيد المنخفض', '低余额阈值')}</Label>
                        <Input
                          id="provider-threshold"
                          type="number"
                          min="0"
                          value={providerForm.lowBalanceThreshold}
                          onChange={(event) => setProviderForm((current) => ({ ...current, lowBalanceThreshold: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider-endpoint">{t('Endpoint', 'نقطة الاتصال', '端点')}</Label>
                      <Input
                        id="provider-endpoint"
                        value={providerForm.apiEndpoint}
                        onChange={(event) => setProviderForm((current) => ({ ...current, apiEndpoint: event.target.value }))}
                        className="bg-white border-emerald-800/30 text-[#07152e]"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-emerald-800/30 bg-white px-3 py-2">
                      <Label htmlFor="provider-active">{t('Active', 'نشط', '启用')}</Label>
                      <Switch
                        id="provider-active"
                        checked={providerForm.isActive}
                        onCheckedChange={(checked) => setProviderForm((current) => ({ ...current, isActive: checked }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isMutating} className="bg-emerald-600 hover:bg-emerald-500">
                        {t('Save', 'حفظ', '保存')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {providerBalanceAlerts.length > 0 && (
                <div className="space-y-3">
                  {providerBalanceAlerts.map((alert) => (
                    <Card key={alert.id} className="border-amber-500/30 bg-amber-500/10 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                          <div>
                            <p className="font-semibold text-[#07152e]">
                              {t('Provider balance is low', 'رصيد المورد منخفض', '供应商余额不足')}
                            </p>
                            <p className="mt-1 text-sm text-[#34445c]">
                              {alert.providerAccountName ?? alert.providerName ?? alert.providerAccountId}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm sm:text-right">
                          <div>
                            <p className="text-[#53627a]">{t('Available', 'المتاح', '可用')}</p>
                            <p className="font-semibold text-amber-800">
                              {formatCurrency(alert.availableBalance)} {alert.currency}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#53627a]">{t('Threshold', 'الحد', '阈值')}</p>
                            <p className="font-semibold text-[#07152e]">
                              {formatCurrency(alert.threshold)} {alert.currency}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {providers.map((provider) => (
                  <Card key={provider.id} className="bg-[#f7faff] border-emerald-800/20 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-[#07152e]">{t(provider.name, provider.name)}</h3>
                        <p className="text-xs text-[#53627a]">{t('Connected top-up route', 'مسار شحن متصل')}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(provider.status)}>
                        {getStatusLabel(provider.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-[#53627a]">{t('Success Rate', 'معدل النجاح')}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={provider.successRate} className="h-2" />
                          <span className="text-sm text-emerald-400">{provider.successRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-[#53627a]">{t('Avg Response', 'متوسط الاستجابة')}</p>
                        <p className="text-sm text-[#07152e] mt-1">{provider.avgResponseTime}s</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#53627a]">{t('Available balance', 'الرصيد المتاح')}</p>
                        <p className="text-sm text-[#07152e] mt-1">
                          {formatCurrency(provider.availableBalance ?? provider.balance ?? 0)} {provider.currency ?? 'IQD'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#53627a]">{t('Account type', 'نوع الحساب')}</p>
                        <p className="text-sm text-[#07152e] mt-1">{provider.accountType ?? '-'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-emerald-800/20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#53627a]">{t('Priority:', 'الأولوية:')}</span>
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                          #{provider.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#53627a]">{t('Active:', 'نشط:')}</span>
                        <Switch
                          checked={provider.isActive}
                          disabled={isMutating}
                          onCheckedChange={(checked) => void toggleProviderActive(provider.id, checked)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'promotions' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-[#07152e]">{t('Promotions', 'العروض')}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void downloadAdminExport('promotions')}
                    className="border-emerald-500/30 text-emerald-400"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('Export', 'تصدير')}
                  </Button>
                  <Button
                    onClick={() => setPromotionDialogOpen(true)}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    <TicketPercent className="w-4 h-4 mr-2" />
                    {t('Create Promotion', 'إنشاء عرض')}
                  </Button>
                </div>
              </div>

              <Dialog open={promotionDialogOpen} onOpenChange={setPromotionDialogOpen}>
                <DialogContent className="border-emerald-800/30 bg-white text-[#07152e]">
                  <DialogHeader>
                    <DialogTitle>{t('Create Promotion', 'إنشاء عرض')}</DialogTitle>
                    <DialogDescription className="text-[#53627a]">
                      {t('Create a recharge offer that can be shown on the offers page.', 'أنشئ عرض شحن يمكن عرضه في صفحة العروض.', '创建可显示在优惠页的充值优惠。')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createPromotion} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="promotion-code">{t('Code', 'الكود')}</Label>
                        <Input
                          id="promotion-code"
                          value={promotionForm.code}
                          onChange={(event) => setPromotionForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promotion-type">{t('Type', 'النوع')}</Label>
                        <select
                          id="promotion-type"
                          value={promotionForm.type}
                          onChange={(event) => setPromotionForm((current) => ({ ...current, type: event.target.value }))}
                          className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                        >
                          <option value="percentage">{t('Percentage', 'نسبة', '百分比')}</option>
                          <option value="fixed">{t('Fixed', 'مبلغ ثابت', '固定金额')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promotion-value">{t('Value', 'القيمة')}</Label>
                        <Input
                          id="promotion-value"
                          type="number"
                          min="1"
                          value={promotionForm.value}
                          onChange={(event) => setPromotionForm((current) => ({ ...current, value: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promotion-min">{t('Minimum purchase', 'الحد الأدنى', '最低消费')}</Label>
                        <Input
                          id="promotion-min"
                          type="number"
                          min="0"
                          value={promotionForm.minPurchase}
                          onChange={(event) => setPromotionForm((current) => ({ ...current, minPurchase: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promotion-max">{t('Maximum discount', 'الحد الأقصى للخصم', '最高折扣')}</Label>
                        <Input
                          id="promotion-max"
                          type="number"
                          min="0"
                          value={promotionForm.maxDiscount}
                          onChange={(event) => setPromotionForm((current) => ({ ...current, maxDiscount: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="promotion-limit">{t('Usage limit', 'حد الاستخدام', '使用限制')}</Label>
                        <Input
                          id="promotion-limit"
                          type="number"
                          min="1"
                          value={promotionForm.usageLimit}
                          onChange={(event) => setPromotionForm((current) => ({ ...current, usageLimit: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promotion-end">{t('Valid until', 'صالح حتى', '有效期至')}</Label>
                      <Input
                        id="promotion-end"
                        type="datetime-local"
                        value={promotionForm.endDate}
                        onChange={(event) => setPromotionForm((current) => ({ ...current, endDate: event.target.value }))}
                        className="bg-white border-emerald-800/30 text-[#07152e]"
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-emerald-800/30 bg-white px-3 py-2">
                      <Label htmlFor="promotion-active">{t('Active', 'نشط', '启用')}</Label>
                      <Switch
                        id="promotion-active"
                        checked={promotionForm.isActive}
                        onCheckedChange={(checked) => setPromotionForm((current) => ({ ...current, isActive: checked }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isMutating} className="bg-emerald-600 hover:bg-emerald-500">
                        {t('Save', 'حفظ', '保存')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-[#53627a]">{t('Code', 'الكود')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Type', 'النوع')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Value', 'القيمة')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Usage', 'الاستخدام')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Valid Until', 'صالح حتى')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Status', 'الحالة')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Actions', 'الإجراءات')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promotions.map((promo) => (
                      <TableRow key={promo.id} className="border-emerald-800/20">
                        <TableCell className="font-mono font-bold text-emerald-400">{promo.code}</TableCell>
                        <TableCell className="text-[#07152e]">{promo.type === 'percentage' ? '%' : t('Fixed', 'مبلغ ثابت')}</TableCell>
                        <TableCell className="text-[#07152e]">
                          {promo.type === 'percentage' ? `${promo.value}%` : `${formatCurrency(promo.value)} IQD`}
                        </TableCell>
                        <TableCell className="text-[#34445c]">
                          {promo.usedCount} / {promo.usageLimit}
                        </TableCell>
                        <TableCell className="text-[#53627a] text-sm">
                          {new Date(promo.endDate).toLocaleDateString(locale)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={promo.isActive ? getStatusColor('completed') : getStatusColor('failed')}>
                            {promo.isActive ? t('Active', 'نشط') : t('Inactive', 'غير نشط')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={promo.isActive}
                            disabled={isMutating}
                            onCheckedChange={(checked) => void togglePromotionActive(promo.id, checked)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'banners' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-[#07152e]">{t('Banners', 'الإعلانات', '横幅')}</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => void downloadAdminExport('banners')}
                    className="border-emerald-500/30 text-emerald-400"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('Export', 'تصدير', '导出')}
                  </Button>
                  <Button
                    onClick={() => openBannerEditor()}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    <Megaphone className="w-4 h-4 mr-2" />
                    {t('Create Banner', 'إنشاء إعلان', '创建横幅')}
                  </Button>
                </div>
              </div>

              <Dialog open={bannerDialogOpen} onOpenChange={(open) => {
                setBannerDialogOpen(open);
                if (!open) setEditingBannerId(null);
              }}>
                <DialogContent className="max-h-[90vh] overflow-y-auto border-emerald-800/30 bg-white text-[#07152e]">
                  <DialogHeader>
                    <DialogTitle>{editingBannerId
                      ? t('Edit banner', 'تعديل الإعلان', '编辑横幅')
                      : t('Create banner', 'إنشاء إعلان', '创建横幅')}</DialogTitle>
                    <DialogDescription className="text-[#53627a]">
                      {t('Add a homepage slide with separate desktop and mobile artwork.', 'أضف شريحة للصفحة الرئيسية بصور منفصلة للكمبيوتر والهاتف.', '添加首页轮播，并分别设置桌面和手机图片。')}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={createBanner} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="banner-title">{t('Title', 'العنوان', '标题')}</Label>
                        <Input
                          id="banner-title"
                          value={bannerForm.title}
                          onChange={(event) => setBannerForm((current) => ({ ...current, title: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner-title-ar">{t('Arabic title', 'العنوان العربي', '阿拉伯语标题')}</Label>
                        <Input
                          id="banner-title-ar"
                          value={bannerForm.titleAr}
                          onChange={(event) => setBannerForm((current) => ({ ...current, titleAr: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner-title-zh">{t('Chinese title', 'العنوان الصيني', '中文标题')}</Label>
                        <Input
                          id="banner-title-zh"
                          value={bannerForm.titleZh}
                          onChange={(event) => setBannerForm((current) => ({ ...current, titleZh: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="banner-subtitle">{t('Subtitle', 'الوصف المختصر', '副标题')}</Label>
                        <Input
                          id="banner-subtitle"
                          value={bannerForm.subtitle}
                          onChange={(event) => setBannerForm((current) => ({ ...current, subtitle: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner-subtitle-ar">{t('Arabic subtitle', 'الوصف العربي', '阿拉伯语副标题')}</Label>
                        <Input
                          id="banner-subtitle-ar"
                          value={bannerForm.subtitleAr}
                          onChange={(event) => setBannerForm((current) => ({ ...current, subtitleAr: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner-subtitle-zh">{t('Chinese subtitle', 'الوصف الصيني', '中文副标题')}</Label>
                        <Input
                          id="banner-subtitle-zh"
                          value={bannerForm.subtitleZh}
                          onChange={(event) => setBannerForm((current) => ({ ...current, subtitleZh: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-[1.3fr_0.7fr]">
                      <div className="space-y-2">
                        <Label htmlFor="banner-image">{t('Image path', 'مسار الصورة', '图片路径')}</Label>
                        <Input
                          id="banner-image"
                          value={bannerForm.image}
                          onChange={(event) => setBannerForm((current) => ({ ...current, image: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner-order">{t('Order', 'الترتيب', '排序')}</Label>
                        <Input
                          id="banner-order"
                          type="number"
                          min="0"
                          value={bannerForm.order}
                          onChange={(event) => setBannerForm((current) => ({ ...current, order: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="banner-mobile-image">{t('Mobile image path', 'مسار صورة الهاتف', '手机图片路径')}</Label>
                      <Input
                        id="banner-mobile-image"
                        value={bannerForm.mobileImage}
                        onChange={(event) => setBannerForm((current) => ({ ...current, mobileImage: event.target.value }))}
                        placeholder={t('Optional: desktop image is used when empty', 'اختياري: تستخدم صورة الكمبيوتر عند تركه فارغاً', '可选：留空时使用桌面图片')}
                        className="bg-white border-emerald-800/30 text-[#07152e]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="banner-link">{t('Link', 'الرابط', '链接')}</Label>
                      <Input
                        id="banner-link"
                        value={bannerForm.link}
                        onChange={(event) => setBannerForm((current) => ({ ...current, link: event.target.value }))}
                        className="bg-white border-emerald-800/30 text-[#07152e]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="banner-product">{t('Linked product', 'المنتج المرتبط', '关联产品')}</Label>
                      <select
                        id="banner-product"
                        value={bannerForm.gameId}
                        onChange={(event) => setBannerForm((current) => ({ ...current, gameId: event.target.value }))}
                        className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                      >
                        <option value="">{t('No product: use the link only', 'بدون منتج: استخدم الرابط فقط', '无产品：仅使用链接')}</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>{product.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="banner-start">{t('Starts at', 'يبدأ في', '开始时间')}</Label>
                        <Input
                          id="banner-start"
                          type="datetime-local"
                          value={bannerForm.startDate}
                          onChange={(event) => setBannerForm((current) => ({ ...current, startDate: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="banner-end">{t('Ends at', 'ينتهي في', '结束时间')}</Label>
                        <Input
                          id="banner-end"
                          type="datetime-local"
                          value={bannerForm.endDate}
                          onChange={(event) => setBannerForm((current) => ({ ...current, endDate: event.target.value }))}
                          className="bg-white border-emerald-800/30 text-[#07152e]"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-md border border-emerald-800/30 bg-white px-3 py-2">
                      <Label htmlFor="banner-active">{t('Active', 'نشط', '启用')}</Label>
                      <Switch
                        id="banner-active"
                        checked={bannerForm.isActive}
                        onCheckedChange={(checked) => setBannerForm((current) => ({ ...current, isActive: checked }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isMutating} className="bg-emerald-600 hover:bg-emerald-500">
                        {t('Save', 'حفظ', '保存')}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-[#53627a]">{t('Banner', 'الإعلان', '横幅')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Schedule', 'الجدولة', '计划')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Link', 'الرابط', '链接')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Order', 'الترتيب', '排序')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Status', 'الحالة', '状态')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Actions', 'الإجراءات', '操作')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {banners.map((banner) => (
                      <TableRow key={banner.id} className="border-emerald-800/20">
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-md bg-[#eef4fa] ring-1 ring-emerald-800/30">
                              <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#07152e]">{t(banner.title, banner.titleAr, banner.titleZh)}</p>
                              {banner.subtitle && (
                                <p className="mt-1 max-w-xs truncate text-xs text-[#53627a]">
                                  {t(banner.subtitle, banner.subtitleAr ?? banner.subtitle, banner.subtitleZh ?? banner.subtitle)}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-[#53627a]">
                          <p>{formatDate(banner.startDate)}</p>
                          <p>{formatDate(banner.endDate)}</p>
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-[#34445c]">{banner.link ?? '-'}</TableCell>
                        <TableCell className="text-[#34445c]">#{banner.order}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={banner.isActive ? getStatusColor('completed') : getStatusColor('failed')}>
                            {banner.isActive ? t('Active', 'نشط', '启用') : t('Inactive', 'غير نشط', '停用')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={banner.isActive}
                              disabled={isMutating}
                              onCheckedChange={(checked) => void toggleBannerActive(banner.id, checked)}
                            />
                            <Button type="button" size="sm" variant="outline" onClick={() => openBannerEditor(banner)} className="border-[#d9e1ec] bg-[#f7faff] text-[#07152e] hover:bg-[#eaf1f8] hover:text-[#07152e]">
                              <FilePenLine className="h-3.5 w-3.5" />
                              {t('Edit', 'تعديل', '编辑')}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'currencies' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-[#07152e]">{t('Currency & exchange rates', 'العملات وأسعار الصرف', '货币和汇率')}</h2>
                <Button
                  variant="outline"
                  onClick={() => void downloadAdminExport('currencies')}
                  className="border-emerald-500/30 text-emerald-400"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('Export', 'تصدير', '导出')}
                </Button>
              </div>

              <CountryPricingMap
                countries={countries}
                exchangeRates={exchangeRates}
                onChanged={() => reloadSummary()}
                t={t}
              />

              <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-[#07152e]">{t('Set a new exchange rate', 'تعيين سعر صرف جديد', '设置新汇率')}</h3>
                  <p className="mt-1 text-sm text-[#53627a]">{t('The new rate applies to every price from the selected minute until a newer rate starts.', 'يُطبق السعر الجديد على جميع الأسعار من الدقيقة المحددة حتى يبدأ سعر أحدث.', '新汇率从所选分钟起应用于所有价格，直到更新的汇率生效。')}</p>
                </div>
                <form onSubmit={updateExchangeRate} className="grid gap-4 md:grid-cols-2 xl:grid-cols-[0.75fr_0.75fr_0.8fr_1fr_1.1fr_auto] xl:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="rate-base" className="text-[#34445c]">{t('Base', 'الأساس', '基础货币')}</Label>
                    <select
                      id="rate-base"
                      value={exchangeRateForm.baseCurrencyCode}
                      onChange={(event) => setExchangeRateForm((current) => ({ ...current, baseCurrencyCode: event.target.value }))}
                      className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                    >
                      {currencyOptions.filter((currency) => currency.code !== exchangeRateForm.quoteCurrencyCode).map((currency) => (
                        <option key={currency.code} value={currency.code}>{currency.code} - {currency.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate-quote" className="text-[#34445c]">{t('Quote', 'عملة التسعير', '计价货币')}</Label>
                    <select
                      id="rate-quote"
                      value={exchangeRateForm.quoteCurrencyCode}
                      onChange={(event) => setExchangeRateForm((current) => ({
                        ...current,
                        quoteCurrencyCode: event.target.value,
                        rate: String(getManagedExchangeRate(current.baseCurrencyCode, event.target.value) || current.rate),
                      }))}
                      className="h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                    >
                      {currencyOptions.filter((currency) => currency.code !== exchangeRateForm.baseCurrencyCode).map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate-value" className="text-[#34445c]">{t('Manual rate', 'سعر الصرف اليدوي', '手动汇率')}</Label>
                    <Input
                      id="rate-value"
                      type="number"
                      min="0"
                      step="0.00000001"
                      value={exchangeRateForm.rate}
                      onChange={(event) => setExchangeRateForm((current) => ({ ...current, rate: event.target.value }))}
                      className="bg-white border-emerald-800/30 text-[#07152e]"
                    />
                    <p className="text-[11px] text-[#6b778a]">1 {exchangeRateForm.baseCurrencyCode} = {exchangeRateForm.rate || '0'} {exchangeRateForm.quoteCurrencyCode}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate-effective-from" className="text-[#34445c]">{t('Valid from', 'صالح من', '生效时间')}</Label>
                    <Input
                      id="rate-effective-from"
                      type="datetime-local"
                      step="60"
                      value={exchangeRateForm.effectiveFrom}
                      onChange={(event) => setExchangeRateForm((current) => ({ ...current, effectiveFrom: event.target.value }))}
                      required
                      className="bg-white border-emerald-800/30 text-[#07152e]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rate-note" className="text-[#34445c]">{t('Note', 'ملاحظة', '备注')}</Label>
                    <Input
                      id="rate-note"
                      value={exchangeRateForm.note}
                      onChange={(event) => setExchangeRateForm((current) => ({ ...current, note: event.target.value }))}
                      className="bg-white border-emerald-800/30 text-[#07152e]"
                    />
                  </div>
                  <Button type="submit" disabled={isMutating} className="bg-emerald-600 hover:bg-emerald-500">
                    {t('Activate rate', 'تفعيل السعر', '启用汇率')}
                  </Button>
                </form>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                  <h3 className="mb-4 text-lg font-bold text-[#07152e]">{t('Countries and local currency', 'البلدان والعملة المحلية', '国家和本地货币')}</h3>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-emerald-800/20">
                        <TableHead className="text-[#53627a]">{t('Country', 'البلد', '国家')}</TableHead>
                        <TableHead className="text-[#53627a]">{t('Phone', 'الهاتف', '电话')}</TableHead>
                        <TableHead className="text-[#53627a]">{t('Currency', 'العملة', '货币')}</TableHead>
                        <TableHead className="text-[#53627a]">{t('Rate', 'السعر', '汇率')}</TableHead>
                        <TableHead className="text-[#53627a]">{t('Active', 'نشط', '启用')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countries.map((country) => (
                        <TableRow key={country.id} className="border-emerald-800/20">
                          <TableCell className="text-[#07152e]">
                            <span className="mr-2">{country.flag}</span>
                            {t(country.name, country.nameAr, country.nameZh)}
                          </TableCell>
                          <TableCell className="text-[#34445c]">{country.phoneCode}</TableCell>
                          <TableCell className="text-[#34445c]">
                            {country.currency} <span className="text-[#6b778a]">({country.currencySymbol})</span>
                          </TableCell>
                          <TableCell className="text-emerald-400">
                            {new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(country.exchangeRate || 0)}
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={country.isActive}
                              disabled={isMutating || country.id === 'iq'}
                              onCheckedChange={(checked) => void toggleCountryActive(country.id, checked)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>

                <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                  <h3 className="mb-1 text-lg font-bold text-[#07152e]">{t('Exchange-rate history', 'سجل أسعار الصرف', '汇率历史')}</h3>
                  <p className="mb-4 text-xs leading-5 text-[#6b778a]">{t('Every change is kept for audit and historical order checks.', 'يتم الاحتفاظ بكل تغيير للتدقيق ومراجعة الطلبات السابقة.', '每次变更都会保留，用于审计和历史订单核对。')}</p>
                  <div className="space-y-3">
                    {exchangeRates.map((rate) => {
                      const now = Date.now();
                      const starts = new Date(rate.effectiveFrom).getTime();
                      const ends = rate.effectiveUntil ? new Date(rate.effectiveUntil).getTime() : Number.POSITIVE_INFINITY;
                      const status = !rate.isActive ? 'inactive' : starts > now ? 'scheduled' : ends <= now ? 'expired' : 'current';
                      return (
                      <div key={rate.id} className="rounded-lg border border-emerald-800/20 bg-[#f7faff] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-mono text-sm font-semibold text-[#07152e]">
                            {rate.baseCurrencyCode} → {rate.quoteCurrencyCode}
                          </p>
                          <Badge variant="outline" className={status === 'current' ? getStatusColor('completed') : status === 'scheduled' ? getStatusColor('processing') : getStatusColor('failed')}>
                            {status === 'current'
                              ? t('Current', 'الحالي', '当前')
                              : status === 'scheduled'
                                ? t('Scheduled', 'مجدول', '已计划')
                                : status === 'expired'
                                  ? t('Expired', 'منتهي', '已过期')
                                  : t('Inactive', 'غير نشط', '停用')}
                          </Badge>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-400">
                          {new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 }).format(rate.rate)}
                        </p>
                        <p className="mt-1 text-xs text-[#53627a]">{t('From', 'من', '从')} {formatDate(rate.effectiveFrom)}</p>
                        {rate.effectiveUntil && <p className="mt-1 text-xs text-[#6b778a]">{t('Until', 'حتى', '至')} {formatDate(rate.effectiveUntil)}</p>}
                        {rate.note && <p className="mt-2 text-xs text-[#53627a]">{rate.note}</p>}
                      </div>
                    );})}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-[#07152e]">{t('Users', 'المستخدمين')}</h2>
                <Button
                  variant="outline"
                  onClick={() => void downloadAdminExport('users')}
                  className="border-emerald-500/30 text-emerald-400"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('Export', 'تصدير')}
                </Button>
              </div>
              <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-[#53627a]">{t('Name', 'الاسم')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Phone Number', 'رقم الهاتف')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Access', 'الصلاحيات', '权限')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Wallet', 'المحفظة')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Total Spent', 'إجمالي الإنفاق')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Type', 'النوع', '类型')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Status', 'الحالة')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Last Login', 'آخر دخول')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Blocked', 'محظور', '已封锁')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((account) => (
                      <TableRow key={account.id} className="border-emerald-800/20">
                        <TableCell className="text-[#07152e]">{account.name}</TableCell>
                        <TableCell className="text-[#34445c]">{account.phone}</TableCell>
                        <TableCell>
                          <div className="flex min-w-36 flex-col gap-2">
                            <select
                              value={(account.role ?? 'user').toUpperCase()}
                              disabled={isMutating || account.role === 'admin'}
                              onChange={(event) => {
                                const nextRole = event.target.value as AdminRoleValue;
                                const nextStaffRole = (account.staffRole ?? 'support').toUpperCase() as StaffRoleValue;
                                void updateUserPermissions(
                                  account.id,
                                  nextRole,
                                  nextRole === 'STAFF' ? nextStaffRole : null,
                                  account.staffPermissions ?? []
                                );
                              }}
                              className="h-9 rounded-md border border-emerald-800/30 bg-white px-2 text-xs text-[#07152e] disabled:opacity-40"
                            >
                              <option value="USER">{t('Customer', 'عميل', '客户')}</option>
                              <option value="STAFF">{t('Staff', 'موظف', '员工')}</option>
                              <option value="ADMIN">{t('Admin', 'مدير', '管理员')}</option>
                            </select>
                            {account.role === 'staff' && (
                              <select
                                value={(account.staffRole ?? 'support').toUpperCase()}
                                disabled={isMutating}
                                onChange={(event) => void updateUserPermissions(
                                  account.id,
                                  'STAFF',
                                  event.target.value as StaffRoleValue,
                                  account.staffPermissions ?? []
                                )}
                                className="h-9 rounded-md border border-emerald-800/30 bg-white px-2 text-xs text-[#07152e] disabled:opacity-40"
                              >
                                {staffRoleOptions.map((role) => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-emerald-400">{formatCurrency(account.walletBalance)} IQD</TableCell>
                        <TableCell className="text-[#34445c]">{formatCurrency(account.totalSpent)} IQD</TableCell>
                        <TableCell>
                          <select
                            value={(account.accountType ?? 'customer').toUpperCase()}
                            disabled={isMutating || account.role === 'admin'}
                            onChange={(event) => void updateUserAccountType(account.id, event.target.value as 'CUSTOMER' | 'DISTRIBUTOR')}
                            className="h-9 rounded-md border border-emerald-800/30 bg-white px-2 text-xs text-[#07152e] disabled:opacity-40"
                          >
                            <option value="CUSTOMER">{t('Customer', 'عميل', '客户')}</option>
                            <option value="DISTRIBUTOR">{t('Distributor', 'موزع', '分销商')}</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={account.isBlocked ? getStatusColor('failed') : getStatusColor('completed')}>
                            {account.isBlocked ? t('Blocked', 'محظور', '已封锁') : t('Active', 'نشط', '启用')}
                          </Badge>
                          {account.blockedReason && (
                            <p className="mt-1 max-w-48 truncate text-xs text-[#6b778a]">{account.blockedReason}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-[#53627a] text-sm">{formatDate(account.lastLogin)}</TableCell>
                        <TableCell>
                          <Switch
                            checked={account.isBlocked}
                            disabled={isMutating || account.role === 'admin'}
                            onCheckedChange={(checked) => void toggleUserBlocked(account.id, checked)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'access' && (
            <AccessBlockManager
              t={t}
              initialWhatsAppValue={pendingAccessBlockValue}
              onInitialValueConsumed={() => setPendingAccessBlockValue(null)}
              onChanged={() => reloadSummary()}
            />
          )}

          {activeTab === 'content' && (
            <ContentManager t={t} />
          )}

          {activeTab === 'wallets' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-bold text-[#07152e]">{t('Wallets', 'المحافظ')}</h2>
                <Button
                  variant="outline"
                  onClick={() => void downloadAdminExport('wallets')}
                  className="border-emerald-500/30 text-emerald-400"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('Export', 'تصدير')}
                </Button>
              </div>
              <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold text-[#07152e]">{t('Manual deposits', 'الإيداعات اليدوية', '手动充值')}</h3>
                    <p className="text-xs text-[#53627a]">
                      {t('Approve deposits only after matching the Transaction ID in the payment account.', 'اعتمد الإيداعات فقط بعد مطابقة رقم المعاملة في حساب الدفع.', '仅在付款账号中核对交易 ID 后批准充值。')}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-800">
                    {manualDeposits.filter((deposit) => deposit.status === 'pending').length} {t('pending', 'قيد الانتظار', '待处理')}
                  </Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-[#53627a]">{t('Transaction ID', 'رقم المعاملة', '交易 ID')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('User', 'المستخدم', '用户')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Method', 'الطريقة', '方式')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Amount', 'المبلغ', '金额')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Status', 'الحالة', '状态')}</TableHead>
                      <TableHead className="text-right text-[#53627a]">{t('Action', 'الإجراء', '操作')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manualDeposits.map((deposit) => (
                      <TableRow key={deposit.id} className="border-emerald-800/20">
                        <TableCell className="font-mono text-xs text-[#34445c]">{deposit.transactionId}</TableCell>
                        <TableCell className="text-[#34445c]">{deposit.userPhone ?? deposit.userId}</TableCell>
                        <TableCell className="text-[#34445c]">{deposit.paymentMethod}</TableCell>
                        <TableCell className="text-emerald-400">{formatCurrency(deposit.amount)} {deposit.currency}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              deposit.status === 'approved'
                                ? getStatusColor('completed')
                                : deposit.status === 'rejected'
                                  ? getStatusColor('failed')
                                  : getStatusColor('processing')
                            }
                          >
                            {deposit.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {deposit.status === 'pending' ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                disabled={isMutating}
                                onClick={() => void reviewManualDeposit(deposit.id, 'APPROVED')}
                                className="bg-emerald-600 hover:bg-emerald-500"
                              >
                                {t('Approve', 'اعتماد', '批准')}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isMutating}
                                onClick={() => void reviewManualDeposit(deposit.id, 'REJECTED')}
                                className="border-rose-500/30 text-rose-700 hover:bg-rose-50"
                              >
                                {t('Reject', 'رفض', '拒绝')}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#6b778a]">{deposit.reviewedAt ? formatDate(deposit.reviewedAt) : '-'}</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {manualDeposits.length === 0 && (
                      <TableRow className="border-emerald-800/20">
                        <TableCell colSpan={6} className="py-8 text-center text-[#53627a]">
                          {t('No manual deposits yet', 'لا توجد إيداعات يدوية بعد', '暂无手动充值')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
              <Card className="bg-[#f7faff] border-emerald-800/20 p-6">
                <Table>
                  <TableHeader>
                    <TableRow className="border-emerald-800/20">
                      <TableHead className="text-[#53627a]">{t('Reference', 'المرجع')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Description', 'الوصف')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Amount', 'المبلغ')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Balance', 'الرصيد')}</TableHead>
                      <TableHead className="text-[#53627a]">{t('Date', 'التاريخ')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="border-emerald-800/20">
                        <TableCell className="font-mono text-xs text-[#34445c]">{transaction.reference ?? transaction.id}</TableCell>
                        <TableCell className="text-[#07152e]">{t(transaction.description, transaction.descriptionAr)}</TableCell>
                        <TableCell className={transaction.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)} IQD
                        </TableCell>
                        <TableCell className="text-[#34445c]">{formatCurrency(transaction.balance)} IQD</TableCell>
                        <TableCell className="text-[#53627a] text-sm">{formatDate(transaction.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#07152e]">{t('Reports', 'التقارير', '报表')}</h2>
                  <p className="mt-1 text-sm text-[#53627a]">
                    {t(
                      'Revenue, orders, refunds, deposits, and new users from live database records.',
                      'الإيرادات والطلبات والاستردادات والإيداعات والمستخدمون الجدد من سجلات قاعدة البيانات.',
                      '基于数据库记录统计收入、订单、退款、充值和新用户。'
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex rounded-xl border border-emerald-800/30 bg-[#f7faff] p-1">
                    {reportPeriodOptions.map((period) => {
                      const label = {
                        daily: t('Daily', 'يومي', '每日'),
                        weekly: t('Weekly', 'أسبوعي', '每周'),
                        monthly: t('Monthly', 'شهري', '每月'),
                        yearly: t('Yearly', 'سنوي', '每年'),
                      }[period];

                      return (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setReportPeriod(period)}
                          className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                            reportPeriod === period
                              ? 'bg-emerald-500 text-slate-950'
                              : 'text-[#53627a] hover:bg-[#eaf1f8] hover:text-[#07152e]'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => void downloadAdminReportExport(reportPeriod)}
                    className="border-emerald-500/30 text-emerald-400"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('Export report', 'تصدير التقرير', '导出报表')}
                  </Button>
                </div>
              </div>

              {isReportLoading && (
                <Card className="border-emerald-800/20 bg-[#f7faff] p-6">
                  <p className="text-sm text-[#53627a]">{t('Loading report data...', 'جاري تحميل بيانات التقرير...', '正在加载报表数据...')}</p>
                </Card>
              )}

              {!isReportLoading && adminReport && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        label: t('Revenue', 'الإيرادات', '收入'),
                        value: `${formatCurrency(adminReport.summary.revenue)} IQD`,
                        detail: `${t('Average order', 'متوسط الطلب', '平均订单')} ${formatCurrency(adminReport.summary.avgOrderValue)} IQD`,
                        icon: DollarSign,
                      },
                      {
                        label: t('Orders', 'الطلبات', '订单'),
                        value: formatCurrency(adminReport.summary.orders),
                        detail: `${adminReport.summary.conversionRate}% ${t('completed', 'مكتملة', '已完成')}`,
                        icon: ShoppingCart,
                      },
                      {
                        label: t('Manual deposits', 'الإيداعات اليدوية', '手动充值'),
                        value: `${formatCurrency(adminReport.summary.manualDepositAmount)} IQD`,
                        detail: `${formatCurrency(adminReport.summary.manualDeposits)} ${t('requests', 'طلبات', '申请')}`,
                        icon: Wallet,
                      },
                      {
                        label: t('New users', 'مستخدمون جدد', '新用户'),
                        value: formatCurrency(adminReport.summary.newUsers),
                        detail: `${adminReport.summary.refundRate}% ${t('refund rate', 'معدل الاسترداد', '退款率')}`,
                        icon: Users,
                      },
                    ].map((metric) => (
                      <Card key={metric.label} className="border-emerald-800/20 bg-[#f7faff] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs text-[#53627a]">{metric.label}</p>
                            <p className="mt-1 text-2xl font-bold text-[#07152e]">{metric.value}</p>
                            <p className="mt-2 text-xs text-[#6b778a]">{metric.detail}</p>
                          </div>
                          <div className="rounded-lg bg-emerald-500/10 p-2">
                            <metric.icon className="h-5 w-5 text-emerald-400" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Card className="border-emerald-800/20 bg-[#f7faff] p-6">
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-[#07152e]">{t('Report range', 'نطاق التقرير', '报表范围')}</h3>
                        <p className="text-sm text-[#53627a]">
                          {formatShortDate(adminReport.from)} - {formatShortDate(adminReport.to)}
                        </p>
                      </div>
                      <p className="text-xs text-[#6b778a]">
                        {t('Grouped by selected period', 'مجمعة حسب الفترة المحددة', '按所选周期分组')}
                      </p>
                    </div>
                    <div className="flex h-72 items-end gap-2 overflow-x-auto pb-2">
                      {adminReport.buckets.map((bucket) => (
                        <div key={bucket.key} className="flex min-w-12 flex-1 flex-col items-center gap-2">
                          <div className="flex h-56 w-full items-end rounded-t-lg bg-[#f7faff]">
                            <div
                              className="w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-300 transition-opacity hover:opacity-80"
                              style={{ height: `${Math.max(4, (bucket.revenue / reportMaxRevenue) * 100)}%` }}
                              title={`${bucket.label}: ${formatCurrency(bucket.revenue)} IQD`}
                            />
                          </div>
                          <span className="max-w-20 truncate text-center text-[10px] text-[#53627a]">{bucket.label}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="overflow-hidden border-emerald-800/20 bg-[#f7faff] p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-emerald-800/20">
                            <TableHead className="text-[#53627a]">{t('Period', 'الفترة', '周期')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Orders', 'الطلبات', '订单')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Completed', 'مكتملة', '已完成')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Failed/refunded', 'فاشلة/مستردة', '失败/退款')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Revenue', 'الإيرادات', '收入')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Manual deposits', 'الإيداعات اليدوية', '手动充值')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('New users', 'مستخدمون جدد', '新用户')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminReport.buckets.map((bucket) => (
                            <TableRow key={bucket.key} className="border-emerald-800/20">
                              <TableCell className="min-w-36 text-[#07152e]">{bucket.label}</TableCell>
                              <TableCell className="text-[#34445c]">{formatCurrency(bucket.orders)}</TableCell>
                              <TableCell className="text-emerald-400">{formatCurrency(bucket.completedOrders)}</TableCell>
                              <TableCell className="text-[#34445c]">
                                {formatCurrency(bucket.failedOrders)} / {formatCurrency(bucket.refundedOrders)}
                              </TableCell>
                              <TableCell className="font-medium text-emerald-400">{formatCurrency(bucket.revenue)} IQD</TableCell>
                              <TableCell className="text-[#34445c]">
                                {formatCurrency(bucket.manualDepositAmount)} IQD
                              </TableCell>
                              <TableCell className="text-[#34445c]">{formatCurrency(bucket.newUsers)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </>
              )}

              {!isReportLoading && !adminReport && (
                <Card className="border-emerald-800/20 bg-[#f7faff] p-6">
                  <p className="text-sm text-[#53627a]">{t('Report data is unavailable.', 'بيانات التقرير غير متاحة.', '报表数据不可用。')}</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[#07152e]">{t('Monitoring', 'المراقبة', '监控')}</h2>
                  <p className="mt-1 text-sm text-[#53627a]">
                    {t(
                      'Uptime checks, error events, and log retention for the production environment.',
                      'فحوصات التوفر وأحداث الأخطاء واحتفاظ السجلات لبيئة الإنتاج.',
                      '生产环境的可用性检查、错误事件和日志保留。'
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => void loadAdminMonitoring()}
                    disabled={isMonitoringLoading}
                    className="border-emerald-500/30 text-emerald-400"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('Refresh', 'تحديث', '刷新')}
                  </Button>
                  <Button
                    onClick={() => void runMonitoringChecks()}
                    disabled={isMutating}
                    className="bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {t('Run checks', 'تشغيل الفحوصات', '运行检查')}
                  </Button>
                  <Button
                    onClick={() => setMonitoringDialogOpen(true)}
                    className="bg-amber-400 text-slate-950 hover:bg-amber-300"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('Add target', 'إضافة هدف', '添加目标')}
                  </Button>
                </div>
              </div>

              {isMonitoringLoading && (
                <Card className="border-emerald-800/20 bg-[#f7faff] p-6">
                  <p className="text-sm text-[#53627a]">{t('Loading monitoring data...', 'جاري تحميل بيانات المراقبة...', '正在加载监控数据...')}</p>
                </Card>
              )}

              {!isMonitoringLoading && monitoringDashboard && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      {
                        label: t('Active targets', 'الأهداف النشطة', '启用目标'),
                        value: monitoringDashboard.summary.activeTargets,
                        detail: monitoringDashboard.settings.uptimeEnabled
                          ? t('Uptime enabled', 'مراقبة التوفر مفعلة', '可用性监控已启用')
                          : t('Uptime paused', 'مراقبة التوفر متوقفة', '可用性监控已暂停'),
                        icon: Server,
                      },
                      {
                        label: t('Down targets', 'أهداف متوقفة', '故障目标'),
                        value: monitoringDashboard.summary.downTargets,
                        detail: t('Current status', 'الحالة الحالية', '当前状态'),
                        icon: AlertCircle,
                      },
                      {
                        label: t('Errors 24h', 'أخطاء 24 ساعة', '24小时错误'),
                        value: monitoringDashboard.summary.errorEvents24h,
                        detail: t('Error and critical events', 'أخطاء وأحداث حرجة', '错误和严重事件'),
                        icon: XCircle,
                      },
                      {
                        label: t('Critical 24h', 'حرج 24 ساعة', '24小时严重'),
                        value: monitoringDashboard.summary.criticalEvents24h,
                        detail: monitoringDashboard.summary.lastEventAt
                          ? formatDate(monitoringDashboard.summary.lastEventAt)
                          : t('No events yet', 'لا توجد أحداث بعد', '暂无事件'),
                        icon: Zap,
                      },
                    ].map((metric) => (
                      <Card key={metric.label} className="border-emerald-800/20 bg-[#f7faff] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs text-[#53627a]">{metric.label}</p>
                            <p className="mt-1 text-2xl font-bold text-[#07152e]">{formatCurrency(metric.value)}</p>
                            <p className="mt-2 text-xs text-[#6b778a]">{metric.detail}</p>
                          </div>
                          <div className="rounded-lg bg-emerald-500/10 p-2">
                            <metric.icon className="h-5 w-5 text-emerald-400" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
                    <Card className="border-emerald-800/20 bg-[#f7faff] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-[#07152e]">{t('External hooks', 'الربط الخارجي', '外部接口')}</h3>
                          <p className="mt-2 break-all rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                            {monitoringDashboard.external.healthEndpoint}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:w-72">
                          <Badge className={monitoringDashboard.external.errorWebhookConfigured ? getStatusColor('up') : getStatusColor('unknown')}>
                            {t('Error webhook', 'Webhook للأخطاء', '错误Webhook')}: {monitoringDashboard.external.errorWebhookConfigured ? t('set', 'مفعل', '已设置') : t('not set', 'غير مفعل', '未设置')}
                          </Badge>
                          <Badge className={monitoringDashboard.external.statusWebhookConfigured ? getStatusColor('up') : getStatusColor('unknown')}>
                            {t('Status webhook', 'Webhook للحالة', '状态Webhook')}: {monitoringDashboard.external.statusWebhookConfigured ? t('set', 'مفعل', '已设置') : t('not set', 'غير مفعل', '未设置')}
                          </Badge>
                        </div>
                      </div>
                    </Card>

                    <Card className="border-emerald-800/20 bg-[#f7faff] p-5">
                      <form onSubmit={updateMonitoringSettings} className="space-y-4">
                        <div>
                          <h3 className="text-lg font-bold text-[#07152e]">{t('Log retention', 'احتفاظ السجلات', '日志保留')}</h3>
                          <p className="mt-1 text-xs text-[#6b778a]">
                            {t('Current events are retained by the configured period.', 'يتم الاحتفاظ بالأحداث حسب المدة المحددة.', '事件按配置周期保留。')}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                          <div>
                            <Label className="text-[#34445c]">{t('Retention days', 'أيام الاحتفاظ', '保留天数')}</Label>
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              value={monitoringSettingsForm.logRetentionDays}
                              onChange={(event) => setMonitoringSettingsForm({ ...monitoringSettingsForm, logRetentionDays: event.target.value })}
                              className="mt-2 bg-white/95 border-emerald-800/30 text-[#07152e]"
                            />
                          </div>
                          <div className="flex items-end gap-2">
                            <Switch
                              checked={monitoringSettingsForm.uptimeEnabled}
                              onCheckedChange={(checked) => setMonitoringSettingsForm({ ...monitoringSettingsForm, uptimeEnabled: checked })}
                            />
                            <span className="pb-2 text-sm text-[#53627a]">{t('Uptime', 'التوفر', '可用性')}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button type="submit" disabled={isMutating} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                            {t('Save settings', 'حفظ الإعدادات', '保存设置')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => void pruneMonitoringLogs()}
                            disabled={isMutating}
                            className="border-amber-500/40 text-amber-800"
                          >
                            {t('Prune logs', 'تنظيف السجلات', '清理日志')}
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </div>

                  <Card className="overflow-hidden border-emerald-800/20 bg-[#f7faff] p-0">
                    <div className="flex items-center justify-between gap-4 border-b border-emerald-800/20 p-5">
                      <div>
                        <h3 className="text-lg font-bold text-[#07152e]">{t('Uptime targets', 'أهداف التوفر', '可用性目标')}</h3>
                        <p className="mt-1 text-xs text-[#6b778a]">
                          {t('Configured checks for the app and external dependencies.', 'فحوصات مكونة للتطبيق والاعتمادات الخارجية.', '应用和外部依赖的检查目标。')}
                        </p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-emerald-800/20">
                            <TableHead className="text-[#53627a]">{t('Target', 'الهدف', '目标')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Status', 'الحالة', '状态')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Last check', 'آخر فحص', '上次检查')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Latency', 'الزمن', '延迟')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Actions', 'الإجراءات', '操作')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monitoringDashboard.targets.map((target) => (
                            <TableRow key={target.id} className="border-emerald-800/20">
                              <TableCell className="min-w-72">
                                <div className="font-medium text-[#07152e]">{target.name}</div>
                                <div className="mt-1 max-w-md truncate text-xs text-[#6b778a]">{target.method} {target.url}</div>
                                {target.lastError && <div className="mt-1 text-xs text-rose-700">{target.lastError}</div>}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(target.lastStatus)}>{getStatusLabel(target.lastStatus)}</Badge>
                              </TableCell>
                              <TableCell className="text-[#53627a]">
                                {target.lastCheckedAt ? formatDate(target.lastCheckedAt) : t('Not checked', 'لم يتم الفحص', '未检查')}
                              </TableCell>
                              <TableCell className="text-[#53627a]">
                                {target.lastLatencyMs !== undefined ? `${target.lastLatencyMs} ms` : '-'}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void runMonitoringChecks(target.id)}
                                    disabled={isMutating}
                                    className="border-emerald-500/30 text-emerald-400"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                                    {t('Check', 'فحص', '检查')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void updateMonitoringTarget(target.id, { isActive: !target.isActive })}
                                    disabled={isMutating}
                                    className="border-[#d9e1ec] text-[#34445c]"
                                  >
                                    {target.isActive ? t('Pause', 'إيقاف', '暂停') : t('Enable', 'تفعيل', '启用')}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void deleteMonitoringTarget(target.id)}
                                    disabled={isMutating}
                                    className="border-rose-500/30 text-rose-700"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {!monitoringDashboard.targets.length && (
                            <TableRow className="border-emerald-800/20">
                              <TableCell colSpan={5} className="py-8 text-center text-[#53627a]">
                                {t('No monitoring targets configured.', 'لا توجد أهداف مراقبة مكونة.', '尚未配置监控目标。')}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <Card className="overflow-hidden border-emerald-800/20 bg-[#f7faff] p-0">
                    <div className="border-b border-emerald-800/20 p-5">
                      <h3 className="text-lg font-bold text-[#07152e]">{t('Recent events', 'الأحداث الأخيرة', '最近事件')}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-emerald-800/20">
                            <TableHead className="text-[#53627a]">{t('Time', 'الوقت', '时间')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Severity', 'الخطورة', '级别')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Source', 'المصدر', '来源')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Message', 'الرسالة', '消息')}</TableHead>
                            <TableHead className="text-[#53627a]">{t('Target', 'الهدف', '目标')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monitoringDashboard.events.map((event) => (
                            <TableRow key={event.id} className="border-emerald-800/20">
                              <TableCell className="min-w-40 text-[#53627a]">{formatDate(event.createdAt)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(event.severity)}>{getStatusLabel(event.severity)}</Badge>
                              </TableCell>
                              <TableCell className="text-[#34445c]">{event.source}</TableCell>
                              <TableCell className="min-w-80 text-[#07152e]">{event.message}</TableCell>
                              <TableCell className="text-[#53627a]">{event.targetName ?? event.path ?? '-'}</TableCell>
                            </TableRow>
                          ))}
                          {!monitoringDashboard.events.length && (
                            <TableRow className="border-emerald-800/20">
                              <TableCell colSpan={5} className="py-8 text-center text-[#53627a]">
                                {t('No monitoring events yet.', 'لا توجد أحداث مراقبة بعد.', '暂无监控事件。')}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>

                  <Dialog open={monitoringDialogOpen} onOpenChange={setMonitoringDialogOpen}>
                    <DialogContent className="border-emerald-800/30 bg-white text-[#07152e]">
                      <DialogHeader>
                        <DialogTitle>{t('Add monitoring target', 'إضافة هدف مراقبة', '添加监控目标')}</DialogTitle>
                        <DialogDescription className="text-[#53627a]">
                          {t('Create a production uptime check for this app or an external dependency.', 'أنشئ فحص توفر للإنتاج لهذا التطبيق أو اعتماد خارجي.', '为此应用或外部依赖创建生产可用性检查。')}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={createMonitoringTarget} className="space-y-4">
                        <div>
                          <Label className="text-[#34445c]">{t('Name', 'الاسم', '名称')}</Label>
                          <Input
                            value={monitoringForm.name}
                            onChange={(event) => setMonitoringForm({ ...monitoringForm, name: event.target.value })}
                            className="mt-2 bg-white border-emerald-800/30 text-[#07152e]"
                          />
                        </div>
                        <div>
                          <Label className="text-[#34445c]">{t('URL', 'الرابط', '网址')}</Label>
                          <Input
                            value={monitoringForm.url}
                            onChange={(event) => setMonitoringForm({ ...monitoringForm, url: event.target.value })}
                            className="mt-2 bg-white border-emerald-800/30 text-[#07152e]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[#34445c]">{t('Expected status', 'الحالة المتوقعة', '预期状态')}</Label>
                            <Input
                              type="number"
                              min="100"
                              max="599"
                              value={monitoringForm.expectedStatus}
                              onChange={(event) => setMonitoringForm({ ...monitoringForm, expectedStatus: event.target.value })}
                              className="mt-2 bg-white border-emerald-800/30 text-[#07152e]"
                            />
                          </div>
                          <div>
                            <Label className="text-[#34445c]">{t('Interval minutes', 'الدقائق بين الفحوصات', '间隔分钟')}</Label>
                            <Input
                              type="number"
                              min="1"
                              max="1440"
                              value={monitoringForm.intervalMinutes}
                              onChange={(event) => setMonitoringForm({ ...monitoringForm, intervalMinutes: event.target.value })}
                              className="mt-2 bg-white border-emerald-800/30 text-[#07152e]"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[#34445c]">{t('Method', 'الطريقة', '方法')}</Label>
                            <select
                              value={monitoringForm.method}
                              onChange={(event) => setMonitoringForm({ ...monitoringForm, method: event.target.value })}
                              className="mt-2 h-10 w-full rounded-md border border-emerald-800/30 bg-white px-3 text-sm text-[#07152e]"
                            >
                              <option value="GET">GET</option>
                              <option value="HEAD">HEAD</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-[#34445c]">{t('Timeout ms', 'مهلة ms', '超时毫秒')}</Label>
                            <Input
                              type="number"
                              min="1000"
                              max="30000"
                              value={monitoringForm.timeoutMs}
                              onChange={(event) => setMonitoringForm({ ...monitoringForm, timeoutMs: event.target.value })}
                              className="mt-2 bg-white border-emerald-800/30 text-[#07152e]"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={monitoringForm.isActive}
                            onCheckedChange={(checked) => setMonitoringForm({ ...monitoringForm, isActive: checked })}
                          />
                          <span className="text-sm text-[#34445c]">{t('Active', 'نشط', '启用')}</span>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setMonitoringDialogOpen(false)}>
                            {t('Cancel', 'إلغاء', '取消')}
                          </Button>
                          <Button type="submit" disabled={isMutating} className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                            {t('Save target', 'حفظ الهدف', '保存目标')}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              )}
            </div>
          )}

          {activeTab !== 'overview' && activeTab !== 'orders' && activeTab !== 'categories' && activeTab !== 'products' && activeTab !== 'pricing' && activeTab !== 'providers' && activeTab !== 'promotions' && activeTab !== 'banners' && activeTab !== 'currencies' && activeTab !== 'reports' && activeTab !== 'monitoring' && activeTab !== 'users' && activeTab !== 'access' && activeTab !== 'content' && activeTab !== 'wallets' && (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="w-20 h-20 rounded-full bg-[#eef4fa] flex items-center justify-center mb-4">
                <Activity className="w-10 h-10 text-[#8b96a6]" />
              </div>
              <h3 className="text-xl font-semibold text-[#07152e]">{t('Coming Soon', 'قريباً')}</h3>
              <p className="text-sm text-[#53627a] mt-1">
                {t('This section is under development', 'هذا القسم قيد التطوير')}
              </p>
            </div>
          )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
