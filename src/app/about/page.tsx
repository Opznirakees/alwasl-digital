import { InfoPage } from '@/components/info/InfoPage';

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'About Al-Wasl Digital', ar: 'عن الوصل الرقمي' }}
      title={{ en: 'Fast digital top-ups for games, gift cards, and subscriptions.', ar: 'شحن رقمي سريع للألعاب والبطاقات والاشتراكات.' }}
      subtitle={{ en: 'Al-Wasl Digital is built as a bilingual storefront for customers across Iraq and the wider region.', ar: 'الوصل الرقمي واجهة ثنائية اللغة للعملاء في العراق والمنطقة.' }}
      actions={[
        { label: { en: 'Browse games', ar: 'تصفح الألعاب' }, href: '/games' },
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم' }, href: '/contact' },
      ]}
      sections={[
        {
          title: { en: 'What we offer', ar: 'ماذا نقدم' },
          body: { en: 'Customers can browse popular mobile games, PC services, gift cards, and streaming products with clear packages and local pricing.', ar: 'يمكن للعملاء تصفح أشهر ألعاب الموبايل وخدمات الكمبيوتر وبطاقات الهدايا والاشتراكات مع باقات وأسعار محلية واضحة.' },
        },
        {
          title: { en: 'Designed for the region', ar: 'مصمم للمنطقة' },
          body: { en: 'The app supports Arabic and English, multiple countries, local currencies, and payment flows common in the Iraqi market.', ar: 'يدعم التطبيق العربية والإنجليزية وعدة دول وعملات محلية ومسارات دفع مناسبة للسوق العراقي.' },
        },
        {
          title: { en: 'Demo-ready platform', ar: 'منصة جاهزة للعرض' },
          body: { en: 'The current release runs with sample data, simulated OTP verification, wallet top-ups, and order processing so every screen can be tested end to end.', ar: 'الإصدار الحالي يعمل ببيانات تجريبية وتحقق OTP ومحفظة وطلبات محاكاة حتى يمكن اختبار كل شاشة من البداية للنهاية.' },
        },
        {
          title: { en: 'Next steps', ar: 'الخطوات القادمة' },
          items: [
            { en: 'Connect real payment providers.', ar: 'ربط مزودي الدفع الحقيقيين.' },
            { en: 'Wire order fulfillment provider APIs.', ar: 'ربط واجهات مزودي تنفيذ الطلبات.' },
            { en: 'Add production authentication and admin permissions.', ar: 'إضافة تسجيل دخول وصلاحيات إدارة للإنتاج.' },
          ],
        },
      ]}
    />
  );
}
