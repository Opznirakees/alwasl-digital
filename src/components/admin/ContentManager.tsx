'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Braces,
  CheckCircle2,
  FilePenLine,
  Languages,
  Loader2,
  RotateCcw,
  Search,
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

interface ContentOverride {
  id: string;
  valueEn: string;
  valueAr: string;
  valueZh: string;
  isActive: boolean;
}

interface ContentEntry {
  key: string;
  module: string;
  valueEn: string;
  valueAr: string;
  valueZh: string;
  override: ContentOverride | null;
}

interface ContentManagerProps {
  t: (en: string, ar: string, zh?: string) => string;
}

const PAGE_SIZE = 40;

export function ContentManager({ t }: ContentManagerProps) {
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState<ContentEntry | null>(null);
  const [valueEn, setValueEn] = useState('');
  const [valueAr, setValueAr] = useState('');
  const [valueZh, setValueZh] = useState('');
  const [isActive, setIsActive] = useState(true);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/content', { credentials: 'include' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'CONTENT_UNAVAILABLE');
      setEntries(payload.entries ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(
        'Website text could not be loaded.',
        'تعذر تحميل نصوص الموقع.',
        '无法加载网站文本。'
      ));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const modules = useMemo(
    () => [...new Set(entries.map((entry) => entry.module))].sort(),
    [entries]
  );
  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return entries.filter((entry) => {
      if (moduleFilter !== 'all' && entry.module !== moduleFilter) return false;
      if (!normalizedQuery) return true;
      const values = [
        entry.key,
        entry.module,
        entry.override?.valueEn ?? entry.valueEn,
        entry.override?.valueAr ?? entry.valueAr,
        entry.override?.valueZh ?? entry.valueZh,
      ];
      return values.some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [entries, moduleFilter, query]);
  const visibleEntries = filteredEntries.slice(0, visibleCount);
  const changedCount = entries.filter((entry) => entry.override).length;
  const requiredPlaceholders = useMemo(
    () => editing
      ? [...new Set([
          ...editing.valueEn.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g),
          ...editing.valueAr.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g),
          ...editing.valueZh.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g),
        ].map((match) => match[1]))].sort()
      : [],
    [editing]
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [moduleFilter, query]);

  const openEditor = (entry: ContentEntry) => {
    setEditing(entry);
    setValueEn(entry.override?.valueEn ?? entry.valueEn);
    setValueAr(entry.override?.valueAr ?? entry.valueAr);
    setValueZh(entry.override?.valueZh ?? entry.valueZh);
    setIsActive(entry.override?.isActive ?? true);
  };

  const saveEntry = async () => {
    if (!editing) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          key: editing.key,
          module: editing.module,
          valueEn,
          valueAr,
          valueZh,
          isActive,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'CONTENT_SAVE_FAILED');

      setEditing(null);
      await loadEntries();
      toast.success(t('Website text saved', 'تم حفظ نص الموقع', '网站文本已保存'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'CONTENT_SAVE_FAILED');
    } finally {
      setIsSaving(false);
    }
  };

  const resetEntry = async (entry: ContentEntry) => {
    if (!entry.override) return;
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key: entry.key }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'CONTENT_RESET_FAILED');
      if (editing?.key === entry.key) setEditing(null);
      await loadEntries();
      toast.success(t('Original text restored', 'تمت استعادة النص الأصلي', '已恢复原始文本'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'CONTENT_RESET_FAILED');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-[#07152e]">{t('Website text', 'نصوص الموقع', '网站文本')}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-[#53627a]">
          {t(
            'Change labels, instructions, module names, checkout steps, and WhatsApp templates without a code release.',
            'غيّر التسميات والتعليمات وأسماء الوحدات وخطوات الشحن وقوالب واتساب دون إصدار برمجي.',
            '无需发布代码即可修改标签、说明、模块名称、充值步骤和 WhatsApp 模板。'
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#d9e1ec] bg-white/80 p-4">
          <p className="text-xs uppercase text-[#6b778a]">{t('Editable texts', 'النصوص القابلة للتعديل', '可编辑文本')}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#07152e]">{entries.length}</p>
        </div>
        <div className="rounded-lg border border-[#d9e1ec] bg-white/80 p-4">
          <p className="text-xs uppercase text-[#6b778a]">{t('Changed', 'تم التغيير', '已更改')}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-[#94610b]">{changedCount}</p>
        </div>
        <div className="rounded-lg border border-[#d9e1ec] bg-white/80 p-4">
          <p className="text-xs uppercase text-[#6b778a]">{t('Languages', 'اللغات', '语言')}</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#07152e]"><Languages className="h-4 w-4 text-[#94610b]" /> EN · عربي · 中文</p>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-[#d9e1ec] bg-white/80 p-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-[#7b8798]" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Search text or label', 'ابحث عن نص أو تسمية', '搜索文本或标签')}
            className="border-[#d9e1ec] bg-white ps-9 text-[#07152e]"
          />
        </div>
        <select
          aria-label={t('Filter by module', 'تصفية حسب الوحدة', '按模块筛选')}
          value={moduleFilter}
          onChange={(event) => setModuleFilter(event.target.value)}
          className="h-10 rounded-md border border-[#d9e1ec] bg-white px-3 text-sm text-[#07152e]"
        >
          <option value="all">{t('All modules', 'كل الوحدات', '所有模块')}</option>
          {modules.map((module) => <option key={module} value={module}>{module}</option>)}
        </select>
      </div>

      <section aria-label={t('Editable website texts', 'نصوص الموقع القابلة للتعديل', '可编辑网站文本')} className="overflow-hidden rounded-lg border border-[#d9e1ec] bg-white/70">
        {isLoading ? (
          <div className="flex min-h-48 items-center justify-center text-sm text-[#53627a]">
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
            {t('Loading website text...', 'جارٍ تحميل نصوص الموقع...', '正在加载网站文本...')}
          </div>
        ) : visibleEntries.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center text-[#53627a]">
            <Search className="h-8 w-8" />
            <p className="mt-3 text-sm">{t('No matching text found.', 'لم يتم العثور على نص مطابق.', '未找到匹配文本。')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#d9e1ec]">
            {visibleEntries.map((entry) => {
              const effectiveEn = entry.override?.valueEn ?? entry.valueEn;
              return (
                <article key={entry.key} className="grid gap-3 p-4 md:grid-cols-[8rem_minmax(0,1fr)_auto] md:items-center">
                  <div>
                    <Badge className="bg-blue-50 text-blue-700">{entry.module}</Badge>
                    {entry.override && (
                      <p className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {entry.override.isActive ? t('Live change', 'تغيير مباشر', '实时更改') : t('Paused', 'متوقف', '已暂停')}
                      </p>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium leading-5 text-[#07152e]">{effectiveEn}</p>
                    <p className="mt-1 truncate text-xs text-[#7b8798]">{entry.key}</p>
                  </div>
                  <div className="flex gap-2 md:justify-end">
                    {entry.override && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isSaving}
                        onClick={() => void resetEntry(entry)}
                        className="text-[#53627a] hover:bg-[#eaf1f8] hover:text-[#07152e]"
                      >
                        <RotateCcw className="me-1.5 h-3.5 w-3.5" />
                        {t('Reset', 'استعادة', '重置')}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEditor(entry)}
                      className="border-[#e2b334] text-[#815600] hover:bg-[#fff8dd] hover:text-[#694500]"
                    >
                      <FilePenLine className="me-1.5 h-3.5 w-3.5" />
                      {t('Edit', 'تعديل', '编辑')}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {visibleCount < filteredEntries.length && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          className="w-full border-[#d9e1ec] text-[#07152e] hover:bg-[#eaf1f8] hover:text-[#07152e]"
        >
          {t('Show more text', 'عرض المزيد من النصوص', '显示更多文本')}
        </Button>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto border-[#d9e1ec] bg-white text-[#07152e] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('Edit website text', 'تعديل نص الموقع', '编辑网站文本')}</DialogTitle>
            <DialogDescription className="text-[#53627a]">
              {editing?.module} · {t('Changes appear after the next page load.', 'تظهر التغييرات بعد تحميل الصفحة التالي.', '更改将在下次加载页面后显示。')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {requiredPlaceholders.length > 0 && (
              <div className="rounded-md border border-[#f7b928]/25 bg-[#f7b928]/8 p-3 text-sm text-[#ffe49a]">
                <p className="flex items-center gap-2 font-semibold">
                  <Braces className="h-4 w-4" />
                  {t('Keep these automatic values in every language', 'احتفظ بهذه القيم التلقائية في كل لغة', '请在每种语言中保留这些自动值')}
                </p>
                <p className="mt-2 font-mono text-xs">{requiredPlaceholders.map((item) => `{{${item}}}`).join(' · ')}</p>
              </div>
            )}
            {[
              ['content-en', 'English', valueEn, setValueEn, 'ltr'],
              ['content-ar', 'العربية', valueAr, setValueAr, 'rtl'],
              ['content-zh', '中文', valueZh, setValueZh, 'ltr'],
            ].map(([id, label, value, setter, direction]) => (
              <div key={String(id)} className="space-y-2">
                <Label htmlFor={String(id)}>{String(label)}</Label>
                <textarea
                  id={String(id)}
                  dir={direction as 'ltr' | 'rtl'}
                  value={String(value)}
                  onChange={(event) => (setter as (value: string) => void)(event.target.value)}
                  rows={String(value).includes('\n') ? 6 : 3}
                  maxLength={2000}
                  className="w-full resize-y rounded-md border border-[#d9e1ec] bg-white px-3 py-2 text-sm leading-6 text-[#07152e] outline-none focus:ring-2 focus:ring-[#f7b928]"
                />
              </div>
            ))}

            <Label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-md border border-[#d9e1ec] px-3">
              <span>
                <span className="block text-sm font-medium">{t('Use this change', 'استخدام هذا التغيير', '启用此更改')}</span>
                <span className="mt-0.5 block text-xs text-[#6b778a]">{t('Turn off to keep it saved but show the original.', 'أوقفه للاحتفاظ به مع عرض النص الأصلي.', '关闭后保留更改，但显示原文。')}</span>
              </span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </Label>
          </div>

          <DialogFooter>
            {editing?.override && (
              <Button
                type="button"
                variant="ghost"
                disabled={isSaving}
                onClick={() => void resetEntry(editing)}
                className="me-auto text-[#53627a] hover:bg-[#eaf1f8] hover:text-[#07152e]"
              >
                <RotateCcw className="me-2 h-4 w-4" />
                {t('Restore original', 'استعادة النص الأصلي', '恢复原文')}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setEditing(null)} className="border-[#d9e1ec] text-[#07152e]">
              {t('Cancel', 'إلغاء', '取消')}
            </Button>
            <Button
              type="button"
              onClick={() => void saveEntry()}
              disabled={isSaving || !valueEn.trim() || !valueAr.trim() || !valueZh.trim()}
              className="bg-[#f7b928] font-semibold text-[#07152e] hover:bg-[#ffd05a]"
            >
              {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('Save text', 'حفظ النص', '保存文本')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
