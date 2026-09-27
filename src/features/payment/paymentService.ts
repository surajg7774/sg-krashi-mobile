import { apiClient } from "@/api/client";
import type { InitiatePaymentPayload, PaymentInitiation } from "./types";

// Ported from sg-krashi-client/src/shared/services/paymentService.ts.
export const paymentService = {
  initiatePayment: async (payload: InitiatePaymentPayload): Promise<PaymentInitiation> => {
    const response = await apiClient.post<PaymentInitiation>("/payments/initiate", payload);
    return response.data;
  },
};
