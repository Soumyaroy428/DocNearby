/**
 * DocNearby Multilingual & Travel Health Types
 * Supported travel languages, phrasebook models, and translation assistance.
 */

export type SupportedLanguage = 'en' | 'hi' | 'bn';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string; // e.g. "English"
  nativeLabel: string; // e.g. "हिन्दी", "বাংলা"
  flag?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
];

export interface TravelMedicalPhrase {
  id: string;
  category: 'emergency' | 'consultation' | 'pricing' | 'directions' | 'pharmacy';
  english: string;
  hindi: string;
  hindiTransliteration?: string;
  bengali: string;
  bengaliTransliteration?: string;
}

export interface AiSafetyAssessment {
  isEmergency: boolean;
  isClinicalAdviceBlocked: boolean;
  emergencyGuidance?: string;
  blockedAdviceExplanation?: string;
  recommendedSpecialty?: string;
}

export interface MultilingualAssistResponse {
  originalQuery: string;
  detectedLanguage: SupportedLanguage;
  safety: AiSafetyAssessment;
  extractedFilters?: {
    location?: string | null;
    specialty?: string | null;
    languages?: string[];
    maxFeeMinor?: number | null;
    currency?: string;
    providerType?: string | null;
  };
  travelPhrases?: TravelMedicalPhrase[];
  suggestedActionText?: string;
}
