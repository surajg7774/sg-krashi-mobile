import type { MessageKey } from "@/i18n";
import type { PayoutLineType, PayoutStatus } from "./types";

// Display text for the server's payout codes. English shows the code exactly as it always did ("BATCHED");
// other languages name it (docs/I18N_DECISIONS.md, D16).
export const PAYOUT_STATUS_KEY: Record<PayoutStatus, MessageKey> = {
  BATCHED: "farmer.payouts.status.BATCHED",
  APPROVED: "farmer.payouts.status.APPROVED",
  PAID: "farmer.payouts.status.PAID",
};

export const LINE_TYPE_KEY: Record<PayoutLineType, MessageKey> = {
  EARNING: "farmer.payouts.lineType.EARNING",
  CLAWBACK: "farmer.payouts.lineType.CLAWBACK",
};
