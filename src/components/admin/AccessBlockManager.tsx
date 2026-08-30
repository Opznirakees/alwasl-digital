'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  Clock3,
  Fingerprint,
  Loader2,
  MessageCircle,
  Network,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type BlockType = 'WHATSAPP' | 'WAHO_ID' | 'IP_ADDRESS';

interface AccessBlock {
  id: string;
  type: BlockType;
  maskedValue: string;
  reason: string;
  isActive: boolean;
  expiresAt?: string | null;
  revokedAt?: string | null;
  notificationRequested: boolean;
  notificationStatus?: 'PENDING' | 'SENT' | 'FAILED' | null;
  notificationError?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  createdByAdmin?: {
    id: string;
    name: string;
  } | null;
}

interface AccessBlockManagerProps {
  t: (en: string, ar: string, zh?: string) => string;
  initialWhatsAppValue?: string | null;
  onInitialValueConsumed?: () => void;
  onChanged?: () => void | Promise<void>;
}

const typeOptions: Array<{
  type: BlockType;
  icon: typeof MessageCircle;
  title: { en: string; ar: string; zh: string };
  description: { en: string; ar: string; zh: string };
}> = [
  {
    type: 'WHATSAPP',
    icon: MessageCircle,
    title: { en: 'WhatsApp number', ar: 'رقم واتساب', zh: 'WhatsApp 号码' },
    description: { en: 'Stops login and active sessions', ar: 'يوقف تسجيل الدخول والجلسات النشطة', zh: '阻止登录并终止活动会话' },
  },
  {
    type: 'WAHO_ID',
    icon: Fingerprint,
    title: { en: 'WAHO ID', ar: 'معرف WAHO', zh: 'WAHO ID' },
    description: { en: 'Stops verification and new orders', ar: 'يوقف التحقق والطلبات الجديدة', zh: '阻止验证和新订单' },
  },
  {
    type: 'IP_ADDRESS',
    icon: Network,
    title: { en: 'IP address', ar: 'عنوان IP', zh: 'IP 地址' },
    description: { en: 'Stops access from one network address', ar: 'يوقف الوصول من عنوان شبكة واحد', zh: '阻止一个网络地址的访问' },
  },
];

