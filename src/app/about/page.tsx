import { InfoPage } from '@/components/info/InfoPage';

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'About Al-Wasl Digital', ar: 'عن الوصل الرقمي', zh: '关于 Al-Wasl Digital' }}
      title={{ en: 'A simple way to recharge.', ar: 'طريقة بسيطة للشحن.', zh: '简单完成充值。' }}
      subtitle={{ en: 'Choose a category and amount, then follow every order from one place.', ar: 'اختر الفئة والمبلغ ثم تابع كل طلب من مكان واحد.', zh: '选择分类和金额，然后在一个地方查看每笔订单。' }}
      actions={[
        { label: { en: 'Choose a category', ar: 'اختر الفئة', zh: '选择分类' }, href: '/#categories' },
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم', zh: '联系客服' }, href: '/contact' },
      ]}
      sections={[
        {
          title: { en: 'What you can do', ar: 'ما يمكنك فعله', zh: '您可以做什么' },
          body: { en: 'Choose an available category, see your local price and confirm the delivery details before paying.', ar: 'اختر فئة متاحة وشاهد سعرك المحلي وتأكد من بيانات التسليم قبل الدفع.', zh: '选择可用分类，查看当地价格，并在付款前确认交付信息。' },
        },
        {
          title: { en: 'Made for you', ar: 'مصمم من أجلك', zh: '为您设计' },
          body: { en: 'Use the app in English, Arabic or Chinese. Prices and available methods follow your selected country.', ar: 'استخدم التطبيق بالإنجليزية أو العربية أو الصينية. تتبع الأسعار والطرق المتاحة البلد الذي اخترته.', zh: '应用支持英语、阿拉伯语和中文。价格及可用方式会根据所选国家显示。' },
        },
        {
          title: { en: 'Four clear steps', ar: 'أربع خطوات واضحة', zh: '四个清晰步骤' },
          body: { en: 'Amount, delivery details, payment and confirmation. The progress bar always shows where you are.', ar: 'المبلغ وبيانات التسليم والدفع والتأكيد. يوضح شريط التقدم دائماً موقعك.', zh: '金额、交付信息、付款和确认。进度条会始终显示您所在的步骤。' },
        },
        {
          title: { en: 'What you can expect', ar: 'ما يمكنك توقعه', zh: '您可以期待' },
          items: [
            { en: 'The total price before you confirm.', ar: 'السعر الإجمالي قبل التأكيد.', zh: '确认前查看总价。' },
            { en: 'An account check when the selected product requires it.', ar: 'فحص الحساب عندما يتطلب المنتج المختار ذلك.', zh: '所选产品需要时会核对账号。' },
            { en: 'WhatsApp help when an order needs attention.', ar: 'مساعدة واتساب عندما يحتاج الطلب إلى متابعة.', zh: '订单需要处理时可获得 WhatsApp 帮助。' },
          ],
        },
      ]}
    />
  );
}
