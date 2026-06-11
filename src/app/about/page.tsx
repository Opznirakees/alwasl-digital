import { InfoPage } from '@/components/info/InfoPage';

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'About Al-Wasl Digital', ar: 'عن الوصل الرقمي' }}
      title={{ en: 'Fast WAHO top-ups for coins, gifts, rooms, and VIP upgrades.', ar: 'شحن WAHO سريع للعملات والهدايا والغرف وترقيات VIP.' }}
      subtitle={{ en: 'Al-Wasl Digital helps customers top up WAHO quickly with clear packages and local payment options.', ar: 'الوصل الرقمي يساعد العملاء على شحن WAHO بسرعة عبر باقات واضحة وخيارات دفع محلية.' }}
      actions={[
        { label: { en: 'Browse WAHO top-ups', ar: 'تصفح شحن WAHO' }, href: '/games' },
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم' }, href: '/contact' },
      ]}
      sections={[
        {
          title: { en: 'What we offer', ar: 'ماذا نقدم' },
          body: { en: 'Customers can choose WAHO coins, gift bundles, room boosts, party games, and VIP upgrades with clear pricing.', ar: 'يمكن للعملاء اختيار عملات WAHO وباقات الهدايا وتعزيز الغرف والألعاب وترقيات VIP بأسعار واضحة.' },
        },
        {
          title: { en: 'Designed for the region', ar: 'مصمم للمنطقة' },
          body: { en: 'The app supports Arabic and English, multiple countries, local currencies, and payment flows common in the Iraqi market.', ar: 'يدعم التطبيق العربية والإنجليزية وعدة دول وعملات محلية ومسارات دفع مناسبة للسوق العراقي.' },
        },
        {
          title: { en: 'Demo-ready platform', ar: 'منصة جاهزة للعرض' },
          body: { en: 'The current release shows the WAHO top-up flow from login to payment and order tracking.', ar: 'يعرض الإصدار الحالي مسار شحن WAHO من تسجيل الدخول إلى الدفع وتتبع الطلب.' },
        },
        {
          title: { en: 'Next steps', ar: 'الخطوات القادمة' },
          items: [
            { en: 'Connect live payment methods.', ar: 'ربط طرق الدفع الفعلية.' },
            { en: 'Speed up order handling.', ar: 'تسريع معالجة الطلبات.' },
            { en: 'Add production authentication and admin permissions.', ar: 'إضافة تسجيل دخول وصلاحيات إدارة للإنتاج.' },
          ],
        },
      ]}
    />
  );
}
