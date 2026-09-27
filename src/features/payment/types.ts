// Ported from sg-krashi-client/src/shared/types/payment.ts.
export type PayableType = "ORDER" | "BOOKING";

export interface PaymentInitiation {
  paymentId: number;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  razorpayKeyId: string;
}

export interface InitiatePaymentPayload {
  payableType: PayableType;
  payableId: number;
}
