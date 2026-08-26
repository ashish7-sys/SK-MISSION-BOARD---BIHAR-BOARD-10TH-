// Centralized App Knowledge & UI Navigation Registry for SK MISSION BOARD
// This serves as the single source of truth for the AI Assistant regarding the app's actual features, UI, and navigation.

export interface AppFeatureInfo {
  name: string;
  location: string;
  stepsToAccess: string[];
  description: string;
  isAvailable: boolean;
}

export const APP_METADATA = {
  name: "SK MISSION BOARD",
  shortName: "SKMB",
  targetBoard: "Bihar School Examination Board (BSEB)",
  targetClass: "Class 10 (Matric) - Board Exam 2026",
  medium: "Hindi / Bilingual (हिन्दी माध्यम)",
  officialChannel: "SK MISSION BOARD (@skmissionboard)",
  channelUrl: "https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8",
  isFree: true,
  pricing: "100% Free - सभी नोट्स, वीडियो और AI पूर्णतः निःशुल्क हैं।"
};

export const APP_NAVIGATION_MAP = {
  header: {
    logo: {
      name: "SK MISSION BOARD Logo / Title",
      action: "Tap logo to open Admin Panel (passcode protected for authorized administrators)."
    },
    updatesButton: {
      name: "Updates / New Button (Sparkles icon / New badge)",
      location: "Top Header (Right side)",
      action: "Opens Version & Updates Modal with latest release notes and APK download options."
    },
    searchButton: {
      name: "Global Search Button (Search / Magnifying glass icon)",
      location: "Top Header (Right side)",
      action: "Opens Global Search to search across all 6 subjects, 129 chapters, PDFs, videos, and music."
    },
    favoritesButton: {
      name: "Favorites / Bookmarks Button (Bookmark icon)",
      location: "Top Header (Right side)",
      action: "Opens Saved Bookmarks Modal with all student-saved PDFs, video lectures, and chapters."
    },
    adminButton: {
      name: "Admin Button (Lock icon)",
      location: "Top Header (Right side)",
      action: "Opens Admin Passcode Login dialog."
    }
  },
  bottomTabs: {
    home: {
      id: "home",
      label: "HOME",
      icon: "Home",
      location: "Bottom Navigation Bar (Tab 1)",
      description: "मुख्य डैशबोर्ड। यहाँ छात्र का स्वागत कार्ड, Quick Actions (Subjects, All PDFs, Official Videos, Study Music), 6 विषयों का ग्रिड, मुख्य घोषणाएँ (Announcements) एवं यूट्यूब चैनल लिंक उपलब्ध हैं।"
    },
    subject: {
      id: "subject",
      label: "SUBJECT",
      icon: "BookOpen",
      location: "Bottom Navigation Bar (Tab 2)",
      description: "विषय चयन पृष्ठ। यहाँ बिहार बोर्ड कक्षा 10वीं के सभी 6 विषय (हिन्दी, अंग्रेजी, गणित, विज्ञान, सामाजिक विज्ञान, संस्कृत) उपलब्ध हैं। किसी भी विषय पर टैप करने पर उसके सभी अध्याय (Chapters) खुलते हैं।"
    },
    ai: {
      id: "ai",
      label: "AI (या Special)",
      icon: "Sparkles",
      location: "Bottom Navigation Bar (Tab 3 - Central)",
      description: "24x7 स्मार्ट AI स्टडी एवं ऐप गाइड असिस्टेंट। यहाँ विद्यार्थी किसी भी विषय का सवाल पूछ सकते हैं, किताब/नोटबुक के सवाल की फोटो भेज सकते हैं, वॉइस इनपुट दे सकते हैं और ऐप के बारे में मदद ले सकते हैं।"
    },
    music: {
      id: "music",
      label: "MUSIC",
      icon: "Music",
      location: "Bottom Navigation Bar (Tab 4)",
      description: "स्टडी फोकस इंस्ट्रूमेंटल म्यूजिक प्लेयर। यहाँ 4 शांत और ध्यान केंद्रित करने वाले ट्रैक्स (Lofi Study, Alpha Focus, Classical Raga, Flute Meditation), पोमोडोरो टाइमर (15m, 25m, 45m, 60m) और वॉल्यूम कंट्रोल उपलब्ध हैं।"
    },
    download: {
      id: "download",
      label: "DOWNLOAD",
      icon: "Download",
      location: "Bottom Navigation Bar (Tab 5)",
      description: "डाउनलोड मैनेजर। यहाँ ऐप में डाउनलोड किए गए सभी PDFs ऑफलाइन पढ़ने के लिए उपलब्ध रहते हैं। यहाँ से PDF को सीधे पढ़ा, डिलीट किया या डिवाइस में सेव किया जा सकता है।"
    }
  },
  aiScreenLayout: {
    topBar: {
      exitAiButton: "Exit AI बटन (ऊपर दाएँ कोने में लाल बॉर्डर वाला बटन): इस पर टैप करके AI से बाहर निकलकर Home या पिछली स्क्रीन पर जा सकते हैं।",
      profileButton: "Profile बटन (ऊपर दाएँ कोने में): विद्यार्थी अपना नाम, जेंडर, बोर्ड वर्ष एवं गाँव/शहर बदल सकते हैं।",
      drawerButton: "Menu / History बटन (ऊपर बाएँ कोने में): पिछली सभी चर्चाओं की सूची (Today, Yesterday, Last 7 Days, Older) खोलने, नयी चर्चा (New Chat) शुरू करने या पुरानी चर्चा डिलीट/रीनेम करने के लिए।"
    },
    stickyTabs: {
      chatTab: "CHAT टैब: मुख्य चैट इंटरफ़ेस जहाँ AI से बातचीत, फोटो अपलोड, वॉइस इनपुट और सवाल पूछे जाते हैं।",
      pdfTab: "PDF टैब: विषयवार अध्ययन PDF नोट्स की सूची और 'Search for PDF' का विकल्प।",
      videoTab: "VIDEOS टैब: बिहार बोर्ड के ऑफिशियल यूट्यूब वीडियो लेक्चर्स।"
    },
    chatComposer: {
      imageUploadBtn: "कैमरा / इमेज बटन (फोटो अपलोड): किताब, सवाल या डायग्राम की फोटो खींचकर भेजने के लिए।",
      textInput: "मैसेज बॉक्स: सवाल टाइप करने के लिए।",
      voiceBtn: "माइक बटन: बोलकर सवाल पूछने के लिए (Voice Input)।",
      sendBtn: "सेंड बटन (तीर का निशान): मैसेज भेजने के लिए।"
    }
  }
};

