import type { MessageKey } from "@/i18n";

// Display text for the server's scan codes. English shows the health code exactly as it always did ("HEALTHY");
// other languages name it. A code this build does not know is shown as sent.
export const HEALTH_KEY: Record<string, MessageKey | undefined> = {
  HEALTHY: "cropDoctor.health.HEALTHY",
  DISEASED: "cropDoctor.health.DISEASED",
  UNCERTAIN: "cropDoctor.health.UNCERTAIN",
};

export const CONFIDENCE_KEY: Record<string, MessageKey | undefined> = {
  HIGH: "cropDoctor.confidence.HIGH",
  MODERATE: "cropDoctor.confidence.MODERATE",
  LOW: "cropDoctor.confidence.LOW",
};
