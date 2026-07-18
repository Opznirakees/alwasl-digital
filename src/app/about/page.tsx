import { InfoPage } from '@/components/info/InfoPage';

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'About Al-Wasl Digital', ar: 'عن الوصل الرقمي', zh: '关于 Al-Wasl Digital' }}
      title={{ en: 'A simple way to top up WAHO.', ar: 'طريقة بسيطة لشحن WAHO.', zh: '简单完成 WAHO 充值。' }}
      subtitle={{ en: 'Choose an amount, check the WAHO account and follow your order from one place.', ar: 'اختر المبلغ وتحقق من حساب WAHO وتابع طلبك من مكان واحد.', zh: '选择金额、核对 WAHO 账号，并在一个地方查看订单。' }}
      actions={[
        { label: { en: 'Choose an amount', ar: 'اختر المبلغ', zh: '选择金额' }, href: '/top-up/waho-top-up' },
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم', zh: '联系客服' }, href: '/contact' },
      ]}
      sections={[
        {
          title: { en: 'What you can do', ar: 'ما يمكنك فعله', zh: '您可以做什么' },
          body: { en: 'Top up one WAHO account at a time. You choose the amount and confirm the account before paying.', ar: 'اشحن حساب WAHO واحداً في كل مرة. اختر المبلغ وتأكد من الحساب قبل الدفع.', zh: '每次为一个 WAHO 账号充值。付款前先选择金额并确认账号。' },
        },
        {
          title: { en: 'Made for you', ar: 'مصمم من أجلك', zh: '为您设计' },
          body: { en: 'Use the app in English, Arabic or Chinese. Prices and available methods follow your selected country.', ar: 'استخدم التطبيق بالإنجليزية أو العربية أو الصينية. تتبع الأسعار والطرق المتاحة البلد الذي اخترته.', zh: '应用支持英语、阿拉伯语和中文。价格及可用方式会根据所选国家显示。' },
        },
        {
          title: { en: 'Four clear steps', ar: 'أربع خطوات واضحة', zh: '四个清晰步骤' },
          body: { en: 'Amount, WAHO ID, payment and confirmation. The progress bar always shows where you are.', ar: 'المبلغ ومعرف WAHO والدفع والتأكيد. يوضح شريط التقدم دائماً موقعك.', zh: '金额、WAHO ID、付款和确认。进度条会始终显示您所在的步骤。' },
        },
        {
          title: { en: 'What you can expect', ar: 'ما يمكنك توقعه', zh: '您可以期待' },
          items: [
            { en: 'The total price before you confirm.', ar: 'السعر الإجمالي قبل التأكيد.', zh: '确认前查看总价。' },
            { en: 'A WAHO ID check before payment.', ar: 'فحص معرف WAHO قبل الدفع.', zh: '付款前核对 WAHO ID。' },
            { en: 'WhatsApp help when an order needs attention.', ar: 'مساعدة واتساب عندما يحتاج الطلب إلى متابعة.', zh: '订单需要处理时可获得 WhatsApp 帮助。' },
          ],
        },
      ]}
    />
  );
}
