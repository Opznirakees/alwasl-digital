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

export function resolveProviderFulfillmentResult(providerStatus: 'processing' | 'completed' | 'failed') {
  if (providerStatus === 'failed') {
    return {
      paymentStatus: 'REFUNDED' as const,
      orderStatus: 'REFUNDED' as const,
      completedAt: false,
      shouldRefund: true,
    };
  }

  if (providerStatus === 'completed') {
    return {
      paymentStatus: 'COMPLETED' as const,
      orderStatus: 'COMPLETED' as const,
      completedAt: true,
      shouldRefund: false,
    };
  }

  return {
    paymentStatus: 'COMPLETED' as const,
    orderStatus: 'PROCESSING' as const,
    completedAt: false,
    shouldRefund: false,
  };
}

export function createRefundReference(orderId: string) {
  return `REFUND-${orderId}`;
}
