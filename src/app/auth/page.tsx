'use client';

import Link from 'next/link';
import { Suspense, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Header } from '@/components/layout/Header';
import { useApp } from '@/contexts/AppContext';
import { getDefaultPhoneCountry, getPhoneCountryById, phoneCountries } from '@/data/phone-countries';
import { getSafeInternalReturnPath } from '@/lib/easy-use';
import { normalizePhoneForDialCode } from '@/lib/phone';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, dir, login, verifyOtp } = useApp();
  const defaultPhoneCountry = getDefaultPhoneCountry();
  const otpInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneCountryOpen, setPhoneCountryOpen] = useState(false);
  const [phoneCountryId, setPhoneCountryId] = useState(defaultPhoneCountry.id);
  const [phone, setPhone] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const selectedPhoneCountry = getPhoneCountryById(phoneCountryId) ?? defaultPhoneCountry;
  const returnPath = getSafeInternalReturnPath(searchParams.get('next'));

  const requestOtp = async (phoneNumber: string) => {
    const success = await login(phoneNumber);
    if (!success) {
      const message = t('We could not send the WhatsApp code. Check the number and try again.', 'تعذر إرسال رمز واتساب. تحقق من الرقم وحاول مرة أخرى.', '无法发送 WhatsApp 验证码，请检查号码后重试。');
      setFormError(message);
      toast.error(message);
      return false;
    }

    setSubmittedPhone(phoneNumber);
    setOtpCode('');
    setFormError('');
    setStep('otp');
    window.setTimeout(() => otpInputRef.current?.focus(), 50);
    toast.success(t('WhatsApp code sent', 'تم إرسال رمز واتساب', 'WhatsApp 验证码已发送'));
    return true;
  };

  const handlePhoneSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (phone.replace(/\D/g, '').length < 7) {
      setFormError(t('Enter a complete phone number.', 'أدخل رقم هاتف كاملاً.', '请输入完整的手机号码。'));
      return;
    }

    setIsLoading(true);
    try {
      const normalizedPhone = normalizePhoneForDialCode(selectedPhoneCountry.phoneCode, phone);
      await requestOtp(normalizedPhone);
    } catch {
      setFormError(t('Check the phone number and try again.', 'تحقق من رقم الهاتف وحاول مرة أخرى.', '请检查手机号码后重试。'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!submittedPhone) return;
    setIsLoading(true);
    setFormError('');
    try {
      await requestOtp(submittedPhone);
    } catch {
      const message = t('We could not send the WhatsApp code. Try again.', 'تعذر إرسال رمز واتساب. حاول مرة أخرى.', '无法发送 WhatsApp 验证码，请重试。');
      setFormError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError('');
    if (!/^\d{6}$/.test(otpCode)) {
      setFormError(t('Enter all 6 digits.', 'أدخل الأرقام الستة.', '请输入全部 6 位数字。'));
      return;
    }

    setIsLoading(true);
    try {
      const success = await verifyOtp(otpCode, submittedPhone);
      if (!success) {
        setFormError(t('This code is not correct or has expired.', 'هذا الرمز غير صحيح أو انتهت صلاحيته.', '验证码不正确或已过期。'));
        return;
      }

      toast.success(t('You are logged in', 'تم تسجيل الدخول', '登录成功'));
      router.replace(returnPath);
    } catch {
      setFormError(t('We could not log you in. Try again.', 'تعذر تسجيل الدخول. حاول مرة أخرى.', '无法登录，请重试。'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-3 sm:py-10">
        <Link href={returnPath === '/' ? '/' : returnPath} className="v2-ghost-link">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {returnPath === '/'
            ? t('Back home', 'العودة للرئيسية', '返回首页')
            : t('Back to top-up', 'العودة إلى الشحن', '返回充值')}
        </Link>

        <section className="v2-surface mt-2 p-5 sm:mt-6 sm:p-8">
          {step === 'phone' ? (
            <>
              <div className="v2-icon-tile v2-icon-tile-gold h-12 w-12 rounded-xl">
                <Phone className="h-5 w-5" />
              </div>
              <h1 className="mt-5 v2-title text-[1.65rem]">
                {t('Log in with WhatsApp', 'سجل الدخول عبر واتساب', '使用 WhatsApp 登录')}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--v2-muted)]">
                {t('Choose your country code and enter your phone number. We will send one 6-digit code.', 'اختر رمز الدولة وأدخل رقم هاتفك. سنرسل رمزاً من 6 أرقام.', '选择国家区号并输入手机号码，我们会发送一个 6 位验证码。')}
              </p>

              <form onSubmit={handlePhoneSubmit} className="mt-6 space-y-5" noValidate>
                <div>
                  <Label htmlFor="phone-number" className="text-sm font-semibold text-[var(--v2-navy)]">
                    {t('Phone number', 'رقم الهاتف', '手机号码')}
                  </Label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[9.5rem_minmax(0,1fr)]">
                    <Popover open={phoneCountryOpen} onOpenChange={setPhoneCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          aria-expanded={phoneCountryOpen}
                          aria-label={t('Country calling code', 'رمز اتصال الدولة', '国家/地区区号')}
                          className="v2-input h-12 justify-between px-3"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="text-lg leading-none">{selectedPhoneCountry.flag}</span>
                            <span className="truncate text-sm tabular-nums">{selectedPhoneCountry.phoneCode}</span>
                          </span>
                          <ChevronsUpDown className="h-4 w-4 flex-shrink-0 text-[var(--v2-subtle)]" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[min(23rem,calc(100vw-2rem))] p-0">
                        <Command>
                          <CommandInput placeholder={t('Search country or code', 'ابحث عن الدولة أو الرمز', '搜索国家或区号')} />
                          <CommandList className="max-h-72">
                            <CommandEmpty>{t('No country code found', 'لم يتم العثور على رمز دولة', '未找到国家/地区区号')}</CommandEmpty>
                            <CommandGroup>
                              {phoneCountries.map((country) => (
                                <CommandItem
                                  key={country.id}
                                  value={country.searchText}
                                  onSelect={() => {
                                    setPhoneCountryId(country.id);
                                    setPhoneCountryOpen(false);
                                  }}
                                  className="min-h-11"
                                >
                                  <Check className={`h-4 w-4 ${country.id === selectedPhoneCountry.id ? 'opacity-100' : 'opacity-0'}`} />
                                  <span className="text-base leading-none">{country.flag}</span>
                                  <span className="min-w-0 flex-1 truncate">{t(country.name, country.nameAr, country.nameZh)}</span>
                                  <span className="text-xs tabular-nums text-[var(--v2-muted)]">{country.phoneCode}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--v2-subtle)]" />
                      <Input
                        id="phone-number"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(event) => setPhone(event.target.value.replace(/[^\d\s()-]/g, ''))}
                        placeholder={t('Phone without country code', 'الهاتف بدون رمز الدولة', '不含国家区号的号码')}
                        aria-invalid={Boolean(formError)}
                        className="v2-input h-12 ps-10"
                      />
                    </div>
                  </div>
                </div>

                {formError && <p role="alert" className="text-sm leading-6 text-red-600">{formError}</p>}

                <div className="flex items-start gap-3 rounded-xl border border-[var(--v2-green)]/20 bg-[var(--v2-green-soft)] p-3">
                  <MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--v2-green)]" />
                  <p className="text-xs leading-5 text-[var(--v2-green)]">
                    {t('The code is sent to this number on WhatsApp.', 'سيتم إرسال الرمز إلى هذا الرقم عبر واتساب.', '验证码将通过 WhatsApp 发送到此号码。')}
                  </p>
                </div>

                <Button type="submit" disabled={isLoading} className="v2-primary-button w-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  {t('Send WhatsApp code', 'أرسل رمز واتساب', '发送 WhatsApp 验证码')}
                  {!isLoading && <ChevronRight className="h-4 w-4 rtl:rotate-180" />}
                </Button>
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setFormError('');
                }}
                className="v2-ghost-link text-[var(--v2-blue)] hover:text-[var(--v2-navy)]"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t('Change phone number', 'غير رقم الهاتف', '更换手机号码')}
              </button>

              <div className="v2-icon-tile v2-icon-tile-gold mt-3 h-12 w-12 rounded-xl">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h1 className="mt-5 v2-title text-[1.65rem]">
                {t('Enter the WhatsApp code', 'أدخل رمز واتساب', '输入 WhatsApp 验证码')}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--v2-muted)]">
                {t('We sent 6 digits to {{phone}}.', 'أرسلنا 6 أرقام إلى {{phone}}.', '我们已向 {{phone}} 发送 6 位验证码。').replace('{{phone}}', submittedPhone)}
              </p>

              <form onSubmit={handleOtpSubmit} className="mt-6 space-y-5" noValidate>
                <div>
                  <Label htmlFor="otp-code" className="text-sm font-semibold text-[var(--v2-navy)]">
                    {t('6-digit verification code', 'رمز التحقق من 6 أرقام', '6 位验证码')}
                  </Label>
                  <Input
                    ref={otpInputRef}
                    id="otp-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    aria-invalid={Boolean(formError)}
                    className="v2-input mt-2 h-16 text-center text-3xl font-bold tracking-[0.35em] tabular-nums"
                  />
                </div>

                {formError && <p role="alert" className="text-sm leading-6 text-red-600">{formError}</p>}

                <Button type="submit" disabled={isLoading || otpCode.length !== 6} className="v2-primary-button w-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                  {t('Log in', 'تسجيل الدخول', '登录')}
                </Button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="flex min-h-11 w-full items-center justify-center rounded-full text-sm font-semibold text-[var(--v2-blue)] hover:bg-[var(--v2-blue-soft)] disabled:opacity-50"
                >
                  {t('Send a new code', 'أرسل رمزاً جديداً', '重新发送验证码')}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-[var(--v2-muted)]">
            {t('By continuing, you agree to the', 'بالمتابعة، أنت توافق على', '继续即表示您同意')}{' '}
            <Link href="/terms" className="font-semibold text-[var(--v2-blue)] hover:underline">{t('Terms', 'الشروط', '条款')}</Link>
            {' '}{t('and', 'و', '和')}{' '}
            <Link href="/privacy" className="font-semibold text-[var(--v2-blue)] hover:underline">{t('Privacy Policy', 'سياسة الخصوصية', '隐私政策')}</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}

function AuthPageFallback() {
  const { t, dir } = useApp();

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="mx-auto w-full max-w-md px-4 py-10" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-medium text-[var(--v2-muted)]">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--v2-gold-deep)] motion-reduce:animate-none" />
          {t('Opening secure login...', 'جارٍ فتح تسجيل الدخول الآمن...', '正在打开安全登录...')}
        </div>
        <div className="v2-skeleton mt-6 h-96 motion-reduce:animate-none" />
      </main>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthPageContent />
    </Suspense>
  );
}
