/**
 * Healthcare Safety Guardrail Engine
 * Enforces strict statutory non-clinical boundaries:
 * - Immediate detection and escalation of medical emergencies (112 / 102).
 * - Prohibition of automated medical diagnosis, clinical prescribing, or drug dosage recommendations.
 * - Mapping symptom discovery to verified clinical specialties without diagnosing.
 */

import { AiSafetyAssessment } from '@/shared/types/multilingual';

const EMERGENCY_PATTERNS = [
  /\b(chest\s+pain|heart\s+attack|angina)\b/i,
  /\b(difficulty\s+breathing|can'?t\s+breathe|shortness\s+of\s+breath|suffocat)\b/i,
  /\b(severe\s+bleeding|hemorrhage|coughing\s+blood)\b/i,
  /\b(stroke|facial\s+droop|slurred\s+speech|paralysis)\b/i,
  /\b(unconscious|passed\s+out|fainted|loss\s+of\s+consciousness)\b/i,
  /\b(seizure|convulsion|epilepsy\s+fit)\b/i,
  /\b(suicid|kill\s+myself|self\s+harm|end\s+my\s+life)\b/i,
  /\b(poison|overdose|swallowed\s+chemicals)\b/i,
  /\b(severe\s+head\s+injury|fractured\s+skull)\b/i,
];

const CLINICAL_DIAGNOSIS_PATTERNS = [
  /\b(what\s+(?:disease|illness|condition|infection)\s+(?:do\s+i\s+have|is\s+it|is\s+this))\b/i,
  /\b(what\s+(?:could\s+it\s+be|could\s+this\s+be|might\s+it\s+be))\b/i,
  /\b(diagnose\s+(?:me|my|this))\b/i,
  /\b(prescribe\s+(?:me|for\s+me)?\s+(?:antibiotics?|medicine|drugs?|pills?))\b/i,
  /\b(write\s+(?:me\s+)?a\s+prescription)\b/i,
  /\b(what\s+dose|what\s+dosage|how\s+many\s+mg|how\s+much\s+(?:mg|paracetamol|ibuprofen|amoxicillin))\b/i,
  /\b(is\s+my\s+(?:lump|mole|rash)\s+cancerous)\b/i,
  /\b(do\s+i\s+have\s+cancer)\b/i,
  /\b(cure\s+(?:my|this)\s+(?:disease|infection))\b/i,
];

const SYMPTOM_TO_SPECIALTY_MAP: Record<string, string> = {
  skin: 'Dermatology',
  rash: 'Dermatology',
  acne: 'Dermatology',
  eczema: 'Dermatology',
  hair: 'Dermatology',
  tooth: 'Dentistry',
  teeth: 'Dentistry',
  gum: 'Dentistry',
  dental: 'Dentistry',
  child: 'Pediatrics',
  baby: 'Pediatrics',
  infant: 'Pediatrics',
  heart: 'Cardiology',
  cardiac: 'Cardiology',
  eye: 'Ophthalmology',
  vision: 'Ophthalmology',
  bone: 'Orthopedics',
  joint: 'Orthopedics',
  fracture: 'Orthopedics',
  knee: 'Orthopedics',
  stomach: 'Gastroenterology',
  digest: 'Gastroenterology',
  ear: 'ENT (Otolaryngology)',
  nose: 'ENT (Otolaryngology)',
  throat: 'ENT (Otolaryngology)',
  fever: 'General Medicine',
  cold: 'General Medicine',
  cough: 'General Medicine',
  headache: 'General Medicine',
};

export class SafetyGuardrailEngine {
  /**
   * Evaluate user query against statutory safety guardrails
   */
  static evaluate(query: string): AiSafetyAssessment {
    const isEmergency = EMERGENCY_PATTERNS.some((pattern) => pattern.test(query));
    const isClinicalAdviceBlocked = CLINICAL_DIAGNOSIS_PATTERNS.some((pattern) =>
      pattern.test(query)
    );

    let recommendedSpecialty: string | undefined;
    const lower = query.toLowerCase();
    for (const [symptom, specialty] of Object.entries(SYMPTOM_TO_SPECIALTY_MAP)) {
      if (lower.includes(symptom)) {
        recommendedSpecialty = specialty;
        break;
      }
    }

    const assessment: AiSafetyAssessment = {
      isEmergency,
      isClinicalAdviceBlocked,
    };

    if (isEmergency) {
      assessment.emergencyGuidance =
        'CRITICAL: You may be experiencing an acute medical emergency. Do not wait for online or AI assistance. Call 112 or 102 immediately (India) or proceed directly to the nearest hospital emergency room.';
    }

    if (isClinicalAdviceBlocked) {
      assessment.blockedAdviceExplanation =
        'DocNearby is an evidence-based healthcare discovery platform and strictly does NOT provide medical diagnosis, clinical treatment plans, or prescription authoring. Please consult an authorized doctor in person.';
    }

    if (recommendedSpecialty) {
      assessment.recommendedSpecialty = recommendedSpecialty;
    }

    return assessment;
  }
}
