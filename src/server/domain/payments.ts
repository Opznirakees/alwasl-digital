export function resolveFakePaymentResult(success: boolean, providerStatus: 'processing' | 'completed' | 'failed') {
  if (!success || providerStatus === 'failed') {
    return {
      paymentStatus: 'FAILED' as const,
      orderStatus: 'FAILED' as const,
      completedAt: false,
    };
  }

  if (providerStatus === 'completed') {
    return {
      paymentStatus: 'COMPLETED' as const,
      orderStatus: 'COMPLETED' as const,
      completedAt: true,
    };
  }

  return {
    paymentStatus: 'COMPLETED' as const,
    orderStatus: 'PROCESSING' as const,
    completedAt: false,
  };
}
