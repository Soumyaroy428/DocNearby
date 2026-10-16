import { Provider } from '@/shared/types/provider';

export const DEMO_PROVIDERS: Provider[] = [
  {
    id: 'demo-prov-001',
    displayName: 'Demo Dr. Ananya Mukherjee',
    providerType: 'doctor',
    specialties: ['Dermatology', 'Cosmetology'],
    languages: ['English', 'Bengali', 'Hindi'],
    qualifications: ['MBBS', 'MD (Dermatology)'],
    experienceYears: 12,
    registrationReference: 'WBMC-REG-2012-DEMO',
    verificationStatus: 'verified',
    verificationSummary: 'State Medical Council registration verified against official registry.',
    verificationDetail: {
      evidenceType: 'state_medical_council_registration',
      checkedBy: 'DocNearby Trust Operations',
      checkedAt: '2026-09-10T10:00:00Z',
      expiresAt: '2027-09-10T10:00:00Z',
      whatWasChecked: 'Registration active and in good standing on West Bengal Medical Council registry.'
    },
    facilities: [
      {
        id: 'demo-fac-001',
        name: 'Demo City Skin & Wellness Clinic',
        address: '14/B Park Street, 2nd Floor',
        locality: 'Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        location: {
          type: 'Point',
          coordinates: [88.3524, 22.5512]
        },
        publicPhone: '+91 33 2222 0001',
        hours: 'Mon-Sat: 10:00 AM - 6:00 PM',
        accessibilityAttributes: ['Wheelchair accessible entrance', 'Elevator access']
      }
    ],
    services: [
      {
        id: 'demo-srv-001',
        serviceName: 'General Dermatology Consultation',
        amountMinor: 80000,
        currency: 'INR',
        priceType: 'confirmed',
        sourceType: 'clinic_verified_fee_schedule',
        sourceReference: 'Official clinic tariff card verified on site',
        lastConfirmedAt: '2026-10-01T09:00:00Z',
        notes: 'Includes initial assessment and standard prescription.'
      },
      {
        id: 'demo-srv-002',
        serviceName: 'Follow-up Consultation (within 14 days)',
        amountMinor: 40000,
        currency: 'INR',
        priceType: 'confirmed',
        sourceType: 'clinic_verified_fee_schedule',
        lastConfirmedAt: '2026-10-01T09:00:00Z'
      }
    ],
    publicContact: {
      phone: '+91 33 2222 0001',
      email: 'demo.dermatology@example.com',
      website: 'https://demo-clinic.example.com'
    },
    isDemonstration: true,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-10-01T09:00:00Z'
  },
  {
    id: 'demo-prov-002',
    displayName: 'Demo Dr. Rajesh Sharma',
    providerType: 'doctor',
    specialties: ['General Medicine', 'Internal Medicine'],
    languages: ['English', 'Hindi'],
    qualifications: ['MBBS', 'DNB (General Medicine)'],
    experienceYears: 8,
    registrationReference: 'DMC-REG-2016-DEMO',
    verificationStatus: 'verified',
    verificationSummary: 'Medical council identity and registration verified.',
    verificationDetail: {
      evidenceType: 'medical_council_identity_check',
      checkedBy: 'DocNearby Trust Operations',
      checkedAt: '2026-08-15T12:00:00Z',
      whatWasChecked: 'Delhi Medical Council registry verification.'
    },
    facilities: [
      {
        id: 'demo-fac-002',
        name: 'Demo Central Care Polyclinic',
        address: '42 Sector 18, Block B',
        locality: 'Salt Lake',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        publicPhone: '+91 33 2222 0002',
        hours: 'Mon-Fri: 9:00 AM - 5:00 PM',
        accessibilityAttributes: ['Ground floor entrance']
      }
    ],
    services: [
      {
        id: 'demo-srv-003',
        serviceName: 'General Health Consultation',
        amountMinor: 60000,
        currency: 'INR',
        priceType: 'confirmed',
        sourceType: 'clinic_published_rate',
        lastConfirmedAt: '2026-09-20T10:00:00Z'
      }
    ],
    publicContact: {
      phone: '+91 33 2222 0002',
      email: 'demo.internalmed@example.com'
    },
    isDemonstration: true,
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-09-20T10:00:00Z'
  },
  {
    id: 'demo-prov-003',
    displayName: 'Demo Bengal Heart & Diagnostic Center',
    providerType: 'diagnostic_center',
    specialties: ['Cardiology', 'Diagnostics', 'Radiology'],
    languages: ['English', 'Bengali', 'Hindi'],
    verificationStatus: 'verification_pending',
    verificationSummary: 'Clinical establishment license submitted; under review by DocNearby Trust Operations.',
    facilities: [
      {
        id: 'demo-fac-003',
        name: 'Demo Bengal Heart & Diagnostic Center',
        address: '88 Rashbehari Avenue',
        locality: 'Gariahat',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        publicPhone: '+91 33 2222 0003',
        hours: '24 Hours Emergency & Day Diagnostics',
        accessibilityAttributes: ['Wheelchair accessible entrance', 'Ramp access', 'Accessible restrooms']
      }
    ],
    services: [
      {
        id: 'demo-srv-004',
        serviceName: 'Cardiology Specialist Consultation',
        amountMinor: 120000,
        currency: 'INR',
        priceType: 'starting_from',
        sourceType: 'facility_website_published',
        lastConfirmedAt: '2026-07-15T00:00:00Z',
        notes: 'Starting price for senior consultant; super-specialist consultations may vary.'
      },
      {
        id: 'demo-srv-005',
        serviceName: '12-Lead ECG Screening',
        amountMinor: 35000,
        currency: 'INR',
        priceType: 'confirmed',
        sourceType: 'reception_confirmed',
        lastConfirmedAt: '2026-09-12T00:00:00Z'
      }
    ],
    publicContact: {
      phone: '+91 33 2222 0003',
      email: 'demo.bengalheart@example.com',
      website: 'https://demo-bengalheart.example.com'
    },
    isDemonstration: true,
    createdAt: '2026-07-01T10:00:00Z',
    updatedAt: '2026-09-12T00:00:00Z'
  },
  {
    id: 'demo-prov-004',
    displayName: 'Demo Dr. Priyadarshini Roy',
    providerType: 'doctor',
    specialties: ['Pediatrics', 'Neonatology'],
    languages: ['English', 'Bengali'],
    qualifications: ['MBBS', 'DCH', 'MD (Pediatrics)'],
    experienceYears: 15,
    registrationReference: 'WBMC-REG-2009-DEMO',
    verificationStatus: 'verified',
    verificationSummary: 'State medical council registration and pediatric credentials verified.',
    verificationDetail: {
      evidenceType: 'state_council_and_degree_check',
      checkedBy: 'DocNearby Trust Operations',
      checkedAt: '2026-09-01T08:00:00Z',
      whatWasChecked: 'Verified registration and pediatric specialist qualification.'
    },
    facilities: [
      {
        id: 'demo-fac-004',
        name: 'Demo Little Smiles Children Clinic',
        address: '5B Ballygunge Circular Road',
        locality: 'Ballygunge',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        publicPhone: '+91 33 2222 0004',
        hours: 'Mon-Sat: 4:00 PM - 8:30 PM',
        accessibilityAttributes: ['Stroller accessible', 'Elevator access']
      }
    ],
    services: [
      {
        id: 'demo-srv-006',
        serviceName: 'Pediatric General Consultation',
        amountMinor: 90000,
        currency: 'INR',
        priceType: 'confirmed',
        sourceType: 'clinic_verified_fee_schedule',
        lastConfirmedAt: '2026-10-05T10:00:00Z'
      }
    ],
    publicContact: {
      phone: '+91 33 2222 0004',
      email: 'demo.pediatrics@example.com'
    },
    isDemonstration: true,
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-10-05T10:00:00Z'
  },
  {
    id: 'demo-prov-005',
    displayName: 'Demo New Delhi Dental Studio',
    providerType: 'clinic',
    specialties: ['Dentistry', 'Orthodontics'],
    languages: ['English', 'Hindi', 'Punjabi'],
    verificationStatus: 'unverified',
    verificationSummary: 'Listing submitted by public user; credentials not yet independently verified.',
    facilities: [
      {
        id: 'demo-fac-005',
        name: 'Demo New Delhi Dental Studio',
        address: '12 Connaught Circus',
        locality: 'Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        publicPhone: '+91 11 2333 0005',
        hours: 'Mon-Sat: 10:00 AM - 7:00 PM'
      }
    ],
    services: [
      {
        id: 'demo-srv-007',
        serviceName: 'Dental Checkup & Consultation',
        amountMinor: 50000,
        currency: 'INR',
        priceType: 'estimate',
        sourceType: 'patient_reported_community',
        lastConfirmedAt: '2026-06-10T00:00:00Z',
        notes: 'Estimated fee based on patient submission; confirm directly with clinic.'
      }
    ],
    publicContact: {
      phone: '+91 11 2333 0005',
      website: 'https://demo-delhidental.example.com'
    },
    isDemonstration: true,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-10T00:00:00Z'
  }
];
