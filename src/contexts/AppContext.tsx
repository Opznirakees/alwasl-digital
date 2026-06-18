'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Language, User, Country, CartItem, Order, WalletTransaction } from '@/types';
import { countries } from '@/data/mock-data';
import { resolveOtpPhone } from './auth-flow';

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
  verifyOtp: (otp: string, phoneOverride?: string) => Promise<boolean>;
  refreshAccount: () => Promise<void>;

  // Country
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (gameId: string, packageId: string) => void;
  clearCart: () => void;
  cartTotal: number;

  // Server data
  orders: Order[];
  walletTransactions: WalletTransaction[];
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const storageKeys = {
  language: 'alwasl-language',
  theme: 'theme',
  country: 'alwasl-country',
  cart: 'alwasl-demo-cart',
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
  'Menu': '菜单',
  'Open menu': '打开菜单',
  'Search': '搜索',
  'Change language': '切换语言',
  'Notifications': '通知',
  'Open cart': '打开购物车',
  'Open account menu': '打开账号菜单',
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
  'Copy order ID': '复制订单号',
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
  'Search...': '搜索...',
  'vs last month': '较上月',
  'WAHO ID': 'WAHO ID',
  'Create Promotion': '创建优惠',
  'OTP sent via WhatsApp!': '验证码已通过 WhatsApp 发送！',
  'Failed to send OTP': '发送验证码失败',
  'Please enter the complete OTP': '请输入完整验证码',
  'Welcome back!': '欢迎回来！',
  'Invalid OTP': '验证码无效',
  'Verification failed': '验证失败',
  'Test account opened': '测试账号已打开',
  'Test login failed': '测试登录失败',
  'WAHO recharge platform': 'WAHO 充值平台',
  'We will send you a verification code via WhatsApp': '我们将通过 WhatsApp 发送验证码',
  'Send OTP': '发送验证码',
  'Use test account': '使用测试账号',
  'Change number': '更换号码',
  'Enter OTP': '输入验证码',
  'Enter the 6-digit code sent to': '请输入发送至该号码的 6 位验证码',
  'Verification Code': '验证码',
  "Didn't receive code?": '没有收到验证码？',
  'Resend': '重新发送',
  'Verify & Login': '验证并登录',
  'By continuing, you agree to our': '继续即表示您同意我们的',
  'Terms': '条款',
  'and': '和',
  'Continue shopping': '继续购物',
  'Cart': '购物车',
  'Saved demo items for follow-up checkout': '已保存用于后续结账的演示商品',
  'Clear': '清除',
  'Account': '账号',
  'Checkout': '结账',
  'Remove': '移除',
  'Summary': '摘要',
  'Estimated total': '预估总计',
  'Your cart is empty': '您的购物车为空',
  'Browse products': '浏览商品',
  'Demo approval flow': '演示审批流程',
  'A complete walkthrough for stakeholder approval.': '用于利益相关方审批的完整演示流程。',
  'This page keeps the demo focused: customer checkout, wallet behavior, order tracking, and operator controls are all ready to show.': '此页面聚焦演示内容：客户结账、钱包行为、订单追踪和运营控制均可展示。',
  'Start demo login': '开始演示登录',
  'Reset demo data': '重置演示数据',
  'Demo OTP': '演示验证码',
  'Wallet balance': '钱包余额',
  'Production scope': '生产范围',
  'Payments + provider APIs': '支付 + 供应商 API',
  'Fast fulfillment': '快速完成',
  'Verified Account': '已验证账号',
  'Verified': '已验证',
  'Phone': '电话',
  'Email': '邮箱',
  'Not set': '未设置',
  'Account shortcuts': '账号快捷入口',
  'View orders': '查看订单',
  'Open wallet': '打开钱包',
  'Promotion code copied!': '优惠码已复制！',
  'Active offers': '有效优惠',
  'Promotions and coupon codes': '优惠活动和优惠码',
  'Copy an active code and apply it during checkout when your WAHO top-up amount meets the offer rules.': '复制有效优惠码，并在 WAHO 充值金额符合活动规则时于结账中使用。',
  'Upcoming': '即将开始',
  'Expired': '已过期',
  'Live now': '进行中',
  'off': '优惠',
  'Copy code': '复制代码',
  'Minimum purchase': '最低消费',
  'Maximum discount': '最高优惠',
  'All products': '全部商品',
  'Manage language, region, and display preferences.': '管理语言、地区和显示偏好。',
  'Theme': '主题',
  'Switch between dark and light mode.': '在深色和浅色模式之间切换。',
  'Language': '语言',
  'Country': '国家/地区',
  'Profile': '个人资料',
  'Order History': '订单历史',
  'Logout': '退出登录',
  'Console': '控制台',
  'Enter WAHO ID': '输入 WAHO ID',
  'Enter WAHO ID or profile number': '输入 WAHO ID 或个人资料编号',
  'Enter the recipient WAHO ID': '输入接收人的 WAHO ID',
  'Manual WAHO Queue': 'WAHO 人工队列',
  'Recipient WAHO ID': '接收人 WAHO ID',
  'SUMMER10': 'SUMMER10',
  'WAHO Backup Fulfillment': 'WAHO 备用交付',
  'WAHO Direct API': 'WAHO 直连 API',
  'WAHO Room Services': 'WAHO 房间服务',
  'WAHO15': 'WAHO15',
  'WELCOME20': 'WELCOME20',
  'bonus': '奖励',
  'cashback': '返现',
  'completed': '已完成',
  'deposit': '充值',
  'failed': '失败',
  'fixed': '固定金额',
  'percentage': '百分比',
  'processing': '处理中',
  'purchase': '购买',
  'refund': '退款',
  'Ahmed Al-Hassan': '艾哈迈德·哈桑',
  'Flash Sale Alert!': '限时优惠提醒！',
  'Order Completed': '订单已完成',
  'WAHO coins and gift bundles are on offer this week!': 'WAHO 金币和礼物套餐本周正在优惠！',
  'Wallet Top-up': '钱包充值',
  'Your WAHO Coins order has been delivered!': '您的 WAHO 金币订单已送达！',
  'Your wallet has been credited with 100,000 IQD': '您的钱包已到账 100,000 IQD',
  'gift_card': '礼物套餐',
  'mobile_game': '派对游戏',
  'order': '订单',
  'promotion': '优惠活动',
  'social_media': 'WAHO 金币',
  'streaming': '直播房间',
  'voucher': 'VIP 与勋章',
  '15,000': '15,000',
  '60': '60',
  '30d': '30天',
  'Validate': '验证',
  'Price': '价格',
  'Deliver': '交付',
  'Waho team': 'WAHO 团队',
  'Fast WAHO top-ups': '快速 WAHO 充值',
  'Top up WAHO in a few clear steps': '几步即可快速充值 WAHO',
  'Top up WAHO': '充值 WAHO',
  'How it works': '服务流程',
  'Fast top-up': '快速充值',
  'Choose': '选择',
  'Check': '确认',
  'Top up': '充值',
  'Pick your package': '选择套餐',
  'Confirm WAHO ID': '确认 WAHO ID',
  'Complete order': '完成订单',
  'Contact us for WAHO top-ups, orders, or account help.': '联系我们获取 WAHO 充值、订单或账号帮助。',
  'Simple steps': '简单步骤',
  'After payment is confirmed, this amount will be sent to the WAHO ID shown above.': '付款确认后，此金额将充值到上方显示的 WAHO ID。',
  'WAHO top-ups • digital services': 'WAHO 充值 • 数字服务',
  'Delivery Partners': '交付合作伙伴',
  'Connected top-up route': '已连接的充值路径',
  'WAHO Direct Top-up': 'WAHO 直充',
  'Payments + order handling': '支付 + 订单处理',
  'Manage language and display preferences.': '管理语言和显示偏好。',
  'About Al-Wasl Digital': '关于 Al-Wasl 数字服务',
  'Browse WAHO top-ups': '浏览 WAHO 充值',
  'Contact support': '联系支持',
  'What we offer': '我们提供什么',
  'Designed for the region': '为本地区设计',
  'Built for WAHO recharges': '专为 WAHO 充值打造',
  'Every step is focused on one outcome: the right WAHO ID, the selected IQD amount, payment confirmation, and order status.': '每一步都聚焦同一个结果：正确的 WAHO ID、选择的 IQD 金额、付款确认和订单状态。',
  'What customers should expect': '客户可以期待什么',
  'Clear WAHO top-up amounts in IQD.': '清晰的 IQD WAHO 充值金额。',
  'A required WAHO ID check before payment.': '付款前必须检查 WAHO ID。',
  'Support when a payment or order needs review.': '付款或订单需要核查时提供支持。',
  'Support is one message away.': '只需一条消息即可获得支持。',
  'Open WhatsApp': '打开 WhatsApp',
  'View FAQ': '查看常见问题',
  'WhatsApp support': 'WhatsApp 支持',
  'For fastest help, send your order ID and the phone number used during checkout.': '为了最快获得帮助，请发送订单号和结账时使用的电话号码。',
  'Order questions': '订单问题',
  'Send the order ID if a WAHO recharge is pending, failed, refunded, or sent to the wrong account details.': '如果 WAHO 充值待处理、失败、已退款或发送到错误账号信息，请发送订单号。',
  'Payments': '支付',
  'The storefront is prepared for wallet, ZainCash, AsiaHawala, card, and USDT style payment methods.': '店铺已准备支持钱包、ZainCash、AsiaHawala、银行卡和 USDT 等支付方式。',
  'Business hours': '营业时间',
  'WhatsApp is the fastest channel for urgent payment checks and WAHO ID corrections.': 'WhatsApp 是处理紧急付款检查和 WAHO ID 更正最快的渠道。',
  '1. Load demo customer': '1. 加载演示客户',
  'Use the demo login button or any phone number with OTP 123456.': '使用演示登录按钮，或输入任意手机号并使用验证码 123456。',
  '2. Place a top-up order': '2. 创建充值订单',
  '2. Place a WAHO top-up': '2. 创建 WAHO 充值',
  'Choose a WAHO package, fill in the demo details, pay from wallet, then watch the order appear.': '选择 WAHO 套餐，填写演示信息，使用钱包支付，然后查看订单生成。',
  'Choose Mobile Legends, fill demo details, pay from wallet, then watch the order appear.': '选择服务，填写演示信息，使用钱包支付，然后查看订单生成。',
  '3. Show wallet impact': '3. 查看钱包变化',
  'Wallet balance and purchase transaction update after the demo order.': '演示订单完成后，钱包余额和购买交易会更新。',
  '4. Review the operator view': '4. 查看运营后台',
  'Admin dashboard shows revenue, orders, products, promotions, and wallet activity.': '管理后台会显示收入、订单、产品、优惠和钱包动态。',
  'Admin dashboard shows revenue, orders, providers, products, and promotions.': '管理后台会显示收入、订单、供应商、产品和优惠活动。',
  'Quick answers before you place an order.': '下单前的快速解答。',
  'Check the WAHO ID, payment method, currency, and order status before you continue.': '继续前请检查 WAHO ID、付款方式、货币和订单状态。',
  'Start shopping': '开始选购',
  'What do I need before ordering?': '下单前需要什么？',
  'Have the correct WAHO ID ready. The recharge is tied to that account, so check it before payment.': '请准备正确的 WAHO ID。充值会绑定到该账号，因此付款前请检查。',
  'How do I follow an order?': '如何跟踪订单？',
  'Open My Orders to see whether the WAHO recharge is pending, processing, completed, failed, or refunded.': '打开“我的订单”查看 WAHO 充值是待处理、处理中、已完成、失败还是已退款。',
  'Which countries are supported?': '支持哪些国家？',
  'The interface currently includes Iraq, Saudi Arabia, UAE, Egypt, Jordan, and Kuwait.': '界面当前包含伊拉克、沙特阿拉伯、阿联酋、埃及、约旦和科威特。',
  'Can I use wallet balance?': '可以使用钱包余额吗？',
  'Yes. The wallet shows balance, transactions, and a clear way to request a top-up.': '可以。钱包会显示余额、交易记录，并提供清晰的充值请求方式。',
  'Everything needed to top up WAHO smoothly.': '顺利充值 WAHO 所需的一切。',
  'Pick a package, confirm the WAHO details, pay securely, and track the order.': '选择套餐，确认 WAHO 信息，安全支付并跟踪订单。',
  'Everything needed to complete a top-up smoothly.': '顺利完成充值所需的一切。',
  'My orders': '我的订单',
  'Before ordering': '下单前',
  'Choose the WAHO package that matches what the customer needs.': '选择符合客户需求的 WAHO 套餐。',
  'Confirm the WAHO ID, room ID, or email before payment.': '付款前确认 WAHO ID、房间 ID 或邮箱。',
  'Pick the correct country so prices and currency match the customer.': '选择正确的地区，使价格和货币与客户匹配。',
  'Confirm the player ID, server, or email before payment.': '付款前请确认账号 ID、房间 ID、服务器或邮箱。',
  'During checkout': '结账中',
  'Select a package, check the account details, then choose a payment method.': '选择套餐，检查账号信息，然后选择支付方式。',
  'Checkout asks users to log in before creating the order.': '创建订单前，结账流程会要求用户登录。',
  'Select a package, verify the account, then choose a payment method.': '选择套餐，验证账号，然后选择支付方式。',
  'After ordering': '下单后',
  'Use the order page to track status and copy the order ID.': '使用订单页面跟踪状态并复制订单号。',
  'Send the order ID to WhatsApp support if something needs review.': '如果需要人工检查，请将订单号发送给 WhatsApp 支持。',
  'Admin checks': '后台检查',
  'The admin dashboard keeps orders, products, promotions, wallets, and reporting in one place.': '管理后台将订单、产品、优惠、钱包和报表集中在一个位置。',
  'Customer data should stay minimal, useful, and protected.': '客户数据应保持最少、实用并受到保护。',
  'We only ask for the details needed to log in, process a WAHO recharge, verify payment, and support the order.': '我们只要求登录、处理 WAHO 充值、验证付款和支持订单所需的信息。',
  'Data collected': '收集的数据',
  'We may collect phone numbers, WAHO account identifiers, order details, wallet transactions, and payment references.': '我们可能会收集电话号码、WAHO 账号标识、订单详情、钱包交易和付款参考。',
  'Why it is used': '使用原因',
  'Data is used to authenticate customers, process orders, provide support, and prevent fraud.': '数据用于认证客户、处理订单、提供支持和防止欺诈。',
  'Sharing': '共享',
  'Order data may be shared with payment and fulfillment providers only where needed to complete the service.': '仅在完成服务所需时，订单数据才会与支付和交付服务商共享。',
  'Local preferences': '本地偏好',
  'Language and theme choices can be stored in the browser so the site opens the way you prefer next time.': '语言和主题选择可存储在浏览器中，以便下次按你的偏好打开网站。',
  'Clear rules for using Al-Wasl Digital.': '使用 Al-Wasl 数字服务的清晰规则。',
  'Please check the WAHO ID, selected amount, and payment details before confirming a recharge.': '确认充值前，请检查 WAHO ID、选择的金额和付款信息。',
  'Account use': '账号使用',
  'Customers are responsible for entering accurate account, player, server, and contact details.': '客户负责输入准确的账号、用户、房间、服务器和联系信息。',
  'Digital top-ups and gift cards may be irreversible after successful fulfillment.': '数字充值和礼品卡一旦成功交付，可能无法撤销。',
  'Orders are processed after payment is confirmed. Keep your order ID if support needs to review a payment.': '付款确认后会处理订单。如果客服需要核查付款，请保留订单号。',
  'Support review': '客服核查',
  'If a recharge cannot be completed, support may ask for the order ID, WAHO ID, phone number, and payment reference.': '如果充值无法完成，客服可能会要求提供订单号、WAHO ID、手机号和付款参考。',
  'Fast WAHO account top-ups with clear payment steps.': '清晰支付步骤，快速完成 WAHO 账号充值。',
  'Al-Wasl Digital helps customers top up a WAHO account quickly with clear amounts and local payment options.': 'Al-Wasl 数字服务帮助客户通过清晰金额和本地支付方式快速充值 WAHO 账号。',
  'Customers choose a WAHO top-up amount, enter the WAHO ID, confirm the account details, and continue to payment.': '客户选择 WAHO 充值金额，输入 WAHO ID，确认账号信息，然后继续支付。',
  'The app supports Arabic, English, and Chinese, local payment expectations, wallet behavior, and IQD-first pricing.': '应用支持阿拉伯语、英语和中文，并符合本地支付预期、钱包流程和以伊拉克第纳尔优先的定价。',
  'Choose the amount, confirm the WAHO ID, pay securely, and track the order.': '选择金额，确认 WAHO ID，安全支付并跟踪订单。',
  'Choose the WAHO top-up amount that matches what the customer needs.': '选择符合客户需求的 WAHO 充值金额。',
  'Confirm the WAHO ID before payment.': '付款前确认 WAHO ID。',
  'Select a top-up amount, check the account details, then choose a payment method.': '选择充值金额，检查账号信息，然后选择支付方式。',
  'The admin dashboard keeps top-up orders, offers, wallets, providers, and reporting in one place.': '管理后台将充值订单、优惠、钱包、供应商和报表集中在一个位置。',
  'Start top-up': '开始充值',
  'Which currency is used?': '使用什么货币？',
  'WAHO top-up prices are shown clearly with IQD-first pricing in the current flow.': '当前流程以伊拉克第纳尔优先显示 WAHO 充值价格，金额清晰。',
  'Use WhatsApp for urgent top-up help, payment questions, or account checks.': '如需紧急充值帮助、支付问题或账号检查，请使用 WhatsApp。',
  'Customers are responsible for entering the correct WAHO account ID and contact details.': '客户负责输入正确的 WAHO 账号 ID 和联系方式。',
  'WAHO top-ups may be irreversible after successful fulfillment.': 'WAHO 充值成功完成后可能无法撤销。',
  'Choose a top-up amount, fill in the WAHO ID, pay from wallet, then watch the order appear.': '选择充值金额，填写 WAHO ID，使用钱包支付，然后查看订单生成。',
  'Admin dashboard shows revenue, top-up orders, offers, providers, and wallet activity.': '管理后台显示收入、充值订单、优惠、供应商和钱包动态。',
  'WAHO Account Top-Up': 'WAHO 账号充值',
  'WAHO Top-Up': 'WAHO 充值',
  'Top-Up': '充值',
  'Top up a WAHO account balance by entering the WAHO ID, choosing the amount, and paying securely.': '输入 WAHO ID，选择金额并安全支付，即可充值 WAHO 账号余额。',
  'Enter the WAHO account ID': '输入 WAHO 账号 ID',
  '5,000 IQD WAHO Top-Up': '5,000 IQD WAHO 充值',
  '10,000 IQD WAHO Top-Up': '10,000 IQD WAHO 充值',
  '25,000 IQD WAHO Top-Up': '25,000 IQD WAHO 充值',
  '50,000 IQD WAHO Top-Up': '50,000 IQD WAHO 充值',
  '100,000 IQD WAHO Top-Up': '100,000 IQD WAHO 充值',
  'IQD top-up': 'IQD 充值',
  'WAHO Direct Top-Up': 'WAHO 直连充值',
  'WAHO Backup Top-Up': 'WAHO 备用充值',
  'Manual Top-Up Review': '人工充值审核',
  'Purchase: WAHO top-up 25,000 IQD': '购买：WAHO 充值 25,000 IQD',
  'Refund: WAHO top-up failed': '退款：WAHO 充值失败',
  'WAHO top-up timeout': 'WAHO 充值超时',
  'Confirm before you pay': '付款前确认',
  'Check the WAHO account details first so every top-up goes to the right account.': '先检查 WAHO 账号信息，确保每次充值都进入正确账号。',
  'Track every WAHO top-up': '跟踪每一笔 WAHO 充值',
  'Follow pending, processing, completed, failed, and refunded statuses from one place.': '在一个页面查看待处理、处理中、已完成、失败和已退款状态。',
  'Top-up offer available': '有可用充值优惠',
  'Your WAHO top-up has been completed!': '您的 WAHO 充值已完成！',
  'WAHO top-up discounts are available this week!': '本周有 WAHO 充值折扣！',
  'Continue top-up': '继续充值',
  'Top-up cart': '充值清单',
  'Saved top-up items for checkout': '已保存待结账的充值项目',
  'Browse top-ups': '浏览充值',
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [pendingPhone, setPendingPhone] = useState<string>('');
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshAccount = useCallback(async () => {
    const meResponse = await fetch('/api/auth/me', { credentials: 'include' });

    if (!meResponse.ok) {
      setUser(null);
      setOrders([]);
      setWalletTransactions([]);
      return;
    }

    const mePayload = await meResponse.json();
    setUser(mePayload.user ?? null);

    if (!mePayload.user) {
      setOrders([]);
      setWalletTransactions([]);
      return;
    }

    const [ordersResponse, walletResponse] = await Promise.all([
      fetch('/api/orders', { credentials: 'include' }),
      fetch('/api/wallet', { credentials: 'include' }),
    ]);

    if (ordersResponse.ok) {
      const payload = await ordersResponse.json();
      setOrders(payload.orders ?? []);
    }

    if (walletResponse.ok) {
      const payload = await walletResponse.json();
      setWalletTransactions(payload.transactions ?? []);
      if (payload.user) {
        setUser(payload.user);
      }
    }
  }, []);

  // Restore browser preferences. Account/order/wallet data is loaded from the API.
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKeys.theme) as Theme | null;
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    }
    const savedLanguage =
      (localStorage.getItem(storageKeys.language) as Language | null) ||
      (localStorage.getItem('language') as Language | null);
    if (savedLanguage && savedLanguage in languageLabels) {
      setLanguage(savedLanguage);
    }
    localStorage.removeItem(storageKeys.country);

    setCart(readJson<CartItem[]>(storageKeys.cart, []));
    setIsHydrated(true);
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (!isHydrated) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem(storageKeys.theme, theme);
  }, [isHydrated, theme]);

  useEffect(() => {
    if (!isHydrated) return;
    void refreshAccount();
  }, [isHydrated, refreshAccount]);

  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(storageKeys.cart, JSON.stringify(cart));
  }, [cart, isHydrated]);

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
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
      credentials: 'include',
    });

    if (!response.ok) return false;
    const payload = await response.json();
    if (payload.debugOtp) {
      console.info(`Al-Wasl OTP for ${phone}: ${payload.debugOtp}`);
    }
    setPendingPhone(phone);
    return true;
  }, []);

  const verifyOtp = useCallback(async (otp: string, phoneOverride?: string): Promise<boolean> => {
    const phone = resolveOtpPhone(pendingPhone, phoneOverride);
    if (!phone) return false;

    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
      credentials: 'include',
    });

    if (!response.ok) return false;

    const payload = await response.json();
    setUser(payload.user);
    setPendingPhone('');
    await refreshAccount();
    return true;
  }, [pendingPhone, refreshAccount]);

  const logout = useCallback(() => {
    void fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    setCart([]);
    setOrders([]);
    setWalletTransactions([]);
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

  const resetDemoData = useCallback(() => {
    logout();
    setCart([]);
    setOrders([]);
    setWalletTransactions([]);
    localStorage.removeItem(storageKeys.cart);
  }, [logout]);

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
      refreshAccount,
      selectedCountry,
      setSelectedCountry,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      cartTotal,
      orders,
      walletTransactions,
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