export const STEP_BY_STEP_GUIDES = {
  howToFindPdf: [
    "यदि आप AI सेक्शन में हैं, तो सबसे पहले ऊपर दाएँ कोने में दिए गए 'Exit AI' बटन पर टैप करें।",
    "आप Home स्क्रीन पर पहुँच जाएंगे। नीचे Bottom Navigation में 'SUBJECT' टैब पर टैप करें (या Home पर दिए गए 'Subjects' बटन पर टैप करें)।",
    "अपना विषय चुनें (जैसे विज्ञान, गणित, सामाजिक विज्ञान, आदि)।",
    "अब उस अध्याय (Chapter) पर टैप करें जिसका PDF आप पढ़ना चाहते हैं।",
    "अध्याय के अंदर 'PDF' / 'Read PDF' बटन पर टैप करें। PDF ऐप के अंदर HD व्यूअर में खुल जाएगा।"
  ],
  howToFindAiPdfTab: [
    "आप AI सेक्शन के अंदर रहते हुए भी सीधे ऊपर दिए गए 'PDF' टैब (CHAT के बगल में) पर टैप करके उपलब्ध PDF नोट्स देख सकते हैं।"
  ],
  howToFindDownloadedPdf: [
    "अगर आप AI स्क्रीन में हैं, तो ऊपर दाएँ 'Exit AI' बटन दबाकर बाहर आएँ।",
    "नीचे Bottom Navigation Bar में सबसे दाएँ दिए गए 'DOWNLOAD' टैब पर टैप करें।",
    "यहाँ आपके द्वारा डाउनलोड किए गए सभी PDFs की सूची मिलेगी, जिन्हें आप बिना इंटरनेट (ऑफलाइन) भी पढ़ सकते हैं।"
  ],
  howToDownloadPdf: [
    "किसी भी विषय (Subject) में जाएँ और अपना अध्याय (Chapter) चुनें।",
    "चैप्टर कार्ड में दिए गए Download आइकॉन (⬇️) पर टैप करें, या PDF व्यूअर खोलकर ऊपर दिए गए Download बटन पर टैप करें।",
    "डाउनलोड पूरा होने के बाद PDF नीचे 'DOWNLOAD' सेक्शन में ऑफलाइन पढ़ने के लिए उपलब्ध हो जाता है।"
  ],
  howToFindMusic: [
    "अगर आप AI में हैं, तो पहले 'Exit AI' दबाएँ।",
    "नीचे Bottom Navigation Bar में 'MUSIC' टैब पर टैप करें (या Home स्क्रीन पर 'Study Music' कार्ड पर टैप करें)।",
    "यहाँ आपको 4 स्टडी-फ्रेंडली इंस्ट्रूमेंटल ट्रैक्स और पोमोडोरो टाइमर मिलेगा।"
  ],
  howToOpenAi: [
    "ऐप के नीचे Bottom Navigation Bar में बीच में दिए गए 'AI' टैब (स्पार्कल्स आइकॉन) पर टैप करें।"
  ],
  howToExitAi: [
    "AI स्क्रीन के ऊपर दाएँ कोने में दिए गए 'Exit AI' बटन पर टैप करें।"
  ],
  howToUseSearch: [
    "Home या किसी भी मुख्य स्क्रीन पर ऊपर हेडर में दिए गए 'Search' (मैग्नीफाइंग ग्लास 🔍) आइकॉन पर टैप करें।",
    "सर्च बार में किसी भी विषय, अध्याय, PDF या वीडियो का नाम लिखकर सीधे वहाँ पहुँच सकते हैं।"
  ],
  howToFindFavorites: [
    "ऊपर हेडर में दिए गए 'Bookmark' (पसंदीदा 🔖) आइकॉन पर टैप करें।",
    "यहाँ आपके द्वारा सेव किए गए सभी जरूरी PDFs, वीडियो और अध्याय एक जगह मिलेंगे।"
  ],
  howToEditProfile: [
    "AI स्क्रीन में ऊपर 'Profile' बटन पर टैप करें (या Home पर स्टूडेंट प्रोफाइल कार्ड पर टैप करें)।",
    "यहाँ आप अपना नाम, जेंडर (छात्र/छात्रा) और जिला/गाँव अपडेट कर सकते हैं।"
  ]
};

