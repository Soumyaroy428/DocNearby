'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '@/shared/types/multilingual';

export interface Translations {
  nav: {
    findCare: string;
    mapDiscovery: string;
    listPractice: string;
    verifications: string;
    priceReports: string;
    phrasebook: string;
    signIn: string;
    register: string;
    appointments: string;
    myAccount: string;
    emergencyWarning: string;
    emergencyCall: string;
    newBadge: string;
  };
  hero: {
    badge: string;
    titlePart1: string;
    titlePart2: string;
    subtitle: string;
  };
  mapsBanner: {
    title: string;
    subtitle: string;
    button: string;
    newBadge: string;
  };
  aiSearch: {
    title: string;
    subtitle: string;
    badge: string;
    privacyScrubbed: string;
    placeholder: string;
    searchBtn: string;
    processing: string;
    clear: string;
    tryAsking: string;
  };
  filters: {
    title: string;
    resetAll: string;
    city: string;
    cityPlaceholder: string;
    specialty: string;
    allSpecialties: string;
    language: string;
    anyLanguage: string;
    maxFee: string;
    anyFee: string;
    nearMe: string;
    gpsActive: string;
    locating: string;
    facilityAll: string;
    facilityDoctors: string;
    facilityClinics: string;
    facilityDiagnostics: string;
    sort: string;
    sortRelevance: string;
    sortDistance: string;
    sortFeeAsc: string;
    sortFeeDesc: string;
    radius: string;
  };
  discovery: {
    title: string;
    subtitle: string;
    allSources: string;
    docnearbyOnly: string;
    googlePlacesOnly: string;
    splitView: string;
    cardsView: string;
    mapView: string;
    resetFilters: string;
    noResultsTitle: string;
    noResultsDesc: string;
    bookAppointment: string;
    directions: string;
    verifiedBadge: string;
    unverifiedBadge: string;
    feeLabel: string;
    feeUnverified: string;
    reviewsCount: string;
    viewDetails: string;
    openNow: string;
    closed: string;
    call: string;
    web: string;
    bookSlot: string;
    profile: string;
    compare: string;
    comparing: string;
    spoken: string;
    demoListing: string;
    providersTitle: string;
    resultsLabel: string;
    refresh: string;
    retry: string;
    directBookingUnavailable: string;
    registeredDocNearby: string;
    googleListed: string;
  };
  footer: {
    safetyTitle: string;
    safetyP1: string;
    safetyP2: string;
    emergencyNotice: string;
    discoveryHeader: string;
    providersHeader: string;
    complianceHeader: string;
    supportHeader: string;
    searchProviders: string;
    mapDiscovery: string;
    joinDirectory: string;
    providerPortal: string;
    privacyPolicy: string;
    termsOfService: string;
    grievanceRedressal: string;
    contactSupport: string;
    evidenceVerified: string;
    pilotBadge: string;
  };
  providerDetail: {
    backToSearch: string;
    requestAppointment: string;
    contactInquiries: string;
    languagesSpoken: string;
    verificationEvidence: string;
    verificationAudit: string;
    verificationStatus: string;
    whatWasChecked: string;
    regRef: string;
    verifiedBy: string;
    verificationDate: string;
    facilityMap: string;
    consultationFees: string;
  };
}

const TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: {
    nav: {
      findCare: 'Find Care',
      mapDiscovery: 'Map Discovery',
      listPractice: 'List Practice',
      verifications: 'Verifications',
      priceReports: 'Price Reports',
      phrasebook: 'Phrasebook',
      signIn: 'Sign In',
      register: 'Register',
      appointments: 'Appointments',
      myAccount: 'My Account',
      emergencyWarning: 'Medical Emergency? If you require urgent medical care, immediately dial local emergency services: 112 / 102 (India). DocNearby is for discovery only.',
      emergencyCall: 'Call 112',
      newBadge: 'New',
    },
    hero: {
      badge: 'Evidence-Based Healthcare Discovery for Travelers',
      titlePart1: 'Find Trusted Healthcare,',
      titlePart2: 'Wherever You Are',
      subtitle: 'Search local doctors, clinics, and diagnostic facilities with transparent consultation pricing, language compatibility, and verified regulatory registrations in unfamiliar cities.',
    },
    mapsBanner: {
      title: 'Interactive Google Maps & Healthcare Places Discovery',
      subtitle: 'Explore publicly listed clinics & hospitals on Google Maps combined with DocNearby-verified doctors and transparent fees.',
      button: 'Open Map Discovery',
      newBadge: 'New',
    },
    aiSearch: {
      title: 'Natural Language Healthcare Assistant',
      subtitle: 'Type naturally in English, हिन्दी, or বাংলা. Converts to validated search filters only.',
      badge: 'Multilingual (EN • HI • BN)',
      privacyScrubbed: 'Privacy Scrubbed',
      placeholder: 'e.g. Find an English-speaking dermatologist in Kolkata under ₹1,000 / কলকাতা বা দিল্লিতে ডাক্তার',
      searchBtn: 'Search',
      processing: 'Processing...',
      clear: 'Clear',
      tryAsking: 'Try asking in any language:',
    },
    filters: {
      title: 'Filter Healthcare Providers',
      resetAll: 'Reset all',
      city: 'City or Locality',
      cityPlaceholder: 'e.g. Kolkata, Salt Lake',
      specialty: 'Specialty',
      allSpecialties: 'All Specialties',
      language: 'Language Spoken',
      anyLanguage: 'Any Language',
      maxFee: 'Max Consultation Fee',
      anyFee: 'Any Fee',
      nearMe: 'Near Me',
      gpsActive: 'GPS Active',
      locating: 'Locating...',
      facilityAll: 'All',
      facilityDoctors: 'Doctors',
      facilityClinics: 'Clinics',
      facilityDiagnostics: 'Diagnostics',
      sort: 'Sort',
      sortRelevance: 'Relevance',
      sortDistance: 'Distance (Nearest First)',
      sortFeeAsc: 'Consultation Fee: Low to High',
      sortFeeDesc: 'Consultation Fee: High to Low',
      radius: 'Radius',
    },
    discovery: {
      title: 'Healthcare Discovery Map',
      subtitle: 'Dual-source discovery combining Google Places with DocNearby verified doctors.',
      allSources: 'All Sources',
      docnearbyOnly: 'DocNearby',
      googlePlacesOnly: 'Google Places',
      splitView: 'Split',
      cardsView: 'Cards',
      mapView: 'Map',
      resetFilters: 'Reset Search Filters',
      noResultsTitle: 'No healthcare locations found',
      noResultsDesc: 'No matching clinics, doctors, or hospitals were found within your current radius. Try increasing your radius or clearing filters.',
      bookAppointment: 'Book Appointment',
      directions: 'Directions',
      verifiedBadge: 'Registration verified',
      unverifiedBadge: 'Not verified by DocNearby',
      feeLabel: 'Consultation Fee',
      feeUnverified: 'Fee not verified by DocNearby',
      reviewsCount: 'reviews',
      viewDetails: 'View Details',
      openNow: 'Open Now',
      closed: 'Closed',
      call: 'Call',
      web: 'Web',
      bookSlot: 'Book Slot',
      profile: 'Profile',
      compare: 'Compare',
      comparing: 'Comparing',
      spoken: 'Spoken:',
      demoListing: 'Demo Listing',
      providersTitle: 'Healthcare Providers',
      resultsLabel: 'results',
      refresh: 'Refresh',
      retry: 'Retry Search',
      directBookingUnavailable: 'Direct booking unavailable',
      registeredDocNearby: 'Registered on DocNearby',
      googleListed: 'Google-listed',
    },
    footer: {
      safetyTitle: 'Healthcare Safety & Informational Notice',
      safetyP1: 'DocNearby is an independent discovery and navigation platform designed to help travelers locate local medical facilities, consult fee benchmarks, and review regulatory registration status.',
      safetyP2: 'DocNearby does NOT provide medical diagnosis, treatment advice, or prescriptions. Regulatory verification confirms credential existence on official registers; it does not certify clinical superiority or guarantee medical outcomes. Consultation fees reflect recorded rates and do not guarantee total cost of treatment.',
      emergencyNotice: 'Medical Emergency in India? Dial 112 or 102 immediately.',
      discoveryHeader: 'Discovery',
      providersHeader: 'For Providers',
      complianceHeader: 'Compliance & Trust',
      supportHeader: 'Support',
      searchProviders: 'Search Providers',
      mapDiscovery: 'Map Discovery',
      joinDirectory: 'Join Directory',
      providerPortal: 'Provider Portal',
      privacyPolicy: 'Privacy Policy (DPDP)',
      termsOfService: 'Terms of Service',
      grievanceRedressal: 'Grievance Redressal',
      contactSupport: 'Contact Support',
      evidenceVerified: 'Evidence-based verification',
      pilotBadge: 'Pilot: Kolkata, India',
    },
    providerDetail: {
      backToSearch: 'Back to Search Results',
      requestAppointment: 'Request Appointment',
      contactInquiries: 'Contact & Inquiries',
      languagesSpoken: 'Languages Spoken:',
      verificationEvidence: 'Verification & Credentials Evidence',
      verificationAudit: 'Evidence-based audit of statutory registration',
      verificationStatus: 'Verification Status:',
      whatWasChecked: 'What was checked:',
      regRef: 'Regulatory Registration Ref:',
      verifiedBy: 'Verified By:',
      verificationDate: 'Verification Date:',
      facilityMap: 'Facility Location, Map & Directions',
      consultationFees: 'Published Consultation Fees',
    },
  },
  hi: {
    nav: {
      findCare: 'इलाज खोजें',
      mapDiscovery: 'मानचित्र खोज',
      listPractice: 'क्लिनिक जोड़ें',
      verifications: 'सत्यापन',
      priceReports: 'मूल्य रिपोर्ट',
      phrasebook: 'वाक्यांश पुस्तिका',
      signIn: 'साइन इन',
      register: 'रजिस्टर करें',
      appointments: 'मेरी अपॉइंटमेंट',
      myAccount: 'मेरा खाता',
      emergencyWarning: 'आपातकालीन चिकित्सा? तत्काल स्थानीय आपातकालीन सेवाओं को डायल करें: 112 / 102 (भारत)। DocNearby केवल खोज के लिए है।',
      emergencyCall: '112 पर कॉल करें',
      newBadge: 'नया',
    },
    hero: {
      badge: 'यात्रियों के लिए साक्ष्य-आधारित स्वास्थ्य सेवा खोज',
      titlePart1: 'विश्वसनीय स्वास्थ्य सेवा पाएं,',
      titlePart2: 'आप जहां भी हों',
      subtitle: 'अपिरचित शहरों में पारदर्शी परामर्श शुल्क, भाषा अनुकूलता और सत्यापित पंजीकरण के साथ स्थानीय डॉक्टरों, क्लीनिकों और अस्पतालों को खोजें।',
    },
    mapsBanner: {
      title: 'गूगल मैप्स और स्वास्थ्य सेवा केंद्र खोज',
      subtitle: 'गूगल मैप्स पर सार्वजनिक रूप से सूचीबद्ध क्लीनिकों और अस्पतालों के साथ DocNearby सत्यापित डॉक्टरों और पारदर्शी शुल्कों को देखें।',
      button: 'मानचित्र खोज खोलें',
      newBadge: 'नया',
    },
    aiSearch: {
      title: 'प्राकृतिक भाषा स्वास्थ्य सेवा सहायक',
      subtitle: 'अंग्रेज़ी, हिन्दी या বাংলা में स्वाभाविक रूप से लिखें। केवल सत्यापित खोज फ़िल्टर में परिवर्तित होता है।',
      badge: 'बहुभाषी (EN • HI • BN)',
      privacyScrubbed: 'गोपनीयता सुरक्षित',
      placeholder: 'उदा. कोलकाता में ₹1,000 के अंदर त्वचा विशेषज्ञ डॉक्टर खोजें',
      searchBtn: 'खोजें',
      processing: 'प्रक्रिया जारी...',
      clear: 'साफ़ करें',
      tryAsking: 'किसी भी भाषा में पूछें:',
    },
    filters: {
      title: 'स्वास्थ्य सेवा प्रदाता फ़िल्टर करें',
      resetAll: 'सभी रीसेट करें',
      city: 'शहर या इलाका',
      cityPlaceholder: 'उदा. कोलकाता, साल्ट लेक',
      specialty: 'विशेषज्ञता',
      allSpecialties: 'सभी विशेषज्ञताएं',
      language: 'बोली जाने वाली भाषा',
      anyLanguage: 'कोई भी भाषा',
      maxFee: 'अधिकतम परामर्श शुल्क',
      anyFee: 'कोई भी शुल्क',
      nearMe: 'मेरे पास',
      gpsActive: 'जीपीएस सक्रिय',
      locating: 'स्थान खोज रहे हैं...',
      facilityAll: 'सभी',
      facilityDoctors: 'डॉक्टर',
      facilityClinics: 'क्लीनिक',
      facilityDiagnostics: 'जांच केंद्र',
      sort: 'क्रमबद्ध',
      sortRelevance: 'प्रासंगिकता',
      sortDistance: 'दूरी (निकटतम पहले)',
      sortFeeAsc: 'परामर्श शुल्क: कम से अधिक',
      sortFeeDesc: 'परामर्श शुल्क: अधिक से कम',
      radius: 'त्रिज्या (दूरी)',
    },
    discovery: {
      title: 'स्वास्थ्य सेवा मानचित्र खोज',
      subtitle: 'गूगल मैप्स और DocNearby सत्यापित डॉक्टरों का संयुक्त खोज अनुभव।',
      allSources: 'सभी स्रोत',
      docnearbyOnly: 'DocNearby सत्यापित',
      googlePlacesOnly: 'गूगल मैप्स',
      splitView: 'विभाजित दृश्य',
      cardsView: 'कार्ड सूची',
      mapView: 'मानचित्र',
      resetFilters: 'फ़िल्टर रीसेट करें',
      noResultsTitle: 'कोई स्वास्थ्य सेवा केंद्र नहीं मिला',
      noResultsDesc: 'आपकी वर्तमान दूरी या फ़िल्टर के भीतर कोई क्लीनिक या डॉक्टर नहीं मिले। कृपया खोज का दायरा बढ़ाएं।',
      bookAppointment: 'अपॉइंटमेंट बुक करें',
      directions: 'दिशा-निर्देश',
      verifiedBadge: 'पंजीकरण सत्यापित',
      unverifiedBadge: 'DocNearby द्वारा सत्यापित नहीं',
      feeLabel: 'परामर्श शुल्क',
      feeUnverified: 'शुल्क DocNearby द्वारा सत्यापित नहीं',
      reviewsCount: 'समीक्षाएं',
      viewDetails: 'विवरण देखें',
      openNow: 'अभी खुला है',
      closed: 'बंद है',
      call: 'कॉल करें',
      web: 'वेबसाइट',
      bookSlot: 'स्लॉट बुक करें',
      profile: 'प्रोफ़ाइल',
      compare: 'तुलना करें',
      comparing: 'तुलना जारी',
      spoken: 'बोली जाने वाली भाषाएं:',
      demoListing: 'डेमो लिस्टिंग',
      providersTitle: 'स्वास्थ्य सेवा प्रदाता',
      resultsLabel: 'परिणाम',
      refresh: 'रीफ्रेश',
      retry: 'पुनः प्रयास करें',
      directBookingUnavailable: 'सीधी बुकिंग अनुपलब्ध',
      registeredDocNearby: 'DocNearby पर पंजीकृत',
      googleListed: 'गूगल मैप्स लिस्टिंग',
    },
    footer: {
      safetyTitle: 'स्वास्थ्य सेवा सुरक्षा और सूचनात्मक सूचना',
      safetyP1: 'DocNearby एक स्वतंत्र खोज और नेविगेशन प्लेटफ़ॉर्म है जो यात्रियों को स्थानीय चिकित्सा सुविधाओं, परामर्श शुल्क और नियामक पंजीकरण की समीक्षा करने में सहायता करता है।',
      safetyP2: 'DocNearby चिकित्सा निदान, उपचार सलाह या नुस्खे प्रदान नहीं करता है। नियामक सत्यापन आधिकारिक रजिस्टरों पर प्रमाण पत्र की पुष्टि करता है। परामर्श शुल्क दर्ज दरों को दर्शाते हैं।',
      emergencyNotice: 'भारत में आपातकालीन चिकित्सा? तुरंत 112 या 102 डायल करें।',
      discoveryHeader: 'खोजें',
      providersHeader: 'प्रदाताओं के लिए',
      complianceHeader: 'अनुपालन एवं विश्वास',
      supportHeader: 'सहायता',
      searchProviders: 'डॉक्टर खोजें',
      mapDiscovery: 'मानचित्र खोज',
      joinDirectory: 'डायरेक्टरी से जुड़ें',
      providerPortal: 'प्रदाता पोर्टल',
      privacyPolicy: 'गोपनीयता नीति (DPDP)',
      termsOfService: 'सेवा की शर्तें',
      grievanceRedressal: 'शिकायत निवारण',
      contactSupport: 'सहायता संपर्क',
      evidenceVerified: 'साक्ष्य-आधारित सत्यापन',
      pilotBadge: 'पायलट: कोलकाता, भारत',
    },
    providerDetail: {
      backToSearch: 'खोज परिणामों पर वापस जाएं',
      requestAppointment: 'अपॉइंटमेंट का अनुरोध करें',
      contactInquiries: 'संपर्क एवं पूछताछ',
      languagesSpoken: 'बोली जाने वाली भाषाएं:',
      verificationEvidence: 'सत्यापन एवं साख प्रमाण',
      verificationAudit: 'वैधानिक पंजीकरण का साक्ष्य-आधारित ऑडिट',
      verificationStatus: 'सत्यापन स्थिति:',
      whatWasChecked: 'क्या जांचा गया:',
      regRef: 'नियामक पंजीकरण संदर्भ:',
      verifiedBy: 'सत्यापनकर्ता:',
      verificationDate: 'सत्यापन तिथि:',
      facilityMap: 'सुविधा स्थल, मानचित्र एवं दिशा-निर्देश',
      consultationFees: 'प्रकाशित परामर्श शुल्क',
    },
  },
  bn: {
    nav: {
      findCare: 'চিকিৎসা খুঁজুন',
      mapDiscovery: 'ম্যাপ ডিসকভারি',
      listPractice: 'চেম্বার যুক্ত করুন',
      verifications: 'যাচাইকরণ',
      priceReports: 'ফি রিপোর্ট',
      phrasebook: 'মেডিকেল বাক্যাংশ',
      signIn: 'সাইন ইন',
      register: 'নিবন্ধন করুন',
      appointments: 'অ্যাপয়েন্টমেন্ট',
      myAccount: 'আমার অ্যাকাউন্ট',
      emergencyWarning: 'জরুরি চিকিৎসা? অবিলম্বে স্থানীয় জরুরি পরিষেবাগুলিতে ডায়াল করুন: 112 / 102 (ভারত)। DocNearby শুধুমাত্র তথ্যের জন্য।',
      emergencyCall: '112 ডায়াল করুন',
      newBadge: 'নতুন',
    },
    hero: {
      badge: 'পর্যটকদের জন্য প্রমাণ-ভিত্তিক স্বাস্থ্যসেবা অনুসন্ধান',
      titlePart1: 'নির্ভরযোগ্য স্বাস্থ্যসেবা খুঁজুন,',
      titlePart2: 'আপনি যেখানেই থাকুন',
      subtitle: 'অপরিচিত শহরে স্বচ্ছ পরামর্শ ফি, ভাষার সুবিধা এবং যাচাইকৃত মেডিকেল রেজিস্ট্রেশন সহ স্থানীয় ডাক্তার, ক্লিনিক এবং হাসপাতাল অনুসন্ধান করুন।',
    },
    mapsBanner: {
      title: 'গুগল ম্যাপস ও স্বাস্থ্যসেবা কেন্দ্র অনুসন্ধান',
      subtitle: 'গুগল ম্যাপসের সর্বজনীন ক্লিনিক ও হাসপাতালের সাথে DocNearby যাচাইকৃত ডাক্তার এবং স্বচ্ছ ভিজিট ফি একসাথে দেখুন।',
      button: 'ম্যাপ অনুসন্ধান খুলুন',
      newBadge: 'নতুন',
    },
    aiSearch: {
      title: 'প্রাকৃতিক ভাষা স্বাস্থ্যসেবা সহায়ক',
      subtitle: 'ইংরেজি, हिन्दी বা বাংলা ভাষায় স্বাভাবিকভাবে লিখুন। কেবল যাচাইকৃত সার্চ ফিল্টারে রূপান্তরিত হয়।',
      badge: 'বহুভাষিক (EN • HI • BN)',
      privacyScrubbed: 'ব্যক্তিগত তথ্য সুরক্ষিত',
      placeholder: 'যেমন: কলকাতায় শিশুর ডাক্তার ইংরেজি ও বাংলা বলেন এবং ভিজিট ₹১,০০০ এর নিচে',
      searchBtn: 'অনুসন্ধান',
      processing: 'প্রক্রিয়াকরণ চলছে...',
      clear: 'মুছুন',
      tryAsking: 'যেকোনো ভাষায় অনুসন্ধান করুন:',
    },
    filters: {
      title: 'স্বাস্থ্যসেবা প্রদানকারী ফিল্টার করুন',
      resetAll: 'সব রিসেট করুন',
      city: 'শহর বা এলাকা',
      cityPlaceholder: 'যেমন: কলকাতা, সল্টলেক',
      specialty: 'বিশেষজ্ঞতা',
      allSpecialties: 'সকল বিশেষজ্ঞতা',
      language: 'কথোপকথনের ভাষা',
      anyLanguage: 'যেকোনো ভাষা',
      maxFee: 'সর্বোচ্চ পরামর্শ ফি',
      anyFee: 'যেকোনো ফি',
      nearMe: 'আমার কাছাকাছি',
      gpsActive: 'জিপিএস সক্রিয়',
      locating: 'অবস্থান খুঁজছি...',
      facilityAll: 'সকল',
      facilityDoctors: 'ডাক্তার',
      facilityClinics: 'ক্লিনিক',
      facilityDiagnostics: 'ডায়াগনস্টিক',
      sort: 'সাজান',
      sortRelevance: 'প্রাসঙ্গিকতা',
      sortDistance: 'দূরত্ব (নিকটবর্তী আগে)',
      sortFeeAsc: 'পরামর্শ ফি: কম থেকে বেশি',
      sortFeeDesc: 'পরামর্শ ফি: বেশি থেকে কম',
      radius: 'দূরত্ব ব্যাসার্ধ',
    },
    discovery: {
      title: 'স্বাস্থ্যসেবা ম্যাপ ডিসকভারি',
      subtitle: 'গুগল ম্যাপস এবং DocNearby যাচাইকৃত ডাক্তারদের যৌথ অনুসন্ধান ব্যবস্থা।',
      allSources: 'সকল উৎস',
      docnearbyOnly: 'DocNearby যাচাইকৃত',
      googlePlacesOnly: 'গুগল ম্যাপস',
      splitView: 'বিভক্ত ভিউ',
      cardsView: 'কার্ড তালিকা',
      mapView: 'ম্যাপ',
      resetFilters: 'ফিল্টার রিসেট করুন',
      noResultsTitle: 'কোনো স্বাস্থ্যসেবা কেন্দ্র পাওয়া যায়নি',
      noResultsDesc: 'আপনার বর্তমান ব্যাসার্ধের মধ্যে কোনো ডাক্তার বা ক্লিনিক পাওয়া যায়নি। অনুগ্রহ করে অনুসন্ধানের দূরত্ব বাড়ান।',
      bookAppointment: 'অ্যাপয়েন্টমেন্ট নিন',
      directions: 'দিকনির্দেশ',
      verifiedBadge: 'রেজিস্ট্রেশন যাচাইকৃত',
      unverifiedBadge: 'DocNearby দ্বারা যাচাই করা হয়নি',
      feeLabel: 'পরামর্শ ফি',
      feeUnverified: 'ফি DocNearby দ্বারা যাচাই করা হয়নি',
      reviewsCount: 'টি রিভিউ',
      viewDetails: 'বিস্তারিত দেখুন',
      openNow: 'এখন খোলা আছে',
      closed: 'এখন বন্ধ',
      call: 'কল করুন',
      web: 'ওয়েবসাইট',
      bookSlot: 'স্লট বুক করুন',
      profile: 'প্রোফাইল',
      compare: 'তুলনা করুন',
      comparing: 'তুলনা হচ্ছে',
      spoken: 'কথোপকথনের ভাষা:',
      demoListing: 'ডেমো তালিকা',
      providersTitle: 'স্বাস্থ্যসেবা প্রদানকারীগণ',
      resultsLabel: 'টি ফলাফল',
      refresh: 'রিফ্রেশ',
      retry: 'আবার চেষ্টা করুন',
      directBookingUnavailable: 'সরাসরি বুকিং অনুপলব্ধ',
      registeredDocNearby: 'DocNearby-এ নিবন্ধিত',
      googleListed: 'গুগল তালিকায় অন্তর্ভুক্ত',
    },
    footer: {
      safetyTitle: 'স্বাস্থ্যসেবা সুরক্ষা এবং তথ্যের বিজ্ঞপ্তি',
      safetyP1: 'DocNearby একটি স্বাধীন অনুসন্ধান ও দিকনির্দেশনা প্ল্যাটফর্ম যা পর্যটকদের স্থানীয় চিকিৎসা কেন্দ্র খুঁজে পেতে, ফি যাচাই করতে এবং রেজিস্ট্রেশন পর্যালোচনা করতে সাহায্য করে।',
      safetyP2: 'DocNearby কোনো চিকিৎসা পরামর্শ, প্রেসক্রিপশন বা রোগ নির্ণয় প্রদান করে না। রেজিস্ট্রেশন যাচাই শুধুমাত্র সরকারি রেকর্ডের অস্তিত্ব নিশ্চিত করে। পরামর্শ ফি তালিকাভুক্ত রেট নির্দেশ করে।',
      emergencyNotice: 'ভারতে জরুরি চিকিৎসা সহায়তা? অবিলম্বে 112 বা 102 নম্বরে কল করুন।',
      discoveryHeader: 'অনুসন্ধান',
      providersHeader: 'চিকিৎসকদের জন্য',
      complianceHeader: 'আইনি সুরক্ষা ও বিশ্বাস',
      supportHeader: 'সহায়তা',
      searchProviders: 'ডাক্তার খুঁজুন',
      mapDiscovery: 'ম্যাপ ডিসকভারি',
      joinDirectory: 'ডাক্তার হিসেবে যুক্ত হন',
      providerPortal: 'ডাক্তার পোর্টাল',
      privacyPolicy: 'গোপনীয়তা নীতি (DPDP)',
      termsOfService: 'ব্যবহারের নিয়মাবলী',
      grievanceRedressal: 'অভিযোগ প্রতিকার',
      contactSupport: 'যোগাযোগ ও সহায়তা',
      evidenceVerified: 'প্রমাণ-ভিত্তিক যাচাইকরণ',
      pilotBadge: 'পাইলট: কলকাতা, ভারত',
    },
    providerDetail: {
      backToSearch: 'অনুসন্ধান ফলাফলে ফিরে যান',
      requestAppointment: 'অ্যাপয়েন্টমেন্টের অনুরোধ করুন',
      contactInquiries: 'যোগাযোগ ও তথ্য',
      languagesSpoken: 'কথোপকথনের ভাষা:',
      verificationEvidence: 'যাচাইকরণ এবং প্রমাণপত্র',
      verificationAudit: 'রেজিস্ট্রেশনের প্রমাণ-ভিত্তিক অডিট',
      verificationStatus: 'যাচাইকরণ অবস্থা:',
      whatWasChecked: 'যা যাচাই করা হয়েছে:',
      regRef: 'মেডিকেল রেজিস্ট্রেশন নম্বর:',
      verifiedBy: 'যাচাইকারী:',
      verificationDate: 'যাচাইকরণের তারিখ:',
      facilityMap: 'হাসপাতাল/চেম্বার অবস্থান ও দিকনির্দেশ',
      consultationFees: 'তালিকাভুক্ত পরামর্শ ফি',
    },
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: TRANSLATIONS.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Load persisted language from localStorage on client mount
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('docnearby_lang') as SupportedLanguage;
      if (savedLang && ['en', 'hi', 'bn'].includes(savedLang)) {
        setLanguageState(savedLang);
      }
    } catch {
      // Safe fallback if localStorage is inaccessible
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('docnearby_lang', lang);
    } catch {
      // Safe fallback
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: TRANSLATIONS[language] || TRANSLATIONS.en,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
