'use client';

import Image from 'next/image';
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
    <div className={`v2-page px-4 py-5 sm:py-10 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <main className="mx-auto w-full max-w-md">
        <Link href={returnPath === '/' ? '/' : returnPath} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--v2-muted)] hover:text-[var(--v2-gold)]">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {returnPath === '/'
            ? t('Back home', 'العودة للرئيسية', '返回首页')
            : t('Back to top-up', 'العودة إلى الشحن', '返回充值')}
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/10">
            <Image src="/brand/alwasl-mark.jpg" alt="" fill className="object-contain p-1" sizes="48px" priority />
          </div>
          <div>
            <p className="font-semibold text-zinc-950 dark:text-white">{t('Al-Wasl Digital', 'الوصل', 'Al-Wasl 数字服务')}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('Secure WAHO login', 'دخول آمن إلى WAHO', '安全登录 WAHO')}</p>
          </div>
        </div>

        <section className="v2-surface mt-6 p-5 sm:p-7">
          {step === 'phone' ? (
            <>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--v2-surface-raised)] text-[var(--v2-gold)]">
                <Phone className="h-5 w-5" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">
                {t('Log in with WhatsApp', 'سجل الدخول عبر واتساب', '使用 WhatsApp 登录')}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {t('Choose your country code and enter your phone number. We will send one 6-digit code.', 'اختر رمز الدولة وأدخل رقم هاتفك. سنرسل رمزاً من 6 أرقام.', '选择国家区号并输入手机号码，我们会发送一个 6 位验证码。')}
              </p>

              <form onSubmit={handlePhoneSubmit} className="mt-6 space-y-5" noValidate>
                <div>
                  <Label htmlFor="phone-number" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
                          <ChevronsUpDown className="h-4 w-4 flex-shrink-0 text-zinc-400" />
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
                                  <span className="text-xs tabular-nums text-zinc-500">{country.phoneCode}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <div className="relative">
                      <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
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

                {formError && <p role="alert" className="text-sm leading-6 text-red-600 dark:text-red-300">{formError}</p>}

                <div className="flex items-start gap-3 rounded-lg bg-[#eaf8ee] p-3 dark:bg-[#34c759]/10">
                  <MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#1f8f3a] dark:text-[#52d273]" />
                  <p className="text-xs leading-5 text-[#1f8f3a] dark:text-[#52d273]">
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
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
              >
                <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                {t('Change phone number', 'غير رقم الهاتف', '更换手机号码')}
              </button>

              <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[var(--v2-surface-raised)] text-[var(--v2-gold)]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h1 className="mt-5 text-2xl font-semibold text-zinc-950 dark:text-white">
                {t('Enter the WhatsApp code', 'أدخل رمز واتساب', '输入 WhatsApp 验证码')}
              </h1>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {t(`We sent 6 digits to ${submittedPhone}.`, `أرسلنا 6 أرقام إلى ${submittedPhone}.`, `我们已向 ${submittedPhone} 发送 6 位验证码。`)}
              </p>

              <form onSubmit={handleOtpSubmit} className="mt-6 space-y-5" noValidate>
                <div>
                  <Label htmlFor="otp-code" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
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
                    className="v2-input mt-2 h-14 text-center text-2xl font-semibold tracking-[0.3em] tabular-nums"
                  />
                </div>

                {formError && <p role="alert" className="text-sm leading-6 text-red-600 dark:text-red-300">{formError}</p>}

                <Button type="submit" disabled={isLoading || otpCode.length !== 6} className="v2-primary-button w-full">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                  {t('Log in', 'تسجيل الدخول', '登录')}
                </Button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="flex min-h-11 w-full items-center justify-center text-sm font-semibold text-blue-700 hover:text-blue-800 disabled:opacity-50 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  {t('Send a new code', 'أرسل رمزاً جديداً', '重新发送验证码')}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            {t('By continuing, you agree to the', 'بالمتابعة، أنت توافق على', '继续即表示您同意')}{' '}
            <Link href="/terms" className="font-medium text-blue-700 hover:underline dark:text-blue-300">{t('Terms', 'الشروط', '条款')}</Link>
            {' '}{t('and', 'و', '和')}{' '}
            <Link href="/privacy" className="font-medium text-blue-700 hover:underline dark:text-blue-300">{t('Privacy Policy', 'سياسة الخصوصية', '隐私政策')}</Link>.
          </p>
        </section>
      </main>
    </div>
  );
}

function AuthPageFallback() {
  const { t, dir } = useApp();

  return (
    <div className={`v2-page px-4 py-10 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <main className="mx-auto w-full max-w-md" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 motion-reduce:animate-none" />
          {t('Opening secure login...', 'جارٍ فتح تسجيل الدخول الآمن...', '正在打开安全登录...')}
        </div>
        <div className="mt-6 h-96 animate-pulse rounded-lg bg-white motion-reduce:animate-none dark:bg-zinc-900" />
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
