import { InfoPage } from '@/components/info/InfoPage';

export default function HelpPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Help', ar: 'المساعدة', zh: '帮助' }}
      title={{ en: 'Top up WAHO in four simple steps.', ar: 'اشحن WAHO في أربع خطوات بسيطة.', zh: '四个简单步骤完成 WAHO 充值。' }}
      subtitle={{ en: 'Follow these steps from top to bottom. The app saves your choices while you continue.', ar: 'اتبع هذه الخطوات من الأعلى إلى الأسفل. يحفظ التطبيق اختياراتك أثناء المتابعة.', zh: '从上到下按步骤操作，应用会在过程中保留您的选择。' }}
      actions={[
        { label: { en: 'Choose an amount', ar: 'اختر المبلغ', zh: '选择金额' }, href: '/top-up/waho-top-up' },
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم', zh: '联系客服' }, href: '/contact' },
      ]}
      sections={[
        {
          title: { en: '1. Choose an amount', ar: '1. اختر المبلغ', zh: '1. 选择金额' },
          items: [
            { en: 'Tap the amount you want to add.', ar: 'اضغط على المبلغ الذي تريد إضافته.', zh: '点击想要充值的金额。' },
            { en: 'The selected card shows a check mark.', ar: 'تظهر علامة صح على البطاقة المختارة.', zh: '选中的金额卡会显示勾号。' },
          ],
        },
        {
          title: { en: '2. Check the WAHO ID', ar: '2. تحقق من معرف WAHO', zh: '2. 核对 WAHO ID' },
          items: [
            { en: 'Copy the ID from your WAHO profile.', ar: 'انسخ المعرف من ملفك في WAHO.', zh: '从 WAHO 个人资料中复制 ID。' },
            { en: 'Check the account name before continuing.', ar: 'تحقق من اسم الحساب قبل المتابعة.', zh: '继续前请核对账号名称。' },
          ],
        },
        {
          title: { en: '3. Choose how to pay', ar: '3. اختر طريقة الدفع', zh: '3. 选择付款方式' },
          items: [
            { en: 'Only available payment methods can be selected.', ar: 'يمكن اختيار طرق الدفع المتاحة فقط.', zh: '只能选择当前可用的付款方式。' },
            { en: 'The total stays visible before confirmation.', ar: 'يبقى المبلغ الإجمالي ظاهراً قبل التأكيد.', zh: '确认前总金额会保持可见。' },
          ],
        },
        {
          title: { en: '4. Confirm and follow', ar: '4. أكد وتابع', zh: '4. 确认并查看进度' },
          items: [
            { en: 'Enter the WhatsApp code to place the order.', ar: 'أدخل رمز واتساب لتنفيذ الطلب.', zh: '输入 WhatsApp 验证码以提交订单。' },
            { en: 'Open My Orders to follow what happens next.', ar: 'افتح طلباتي لمتابعة ما يحدث بعد ذلك.', zh: '打开“我的订单”查看后续进度。' },
          ],
        },
      ]}
    />
  );
}