export function AccessBlockManager({
  t,
  initialWhatsAppValue,
  onInitialValueConsumed,
  onChanged,
}: AccessBlockManagerProps) {
  const [blocks, setBlocks] = useState<AccessBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<BlockType>('WHATSAPP');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notifyByWhatsApp, setNotifyByWhatsApp] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | BlockType>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESTORED'>('ALL');

  const loadBlocks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/access-blocks', { credentials: 'include' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'ACCESS_BLOCKS_UNAVAILABLE');
      setBlocks(payload.blocks ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(
        'Block list could not be loaded.',
        'تعذر تحميل قائمة الحظر.',
        '无法加载封锁列表。'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadBlocks();
  }, [loadBlocks]);

  useEffect(() => {
    if (!initialWhatsAppValue) return;
    setType('WHATSAPP');
    setValue(initialWhatsAppValue);
    setNotifyByWhatsApp(true);
    setDialogOpen(true);
    onInitialValueConsumed?.();
  }, [initialWhatsAppValue, onInitialValueConsumed]);

  const activeBlocks = useMemo(
    () => blocks.filter((block) => block.isActive && !block.revokedAt),
    [blocks]
  );
  const filteredBlocks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return blocks.filter((block) => {
      if (typeFilter !== 'ALL' && block.type !== typeFilter) return false;
      const isActive = block.isActive && !block.revokedAt;
      if (statusFilter === 'ACTIVE' && !isActive) return false;
      if (statusFilter === 'RESTORED' && isActive) return false;
      if (!normalizedQuery) return true;

      return [
        block.maskedValue,
        block.reason,
        block.user?.name,
        block.createdByAdmin?.name,
      ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [blocks, query, statusFilter, typeFilter]);

  const resetForm = () => {
    setType('WHATSAPP');
    setValue('');
    setReason('');
    setExpiresAt('');
    setNotifyByWhatsApp(true);
  };

  const createBlock = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/access-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type,
          value,
          reason,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          notifyByWhatsApp: type === 'WHATSAPP' && notifyByWhatsApp,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'ACCESS_BLOCK_CREATE_FAILED');

      setDialogOpen(false);
      resetForm();
      await loadBlocks();
      await onChanged?.();
      toast.success(t('Access blocked', 'تم حظر الوصول', '访问已封锁'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(
        'Access could not be blocked.',
        'تعذر حظر الوصول.',
        '无法封锁访问。'
      ));
    } finally {
      setIsSaving(false);
    }
  };

  const updateBlock = async (block: AccessBlock, isActive: boolean) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/access-blocks/${block.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'ACCESS_BLOCK_UPDATE_FAILED');

      await loadBlocks();
      await onChanged?.();
      toast.success(isActive
        ? t('Block restored', 'تمت إعادة الحظر', '已恢复封锁')
        : t('Access restored', 'تمت استعادة الوصول', '已恢复访问'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'ACCESS_BLOCK_UPDATE_FAILED');
    } finally {
      setIsSaving(false);
    }
  };

  const retryNotification = async (block: AccessBlock) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/access-blocks/${block.id}/notify`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'BLOCK_NOTIFICATION_FAILED');
      await loadBlocks();
      toast.success(t('WhatsApp message sent again', 'تم إرسال رسالة واتساب مرة أخرى', 'WhatsApp 消息已重新发送'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'BLOCK_NOTIFICATION_FAILED');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (value?: string | null) => value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : t('No end date', 'بدون تاريخ انتهاء', '无结束日期');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#07152e]">{t('Access blocks', 'حظر الوصول', '访问封锁')}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#53627a]">
            {t(
              'Block a WhatsApp number, WAHO ID, or IP address. Every change is recorded.',
              'احظر رقم واتساب أو معرف WAHO أو عنوان IP. يتم تسجيل كل تغيير.',
              '可封锁 WhatsApp 号码、WAHO ID 或 IP 地址。每项更改都会记录。'
            )}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="h-11 bg-[#f7b928] font-semibold text-[#07152e] hover:bg-[#ffd05a]"
        >
          <Plus className="me-2 h-4 w-4" />
          {t('Add block', 'إضافة حظر', '添加封锁')}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#d9e1ec] bg-white/80 p-4">
          <p className="text-xs uppercase text-[#6b778a]">{t('Active blocks', 'الحظر النشط', '有效封锁')}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#07152e]">{activeBlocks.length}</p>
        </div>
        <div className="rounded-lg border border-[#d9e1ec] bg-white/80 p-4">
          <p className="text-xs uppercase text-[#6b778a]">{t('WhatsApp blocks', 'حظر واتساب', 'WhatsApp 封锁')}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#07152e]">{activeBlocks.filter((block) => block.type === 'WHATSAPP').length}</p>
        </div>
        <div className="rounded-lg border border-[#d9e1ec] bg-white/80 p-4">
          <p className="text-xs uppercase text-[#6b778a]">{t('Messages sent', 'الرسائل المرسلة', '已发送消息')}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#07152e]">{blocks.filter((block) => block.notificationStatus === 'SENT').length}</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#d9e1ec] bg-white/80 p-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-[#7b8798]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Search blocks or reasons', 'ابحث في الحظر أو الأسباب', '搜索封锁或原因')}
            className="border-[#d9e1ec] bg-white ps-9 text-[#07152e]"
          />
        </div>
        <select
          aria-label={t('Filter by block type', 'تصفية حسب نوع الحظر', '按封锁类型筛选')}
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value as 'ALL' | BlockType)}
          className="h-10 rounded-md border border-[#d9e1ec] bg-white px-3 text-sm text-[#07152e]"
        >
          <option value="ALL">{t('All block types', 'كل أنواع الحظر', '所有封锁类型')}</option>
          {typeOptions.map((option) => (
            <option key={option.type} value={option.type}>{t(option.title.en, option.title.ar, option.title.zh)}</option>
          ))}
        </select>
        <select
          aria-label={t('Filter by block status', 'تصفية حسب حالة الحظر', '按封锁状态筛选')}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          className="h-10 rounded-md border border-[#d9e1ec] bg-white px-3 text-sm text-[#07152e]"
        >
          <option value="ALL">{t('All statuses', 'كل الحالات', '所有状态')}</option>
          <option value="ACTIVE">{t('Blocked', 'محظور', '已封锁')}</option>
          <option value="RESTORED">{t('Restored', 'مستعاد', '已恢复')}</option>
        </select>
      </div>

      <section aria-label={t('Block list', 'قائمة الحظر', '封锁列表')} className="overflow-hidden rounded-lg border border-[#d9e1ec] bg-white/70">
        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center text-sm text-[#53627a]">
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            {t('Loading blocks...', 'جارٍ تحميل الحظر...', '正在加载封锁...')}
          </div>
        ) : filteredBlocks.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
            <ShieldCheck className="h-9 w-9 text-emerald-400" />
            <p className="mt-3 font-semibold text-[#07152e]">
              {blocks.length === 0
                ? t('No one is blocked', 'لا يوجد أي حظر', '当前没有封锁')
                : t('No matching blocks', 'لا يوجد حظر مطابق', '没有匹配的封锁')}
            </p>
            <p className="mt-1 text-sm text-[#6b778a]">
              {blocks.length === 0
                ? t('New blocks will appear here.', 'سيظهر الحظر الجديد هنا.', '新封锁会显示在这里。')
                : t('Change the search or filters.', 'غيّر البحث أو عوامل التصفية.', '请更改搜索词或筛选条件。')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#d9e1ec]">
            {filteredBlocks.map((block) => {
              const option = typeOptions.find((item) => item.type === block.type) ?? typeOptions[0];
              const Icon = option.icon;
              return (
                <article key={block.id} className="grid gap-4 p-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] md:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={`mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-md ${
                      block.isActive ? 'bg-rose-50 text-rose-700' : 'bg-[#f7faff] text-[#6b778a]'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold text-[#07152e]">{block.maskedValue}</p>
                        <Badge className={block.isActive ? 'bg-rose-100 text-rose-700' : 'bg-[#eaf1f8] text-[#53627a]'}>
                          {block.isActive ? t('Blocked', 'محظور', '已封锁') : t('Restored', 'مستعاد', '已恢复')}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-[#6b778a]">{t(option.title.en, option.title.ar, option.title.zh)}</p>
                      {block.user?.name && <p className="mt-1 truncate text-xs text-[#53627a]">{block.user.name}</p>}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm leading-5 text-[#34445c]">{block.reason}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-[#6b778a]">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDate(block.expiresAt)}
                    </p>
                    {block.notificationRequested && (
                      <p className={`mt-1 text-xs ${
                        block.notificationStatus === 'SENT'
                          ? 'text-emerald-700'
                          : block.notificationStatus === 'FAILED'
                            ? 'text-rose-700'
                            : 'text-amber-700'
                      }`}>
                        {block.notificationStatus === 'SENT'
                          ? t('WhatsApp reason sent', 'تم إرسال السبب عبر واتساب', '已通过 WhatsApp 发送原因')
                          : block.notificationStatus === 'FAILED'
                            ? t('WhatsApp message failed', 'فشل إرسال رسالة واتساب', 'WhatsApp 消息发送失败')
                            : t('WhatsApp message pending', 'رسالة واتساب قيد الانتظار', 'WhatsApp 消息待发送')}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {block.type === 'WHATSAPP' && block.notificationStatus === 'FAILED' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => void retryNotification(block)}
                        className="border-[#d9e1ec] text-[#07152e] hover:bg-[#eaf1f8] hover:text-[#07152e]"
                      >
                        <RefreshCw className="me-1.5 h-3.5 w-3.5" />
                        {t('Send again', 'إرسال مرة أخرى', '重新发送')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => void updateBlock(block, !block.isActive)}
                      className={block.isActive
                        ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                        : 'border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800'}
                    >
                      {block.isActive ? <ShieldOff className="me-1.5 h-3.5 w-3.5" /> : <Ban className="me-1.5 h-3.5 w-3.5" />}
                      {block.isActive
                        ? t('Restore access', 'استعادة الوصول', '恢复访问')
                        : t('Block again', 'الحظر مرة أخرى', '再次封锁')}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-[#d9e1ec] bg-white text-[#07152e] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('Block access', 'حظر الوصول', '封锁访问')}</DialogTitle>
            <DialogDescription className="text-[#53627a]">
              {t(
                'Choose what to block and explain the reason clearly.',
                'اختر ما تريد حظره واشرح السبب بوضوح.',
                '选择要封锁的对象，并清楚说明原因。'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">{t('Block by', 'الحظر حسب', '封锁依据')}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {typeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => {
                        setType(option.type);
                        setNotifyByWhatsApp(option.type === 'WHATSAPP');
                      }}
                      aria-pressed={type === option.type}
                      className={`min-h-24 rounded-md border p-3 text-start ${
                        type === option.type
                          ? 'border-[#f7b928] bg-[#f7b928]/10 text-[#07152e]'
                          : 'border-[#d9e1ec] bg-white text-[#53627a] hover:border-[#9fb1c8] hover:bg-[#f7faff]'
                      }`}
                    >
                      <Icon className="h-5 w-5 text-[#94610b]" />
                      <span className="mt-2 block text-xs font-semibold">{t(option.title.en, option.title.ar, option.title.zh)}</span>
                      <span className="mt-1 block text-[10px] leading-4 text-[#6b778a]">{t(option.description.en, option.description.ar, option.description.zh)}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="block-value">{t(
                type === 'WHATSAPP' ? 'WhatsApp number' : type === 'WAHO_ID' ? 'WAHO ID' : 'IP address',
                type === 'WHATSAPP' ? 'رقم واتساب' : type === 'WAHO_ID' ? 'معرف WAHO' : 'عنوان IP',
                type === 'WHATSAPP' ? 'WhatsApp 号码' : type === 'WAHO_ID' ? 'WAHO ID' : 'IP 地址'
              )}</Label>
              <Input
                id="block-value"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={type === 'WHATSAPP' ? '+31612345678' : type === 'WAHO_ID' ? 'WAHO-12345' : '203.0.113.10'}
                autoComplete="off"
                className="border-[#d9e1ec] bg-white text-[#07152e]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-reason">{t('Reason shown to the customer', 'السبب الظاهر للعميل', '向客户显示的原因')}</Label>
              <textarea
                id="block-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder={t('Explain briefly why access is blocked', 'اشرح باختصار سبب حظر الوصول', '简要说明封锁原因')}
                className="w-full resize-y rounded-md border border-[#d9e1ec] bg-white px-3 py-2 text-sm text-[#07152e] outline-none focus:ring-2 focus:ring-[#f7b928]"
              />
              <p className="text-end text-xs text-[#7b8798]">{reason.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="block-expiry">{t('End date (optional)', 'تاريخ الانتهاء (اختياري)', '结束日期（可选）')}</Label>
              <Input
                id="block-expiry"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className="border-[#d9e1ec] bg-white text-[#07152e]"
              />
            </div>

            {type === 'WHATSAPP' && (
              <Label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-md border border-[#25d366]/20 bg-[#25d366]/8 px-4">
                <span>
                  <span className="block text-sm font-semibold">{t('Send reason on WhatsApp', 'إرسال السبب عبر واتساب', '通过 WhatsApp 发送原因')}</span>
                  <span className="mt-1 block text-xs text-[#6b778a]">{t('The block remains active if delivery fails.', 'يبقى الحظر نشطاً إذا فشل الإرسال.', '即使发送失败，封锁仍然有效。')}</span>
                </span>
                <Switch checked={notifyByWhatsApp} onCheckedChange={setNotifyByWhatsApp} />
              </Label>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-[#d9e1ec] text-[#07152e]">
              {t('Cancel', 'إلغاء', '取消')}
            </Button>
            <Button
              type="button"
              onClick={() => void createBlock()}
              disabled={isSaving || value.trim().length < 2 || reason.trim().length < 3}
              className="bg-rose-600 font-semibold text-white hover:bg-rose-700"
            >
              {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('Block access', 'حظر الوصول', '封锁访问')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
