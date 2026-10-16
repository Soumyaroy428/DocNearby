/**
 * Local Deterministic Multilingual Heuristic AI Adapter
 * Parses English, Hindi (Devanagari + Romanized), and Bengali (Bengali script + Romanized)
 * queries into validated structured search filters without any external network dependency.
 */

import {
  IAiLanguageModelAdapter,
  AiGenerateOptions,
  AiGenerateResult,
} from './ai-adapter.interface';
import { ValidatedAiSearchIntent } from '@/server/validation/ai-multilingual';

export class HeuristicAiAdapter implements IAiLanguageModelAdapter {
  readonly name = 'heuristic';

  isConfigured(): boolean {
    return true; // Always operational offline
  }

  async generateStructured<T>(options: AiGenerateOptions<T>): Promise<AiGenerateResult<T>> {
    const startTime = Date.now();
    const prompt = options.prompt.toLowerCase();

    // 1. Detect location (English, Hindi, Bengali)
    let location: string | null = null;
    const cityMap: Record<string, string> = {
      kolkata: 'Kolkata',
      कलकत्ता: 'Kolkata',
      कोलकाता: 'Kolkata',
      কলকাতা: 'Kolkata',
      calcutta: 'Kolkata',
      'salt lake': 'Salt Lake',
      'সল্টলেক': 'Salt Lake',
      delhi: 'New Delhi',
      'new delhi': 'New Delhi',
      दिल्ली: 'New Delhi',
      দিল্লি: 'New Delhi',
      mumbai: 'Mumbai',
      बंबई: 'Mumbai',
      মুম্বই: 'Mumbai',
      bangalore: 'Bengaluru',
      bengaluru: 'Bengaluru',
      बेंगलुरु: 'Bengaluru',
      বেঙ্গালুরু: 'Bengaluru',
      chennai: 'Chennai',
      चेन्नई: 'Chennai',
      চেন্নাই: 'Chennai',
      hyderabad: 'Hyderabad',
      हैदराबाद: 'Hyderabad',
      হায়দরাবাদ: 'Hyderabad',
    };

    for (const [key, value] of Object.entries(cityMap)) {
      if (prompt.includes(key)) {
        location = value;
        break;
      }
    }

    // 2. Detect specialty across English, Hindi, Bengali
    let specialty: string | null = null;
    const specialtyMap: Record<string, string> = {
      // Dermatology
      dermatol: 'Dermatology',
      skin: 'Dermatology',
      त्वचा: 'Dermatology',
      चमड़ी: 'Dermatology',
      চর্ম: 'Dermatology',
      ত্বক: 'Dermatology',

      // Pediatrics
      pediatric: 'Pediatrics',
      paediatric: 'Pediatrics',
      child: 'Pediatrics',
      बच्चे: 'Pediatrics',
      शिशु: 'Pediatrics',
      বাচ্চা: 'Pediatrics',
      শিশু: 'Pediatrics',

      // Cardiology
      cardiolog: 'Cardiology',
      heart: 'Cardiology',
      हृदय: 'Cardiology',
      दिल: 'Cardiology',
      হৃদরোগ: 'Cardiology',
      হার্ট: 'Cardiology',

      // Dentistry
      dental: 'Dentistry',
      dentist: 'Dentistry',
      दांत: 'Dentistry',
      দাঁত: 'Dentistry',

      // Orthopedics
      orthoped: 'Orthopedics',
      bone: 'Orthopedics',
      joint: 'Orthopedics',
      हड्डी: 'Orthopedics',
      হাড়: 'Orthopedics',

      // Ophthalmology
      eye: 'Ophthalmology',
      ophthalmolog: 'Ophthalmology',
      आंख: 'Ophthalmology',
      চোখ: 'Ophthalmology',

      // ENT
      ent: 'ENT (Otolaryngology)',
      'ear nose throat': 'ENT (Otolaryngology)',
      'কান নাক গলা': 'ENT (Otolaryngology)',

      // General Medicine
      'general medicine': 'General Medicine',
      physician: 'General Medicine',
      'general physician': 'General Medicine',
      डॉक्टर: 'General Medicine',
      চিকিৎসক: 'General Medicine',
    };

    for (const [key, value] of Object.entries(specialtyMap)) {
      if (prompt.includes(key)) {
        specialty = value;
        break;
      }
    }

    // 3. Detect languages mentioned or implied
    const languages: string[] = [];
    if (prompt.includes('english') || prompt.includes('अंग्रेज़ी') || prompt.includes('ইংরেজি')) {
      languages.push('English');
    }
    if (prompt.includes('hindi') || prompt.includes('हिन्दी') || prompt.includes('हिंदी')) {
      languages.push('Hindi');
    }
    if (prompt.includes('bengali') || prompt.includes('bangla') || prompt.includes('বাংলা') || prompt.includes('बंगाली')) {
      languages.push('Bengali');
    }

    // Default language based on query script if not explicitly named
    if (languages.length === 0) {
      if (/[\u0900-\u097F]/.test(prompt)) {
        languages.push('Hindi');
      } else if (/[\u0980-\u09FF]/.test(prompt)) {
        languages.push('Bengali');
      }
    }

    // 4. Max fee parsing (Indic numerals, English numerals, prefix and suffix patterns)
    let maxFeeMinor: number | null = null;
    const normalizedPrompt = prompt
      .replace(/[\u0966-\u096F]/g, (d) => String(d.charCodeAt(0) - 0x0966))
      .replace(/[\u09E6-\u09EF]/g, (d) => String(d.charCodeAt(0) - 0x09E6));

    // Prefix pattern: "under ₹1000", "below 500", "₹1,000", "less than 800"
    let feeMatch = normalizedPrompt.match(
      /(?:under|below|less than|max|within|कम|₹|rs\.?|inr)\s*([0-9,]+)/i
    );

    // Suffix pattern: "1000 रुपये के अंदर", "500 টাকার মধ্যে", "800 rs max", "1000 रुपये", "500 টাকা"
    if (!feeMatch) {
      feeMatch = normalizedPrompt.match(
        /([0-9,]+)\s*(?:रुपये|টাকা|rupees?|rs\.?|inr|₹)\s*(?:के\s*अंदर|के\s*नीचे|মধ্যে|under|below|less|max)?/i
      );
    }

    // Direct suffix bounds: "1000 के अंदर", "500 মধ্যে"
    if (!feeMatch) {
      feeMatch = normalizedPrompt.match(
        /([0-9,]+)\s*(?:के\s*अंदर|के\s*नीचे|মধ্যে)/i
      );
    }

    if (feeMatch && feeMatch[1]) {
      const rawNum = parseInt(feeMatch[1].replace(/,/g, ''), 10);
      if (!isNaN(rawNum) && rawNum > 0 && rawNum <= 100000) {
        maxFeeMinor = rawNum * 100;
      }
    }

    // 5. Provider type detection
    let providerType: ValidatedAiSearchIntent['providerType'] = null;
    if (prompt.includes('hospital') || prompt.includes('अस्पताल') || prompt.includes('হাসপাতাল')) {
      providerType = 'hospital';
    } else if (prompt.includes('clinic') || prompt.includes('क्लिनिक') || prompt.includes('ক্লিনিক')) {
      providerType = 'clinic';
    } else if (prompt.includes('diagnostic') || prompt.includes('lab') || prompt.includes('परीक्षण')) {
      providerType = 'diagnostic_center';
    } else if (prompt.includes('doctor') || prompt.includes('dr')) {
      providerType = 'doctor';
    }

    const intent: ValidatedAiSearchIntent = {
      location,
      specialty,
      languages,
      maxFeeMinor,
      currency: 'INR',
      providerType,
    };

    let validatedData = intent as unknown as T;
    if (options.schema) {
      validatedData = options.schema.parse(intent);
    }

    const latencyMs = Date.now() - startTime;
    return {
      data: validatedData,
      rawText: JSON.stringify(intent),
      provider: this.name,
      latencyMs,
    };
  }
}
