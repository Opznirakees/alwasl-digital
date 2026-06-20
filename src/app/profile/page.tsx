'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Shield, Star, Wallet } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { resolveMembershipForSpend } from '@/lib/membership';

export default function ProfilePage() {
  const { t, dir, theme, user, formatLocalAmount } = useApp();
  const currentUser = user;
  const isLight = theme === 'light';

  if (!currentUser) {
    return (
      <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'} ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <Shield className={isLight ? 'mb-4 h-10 w-10 text-purple-600' : 'mb-4 h-10 w-10 text-purple-300'} />
          <h1 className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {t('Login required', 'تسجيل الدخول مطلوب', '需要登录')}
          </h1>
          <p className={`mt-2 text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
            {t('Login to view your profile and account details.', 'سجل الدخول لعرض ملفك وبيانات حسابك.', '登录后查看您的资料和账号信息。')}
          </p>
          <Link href="/auth">
            <Button className="mt-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              {t('Login', 'تسجيل الدخول', '登录')}
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const level = resolveMembershipForSpend(currentUser.totalSpent);
  const displayName = t(currentUser.name, currentUser.name);

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'} ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Link href="/" className={`inline-flex items-center gap-2 text-sm mb-8 ${isLight ? 'text-slate-600 hover:text-purple-600' : 'text-white/70 hover:text-white'}`}>
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Home', 'العودة للرئيسية')}
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className={`lg:col-span-1 p-6 ${isLight ? 'bg-white border-purple-100' : 'bg-slate-900/50 border-purple-500/15'}`}>
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold text-white">
              {displayName.charAt(0)}
            </div>
            <h1 className={`text-2xl font-bold mt-5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {displayName}
            </h1>
            <p className={isLight ? 'text-slate-500' : 'text-white/50'}>
              {currentUser.phone}
            </p>
            <Badge className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Star className="w-3 h-3 mr-1" />
              {t(level.en, level.ar)}
            </Badge>
          </Card>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
            {[
              { icon: Wallet, label: t('Wallet Balance', 'رصيد المحفظة'), value: formatLocalAmount(currentUser.walletBalance) },
              { icon: Shield, label: t('Verified Account', 'حساب موثق'), value: currentUser.isVerified ? t('Verified', 'موثق') : t('Pending', 'قيد الانتظار') },
              { icon: Phone, label: t('Phone', 'الهاتف'), value: currentUser.phone },
              { icon: Mail, label: t('Email', 'البريد الإلكتروني'), value: currentUser.email || t('Not set', 'غير محدد') },
            ].map((item) => (
              <Card key={item.label} className={`p-5 ${isLight ? 'bg-white border-purple-100' : 'bg-slate-900/50 border-purple-500/15'}`}>
                <item.icon className={isLight ? 'w-5 h-5 text-purple-600' : 'w-5 h-5 text-purple-300'} />
                <p className={`text-xs mt-4 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{item.label}</p>
                <p className={`font-bold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.value}</p>
              </Card>
            ))}

            <Card className={`sm:col-span-2 p-6 ${isLight ? 'bg-white border-purple-100' : 'bg-slate-900/50 border-purple-500/15'}`}>
              <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {t('Account shortcuts', 'اختصارات الحساب')}
              </h2>
              <div className="flex flex-wrap gap-3 mt-5">
                <Link href="/orders">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {t('View orders', 'عرض الطلبات')}
                  </Button>
                </Link>
                <Link href="/wallet">
                  <Button variant="outline" className={isLight ? 'border-purple-200 text-purple-700' : 'border-purple-500/30 text-purple-300'}>
                    {t('Open wallet', 'فتح المحفظة')}
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
