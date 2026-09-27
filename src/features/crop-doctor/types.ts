// Mirrors sg-krashi-client/src/features/ai-crop-doctor/types.ts exactly —
// same backend, same public-guest-analyze / authenticated-history contract.
export type HealthStatus = "HEALTHY" | "DISEASED" | "UNCERTAIN";
export type ConfidenceBand = "HIGH" | "MODERATE" | "LOW";
export type Severity = "MILD" | "MODERATE" | "SEVERE";

export interface CropScanSummary {
  id: number;
  imageUrl: string;
  identifiedCrop: string;
  problem: string | null;
  healthStatus: HealthStatus;
  confidenceBand: ConfidenceBand;
  isUncertain: boolean;
  cropMismatch: boolean;
  createdAt: string;
}

export interface GroundingSource {
  title: string;
  crop: string;
  topic: string;
}

export interface CropScan {
  // null for a Guest's result — never persisted, so there's no scan to
  // download a report for or revisit in history.
  id: number | null;
  declaredCrop: string | null;
  language: string | null;
  imageUrls: string[];
  identifiedCrop: string;
  healthStatus: HealthStatus;
  problem: string | null;
  pathogenScientificName: string | null;
  confidenceBand: ConfidenceBand;
  severity: Severity | null;
  symptoms: string[];
  possibleCauses: string[];
  environmentalFactors: string[];
  actionsNow: string[];
  prevention: string[];
  monitoringGuidance: string | null;
  warningSignsToEscalate: string[];
  limitations: string;
  providerName: string;
  modelVersion: string;
  isUncertain: boolean;
  cropMismatch: boolean;
  groundingSources: GroundingSource[];
  createdAt: string;
}

export interface SupportedCrop {
  cropName: string;
  hasLimitedCoverage: boolean;
  coverageNote: string | null;
}

export interface SupportedLanguage {
  code: string;
  label: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "hinglish", label: "Hinglish" },
];

// Frontend-only sentinel — never sent to the backend. Selecting it swaps the
// crop dropdown for a free-text input; the typed value is sent as
// declaredCrop instead.
export const OTHER_CROP_VALUE = "__other__";

export interface PickedImage {
  uri: string;
  name: string;
  type: string;
}
