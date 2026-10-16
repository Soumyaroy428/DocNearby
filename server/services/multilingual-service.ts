/**
 * Multilingual Healthcare Assistance & Travel Medical Phrasebook Service
 * Supports travelers in unfamiliar cities across English, Hindi, and Bengali.
 * Integrates SafetyGuardrails to prevent diagnosis or prescribing.
 */

import {
  SupportedLanguage,
  TravelMedicalPhrase,
  MultilingualAssistResponse,
} from '@/shared/types/multilingual';
import { SafetyGuardrailEngine } from '@/server/ai/safety-guardrails';
import { AiProviderManager, aiProviderManager as defaultAiManager } from '@/server/ai/ai-provider-manager';
import { aiSearchIntentSchema, ValidatedAiSearchIntent } from '@/server/validation/ai-multilingual';

const TRAVEL_PHRASES: TravelMedicalPhrase[] = [
  // Emergency
  {
    id: 'phrase-emg-1',
    category: 'emergency',
    english: 'I need urgent medical assistance.',
    hindi: 'मुझे तत्काल चिकित्सा सहायता चाहिए।',
    hindiTransliteration: 'Mujhe tatkaal chikitsa sahaayata chahiye.',
    bengali: 'আমার জরুরি চিকিৎসা সহায়তা প্রয়োজন।',
    bengaliTransliteration: 'Aamar joruri chikitsa shohayota proyojon.',
  },
  {
    id: 'phrase-emg-2',
    category: 'emergency',
    english: 'Where is the hospital emergency department?',
    hindi: 'अस्पताल का आपातकालीन विभाग कहाँ है?',
    hindiTransliteration: 'Aspataal ka aapaatkaaleen vibhaag kahan hai?',
    bengali: 'হাসপাতালের জরুরি বিভাগ কোথায়?',
    bengaliTransliteration: 'Hashpataler joruri bibhag kothay?',
  },
  {
    id: 'phrase-emg-3',
    category: 'emergency',
    english: 'Please call an ambulance immediately (Dial 112 / 102).',
    hindi: 'कृपया तुरंत एम्बुलेंस बुलाएं (112 / 102 पर कॉल करें)।',
    hindiTransliteration: 'Kripaya turant ambulance bulaayein.',
    bengali: 'দয়া করে অবিলম্বে একটি অ্যাম্বুলেন্স ডাকুন (112 / 102)।',
    bengaliTransliteration: 'Doya kore obilombe ekti ambulance dakun.',
  },

  // Consultation & Communication
  {
    id: 'phrase-cons-1',
    category: 'consultation',
    english: 'I am a traveler visiting this city and need to see a doctor.',
    hindi: 'मैं इस शहर में यात्री हूँ और मुझे डॉक्टर से मिलना है।',
    hindiTransliteration: 'Main is shahar mein yaatri hoon aur mujhe doctor se milna hai.',
    bengali: 'আমি এই শহরে একজন পর্যটক এবং আমার একজন ডাক্তারকে দেখানো দরকার।',
    bengaliTransliteration: 'Aami ei shohore ekjon porjotok ebong amar ekjon daktar dekhano dorkar.',
  },
  {
    id: 'phrase-cons-2',
    category: 'consultation',
    english: 'Does anyone on your medical staff speak English, Hindi, or Bengali?',
    hindi: 'क्या आपके मेडिकल स्टाफ में कोई अंग्रेज़ी, हिन्दी या बंगाली बोलता है?',
    hindiTransliteration: 'Kya aapke medical staff mein koi Angrezi, Hindi ya Bengali bolta hai?',
    bengali: 'আপনার মেডিকেল কর্মীদের মধ্যে কেউ কি ইংরেজি, হিন্দি বা বাংলা বলেন?',
    bengaliTransliteration: 'Aapnar medical kormider modhye keu ki English, Hindi ba Bangla bolen?',
  },
  {
    id: 'phrase-cons-3',
    category: 'consultation',
    english: 'Can I book an appointment slot for today?',
    hindi: 'क्या मुझे आज के लिए अपॉइंटमेंट मिल सकता है?',
    hindiTransliteration: 'Kya mujhe aaj ke liye appointment mil sakta hai?',
    bengali: 'আমি কি আজকের জন্য একটি অ্যাপয়েন্টমেন্ট বুক করতে পারি?',
    bengaliTransliteration: 'Aami ki aajker jonno ekti appointment book korte pari?',
  },

  // Pricing & Transparency
  {
    id: 'phrase-price-1',
    category: 'pricing',
    english: 'What is the consultation fee for an outpatient visit?',
    hindi: 'ओपीडी परामर्श शुल्क कितना है?',
    hindiTransliteration: 'OPD paraamarsh shulk kitna hai?',
    bengali: 'আউটপেশেন্ট পরামর্শ ফি কত?',
    bengaliTransliteration: 'Outpatient poramorsho fee koto?',
  },
  {
    id: 'phrase-price-2',
    category: 'pricing',
    english: 'Will there be any additional charges for registration or tests?',
    hindi: 'क्या रजिस्ट्रेशन या टेस्ट के लिए कोई अतिरिक्त शुल्क लगेगा?',
    hindiTransliteration: 'Kya registration ya test ke liye koi atirikt shulk lagega?',
    bengali: 'রেজিস্ট্রেশন বা পরীক্ষার জন্য কি অতিরিক্ত কোনো খরচ হবে?',
    bengaliTransliteration: 'Registration ba porikkhar jonno ki otirikto kono khoroch hobe?',
  },
  {
    id: 'phrase-price-3',
    category: 'pricing',
    english: 'Can you provide an itemized official bill / receipt for travel insurance?',
    hindi: 'क्या आप यात्रा बीमा के लिए आधिकारिक रसीद दे सकते हैं?',
    hindiTransliteration: 'Kya aap yaatra beema ke liye aadhikaarik raseed de sakte hain?',
    bengali: 'আপনি কি ট্রাভেল ইনস্যুরেন্সের জন্য বিস্তারিত অফিশিয়াল রসিদ দিতে পারবেন?',
    bengaliTransliteration: 'Aapni ki travel insurance er jonno bistarito official roshid dite parben?',
  },

  // Pharmacy
  {
    id: 'phrase-pharm-1',
    category: 'pharmacy',
    english: 'Where is the nearest 24/7 operating pharmacy / chemist?',
    hindi: 'सबसे नज़दीकी 24 घंटे खुली रहने वाली दवा की दुकान कहाँ है?',
    hindiTransliteration: 'Sabse nazdeeki 24 ghante khuli rehne waali dawa ki dukaan kahan hai?',
    bengali: 'সবচেয়ে কাছের ২৪ ঘণ্টা খোলা ওষুধের দোকান কোথায়?',
    bengaliTransliteration: 'Shobcheye kacher 24 ghonta khola oushudher dokan kothay?',
  },
];

