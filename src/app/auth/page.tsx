'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countries } from '@/data/mock-data';
import { ArrowLeft, Phone, Shield, Loader2, MessageCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const router = useRouter();
  const { t, dir, language, login, verifyOtp } = useApp();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countryCode, setCountryCode] = useState('+964');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 8) {
      toast.error(t('Please enter a valid phone number', 'الرجاء إدخال رقم هاتف صحيح'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(`${countryCode}${phone}`);
      if (success) {
        setStep('otp');
        toast.success(t('OTP sent via WhatsApp!', 'تم إرسال رمز التحقق عبر واتساب!'));
      }
    } catch (error) {
      toast.error(t('Failed to send OTP', 'فشل في إرسال رمز التحقق'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error(t('Please enter the complete OTP', 'الرجاء إدخال رمز التحقق كاملاً'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await verifyOtp(otpCode);
      if (success) {
        toast.success(t('Welcome back!', 'مرحباً بعودتك!'));
        router.push('/');
      } else {
        toast.error(t('Invalid OTP', 'رمز التحقق غير صحيح'));
      }
    } catch (error) {
      toast.error(t('Verification failed', 'فشل في التحقق'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MTEwIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />

      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Home', 'العودة للرئيسية')}
        </Link>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span className="text-2xl font-bold text-white">و</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('Al-Wasl Digital', 'الوصل الرقمي')}</h1>
            <p className="text-xs text-emerald-500/70">{t('Top-Up Platform', 'منصة الشحن الرقمي')}</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/50 border border-emerald-800/20 rounded-2xl p-6 md:p-8 backdrop-blur-xl">
          {step === 'phone' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">{t('Welcome', 'مرحباً')}</h2>
                <p className="text-sm text-white/50 mt-1">
                  {t('Enter your phone number to continue', 'أدخل رقم هاتفك للمتابعة')}
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-white/70">{t('Phone Number', 'رقم الهاتف')}</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-28 bg-slate-800/50 border-emerald-800/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-emerald-800/30">
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={`+${country.id === 'iq' ? '964' : country.id === 'sa' ? '966' : country.id === 'ae' ? '971' : country.id === 'eg' ? '20' : country.id === 'jo' ? '962' : '965'}`}>
                            <span className="flex items-center gap-2">
                              <span>{country.flag}</span>
                              <span className="text-xs">+{country.id === 'iq' ? '964' : country.id === 'sa' ? '966' : country.id === 'ae' ? '971' : country.id === 'eg' ? '20' : country.id === 'jo' ? '962' : '965'}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500/50" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="7XX XXX XXXX"
                        className="pl-10 bg-slate-800/50 border-emerald-800/30 text-white placeholder:text-white/30"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <MessageCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-400/70">
                    {t('We will send you a verification code via WhatsApp', 'سنرسل لك رمز التحقق عبر واتساب')}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {t('Send OTP', 'إرسال رمز التحقق')}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setStep('phone')}
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('Change number', 'تغيير الرقم')}
                </button>
                <h2 className="text-2xl font-bold text-white">{t('Enter OTP', 'أدخل رمز التحقق')}</h2>
                <p className="text-sm text-white/50 mt-1">
                  {t('Enter the 6-digit code sent to', 'أدخل الرمز المكون من 6 أرقام المرسل إلى')} {countryCode}{phone}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-white/70">{t('Verification Code', 'رمز التحقق')}</Label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-xl font-bold bg-slate-800/50 border-emerald-800/30 text-white focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button type="button" className="text-sm text-emerald-400 hover:text-emerald-300">
                    {t("Didn't receive code?", 'لم تستلم الرمز؟')} {t('Resend', 'إعادة الإرسال')}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      {t('Verify & Login', 'تحقق وسجل الدخول')}
                    </>
                  )}
                </Button>
              </form>
            </>
          )}

          <p className="text-xs text-white/30 text-center mt-6">
            {t('By continuing, you agree to our', 'بالمتابعة، أنت توافق على')}{' '}
            <Link href="/terms" className="text-emerald-400 hover:underline">{t('Terms', 'الشروط')}</Link>
            {' '}{t('and', 'و')}{' '}
            <Link href="/privacy" className="text-emerald-400 hover:underline">{t('Privacy Policy', 'سياسة الخصوصية')}</Link>
          </p>
        </div>

        {/* Demo Hint */}
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-400/70 text-center">
            <strong>{t('Demo Mode:', 'وضع التجربة:')}</strong> {t('Enter any phone number and use OTP "123456" to login', 'أدخل أي رقم هاتف واستخدم الرمز "123456" للدخول')}
          </p>
        </div>
      </div>
    </div>
  );
}
