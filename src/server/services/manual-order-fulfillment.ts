import type { User } from '@prisma/client';
import { assertManualFulfillmentInput } from '../domain/fulfillment';
import { encryptFulfillmentCode } from '../fulfillment-code';
import { prisma } from '../prisma';
import { notifyManualDeliveryForOrder, notifyTopupSuccessForOrder } from './whatsapp-notifications';

interface ManualFulfillmentInput {
  code?: string;
  note?: string;
}

export async function fulfillManualOrder(
  admin: Pick<User, 'id'>,
  orderId: string,
  input: ManualFulfillmentInput
) {
  const current = await prisma.order.findUnique({ where: { id: orderId } });
  if (!current) throw new Error('NOT_FOUND');

  const fulfillment = assertManualFulfillmentInput(current.fulfillmentMode, input);
  const isRetry = current.status === 'COMPLETED' && Boolean(current.manualFulfilledAt);
  if (!isRetry && (current.status !== 'PROCESSING' || current.paymentStatus !== 'COMPLETED')) {
    throw new Error('ORDER_NOT_READY_FOR_FULFILLMENT');
  }

  const encryptedCode = fulfillment.code ? encryptFulfillmentCode(fulfillment.code) : undefined;
  const order = await prisma.$transaction(async (tx) => {
    if (!isRetry) {
      const claim = await tx.order.updateMany({
        where: {
          id: current.id,
          status: 'PROCESSING',
          paymentStatus: 'COMPLETED',
          manualFulfilledAt: null,
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          manualFulfilledAt: new Date(),
          fulfilledByAdminId: admin.id,
          fulfillmentCodeEncrypted: encryptedCode,
          fulfillmentNote: fulfillment.note,
        },
      });
      if (claim.count !== 1) throw new Error('ORDER_ALREADY_FULFILLED');
    } else if (encryptedCode || fulfillment.note) {
      await tx.order.update({
        where: { id: current.id },
        data: {
          fulfillmentCodeEncrypted: encryptedCode,
          fulfillmentNote: fulfillment.note,
          fulfilledByAdminId: admin.id,
        },
      });
    }

    return tx.order.findUniqueOrThrow({ where: { id: current.id } });
  });

  const notification = fulfillment.code
    ? await notifyManualDeliveryForOrder(order.id, fulfillment.code)
    : await notifyTopupSuccessForOrder(order.id);

  return {
    order,
    deliveryStatus: notification?.notification?.status.toLowerCase() ?? 'pending',
    retried: isRetry,
  };
}