export class MultilingualService {
  constructor(private aiManager: AiProviderManager = defaultAiManager) {}

  /**
   * Detects the dominant language in the query
   */
  detectLanguage(text: string): SupportedLanguage {
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari script
    if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali script

    const lower = text.toLowerCase();
    if (lower.includes('chahiye') || lower.includes('kahan') || lower.includes('doctor ko')) {
      return 'hi';
    }
    if (lower.includes('dorkar') || lower.includes('kothay') || lower.includes('daktar')) {
      return 'bn';
    }

    return 'en';
  }

  /**
   * Get travel health phrases filtered by category and target language
   */
  getTravelPhrases(category = 'all'): TravelMedicalPhrase[] {
    if (category === 'all') return TRAVEL_PHRASES;
    return TRAVEL_PHRASES.filter((p) => p.category === category);
  }

  /**
   * Process a multilingual travel healthcare assistance request
   */
  async processAssistanceRequest(
    query: string,
    targetLanguage: SupportedLanguage = 'en'
  ): Promise<MultilingualAssistResponse> {
    const detectedLanguage = this.detectLanguage(query);

    // 1. Mandatory Safety Guardrail Evaluation
    const safety = SafetyGuardrailEngine.evaluate(query);

    // If acute emergency, immediately return emergency assistance
    if (safety.isEmergency) {
      return {
        originalQuery: query,
        detectedLanguage,
        safety,
        travelPhrases: this.getTravelPhrases('emergency'),
        suggestedActionText:
          'Medical emergency detected. Dial emergency services (112 or 102) immediately.',
      };
    }

    // 2. Extract structured search intent
    let extractedFilters: ValidatedAiSearchIntent | undefined;
    try {
      const result = await this.aiManager.generateStructured<ValidatedAiSearchIntent>({
        prompt: query,
        systemInstruction: `You are a healthcare discovery filter extractor for DocNearby.
Extract structured search parameters from the user's natural language healthcare request.
The request may be in English, Hindi, or Bengali.
Return JSON matching:
- "location": string or null (e.g. city or locality)
- "specialty": string or null (e.g. Dermatology, Pediatrics, Cardiology, Dentistry)
- "languages": array of strings (e.g. ["English", "Hindi", "Bengali"])
- "maxFeeMinor": integer or null (in paise, 1 INR = 100 paise; e.g. 1000 INR = 100000)
- "currency": "INR"
- "providerType": "doctor" | "clinic" | "hospital" | "diagnostic_center" | null

Strict rules:
- Do NOT prescribe medications, clinical advice, or diagnose.
- Only extract search parameters.`,
        schema: aiSearchIntentSchema,
        temperature: 0.1,
      });

      extractedFilters = result.data;
    } catch {
      // Non-blocking fallback
    }

    // 3. Assemble relevant travel phrases
    let relevantPhrases: TravelMedicalPhrase[] = [];
    if (safety.isClinicalAdviceBlocked) {
      relevantPhrases = this.getTravelPhrases('consultation');
    } else {
      relevantPhrases = this.getTravelPhrases('consultation').slice(0, 2);
    }

    return {
      originalQuery: query,
      detectedLanguage,
      safety,
      extractedFilters,
      travelPhrases: relevantPhrases,
      suggestedActionText: safety.isClinicalAdviceBlocked
        ? 'Clinical diagnosis blocked. You can search for verified doctors in the recommended specialty.'
        : 'Search filters extracted. You can discover verified providers and check consultation pricing.',
    };
  }
}

export const multilingualService = new MultilingualService();
