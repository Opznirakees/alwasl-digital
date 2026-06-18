interface DeliverOtpInput {
  phone: string;
  code: string;
}

export async function deliverOtp(input: DeliverOtpInput) {
  if (process.env.OTP_WEBHOOK_URL) {
    const response = await fetch(process.env.OTP_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.OTP_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.OTP_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        phone: input.phone,
        code: input.code,
        channel: process.env.OTP_CHANNEL ?? 'whatsapp',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to deliver OTP');
    }
    return;
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_UNDELIVERED_OTP !== 'true') {
    throw new Error('OTP provider is not configured');
  }

  console.info(`Al-Wasl OTP for ${input.phone}: ${input.code}`);
}
