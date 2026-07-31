'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { AccountPageLoading } from '@/components/account/AccountPageLoading';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useApp } from '@/contexts/AppContext';
import { getNextMembershipLevel, resolveMembershipForSpend } from '@/lib/membership';
import type { WalletTransactionType } from '@/types';
import { walletTopUpDialogCopy } from './wallet-dialog-copy';

export default function WalletPage() {
  const { t, language, dir, user, isAccountLoading, walletTransactions, refreshAccount, formatLocalAmount } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('zaincash');
  const [transactionId, setTransactionId] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const quickAmounts = [10000, 25000, 50000, 100000];

  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const transactionIcon = (type: WalletTransactionType) => {
    if (type === 'deposit') return ArrowDownLeft;
    if (type === 'refund') return RefreshCw;
    if (type === 'bonus' || type === 'cashback') return Sparkles;
    return ArrowUpRight;
  };

  const requestWalletOtp = async () => {
    setIsRequestingOtp(true);
    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ purpose: 'WALLET_TOP_UP' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error('OTP_REQUEST_FAILED');
      if (payload.debugOtp) setOtp(payload.debugOtp);
      toast.success(t('WhatsApp code sent', 'تم إرسال رمز واتساب', 'WhatsApp 验证码已发送'));
    } catch {
      toast.error(t('The code could not be sent. Try again.', 'تعذر إرسال الرمز. حاول مرة أخرى.', '验证码发送失败，请重试。'));
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) < 5000) {
      toast.error(t('Enter at least 5,000 IQD', 'أدخل 5,000 د.ع على الأقل', '请输入至少 5,000 IQD'));
      return;
    }
    if (!transactionId.trim()) {
      toast.error(t('Enter the payment transaction ID', 'أدخل رقم معاملة الدفع', '请输入付款交易 ID'));
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      toast.error(t('Enter the 6-digit WhatsApp code', 'أدخل رمز واتساب المكون من 6 أرقام', '请输入 6 位 WhatsApp 验证码'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/wallet/manual-deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(topUpAmount),
          paymentMethod,
          transactionId,
          otp,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'WALLET_TOP_UP_FAILED');

      await refreshAccount();
      setTopUpAmount('');
      setTransactionId('');
      setOtp('');
      setDialogOpen(false);
      toast.success(t('Deposit sent for review', 'تم إرسال الإيداع للمراجعة', '充值申请已提交审核'));
    } catch (error) {
      const message = error instanceof Error && !error.message.includes('_')
        ? error.message
        : t('The deposit could not be submitted. Try again.', 'تعذر إرسال الإيداع. حاول مرة أخرى.', '充值申请提交失败，请重试。');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAccountLoading) return <AccountPageLoading />;

  if (!user) {
    return (
      <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="container mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"><Wallet className="h-7 w-7" /></div>
          <h1 className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">{t('Log in to see your wallet', 'سجل الدخول لرؤية محفظتك', '登录后查看钱包')}</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{t('Your balance and wallet transactions are kept here.', 'تجد هنا رصيدك ومعاملات المحفظة.', '您的余额和钱包交易记录会显示在这里。')}</p>
          <Button asChild className="mt-5 bg-blue-600 text-white hover:bg-blue-700"><Link href="/auth?next=%2Fwallet">{t('Log in', 'تسجيل الدخول', '登录')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link></Button>
        </main>
      </div>
    );
  }

  const currentLevel = resolveMembershipForSpend(user.totalSpent);
  const nextLevel = getNextMembershipLevel(currentLevel.level);
  const progress = nextLevel
    ? Math.max(0, Math.min(100, ((user.totalSpent - currentLevel.minSpent) / (nextLevel.minSpent - currentLevel.minSpent)) * 100))
    : 100;
  const remaining = nextLevel ? Math.max(0, nextLevel.minSpent - user.totalSpent) : 0;

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-zinc-500 hover:text-blue-700 dark:text-zinc-400 dark:hover:text-blue-300">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="mt-4">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Your money', 'أموالك', '您的资金')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white sm:text-4xl">{t('My wallet', 'محفظتي', '我的钱包')}</h1>
        </header>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">
            <section className="rounded-lg bg-[#071b46] p-6 text-white sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-100/75">{t('Available balance', 'الرصيد المتاح', '可用余额')}</p>
                  <p className="mt-2 break-words text-3xl font-semibold tabular-nums text-white sm:text-4xl">{formatLocalAmount(user.walletBalance)}</p>
                </div>
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#ffd33d]"><Wallet className="h-6 w-6" /></span>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="v2-primary-button mt-6">
                    <Plus className="h-4 w-4" />
                    {t('Add wallet balance', 'أضف رصيداً للمحفظة', '充值钱包余额')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="grid max-h-[calc(100dvh-1.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden border-white/10 bg-[#06152f] p-0 text-white sm:max-h-[90vh] sm:max-w-lg">
                  <DialogHeader className="px-5 pb-4 pe-14 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
                    <DialogTitle className="text-white">{t('Add wallet balance', 'أضف رصيداً للمحفظة', '充值钱包余额')}</DialogTitle>
                    <DialogDescription className="text-[#b8c5db]">
                      {t(walletTopUpDialogCopy.description.en, walletTopUpDialogCopy.description.ar, walletTopUpDialogCopy.description.zh)}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="min-h-0 overflow-y-auto px-5 pb-5 sm:px-6">
                    <div className="rounded-lg border border-white/10 bg-[#0a2148] p-4 text-sm leading-6 text-[#dce6f5]">
                      <ol className="space-y-1">
                        <li>{t('1. Make the payment with your chosen method.', '1. نفذ الدفع بالطريقة المختارة.', '1. 使用所选方式付款。')}</li>
                        <li>{t('2. Enter the transaction ID shown on the payment receipt.', '2. أدخل رقم المعاملة الظاهر في إيصال الدفع.', '2. 输入付款凭证上显示的交易 ID。')}</li>
                        <li>{t('3. We review it before adding the balance.', '3. نراجعه قبل إضافة الرصيد.', '3. 审核后余额才会到账。')}</li>
                      </ol>
                    </div>

                    <div className="mt-5 space-y-5">
                    <div>
                      <Label htmlFor="wallet-amount" className="font-semibold text-zinc-800 dark:text-zinc-200">{t('Amount in IQD', 'المبلغ بالدينار', 'IQD 金额')}</Label>
                      <Input id="wallet-amount" type="number" inputMode="numeric" min={5000} value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} placeholder="5000" className="mt-2 h-12 border-white/15 bg-[#020817] text-lg font-semibold text-white tabular-nums" />
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {quickAmounts.map((amount) => (
                          <button key={amount} type="button" aria-pressed={topUpAmount === String(amount)} onClick={() => setTopUpAmount(String(amount))} className={`min-h-11 rounded-md border px-2 text-xs font-semibold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b928] ${topUpAmount === String(amount) ? 'border-[#f7b928] bg-[#f7b928] text-[#07152e]' : 'border-white/15 text-[#dce6f5] hover:border-[#f7b928] hover:bg-white/5'}`}>
                            {new Intl.NumberFormat(locale).format(amount)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="font-semibold text-zinc-800 dark:text-zinc-200">{t('Payment method', 'طريقة الدفع', '付款方式')}</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2 grid gap-2">
                        {[
                          { id: 'zaincash', name: 'ZainCash' },
                          { id: 'asiahawala', name: 'AsiaHawala' },
                          { id: 'card', name: t('Bank card', 'بطاقة مصرفية', '银行卡') },
                        ].map((method) => (
                          <label key={method.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border p-3 ${paymentMethod === method.id ? 'border-[#f7b928] bg-[#f7b928]/10' : 'border-white/15'}`}>
                            <RadioGroupItem value={method.id} className="border-[#f7b928] text-[#f7b928]" />
                            <CreditCard className="h-4 w-4 text-[#f7b928]" />
                            <span className="font-medium text-zinc-950 dark:text-white">{method.name}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="wallet-transaction" className="font-semibold text-zinc-800 dark:text-zinc-200">{t('Payment transaction ID', 'رقم معاملة الدفع', '付款交易 ID')}</Label>
                      <Input id="wallet-transaction" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="ZC-123456789" autoComplete="off" className="mt-2 h-12 border-white/15 bg-[#020817] text-white" />
                    </div>

                    <div>
                      <Label htmlFor="wallet-otp" className="font-semibold text-zinc-800 dark:text-zinc-200">{t('WhatsApp verification code', 'رمز تحقق واتساب', 'WhatsApp 验证码')}</Label>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <Input id="wallet-otp" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="h-12 border-white/15 bg-[#020817] text-center font-semibold text-white tracking-[0.2em] tabular-nums" />
                        <Button type="button" variant="outline" disabled={isRequestingOtp} onClick={() => void requestWalletOtp()} className="h-12">
                          {isRequestingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                          {t('Send code', 'أرسل الرمز', '发送验证码')}
                        </Button>
                      </div>
                    </div>

                    </div>
                  </div>

                  <div className="border-t border-white/10 bg-[#06152f] p-4 sm:px-6">
                    <Button type="button" onClick={() => void handleTopUp()} disabled={isLoading || !topUpAmount || !transactionId || otp.length !== 6} className="v2-primary-button w-full">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {t('Send deposit for review', 'أرسل الإيداع للمراجعة', '提交充值审核')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </section>

            <section className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900 sm:p-6">
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-white">{t('Recent wallet activity', 'آخر معاملات المحفظة', '最近的钱包记录')}</h2>
              {walletTransactions.length > 0 ? (
                <div className="mt-4 divide-y divide-black/10 dark:divide-white/10">
                  {walletTransactions.map((transaction) => {
                    const TransactionIcon = transactionIcon(transaction.type);
                    const positive = transaction.amount >= 0;
                    return (
                      <div key={transaction.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${positive ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'}`}><TransactionIcon className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-950 dark:text-white">{t(transaction.description, transaction.descriptionAr, transaction.description)}</p>
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{formatDate(transaction.createdAt)}</p>
                        </div>
                        <div className="text-end">
                          <p className={`text-sm font-semibold tabular-nums ${positive ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{positive ? '+' : '-'}{formatLocalAmount(transaction.amount, { absolute: true })}</p>
                          <p className="mt-1 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">{formatLocalAmount(transaction.balance)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 flex min-h-40 flex-col items-center justify-center rounded-lg bg-zinc-100 p-5 text-center dark:bg-zinc-950">
                  <Wallet className="h-6 w-6 text-zinc-400" />
                  <p className="mt-3 text-sm font-semibold text-zinc-950 dark:text-white">{t('No wallet activity yet', 'لا توجد معاملات بعد', '暂无钱包记录')}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{t('Deposits, purchases and refunds will appear here.', 'ستظهر هنا الإيداعات والمشتريات والمبالغ المستردة.', '充值、消费和退款记录会显示在这里。')}</p>
                </div>
              )}
            </section>
          </div>

          <aside className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#fff8dd] text-[#8a5a00] dark:bg-[#ffd33d]/10 dark:text-[#ffd966]"><Star className="h-5 w-5" /></span>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('Membership level', 'مستوى العضوية', '会员等级')}</p>
                <p className="font-semibold text-zinc-950 dark:text-white">{t(currentLevel.en, currentLevel.ar, currentLevel.zh)}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-zinc-500 dark:text-zinc-400">{t('Your discount', 'خصمك', '您的折扣')}</dt><dd className="font-semibold text-blue-700 dark:text-blue-300">{currentLevel.discountPercentage}%</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-zinc-500 dark:text-zinc-400">{t('Total spent', 'إجمالي الإنفاق', '累计消费')}</dt><dd className="font-medium tabular-nums text-zinc-950 dark:text-white">{formatLocalAmount(user.totalSpent)}</dd></div>
            </dl>
            {nextLevel && (
              <div className="mt-5 border-t border-black/10 pt-4 dark:border-white/10">
                <div className="flex justify-between gap-3 text-xs"><span className="text-zinc-500 dark:text-zinc-400">{t('Next level', 'المستوى التالي', '下一等级')}</span><span className="font-semibold text-zinc-950 dark:text-white">{t(nextLevel.en, nextLevel.ar, nextLevel.zh)}</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"><div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }} /></div>
                <p className="mt-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{t(`${formatLocalAmount(remaining)} until the next level`, `${formatLocalAmount(remaining)} حتى المستوى التالي`, `距离下一等级还差 ${formatLocalAmount(remaining)}`)}</p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
