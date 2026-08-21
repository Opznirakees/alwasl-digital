-- DigitalOcean runs migrations without `prisma db seed`. Keep the complete Arab-region
-- currency catalog available in every production database while preserving admin rates.
INSERT INTO "currencies" (
  "code", "name", "symbol", "decimalPlaces", "isActive", "createdAt", "updatedAt"
) VALUES
  ('AED', 'United Arab Emirates dirham', 'د.إ', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('BHD', 'Bahraini dinar', '.د.ب', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DJF', 'Djiboutian franc', 'Fr', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('DZD', 'Algerian dinar', 'د.ج', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('EGP', 'Egyptian pound', '£', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ILS', 'Israeli new shekel', '₪', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('IQD', 'Iraqi dinar', 'ع.د', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('JOD', 'Jordanian dinar', 'د.ا', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('KMF', 'Comorian franc', 'Fr', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('KWD', 'Kuwaiti dinar', 'د.ك', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('LBP', 'Lebanese pound', 'ل.ل', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('LYD', 'Libyan dinar', 'ل.د', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('MAD', 'Moroccan dirham', 'د.م.', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('MRU', 'Mauritanian ouguiya', 'UM', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('OMR', 'Omani rial', 'ر.ع.', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('QAR', 'Qatari riyal', 'ر.ق', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SAR', 'Saudi riyal', 'ر.س', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SDG', 'Sudanese pound', 'PT', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SOS', 'Somali shilling', 'Sh', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('SYP', 'Syrian pound', '£', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('TND', 'Tunisian dinar', 'د.ت', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('YER', 'Yemeni rial', '﷼', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "countries" (
  "id", "code", "name", "nameAr", "nameZh", "flag", "phoneCode", "currencyCode",
  "primaryPriceCurrency", "showPricesInIqd", "showPricesInUsd", "showPricesInLocal",
  "isActive", "createdAt", "updatedAt"
) VALUES
  ('dz', 'DZ', 'Algeria', 'الجزائر', '阿尔及利亚', '🇩🇿', '+213', 'DZD', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('bh', 'BH', 'Bahrain', 'البحرين', '巴林', '🇧🇭', '+973', 'BHD', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('km', 'KM', 'Comoros', 'جزر القمر', '科摩罗', '🇰🇲', '+269', 'KMF', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('dj', 'DJ', 'Djibouti', 'جيبوتي', '吉布提', '🇩🇯', '+253', 'DJF', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('eg', 'EG', 'Egypt', 'مصر', '埃及', '🇪🇬', '+20', 'EGP', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('iq', 'IQ', 'Iraq', 'العراق', '伊拉克', '🇮🇶', '+964', 'IQD', 'IQD', true, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('jo', 'JO', 'Jordan', 'الأردن', '约旦', '🇯🇴', '+962', 'JOD', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('kw', 'KW', 'Kuwait', 'الكويت', '科威特', '🇰🇼', '+965', 'KWD', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('lb', 'LB', 'Lebanon', 'لبنان', '黎巴嫩', '🇱🇧', '+961', 'LBP', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ly', 'LY', 'Libya', 'ليبيا', '利比亚', '🇱🇾', '+218', 'LYD', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mr', 'MR', 'Mauritania', 'موريتانيا', '毛里塔尼亚', '🇲🇷', '+222', 'MRU', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ma', 'MA', 'Morocco', 'المغرب', '摩洛哥', '🇲🇦', '+212', 'MAD', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('om', 'OM', 'Oman', 'عمان', '阿曼', '🇴🇲', '+968', 'OMR', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ps', 'PS', 'Palestine', 'فلسطين', '巴勒斯坦', '🇵🇸', '+970', 'ILS', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('qa', 'QA', 'Qatar', 'قطر', '卡塔尔', '🇶🇦', '+974', 'QAR', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sa', 'SA', 'Saudi Arabia', 'السعودية', '沙特阿拉伯', '🇸🇦', '+966', 'SAR', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('so', 'SO', 'Somalia', 'الصومال', '索马里', '🇸🇴', '+252', 'SOS', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sd', 'SD', 'Sudan', 'السودان', '苏丹', '🇸🇩', '+249', 'SDG', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('sy', 'SY', 'Syria', 'سوريا', '叙利亚', '🇸🇾', '+963', 'SYP', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('tn', 'TN', 'Tunisia', 'تونس', '突尼斯', '🇹🇳', '+216', 'TND', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ae', 'AE', 'United Arab Emirates', 'الإمارات', '阿拉伯联合酋长国', '🇦🇪', '+971', 'AED', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('ye', 'YE', 'Yemen', 'اليمن', '也门', '🇾🇪', '+967', 'YER', 'LOCAL', false, false, true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "nameAr" = EXCLUDED."nameAr",
  "nameZh" = EXCLUDED."nameZh",
  "flag" = EXCLUDED."flag",
  "phoneCode" = EXCLUDED."phoneCode",
  "currencyCode" = EXCLUDED."currencyCode",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "exchange_rates" (
  "id", "baseCurrencyCode", "quoteCurrencyCode", "rate", "isActive", "source", "note",
  "createdAt", "updatedAt"
) VALUES
  ('seed-arab-iqd-dzd-rate', 'IQD', 'DZD', 0.10139800, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-bhd-rate', 'IQD', 'BHD', 0.00028700, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-kmf-rate', 'IQD', 'KMF', 0.32139300, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-djf-rate', 'IQD', 'DJF', 0.13561600, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-egp-rate', 'IQD', 'EGP', 0.03864100, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-jod-rate', 'IQD', 'JOD', 0.00054100, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-kwd-rate', 'IQD', 'KWD', 0.00023400, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-lbp-rate', 'IQD', 'LBP', 68.29593100, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-lyd-rate', 'IQD', 'LYD', 0.00485300, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-mru-rate', 'IQD', 'MRU', 0.03058500, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-mad-rate', 'IQD', 'MAD', 0.00707300, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-omr-rate', 'IQD', 'OMR', 0.00029300, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-ils-rate', 'IQD', 'ILS', 0.00228800, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-qar-rate', 'IQD', 'QAR', 0.00277800, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-sar-rate', 'IQD', 'SAR', 0.00286200, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-sos-rate', 'IQD', 'SOS', 0.43594500, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-sdg-rate', 'IQD', 'SDG', 0.39047600, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-syp-rate', 'IQD', 'SYP', 0.09309900, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-tnd-rate', 'IQD', 'TND', 0.00221700, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-aed-rate', 'IQD', 'AED', 0.00280200, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('seed-arab-iqd-yer-rate', 'IQD', 'YER', 0.18088400, true, 'manual', 'Initial Arab-region administrative rate; review regularly', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("baseCurrencyCode", "quoteCurrencyCode") DO NOTHING;

UPDATE "products"
SET
  "countries" = ARRAY(SELECT "id" FROM "countries" WHERE "isActive" = true ORDER BY "id"),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN ('waho-top-up', 'waho-asiacell-code');
