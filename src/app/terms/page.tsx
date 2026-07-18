import { InfoPage } from '@/components/info/InfoPage';

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Terms', ar: 'شروط الخدمة', zh: '服务条款' }}
      title={{ en: 'Please check the details before you confirm.', ar: 'يرجى التحقق من التفاصيل قبل التأكيد.', zh: '确认前请核对所有信息。' }}
      subtitle={{ en: 'The WAHO ID, amount and payment method must be correct before the order is placed.', ar: 'يجب أن يكون معرف WAHO والمبلغ وطريقة الدفع صحيحة قبل تنفيذ الطلب.', zh: '提交订单前，WAHO ID、金额和付款方式必须正确。' }}
      sections={[
        {
          title: { en: 'Your details', ar: 'بياناتك', zh: '您的信息' },
          body: { en: 'You are responsible for entering the correct WAHO ID and phone number.', ar: 'أنت مسؤول عن إدخال معرف WAHO ورقم الهاتف بشكل صحيح.', zh: '您需要负责填写正确的 WAHO ID 和手机号码。' },
        },
        {
          title: { en: 'Completed orders', ar: 'الطلبات المكتملة', zh: '已完成订单' },
          body: { en: 'A WAHO top-up may not be reversible after it has been completed.', ar: 'قد لا يمكن عكس شحن WAHO بعد اكتماله.', zh: 'WAHO 充值完成后可能无法撤销。' },
        },
        {
          title: { en: 'Payment', ar: 'الدفع', zh: '付款' },
          body: { en: 'An order continues after payment is confirmed. Keep the order ID until the top-up is complete.', ar: 'يتابع الطلب بعد تأكيد الدفع. احتفظ برقم الطلب حتى يكتمل الشحن.', zh: '付款确认后订单才会继续处理。充值完成前请保留订单编号。' },
        },
        {
          title: { en: 'When you need help', ar: 'عندما تحتاج مساعدة', zh: '需要帮助时' },
          body: { en: 'Support may ask for the order ID, WAHO ID, phone number and payment reference. Never share a verification code.', ar: 'قد يطلب الدعم رقم الطلب ومعرف WAHO ورقم الهاتف ومرجع الدفع. لا تشارك رمز التحقق أبداً.', zh: '客服可能会询问订单编号、WAHO ID、手机号码和付款凭证。切勿分享验证码。' },
        },
      ]}
    />
  );
}
