'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import worldTopology from 'world-atlas/countries-110m.json';
import { Check, Globe2, Loader2, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import type { Country, ExchangeRate } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CatalogCountry {
  id: string;
  code: string;
  numericCode?: string;
  name: string;
  nameAr: string;
  nameZh: string;
  flag: string;
  phoneCode: string;
  currencyCode: string;
  currencyName: string;
  currencySymbol: string;
  decimalPlaces: number;
}

interface CountryPricingMapProps {
  countries: Country[];
  exchangeRates: ExchangeRate[];
  onChanged: () => void | Promise<void>;
  t: (en: string, ar: string, zh?: string) => string;
}

interface PricingForm {
  primaryPriceCurrency: 'IQD' | 'USD' | 'LOCAL';
  showPricesInIqd: boolean;
  showPricesInUsd: boolean;
  showPricesInLocal: boolean;
  isActive: boolean;
}

const defaultForm: PricingForm = {
  primaryPriceCurrency: 'IQD',
  showPricesInIqd: true,
  showPricesInUsd: false,
  showPricesInLocal: true,
  isActive: true,
};

export function CountryPricingMap({ countries, exchangeRates, onChanged, t }: CountryPricingMapProps) {
  const [catalog, setCatalog] = useState<CatalogCountry[]>([]);
  const [selectedCode, setSelectedCode] = useState('IQ');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<PricingForm>(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const countriesByCode = useMemo(
    () => new Map(countries.map((country) => [country.code, country])),
    [countries]
  );
  const catalogByNumericCode = useMemo(
    () => new Map(catalog.filter((country) => country.numericCode).map((country) => [country.numericCode, country])),
    [catalog]
  );
  const selectedCatalogCountry = catalog.find((country) => country.code === selectedCode);
  const selectedCountry = countriesByCode.get(selectedCode);
  const filteredCatalog = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return catalog.slice(0, 12);
    return catalog
      .filter((country) => [
        country.name,
        country.nameAr,
        country.nameZh,
        country.code,
        country.currencyCode,
      ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)))
      .slice(0, 12);
  }, [catalog, query]);

  useEffect(() => {
    let active = true;

    void fetch('/api/admin/countries/catalog', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('COUNTRY_CATALOG_UNAVAILABLE');
        return response.json();
      })
      .then((payload) => {
        if (active) setCatalog(payload.countries ?? []);
      })
      .catch(() => {
        if (active) toast.error(t(
          'The country map could not be loaded.',
          'تعذر تحميل خريطة البلدان.',
          '无法加载国家地图。'
        ));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (!selectedCountry) {
      const localCode = selectedCatalogCountry?.currencyCode;
      setForm({
        ...defaultForm,
        showPricesInUsd: localCode === 'USD',
        showPricesInLocal: Boolean(localCode && localCode !== 'IQD' && localCode !== 'USD'),
      });
      return;
    }

    const localCode = selectedCountry.currency;
    const localMatchesManagedCurrency = localCode === 'IQD' || localCode === 'USD';
    setForm({
      primaryPriceCurrency: selectedCountry.primaryPriceCurrency === 'LOCAL' && localMatchesManagedCurrency
        ? localCode
        : selectedCountry.primaryPriceCurrency,
      showPricesInIqd: selectedCountry.showPricesInIqd || (localCode === 'IQD' && selectedCountry.showPricesInLocal),
      showPricesInUsd: selectedCountry.showPricesInUsd || (localCode === 'USD' && selectedCountry.showPricesInLocal),
      showPricesInLocal: localMatchesManagedCurrency ? false : selectedCountry.showPricesInLocal,
      isActive: selectedCountry.isActive,
    });
  }, [selectedCatalogCountry?.currencyCode, selectedCountry]);

  const selectCountry = (code: string) => {
    setSelectedCode(code);
    const country = catalog.find((item) => item.code === code);
    if (country) setQuery(country.name);
  };

  const updateCurrencyVisibility = (
    field: 'showPricesInIqd' | 'showPricesInUsd' | 'showPricesInLocal',
    checked: boolean
  ) => {
    setForm((current) => {
      const next = { ...current, [field]: checked };
      if (!next.showPricesInIqd && !next.showPricesInUsd && !next.showPricesInLocal) {
        toast.error(t(
          'Keep at least one currency visible.',
          'أبقِ عملة واحدة ظاهرة على الأقل.',
          '请至少保留一种显示货币。'
        ));
        return current;
      }
      const primaryIsVisible =
        (next.primaryPriceCurrency === 'IQD' && next.showPricesInIqd) ||
        (next.primaryPriceCurrency === 'USD' && next.showPricesInUsd) ||
        (next.primaryPriceCurrency === 'LOCAL' && next.showPricesInLocal);

      if (!primaryIsVisible) {
        next.primaryPriceCurrency = next.showPricesInLocal
          ? 'LOCAL'
          : next.showPricesInIqd
            ? 'IQD'
            : 'USD';
      }

      return next;
    });
  };

  const saveCountry = async () => {
    if (!selectedCatalogCountry) return;
    if (!form.showPricesInIqd && !form.showPricesInUsd && !form.showPricesInLocal) {
      toast.error(t(
        'Choose at least one visible currency.',
        'اختر عملة واحدة ظاهرة على الأقل.',
        '请至少选择一种显示货币。'
      ));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        selectedCountry ? `/api/admin/countries/${selectedCountry.id}` : '/api/admin/countries',
        {
          method: selectedCountry ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(selectedCountry
            ? form
            : {
                ...selectedCatalogCountry,
                ...form,
              }),
        }
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? 'COUNTRY_UPDATE_FAILED');

      await onChanged();
      toast.success(t(
        '{{country}} pricing saved.',
        'تم حفظ تسعير {{country}}.',
        '{{country}} 的价格设置已保存。'
      ).replace(
        '{{country}}',
        t(selectedCatalogCountry.name, selectedCatalogCountry.nameAr, selectedCatalogCountry.nameZh)
      ));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t(
        'Country pricing could not be saved.',
        'تعذر حفظ تسعير البلد.',
        '无法保存国家价格设置。'
      ));
    } finally {
      setIsSaving(false);
    }
  };

  const localCurrencyIsManaged = selectedCatalogCountry?.currencyCode === 'IQD'
    || selectedCatalogCountry?.currencyCode === 'USD';
  const priceToggleOptions: Array<{
    field: 'showPricesInIqd' | 'showPricesInUsd' | 'showPricesInLocal';
    code: string;
    label: string;
  }> = [
    { field: 'showPricesInIqd', code: 'IQD', label: t('Iraqi dinar', 'الدينار العراقي', '伊拉克第纳尔') },
    { field: 'showPricesInUsd', code: 'USD', label: t('US dollar', 'الدولار الأمريكي', '美元') },
    ...selectedCatalogCountry && !localCurrencyIsManaged
      ? [{
          field: 'showPricesInLocal' as const,
          code: selectedCatalogCountry.currencyCode,
          label: t('Local currency', 'العملة المحلية', '本地货币'),
        }]
      : [],
  ];
  const requestedCurrencyCodes = [
    form.showPricesInIqd ? 'IQD' : null,
    form.showPricesInUsd ? 'USD' : null,
    form.showPricesInLocal ? selectedCatalogCountry?.currencyCode : null,
  ].filter((code): code is string => Boolean(code));
  const uniqueRequestedCurrencyCodes = [...new Set(requestedCurrencyCodes)];
  const rateByCurrency = new Map(
    exchangeRates
      .filter((rate) => rate.baseCurrencyCode === 'IQD' && rate.isActive)
      .map((rate) => [rate.quoteCurrencyCode, rate.rate])
  );
  const selectedCountryRate = selectedCountry?.exchangeRate ?? 0;
  if (selectedCountry?.currency && selectedCountryRate > 0) {
    rateByCurrency.set(selectedCountry.currency, selectedCountryRate);
  }
  const primaryCode = form.primaryPriceCurrency === 'LOCAL'
    ? selectedCatalogCountry?.currencyCode
    : form.primaryPriceCurrency;
  const previewCurrencies = uniqueRequestedCurrencyCodes
    .map((code) => {
      const local = code === selectedCatalogCountry?.currencyCode;
      const rate = code === 'IQD' ? 1 : rateByCurrency.get(code) ?? 0;
      return {
        code,
        symbol: local ? selectedCatalogCountry?.currencySymbol ?? code : code === 'USD' ? '$' : 'د.ع',
        decimalPlaces: local ? selectedCatalogCountry?.decimalPlaces ?? 2 : code === 'USD' ? 2 : 0,
        rate,
        isAvailable: rate > 0,
      };
    })
    .filter((currency) => currency.isAvailable)
    .sort((left, right) => {
      return Number(right.code === primaryCode) - Number(left.code === primaryCode);
    });
  const visibleCurrencyCodes = previewCurrencies.map((currency) => currency.code);
  const missingCurrencyCodes = uniqueRequestedCurrencyCodes.filter((code) => (
    code !== 'IQD' && !(rateByCurrency.get(code) && rateByCurrency.get(code)! > 0)
  ));

  return (
    <section
      aria-labelledby="country-pricing-title"
      className="overflow-hidden rounded-lg border border-[#f7b928]/20 bg-[#071832]/80"
    >
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-[#f7b928]/10 text-[#f7b928]">
            <Globe2 className="h-5 w-5" />
          </span>
          <div>
            <h3 id="country-pricing-title" className="font-semibold text-white">
              {t('Price display by country', 'عرض الأسعار حسب البلد', '按国家显示价格')}
            </h3>
            <p className="mt-1 text-sm leading-5 text-white/55">
              {t(
                'Select a country and decide whether customers see IQD, USD, local currency, or a combination.',
                'اختر بلداً وحدد ما إذا كان العملاء يرون الدينار العراقي أو الدولار أو العملة المحلية أو مزيجاً منها.',
                '选择国家，并设置客户查看 IQD、USD、本地货币或其组合。'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <div className="min-w-0 border-b border-white/10 p-4 lg:border-b-0 lg:border-e">
          <div className="relative aspect-[16/8.5] min-h-56 overflow-hidden rounded-md border border-white/10 bg-[#020b1c]">
            {isLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-white/60">
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                {t('Loading countries...', 'جارٍ تحميل البلدان...', '正在加载国家...')}
              </div>
            ) : (
              <ComposableMap
                aria-label={t('Interactive world map for country pricing', 'خريطة عالمية تفاعلية لتسعير البلدان', '国家价格交互式世界地图')}
                projectionConfig={{ scale: 142 }}
                width={800}
                height={430}
                className="h-full w-full"
              >
                <ZoomableGroup center={[8, 8]} zoom={1}>
                  <Geographies geography={worldTopology}>
                    {({ geographies }) => geographies.map((geography) => {
                      const numericCode = String(geography.id ?? '').padStart(3, '0');
                      const catalogCountry = catalogByNumericCode.get(numericCode);
                      const configured = catalogCountry ? countriesByCode.get(catalogCountry.code) : undefined;
                      const selected = catalogCountry?.code === selectedCode;
                      const fill = selected
                        ? '#f7b928'
                        : configured?.isActive
                          ? '#2764c7'
                          : configured
                            ? '#52617a'
                            : '#172943';

                      return (
                        <Geography
                          key={geography.rsmKey}
                          geography={geography}
                          role={catalogCountry ? 'button' : undefined}
                          tabIndex={catalogCountry ? 0 : -1}
                          aria-label={catalogCountry
                            ? t(
                                '{{country}}: configure prices',
                                '{{country}}: إعداد الأسعار',
                                '{{country}}：配置价格'
                              ).replace(
                                '{{country}}',
                                t(catalogCountry.name, catalogCountry.nameAr, catalogCountry.nameZh)
                              )
                            : undefined}
                          onClick={() => catalogCountry && selectCountry(catalogCountry.code)}
                          onKeyDown={(event) => {
                            if (catalogCountry && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault();
                              selectCountry(catalogCountry.code);
                            }
                          }}
                          style={{
                            default: { fill, stroke: '#071327', strokeWidth: 0.55, outline: 'none' },
                            hover: { fill: catalogCountry ? '#ffd05a' : fill, stroke: '#071327', strokeWidth: 0.55, outline: 'none' },
                            pressed: { fill: '#e6a818', stroke: '#071327', strokeWidth: 0.55, outline: 'none' },
                          }}
                        />
                      );
                    })}
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            )}
            <div className="pointer-events-none absolute bottom-2 start-2 flex flex-wrap gap-2 text-[10px] text-white/65">
              <span className="rounded bg-black/45 px-2 py-1"><i className="me-1 inline-block h-2 w-2 rounded-sm bg-[#2764c7]" />{t('Configured', 'مُعد', '已配置')}</span>
              <span className="rounded bg-black/45 px-2 py-1"><i className="me-1 inline-block h-2 w-2 rounded-sm bg-[#172943]" />{t('Not configured', 'غير مُعد', '未配置')}</span>
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-white/35" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Search country or currency', 'ابحث عن بلد أو عملة', '搜索国家或货币')}
              className="border-white/10 bg-[#020b1c] ps-9 text-white placeholder:text-white/30"
            />
          </div>
          {query && (
            <div className="mt-2 grid max-h-44 gap-1 overflow-y-auto rounded-md border border-white/10 bg-[#020b1c] p-1 sm:grid-cols-2">
              {filteredCatalog.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => selectCountry(country.code)}
                  className={`flex min-h-11 items-center gap-2 rounded px-3 text-start text-sm ${
                    country.code === selectedCode
                      ? 'bg-[#f7b928]/15 text-[#ffd05a]'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg" aria-hidden>{country.flag}</span>
                  <span className="min-w-0 flex-1 truncate">{t(country.name, country.nameAr, country.nameZh)}</span>
                  {countriesByCode.has(country.code) && <Check className="h-4 w-4 flex-none text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5">
          {selectedCatalogCountry ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>{selectedCatalogCountry.flag}</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">
                    {t(selectedCatalogCountry.name, selectedCatalogCountry.nameAr, selectedCatalogCountry.nameZh)}
                  </p>
                  <p className="text-xs text-white/45">
                    {selectedCatalogCountry.currencyCode} · {selectedCatalogCountry.phoneCode}
                  </p>
                </div>
              </div>

              <fieldset className="space-y-3">
                <legend className="mb-2 text-xs font-semibold uppercase text-white/45">
                  {t('Visible prices', 'الأسعار الظاهرة', '显示的价格')}
                </legend>
                {priceToggleOptions.map(({ field, code, label }) => (
                  <Label
                    key={field}
                    className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3 text-white/80"
                  >
                    <span>
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="text-xs text-white/40">{code}</span>
                    </span>
                    <Switch
                      checked={form[field]}
                      onCheckedChange={(checked) => updateCurrencyVisibility(field, checked)}
                    />
                  </Label>
                ))}
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="primary-country-currency" className="text-xs font-semibold uppercase text-white/45">
                  {t('Primary price', 'السعر الأساسي', '主要价格')}
                </Label>
                <select
                  id="primary-country-currency"
                  value={form.primaryPriceCurrency}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    primaryPriceCurrency: event.target.value as PricingForm['primaryPriceCurrency'],
                  }))}
                  className="h-11 w-full rounded-md border border-white/10 bg-[#020b1c] px-3 text-sm text-white"
                >
                  {form.showPricesInLocal && !localCurrencyIsManaged && <option value="LOCAL">{selectedCatalogCountry.currencyCode}</option>}
                  {form.showPricesInIqd && <option value="IQD">IQD</option>}
                  {form.showPricesInUsd && <option value="USD">USD</option>}
                </select>
              </div>

              {previewCurrencies.length > 0 && (
                <div className="rounded-md border border-[#f7b928]/20 bg-[#020b1c] p-3">
                  <p className="text-xs font-semibold uppercase text-white/45">
                    {t('Example for 10,000 IQD', 'مثال على 10,000 دينار عراقي', '10,000 IQD 示例')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                    {previewCurrencies.map((currency, index) => (
                      <span
                        key={currency.code}
                        className={index === 0 ? 'text-base font-semibold text-white' : 'text-xs text-white/55'}
                      >
                        {index > 0 && '≈ '}
                        {new Intl.NumberFormat(undefined, {
                          minimumFractionDigits: currency.decimalPlaces,
                          maximumFractionDigits: currency.decimalPlaces,
                        }).format(10_000 * currency.rate)} {currency.symbol}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-md border border-white/10 px-3 text-sm text-white/80">
                <span>{t('Country available to customers', 'البلد متاح للعملاء', '向客户开放该国家')}</span>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((current) => ({ ...current, isActive: checked }))}
                />
              </Label>

              {missingCurrencyCodes.length > 0 && (
                <p role="status" className="rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">
                  {t(
                    'Add an IQD exchange rate for {{currencies}} before customers can see it.',
                    'أضف سعر صرف من IQD إلى {{currencies}} قبل عرضه للعملاء.',
                    '请先添加 IQD 到 {{currencies}} 的汇率，客户才能看到。'
                  ).replace('{{currencies}}', missingCurrencyCodes.join(', '))}
                </p>
              )}
              {visibleCurrencyCodes.length > 0 && (
                <p className="flex items-center gap-2 text-xs text-emerald-300">
                  <MapPin className="h-3.5 w-3.5" />
                  {t(
                    'Currently available: {{currencies}}',
                    'متاح حالياً: {{currencies}}',
                    '当前可用：{{currencies}}'
                  ).replace('{{currencies}}', visibleCurrencyCodes.join(', '))}
                </p>
              )}

              <Button
                type="button"
                onClick={() => void saveCountry()}
                disabled={isSaving}
                className="h-11 w-full bg-[#f7b928] font-semibold text-[#06152f] hover:bg-[#ffd05a]"
              >
                {isSaving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {selectedCountry
                  ? t('Save country pricing', 'حفظ تسعير البلد', '保存国家价格')
                  : t('Configure this country', 'إعداد هذا البلد', '配置该国家')}
              </Button>
            </div>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center text-white/50">
              <Globe2 className="mb-3 h-8 w-8 text-[#f7b928]/60" />
              <p className="text-sm">{t('Choose a country on the map.', 'اختر بلداً على الخريطة.', '请在地图上选择国家。')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
