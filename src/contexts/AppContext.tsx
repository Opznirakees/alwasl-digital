'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Language, User, Country, CartItem, Order, PaymentMethod, WalletTransaction } from '@/types';
import { demoUser, countries, sampleOrders, walletTransactions as sampleWalletTransactions } from '@/data/mock-data';

type Theme = 'dark' | 'light';

interface AppContextType {
  // Language
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string, ar: string, zh?: string) => string;
  dir: 'ltr' | 'rtl';

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string) => Promise<boolean>;
  logout: () => void;
  verifyOtp: (otp: string) => Promise<boolean>;

  // Country
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (gameId: string, packageId: string) => void;
  clearCart: () => void;
  cartTotal: number;

  // Demo data
  orders: Order[];
  walletTransactions: WalletTransaction[];
  createDemoOrder: (order: DemoOrderInput) => Order;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface DemoOrderInput {
  gameId: string;
  gameName: string;
  packageId: string;
  packageName: string;
  gameUserId: string;
  gameUsername?: string;
  zoneId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
  paymentMethod: PaymentMethod;
}

const storageKeys = {
  language: 'alwasl-language',
  theme: 'theme',
  country: 'alwasl-country',
  user: 'alwasl-demo-user',
  cart: 'alwasl-demo-cart',
  orders: 'alwasl-demo-orders',
  walletTransactions: 'alwasl-demo-wallet-transactions',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

const zhTranslations: Record<string, string> = {
  'Home': '首页',
  'WAHO Services': 'WAHO 服务',
  'WAHO Offers': 'WAHO 优惠',
  'My Orders': '我的订单',
  'Wallet': '钱包',
  'Al-Wasl Digital': 'Al-Wasl 数字服务',
  'Al-Wasl Digital Services': 'Al-Wasl 数字服务',
  'Al-Wasl digital services banner': 'Al-Wasl 数字服务横幅',
  'Page promotion • app recharge': '页面推广 • 应用充值',
  'Page Promotion': '页面推广',
  'App Recharge': '应用充值',
  'Marketing Solutions': '营销解决方案',
  'Electronic services': '电子服务',
  'High Quality': '高品质',
  'Trusted': '可信赖',
  'Fast Fulfillment': '快速完成',
  'Quick': '快速',
  'Competitive Prices': '有竞争力的价格',
  'Fair': '合理',
  'Technical Support': '技术支持',
  'Secure digital service': '安全可靠的数字服务',
  'Digital solutions to grow your business': '助力业务增长的数字解决方案',
  'Page promotion, app recharge, marketing services, and reliable WAHO delivery.': '页面推广、应用充值、营销服务和可靠的 WAHO 交付。',
  'Explore Services': '查看服务',
  'WAHO Recharge': 'WAHO 充值',
  'Al-Wasl helps you reach better results': 'Al-Wasl 助您获得更好成果',
  'Digital solutions for page promotion, app recharge, marketing services, and WAHO product delivery with continuous technical support.': '提供页面推广、应用充值、营销服务和 WAHO 产品交付，并配备持续技术支持。',
  'Boost WAHO rooms and parties': '提升 WAHO 房间与派对',
  'Room boosts, decorations, and party game packs in one checkout.': '房间提升、装饰和派对游戏包，一次结账完成。',
  'WAHO VIP, medals, and profile frames': 'WAHO VIP、勋章和头像框',
  'Highlight status inside the WAHO community.': '在 WAHO 社区中突出您的身份。',
  'WAHO Coins': 'WAHO 金币',
  'Gift Bundles': '礼物套餐',
  'Live Rooms': '直播房间',
  'Party Games': '派对游戏',
  'VIP & Medals': 'VIP 与勋章',
  'Popular WAHO Products': '热门 WAHO 产品',
  'Most requested for rooms, gifts, and live chats': '房间、礼物和语音聊天的热门选择',
  'View WAHO Services': '查看 WAHO 服务',
  'All WAHO Services': '全部 WAHO 服务',
  'Find coins, gifts, room boosts, games, and VIP packages': '查找金币、礼物、房间提升、游戏和 VIP 套餐',
  'No WAHO services found': '未找到 WAHO 服务',
  'Try another WAHO service or clear filters': '尝试其他 WAHO 服务或清除筛选',
  'WAHO API-Ready Catalog': '支持 WAHO API 的目录',
  'Products are structured for account validation and automatic fulfillment': '产品结构已准备好支持账号验证和自动交付',
  'Need WAHO Support?': '需要 WAHO 支持？',
  'Contact us for WAHO recharge, API, or order support': '联系我们获取 WAHO 充值、API 或订单支持',
  'Chat on WhatsApp': 'WhatsApp 咨询',
  'WAHO Links': 'WAHO 链接',
  'API Roadmap': 'API 路线图',
  'Contact': '联系',
  'Support': '支持',
  'FAQ': '常见问题',
  'Help Center': '帮助中心',
  'Terms of Service': '服务条款',
  'Privacy Policy': '隐私政策',
  'Payment Methods': '支付方式',
  'All rights reserved.': '版权所有。',
  'Digital services for social page promotion, app recharge, marketing solutions, and WAHO product delivery.': '提供社交页面推广、应用充值、营销解决方案和 WAHO 产品交付的数字服务。',
  'Back to Home': '返回首页',
  'Browse WAHO coins, gift bundles, live room boosts, party game packs, and VIP upgrades': '浏览 WAHO 金币、礼物套餐、直播房间提升、派对游戏包和 VIP 升级',
  'Sort by': '排序',
  'Most Popular': '最受欢迎',
  'Name A-Z': '名称 A-Z',
  'Price: Low to High': '价格：从低到高',
  'Price: High to Low': '价格：从高到低',
  'Showing': '显示',
  'results': '结果',
  'Try adjusting your search or filters': '请调整搜索或筛选条件',
  'Clear Filters': '清除筛选',
  'Search WAHO coins, gifts, rooms...': '搜索 WAHO 金币、礼物、房间...',
  'All': '全部',
  'Community': '社区',
  'Select WAHO Package': '选择 WAHO 套餐',
  'Enter WAHO Account Details': '输入 WAHO 账号信息',
  'Please enter your WAHO ID': '请输入 WAHO ID',
  'WAHO account verified!': 'WAHO 账号已验证！',
  'Please verify the WAHO account first': '请先验证 WAHO 账号',
  'Please enter the WAHO Room ID': '请输入 WAHO 房间 ID',
  'Host WAHO ID': '房主 WAHO ID',
  'Enter host WAHO ID': '输入房主 WAHO ID',
  'Room ID': '房间 ID',
  'Enter WAHO Room ID': '输入 WAHO 房间 ID',
  'Verify': '验证',
  'WAHO Account Verified': 'WAHO 账号已验证',
  'This product will be delivered to your email after purchase': '购买后该产品将发送到您的邮箱',
  'Please login to continue': '请登录后继续',
  'Order placed successfully!': '订单已成功提交！',
  'Continue': '继续',
  'Continue to Payment': '继续支付',
  'Select Payment Method': '选择支付方式',
  'Payment Method': '支付方式',
  'Credit Card': '信用卡',
  'Balance:': '余额：',
  'Review WAHO Order': '检查 WAHO 订单',
  'Confirm WAHO Order': '确认 WAHO 订单',
  'Prepared for automatic WAHO API delivery': '已准备好通过 WAHO API 自动交付',
  'Confirm & Pay': '确认并支付',
  'WAHO Order Summary': 'WAHO 订单摘要',
  'Select a package to see summary': '选择套餐以查看摘要',
  'Deliver to': '交付给',
  'Subtotal': '小计',
  'Member Discount': '会员折扣',
  'Total': '总计',
  'Secure checkout': '安全结账',
  'From': '起价',
  'Starting from': '起价',
  'Sale': '优惠',
  'Featured': '精选',
  'Popular': '热门',
  'Recharge WAHO': '充值 WAHO',
  'Back': '返回',
  'Welcome': '欢迎',
  'Enter your phone number to continue': '输入手机号继续',
  'Phone Number': '手机号',
  'Please enter a valid phone number': '请输入有效手机号',
  'Login': '登录',
  'Order ID copied!': '订单号已复制！',
  'View and track your order history': '查看并跟踪您的订单记录',
  'Completed': '已完成',
  'Processing': '处理中',
  'Failed': '失败',
  'Pending': '待处理',
  'Refunded': '已退款',
  'Cancelled': '已取消',
  'Order ID:': '订单号：',
  'WAHO ID:': 'WAHO ID：',
  'wallet': '钱包',
  'zaincash': 'ZainCash',
  'card': '银行卡',
  'discount': '折扣',
  'Reorder': '再次下单',
  'View Details': '查看详情',
  'No orders found': '未找到订单',
  'Recharge WAHO to see your orders here': '充值 WAHO 后可在此查看订单',
  'Browse WAHO Services': '浏览 WAHO 服务',
  'Admin Dashboard': '管理后台',
  'View Site': '查看网站',
  'Overview': '概览',
  'Orders': '订单',
  'Products': '产品',
  'Users': '用户',
  'Providers': '供应商',
  'Promotions': '优惠活动',
  'Wallets': '钱包',
  'Reports': '报表',
  'Settings': '设置',
  'Total Revenue': '总收入',
  'Total Orders': '订单总数',
  'Active Users': '活跃用户',
  'Refund Rate': '退款率',
  'Revenue Overview': '收入概览',
  'Export': '导出',
  'Provider Status': '供应商状态',
  'Recent Orders': '最近订单',
  'View All': '查看全部',
  'Order ID': '订单号',
  'WAHO Service': 'WAHO 服务',
  'Amount': '金额',
  'Status': '状态',
  'Date': '日期',
  'Orders Management': '订单管理',
  'Filter': '筛选',
  'Package': '套餐',
  'Payment': '支付',
  'Actions': '操作',
  'View': '查看',
  'online': '在线',
  'offline': '离线',
  'degraded': '性能下降',
  'Success Rate': '成功率',
  'Avg Response': '平均响应',
  'Priority:': '优先级：',
  'Active:': '启用：',
  'WAHO Services Management': 'WAHO 服务管理',
  'Add WAHO Service': '添加 WAHO 服务',
  'packages': '套餐',
  'API Providers': 'API 供应商',
  'Add Provider': '添加供应商',
  'Code': '代码',
  'Type': '类型',
  'Value': '数值',
  'Usage': '使用量',
  'Valid Until': '有效期至',
  'Active': '启用',
  'Inactive': '停用',
  'Fixed': '固定金额',
  'Coming Soon': '即将推出',
  'This section is under development': '此部分正在开发中',
  'Wallet Balance': '钱包余额',
  'Wallet Transactions': '钱包交易',
  'My Wallet': '我的钱包',
  'Available Balance': '可用余额',
  'Top Up': '充值',
  'Top Up Wallet': '钱包充值',
  'Proceed to Payment': '继续支付',
  'Minimum top-up amount is 5,000 IQD': '最低充值金额为 5,000 IQD',
  'Top-up request submitted!': '充值请求已提交！',
  'Transaction History': '交易记录',
  'Membership Level': '会员等级',
  'Your Discount': '您的折扣',
  'Total Spent': '累计消费',
  'Progress to': '升级进度',
  'Spend': '再消费',
  'more': '即可升级',
  'Wallet Benefits': '钱包权益',
  'Secure transactions': '安全交易',
  'Earn cashback': '获得返现',
  'Exclusive bonuses': '专属奖励',
  'Deposit': '充值',
  'Withdraw': '提现',
  'Purchase': '购买',
  'Refund': '退款',
  'Bonus': '奖励',
  'Cashback': '返现',
  'Bronze': '青铜',
  'Silver': '白银',
  'Gold': '黄金',
  'Platinum': '铂金',
  'Diamond': '钻石',
  'Iraq': '伊拉克',
  'Saudi Arabia': '沙特阿拉伯',
  'UAE': '阿联酋',
  'Egypt': '埃及',
  'Jordan': '约旦',
  'Kuwait': '科威特',
  'WAHO Gift Bundles': 'WAHO 礼物套餐',
  'WAHO Live Room Boosts': 'WAHO 直播房间提升',
  'WAHO Party Game Packs': 'WAHO 派对游戏包',
  'WAHO VIP & Medals': 'WAHO VIP 与勋章',
  'Recharge WAHO coin balance for live rooms, voice chat gifts, moments, and party interactions.': '为直播房间、语音聊天礼物、动态和派对互动充值 WAHO 金币。',
  'Send gift-ready WAHO bundles for voice rooms, live streams, themed parties, and friend surprises.': '为语音房、直播、主题派对和好友惊喜发送 WAHO 礼物套餐。',
  'Boost WAHO voice rooms with decorations, visibility, frames, and live party upgrades.': '通过装饰、曝光、头像框和直播派对升级提升 WAHO 语音房。',
  'Top up casual party-game packs for WAHO rooms, including Ludo-style sessions and group play.': '为 WAHO 房间充值休闲派对游戏包，包括 Ludo 风格对局和多人玩法。',
  'Activate WAHO VIP status, achievement medals, avatar frames, and profile privileges.': '开通 WAHO VIP、成就勋章、头像框和个人资料特权。',
  'Coins': '金币',
  'Gifts': '礼物',
  'Day': '天',
  'Days': '天',
  'Pack': '包',
  'Packs': '包',
  '1,000 WAHO Coins': '1,000 WAHO 金币',
  '3,000 WAHO Coins': '3,000 WAHO 金币',
  '7,000 WAHO Coins': '7,000 WAHO 金币',
  '15,000 WAHO Coins': '15,000 WAHO 金币',
  'Starter Gift Bundle': '入门礼物套餐',
  'Party Gift Bundle': '派对礼物套餐',
  'Premium Gift Bundle': '高级礼物套餐',
  'Host Gift Bundle': '房主礼物套餐',
  '1 Day Room Boost': '1 天房间提升',
  '7 Days Room Boost': '7 天房间提升',
  '30 Days Room Boost': '30 天房间提升',
  '1 Game Pack': '1 个游戏包',
  '3 Game Packs': '3 个游戏包',
  '10 Game Packs': '10 个游戏包',
  '7 Days VIP': '7 天 VIP',
  '30 Days VIP': '30 天 VIP',
  '90 Days VIP': '90 天 VIP',
  'Purchase: WAHO Coins 3,000': '购买：3,000 WAHO 金币',
  'Refund: WAHO VIP order failed': '退款：WAHO VIP 订单失败',
  'Wallet top-up via ZainCash': '通过 ZainCash 充值钱包',
  'Gold level cashback (5%)': '黄金等级返现（5%）',
  'Welcome bonus': '欢迎奖励',
};

const languageLabels: Record<Language, { short: string; locale: string; htmlLang: string }> = {
  en: { short: 'EN', locale: 'en-IQ', htmlLang: 'en' },
  ar: { short: 'عربي', locale: 'ar-IQ', htmlLang: 'ar' },
  zh: { short: '中文', locale: 'zh-CN', htmlLang: 'zh-CN' },
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [user, setUser] = useState<User | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(sampleWalletTransactions);
  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore demo state for a smoother presentation flow.
  useEffect(() => {
    localStorage.setItem(storageKeys.theme, 'light');
    const savedLanguage =
      (localStorage.getItem(storageKeys.language) as Language | null) ||
      (localStorage.getItem('language') as Language | null);
    if (savedLanguage && savedLanguage in languageLabels) {
      setLanguage(savedLanguage);
    }
    const savedCountryId = localStorage.getItem(storageKeys.country);
    if (savedCountryId) {
      const country = countries.find((item) => item.id === savedCountryId);
      if (country) setSelectedCountry(country);
    }

    setUser(readJson<User | null>(storageKeys.user, null));
    setCart(readJson<CartItem[]>(storageKeys.cart, []));
    setOrders(readJson<Order[]>(storageKeys.orders, sampleOrders));
    setWalletTransactions(readJson<WalletTransaction[]>(storageKeys.walletTransactions, sampleWalletTransactions));
    setIsHydrated(true);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem(storageKeys.theme, theme);
  }, [theme]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.country, selectedCountry.id);
  }, [isHydrated, selectedCountry.id]);

  useEffect(() => {
    if (!isHydrated) return;
    if (user) {
      localStorage.setItem(storageKeys.user, JSON.stringify(user));
    } else {
      localStorage.removeItem(storageKeys.user);
    }
  }, [isHydrated, user]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.cart, JSON.stringify(cart));
  }, [cart, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.orders, JSON.stringify(orders));
  }, [isHydrated, orders]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.walletTransactions, JSON.stringify(walletTransactions));
  }, [isHydrated, walletTransactions]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const t = useCallback((en: string, ar: string, zh?: string) => {
    if (language === 'ar') return ar;
    if (language === 'zh') return zh || zhTranslations[en] || en;
    return en;
  }, [language]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = languageLabels[language].htmlLang;
    document.documentElement.dir = dir;
    localStorage.setItem(storageKeys.language, language);
    localStorage.setItem('language', language);
  }, [dir, language]);

  const login = useCallback(async (phone: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPendingPhone(phone);
    return true;
  }, []);

  const verifyOtp = useCallback(async (otp: string): Promise<boolean> => {
    // Simulate OTP verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (otp === '123456' || otp.length === 6) {
      setUser({
        ...demoUser,
        phone: pendingPhone || demoUser.phone,
        lastLogin: new Date().toISOString(),
      });
      setPendingPhone('');
      return true;
    }
    return false;
  }, [pendingPhone]);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(
        i => i.gameId === item.gameId && i.packageId === item.packageId
      );
      if (existing) {
        return prev.map(i =>
          i.gameId === item.gameId && i.packageId === item.packageId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const removeFromCart = useCallback((gameId: string, packageId: string) => {
    setCart(prev => prev.filter(
      i => !(i.gameId === gameId && i.packageId === packageId)
    ));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const createDemoOrder = useCallback((orderInput: DemoOrderInput) => {
    const now = new Date();
    const orderId = `ORD-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isInstantPayment = orderInput.paymentMethod === 'wallet';
    const order: Order = {
      id: orderId,
      userId: user?.id || demoUser.id,
      ...orderInput,
      status: isInstantPayment ? 'completed' : 'processing',
      paymentStatus: isInstantPayment ? 'completed' : 'pending',
      providerId: isInstantPayment ? 'provider-1' : undefined,
      providerOrderId: isInstantPayment ? `PROV-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      completedAt: isInstantPayment ? new Date(now.getTime() + 22000).toISOString() : undefined,
    };

    setOrders((current) => [order, ...current]);

    if (isInstantPayment && user) {
      const nextBalance = Math.max(0, user.walletBalance - order.finalPrice);
      setUser({
        ...user,
        walletBalance: nextBalance,
        totalSpent: user.totalSpent + order.finalPrice,
      });
      setWalletTransactions((current) => [
        {
          id: `wt-${orderId.toLowerCase()}`,
          userId: user.id,
          type: 'purchase',
          amount: -order.finalPrice,
          currency: order.currency,
          balance: nextBalance,
          description: `Purchase: ${order.gameName} ${order.packageName}`,
          descriptionAr: `شراء: ${order.gameName} ${order.packageName}`,
          reference: order.id,
          createdAt: now.toISOString(),
        },
        ...current,
      ]);
    }

    return order;
  }, [user]);

  const resetDemoData = useCallback(() => {
    setUser(null);
    setCart([]);
    setOrders(sampleOrders);
    setWalletTransactions(sampleWalletTransactions);
    localStorage.removeItem(storageKeys.user);
    localStorage.removeItem(storageKeys.cart);
    localStorage.removeItem(storageKeys.orders);
    localStorage.removeItem(storageKeys.walletTransactions);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      t,
      dir,
      theme,
      toggleTheme,
      user,
      isAuthenticated: !!user,
      login,
      logout,
      verifyOtp,
      selectedCountry,
      setSelectedCountry,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      orders,
      walletTransactions,
      createDemoOrder,
      resetDemoData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
