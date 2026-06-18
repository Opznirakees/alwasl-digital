'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  const { t, dir, login, verifyOtp } = useApp();
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

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const demoPhone = '+9647812345678';
    try {
      await login(demoPhone);
      const success = await verifyOtp('123456', demoPhone);
      if (success) {
        toast.success(t('Demo account loaded!', 'تم تحميل الحساب التجريبي!'));
        router.push('/');
      } else {
        toast.error(t('Demo login failed', 'فشل تسجيل الدخول التجريبي'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center bg-[#f5f5f7] p-4 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 inline-flex min-h-11 items-center gap-2 py-2 text-sm text-zinc-500 transition-colors hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('Back to Home', 'العودة للرئيسية')}
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-black/10 bg-white">
            <Image
              src="/brand/alwasl-mark.jpg"
              alt={t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}
              fill
              className="object-contain p-1"
              sizes="48px"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-950">{t('Al-Wasl Digital', 'الوصل الرقمي')}</h1>
            <p className="text-xs text-zinc-500">{t('WAHO recharge platform', 'منصة شحن WAHO')}</p>
          </div>
        </div>

        <div className="rounded-lg border border-black/10 bg-white p-6 md:p-8">
          {step === 'phone' ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-zinc-950">{t('Welcome', 'مرحباً')}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {t('Enter your phone number to continue', 'أدخل رقم هاتفك للمتابعة')}
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-zinc-700">{t('Phone Number', 'رقم الهاتف')}</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-28 border-black/10 bg-white text-zinc-950">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-black/10 bg-white">
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
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="7XX XXX XXXX"
                        className="border-black/10 bg-white pl-10 text-zinc-950 placeholder:text-zinc-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border border-[#34c759]/25 bg-[#34c759]/10 p-3">
                  <MessageCircle className="h-5 w-5 flex-shrink-0 text-[#1f8f3a]" />
                  <p className="text-xs text-[#1f8f3a]">
                    {t('We will send you a verification code via WhatsApp', 'سنرسل لك رمز التحقق عبر واتساب')}
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white shadow-none hover:bg-blue-700"
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

                <Button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full border-black/10 bg-white text-zinc-700 hover:bg-zinc-50"
                >
                  {t('Use Demo Account', 'استخدام الحساب التجريبي')}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <button
                  onClick={() => setStep('phone')}
                  className="mb-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('Change number', 'تغيير الرقم')}
                </button>
                <h2 className="text-2xl font-semibold text-zinc-950">{t('Enter OTP', 'أدخل رمز التحقق')}</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  {t('Enter the 6-digit code sent to', 'أدخل الرمز المكون من 6 أرقام المرسل إلى')} {countryCode}{phone}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-zinc-700">{t('Verification Code', 'رمز التحقق')}</Label>
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
                        className="h-14 w-12 border-black/10 bg-white text-center text-xl font-semibold text-zinc-950 focus:border-blue-500 focus:ring-blue-500"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button type="button" className="text-sm text-blue-600 hover:text-blue-700">
                    {t("Didn't receive code?", 'لم تستلم الرمز؟')} {t('Resend', 'إعادة الإرسال')}
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white shadow-none hover:bg-blue-700"
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

          <p className="mt-6 text-center text-xs text-zinc-500">
            {t('By continuing, you agree to our', 'بالمتابعة، أنت توافق على')}{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">{t('Terms', 'الشروط')}</Link>
            {' '}{t('and', 'و')}{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">{t('Privacy Policy', 'سياسة الخصوصية')}</Link>
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-center text-xs text-amber-800">
            <strong>{t('Demo Mode:', 'وضع التجربة:')}</strong> {t('Enter any phone number and use OTP "123456" to login', 'أدخل أي رقم هاتف واستخدم الرمز "123456" للدخول')}
          </p>
        </div>
      </div>
    </div>
  );
}
