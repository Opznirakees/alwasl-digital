'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Globe2, ImageIcon, LockKeyhole, Pencil, Plus } from 'lucide-react';
import type { CatalogCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/contexts/AppContext';

interface CategoryPayload {
  slug?: string;
  name: string;
  nameAr: string;
  nameZh: string;
  description: string;
  descriptionAr: string;
  descriptionZh: string;
  image: string;
  accentColor: string;
  sortOrder: number;
  isActive: boolean;
  priceVisibility: 'PUBLIC' | 'AUTHENTICATED';
}

interface CatalogCategoryManagerProps {
  categories: CatalogCategory[];
  isMutating: boolean;
  onSave: (categoryId: string | null, payload: CategoryPayload) => Promise<boolean>;
  onToggle: (category: CatalogCategory, isActive: boolean) => Promise<void>;
}

const emptyForm = {
  slug: '',
  name: '',
  nameAr: '',
  nameZh: '',
  description: '',
  descriptionAr: '',
  descriptionZh: '',
  image: '/brand/alwasl-mark.jpg',
  accentColor: '#9bd8f2',
  sortOrder: '0',
  isActive: true,
  priceVisibility: 'AUTHENTICATED' as 'PUBLIC' | 'AUTHENTICATED',
};

const swatches = ['#9bd8f2', '#f6b7cc', '#8fe3d2', '#c4b5fd', '#f7b928', '#ef6a72'];

export function CatalogCategoryManager({ categories, isMutating, onSave, onToggle }: CatalogCategoryManagerProps) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) return;
    setEditingId(null);
    setForm(emptyForm);
  }, [open]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (category: CatalogCategory) => {
    setEditingId(category.id);
    setForm({
      slug: category.slug,
      name: category.name,
      nameAr: category.nameAr,
      nameZh: category.nameZh,
      description: category.description,
      descriptionAr: category.descriptionAr,
      descriptionZh: category.descriptionZh,
      image: category.image,
      accentColor: category.accentColor,
      sortOrder: String(category.sortOrder),
      isActive: category.isActive,
      priceVisibility: category.priceVisibility,
    });
    setOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const saved = await onSave(editingId, {
      slug: editingId ? undefined : form.slug,
      name: form.name,
      nameAr: form.nameAr,
      nameZh: form.nameZh,
      description: form.description,
      descriptionAr: form.descriptionAr,
      descriptionZh: form.descriptionZh,
      image: form.image,
      accentColor: form.accentColor,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      priceVisibility: form.priceVisibility,
    });
    if (saved) setOpen(false);
  };

  return (
    <section>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-2xl font-bold text-white">{t('Catalog categories', 'فئات الكتالوج', '目录分类')}</h2><p className="mt-1 text-sm text-white/55">{t('Manage the categories customers see before choosing a recharge.', 'أدر الفئات التي يراها العملاء قبل اختيار الشحن.', '管理客户选择充值前看到的分类。')}</p></div>
        <Button type="button" onClick={openCreate} className="bg-[#f7b928] text-[#07152e] hover:bg-[#ffd05a]"><Plus className="h-4 w-4" />{t('Add category', 'إضافة فئة', '添加分类')}</Button>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <article key={category.id} className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <div className="h-1" style={{ backgroundColor: category.accentColor }} />
            <div className="flex gap-4 p-4">
              <span className="h-20 w-20 flex-none overflow-hidden rounded-lg border border-white/10 bg-white/5 p-2"><img src={category.image} alt="" className="h-full w-full object-contain" /></span>
              <div className="min-w-0 flex-1"><h3 className="truncate font-bold text-white">{category.name}</h3><p dir="rtl" className="mt-1 truncate text-xs text-white/65">{category.nameAr}</p><p className="mt-2 text-xs text-white/45">{category.productCount} {t('products', 'منتجات', '个产品')}</p><span className={`mt-2 inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold ${category.priceVisibility === 'PUBLIC' ? 'bg-[#8fe3d2]/15 text-[#8fe3d2]' : 'bg-[#f6b7cc]/15 text-[#ffd7e4]'}`}>{category.priceVisibility === 'PUBLIC' ? <Globe2 className="h-3 w-3" /> : <LockKeyhole className="h-3 w-3" />}{category.priceVisibility === 'PUBLIC' ? t('Prices public', 'الأسعار عامة', '价格公开') : t('Login for prices', 'الدخول للأسعار', '登录看价格')}</span></div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-white/65"><Switch checked={category.isActive} disabled={isMutating} onCheckedChange={(checked) => void onToggle(category, checked)} />{category.isActive ? t('Visible', 'ظاهر', '可见') : t('Hidden', 'مخفي', '隐藏')}</label>
              <Button type="button" size="sm" variant="outline" onClick={() => openEdit(category)} className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Pencil className="h-3.5 w-3.5" />{t('Edit', 'تعديل', '编辑')}</Button>
            </div>
          </article>
        ))}
        {!categories.length && <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 p-6 text-center text-white/55"><ImageIcon className="h-7 w-7" /><p className="mt-3 text-sm">{t('No categories yet', 'لا توجد فئات بعد', '暂无分类')}</p></div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? t('Edit category', 'تعديل الفئة', '编辑分类') : t('Add category', 'إضافة فئة', '添加分类')}</DialogTitle><DialogDescription>{t('Names, images and colors appear directly in the storefront.', 'تظهر الأسماء والصور والألوان مباشرة في المتجر.', '名称、图片和颜色会直接显示在商店中。')}</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            {!editingId && <div className="sm:col-span-2"><Label htmlFor="category-slug">Slug</Label><Input id="category-slug" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} required className="mt-1.5" /></div>}
            <div><Label htmlFor="category-name">English</Label><Input id="category-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required className="mt-1.5" /></div>
            <div><Label htmlFor="category-name-ar">العربية</Label><Input id="category-name-ar" dir="rtl" value={form.nameAr} onChange={(event) => setForm((current) => ({ ...current, nameAr: event.target.value }))} required className="mt-1.5" /></div>
            <div className="sm:col-span-2"><Label htmlFor="category-name-zh">中文</Label><Input id="category-name-zh" value={form.nameZh} onChange={(event) => setForm((current) => ({ ...current, nameZh: event.target.value }))} className="mt-1.5" /></div>
            <div><Label htmlFor="category-description">English description</Label><textarea id="category-description" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} required rows={3} className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
            <div><Label htmlFor="category-description-ar">الوصف العربي</Label><textarea id="category-description-ar" dir="rtl" value={form.descriptionAr} onChange={(event) => setForm((current) => ({ ...current, descriptionAr: event.target.value }))} required rows={3} className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
            <div className="sm:col-span-2"><Label htmlFor="category-description-zh">中文描述</Label><textarea id="category-description-zh" value={form.descriptionZh} onChange={(event) => setForm((current) => ({ ...current, descriptionZh: event.target.value }))} rows={2} className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm" /></div>
            <div className="sm:col-span-2"><Label htmlFor="category-image">{t('Image URL or path', 'رابط أو مسار الصورة', '图片 URL 或路径')}</Label><Input id="category-image" value={form.image} onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))} required className="mt-1.5" /></div>
            <div><Label>{t('Accent color', 'لون التمييز', '强调色')}</Label><div className="mt-2 flex flex-wrap gap-2">{swatches.map((color) => <button key={color} type="button" title={color} aria-label={color} aria-pressed={form.accentColor === color} onClick={() => setForm((current) => ({ ...current, accentColor: color }))} className={`h-9 w-9 rounded-md border-2 ${form.accentColor === color ? 'border-zinc-950 ring-2 ring-zinc-400' : 'border-transparent'}`} style={{ backgroundColor: color }} />)}<Input aria-label={t('Custom accent color', 'لون تمييز مخصص', '自定义强调色')} type="color" value={form.accentColor} onChange={(event) => setForm((current) => ({ ...current, accentColor: event.target.value }))} className="h-9 w-12 p-1" /></div></div>
            <div><Label htmlFor="category-order">{t('Display order', 'ترتيب العرض', '显示顺序')}</Label><Input id="category-order" type="number" min="0" value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} className="mt-1.5" /></div>
            <div>
              <Label htmlFor="category-price-visibility">{t('Who can see prices?', 'من يمكنه رؤية الأسعار؟', '谁可以查看价格？')}</Label>
              <select id="category-price-visibility" value={form.priceVisibility} onChange={(event) => setForm((current) => ({ ...current, priceVisibility: event.target.value as 'PUBLIC' | 'AUTHENTICATED' }))} className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm">
                <option value="PUBLIC">{t('Everyone (public)', 'الجميع (عام)', '所有人（公开）')}</option>
                <option value="AUTHENTICATED">{t('Logged-in customers only', 'العملاء المسجلون فقط', '仅限已登录客户')}</option>
              </select>
              <p className="mt-1.5 text-xs text-muted-foreground">{t('Ordering always requires login, even when prices are public.', 'الطلب يتطلب تسجيل الدخول دائماً حتى لو كانت الأسعار عامة.', '即使价格公开，下单仍需登录。')}</p>
            </div>
            <label className="flex items-center gap-3 sm:col-span-2"><Switch checked={form.isActive} onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))} />{t('Visible to customers', 'ظاهر للعملاء', '对客户可见')}</label>
            <DialogFooter className="sm:col-span-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('Cancel', 'إلغاء', '取消')}</Button><Button type="submit" disabled={isMutating}>{t('Save category', 'حفظ الفئة', '保存分类')}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