export const FEATURE_AVAILABILITY = {
  // Existing Features in current App
  pdfNotes: { available: true, note: "उपलब्ध है (सभी 6 विषयों के अध्यायों के लिए)" },
  pdfViewer: { available: true, note: "ऐप के अंदर इन-बिल्ट HD PDF व्यूअर उपलब्ध है" },
  pdfDownload: { available: true, note: "ऑफलाइन डाउनलोड एवं डिवाइस में सेव करने की सुविधा उपलब्ध है" },
  videoLectures: { available: true, note: "ऑफिशियल यूट्यूब वीडियो लेक्चर्स उपलब्ध हैं" },
  aiAssistant: { available: true, note: "24x7 मल्टीमॉडल AI ट्यूटर (टेक्स्ट, फोटो स्कैन एवं वॉइस इनपुट सहित) उपलब्ध है" },
  studyMusic: { available: true, note: "4 इंस्ट्रूमेंटल फोकस ट्रैक्स एवं टाइमर उपलब्ध है" },
  globalSearch: { available: true, note: "पूरे ऐप में विषय, चैप्टर, PDF एवं वीडियो खोजने की सुविधा उपलब्ध है" },
  favoritesBookmarks: { available: true, note: "PDF, वीडियो और चैप्टर को बुकमार्क करने की सुविधा उपलब्ध है" },
  offlineDownloadsManager: { available: true, note: "डाउनलोड किए गए PDFs बिना इंटरनेट के पढ़ने की सुविधा उपलब्ध है" },
  adminPanel: { available: true, note: "पासकोड सुरक्षित एडमिन पैनल उपलब्ध है" },
  studentProfile: { available: true, note: "छात्र प्रोफाइल (नाम, जेंडर, जिला) कस्टमाइज़ेशन उपलब्ध है" },

  // Non-existent / Not in App features
  paidSubscription: { available: false, note: "ऐप में कोई पेड प्लान नहीं है; सभी सामग्री 100% फ्री है।" },
  live1On1VideoCall: { available: false, note: "वर्तमान संस्करण में 1-ऑन-1 लाइव वीडियो कॉल सुविधा उपलब्ध नहीं है।" },
  studentToStudentChat: { available: false, note: "छात्रों के बीच आपसी प्राइवेट चैटिंग की सुविधा उपलब्ध नहीं है (केवल AI असिस्टेंट से संवाद संभव है)।" },
  gamesOrSocialFeed: { available: false, note: "ऐप केवल शुद्ध अध्ययन और बिहार बोर्ड मैट्रिक परीक्षा की तैयारी के लिए समर्पित है।" }
};
