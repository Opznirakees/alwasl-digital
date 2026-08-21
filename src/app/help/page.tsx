import { InfoPage } from '@/components/info/InfoPage';

export default function HelpPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Help', ar: 'المساعدة', zh: '帮助' }}
      title={{ en: 'Recharge in four simple steps.', ar: 'اشحن في أربع خطوات بسيطة.', zh: '四个简单步骤完成充值。' }}
      subtitle={{ en: 'Follow these steps from top to bottom. The app saves your choices while you continue.', ar: 'اتبع هذه الخطوات من الأعلى إلى الأسفل. يحفظ التطبيق اختياراتك أثناء المتابعة.', zh: '从上到下按步骤操作，应用会在过程中保留您的选择。' }}
      actions={[
        { label: { en: 'Choose a category', ar: 'اختر الفئة', zh: '选择分类' }, href: '/#categories' },
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم', zh: '联系客服' }, href: '/contact' },
      ]}
      sections={[
        {
          title: { en: '1. Choose a category and amount', ar: '1. اختر الفئة والمبلغ', zh: '1. 选择分类和金额' },
          items: [
            { en: 'Choose WAHO, Asiacell or another available category first.', ar: 'اختر واهو أو آسياسيل أو أي فئة متاحة أولاً.', zh: '先选择 WAHO、Asiacell 或其他可用分类。' },
            { en: 'The selected card shows a check mark.', ar: 'تظهر علامة صح على البطاقة المختارة.', zh: '选中的金额卡会显示勾号。' },
          ],
        },
        {
          title: { en: '2. Check the delivery details', ar: '2. تحقق من بيانات التسليم', zh: '2. 核对交付信息' },
          items: [
            { en: 'For account top-ups, copy the requested ID from the app.', ar: 'لشحن الحساب، انسخ المعرف المطلوب من التطبيق.', zh: '为账号充值时，请从应用中复制所需 ID。' },
            { en: 'For purchased codes, delivery is confirmed privately through WhatsApp.', ar: 'بالنسبة للرموز المشتراة، يتم تأكيد التسليم بشكل خاص عبر واتساب.', zh: '购买充值码时，将通过 WhatsApp 私密确认交付。' },
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
