/**
 * Privacy Minimization and PII Data Scrubber
 * Scrubs personally identifiable information (phone numbers, emails, card numbers,
 * identity numbers, personal names) from user queries before transmission to external AI models.
 */

export class PrivacyScrubber {
  /**
   * Scrub PII from input text
   */
  static scrub(text: string): { scrubbedText: string; hadPii: boolean } {
    let scrubbed = text;
    let hadPii = false;

    // 1. Email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    if (emailRegex.test(scrubbed)) {
      hadPii = true;
      scrubbed = scrubbed.replace(emailRegex, '[REDACTED_EMAIL]');
    }

    // 2. Credit / Debit card patterns (13-19 digits with spaces or hyphens) - scrub before phone to avoid chunk collisions
    const cardRegex = /\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{16}\b/g;
    if (cardRegex.test(scrubbed)) {
      hadPii = true;
      scrubbed = scrubbed.replace(cardRegex, '[REDACTED_CARD]');
    }

    // 3. National ID numbers (Aadhaar 12-digits, PAN 5-letter + 4-digit + 1-letter) - scrub before phone
    const aadhaarRegex = /\b\d{4}\s\d{4}\s\d{4}\b/g;
    if (aadhaarRegex.test(scrubbed)) {
      hadPii = true;
      scrubbed = scrubbed.replace(aadhaarRegex, '[REDACTED_ID]');
    }
    const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/g;
    if (panRegex.test(scrubbed)) {
      hadPii = true;
      scrubbed = scrubbed.replace(panRegex, '[REDACTED_ID]');
    }

    // 4. Phone numbers (Indian, international, standard 10-12 digits with optional + and spaces)
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:(?:\d{5}[-.\s]?\d{5})|(?:\(?\d{2,5}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4})|\d{10,12})\b/g;
    if (phoneRegex.test(scrubbed)) {
      hadPii = true;
      scrubbed = scrubbed.replace(phoneRegex, '[REDACTED_PHONE]');
    }

    // 5. Explicit self-introductions ("My name is John Doe", "I am Alice Smith")
    const nameIntroRegex = /\b(my name is|i am|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/gi;
    if (nameIntroRegex.test(scrubbed)) {
      hadPii = true;
      scrubbed = scrubbed.replace(nameIntroRegex, '$1 [REDACTED_NAME]');
    }

    return {
      scrubbedText: scrubbed,
      hadPii,
    };
  }
}
