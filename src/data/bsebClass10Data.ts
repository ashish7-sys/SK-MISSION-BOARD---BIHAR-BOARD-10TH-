import { SubjectInfo, Chapter, PDFMaterial, YouTubeVideo, Announcement, AppVersionInfo, MusicTrack } from "../types";

export const OFFICIAL_SUBJECTS: SubjectInfo[] = [
  {
    id: "hindi",
    nameHindi: "हिन्दी",
    nameEnglish: "Hindi",
    code: "HIN-101",
    iconName: "BookOpenText",
    themeColor: "#ec4899", // Neon Pink
    totalChapters: 29,
    description: "गोधूलि भाग 2 (गद्य एवं काव्य खंड) एवं वर्णिका भाग 2 का संपूर्ण 29 अध्यायों का पाठ्यक्रम।",
    bookNames: ["गोधूलि भाग 2 (गद्य खंड)", "गोधूलि भाग 2 (काव्य खंड)", "वर्णिका भाग 2"]
  },
  {
    id: "english",
    nameHindi: "English",
    nameEnglish: "English",
    code: "ENG-102",
    iconName: "Languages",
    themeColor: "#3b82f6", // Electric Blue
    totalChapters: 23,
    description: "Panorama Part 2 Prose & Poetry and English Reader supplementary literature (All 23 Chapters).",
    bookNames: ["Panorama Part 2", "English Reader"]
  },
  {
    id: "math",
    nameHindi: "गणित",
    nameEnglish: "Mathematics",
    code: "MTH-103",
    iconName: "Calculator",
    themeColor: "#10b981", // Emerald Neon Green
    totalChapters: 15,
    description: "NCERT/BSEB गणित: वास्तविक संख्याएँ से लेकर प्रायिकता तक संपूर्ण 15 अध्यायों के सूत्र एवं हल।",
    bookNames: ["NCERT / BSEB गणित कक्षा 10"]
  },
  {
    id: "science",
    nameHindi: "विज्ञान",
    nameEnglish: "Science",
    code: "SCI-104",
    iconName: "Atom",
    themeColor: "#06b6d4", // Cyan Neon
    totalChapters: 16,
    description: "भौतिकी (Physics), रसायन शास्त्र (Chemistry) एवं जीव विज्ञान (Biology) के सभी 16 अध्याय।",
    bookNames: ["भौतिकी (Physics)", "रसायन शास्त्र (Chemistry)", "जीव विज्ञान (Biology)"]
  },
  {
    id: "social_science",
    nameHindi: "सामाजिक विज्ञान",
    nameEnglish: "Social Science",
    code: "SOC-105",
    iconName: "Globe",
    themeColor: "#f59e0b", // Golden Amber
    totalChapters: 32,
    description: "इतिहास, राजनीति विज्ञान, भूगोल, अर्थशास्त्र एवं आपदा प्रबंधन के कुल 32 अध्याय।",
    bookNames: ["इतिहास", "राजनीति शास्त्र", "भूगोल", "अर्थशास्त्र", "आपदा प्रबंधन"]
  },
  {
    id: "sanskrit",
    nameHindi: "संस्कृत",
    nameEnglish: "Sanskrit",
    code: "SAN-106",
    iconName: "Scroll",
    themeColor: "#a855f7", // Purple Neon
    totalChapters: 14,
    description: "पीयूषम् भाग 2: मङ्गलम् से लेकर शास्त्रकाराः तक संपूर्ण 14 अध्यायों की संस्कृत व्याख्या एवं व्याकरण।",
    bookNames: ["पीयूषम् भाग 2 (संस्कृत)", "संस्कृत व्याकरण"]
  }
];

export const INITIAL_CHAPTERS: Chapter[] = [
  // ==========================================
  // 1. HINDI (29 CHAPTERS)
  // ==========================================
  // Godhuli Part 2 - Prose (गद्य खंड 1-12)
  { id: "hin-g-1", subjectId: "hindi", chapterNumber: 1, titleHindi: "श्रम विभाजन और जाति प्रथा", subtitle: "गोधूलि (गद्य) - डॉ. भीमराव अंबेडकर", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "hin-g-2", subjectId: "hindi", chapterNumber: 2, titleHindi: "विष के दाँत", subtitle: "गोधूलि (गद्य) - नलिन विलोचन शर्मा", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "hin-g-3", subjectId: "hindi", chapterNumber: 3, titleHindi: "भारत से हम क्या सीखें", subtitle: "गोधूलि (गद्य) - मैक्समूलर", hasPdfs: true, hasVideos: true },
  { id: "hin-g-4", subjectId: "hindi", chapterNumber: 4, titleHindi: "नाखून क्यों बढ़ते हैं", subtitle: "गोधूलि (गद्य) - हजारी प्रसाद द्विवेदी", hasPdfs: true },
  { id: "hin-g-5", subjectId: "hindi", chapterNumber: 5, titleHindi: "नागरी लिपि", subtitle: "गोधूलि (गद्य) - गुणाकर मुले", hasPdfs: true },
  { id: "hin-g-6", subjectId: "hindi", chapterNumber: 6, titleHindi: "बहादुर", subtitle: "गोधूलि (गद्य) - अमरकांत", isImportant: true, hasPdfs: true },
  { id: "hin-g-7", subjectId: "hindi", chapterNumber: 7, titleHindi: "परंपरा का मूल्यांकन", subtitle: "गोधूलि (गद्य) - रामविलास शर्मा", hasPdfs: true },
  { id: "hin-g-8", subjectId: "hindi", chapterNumber: 8, titleHindi: "जित-जित मैं निरखत हूँ", subtitle: "गोधूलि (गद्य) - पंडित बिरजू महाराज", hasPdfs: true },
  { id: "hin-g-9", subjectId: "hindi", chapterNumber: 9, titleHindi: "आविन्यों", subtitle: "गोधूलि (गद्य) - अशोक वाजपेयी", hasPdfs: true },
  { id: "hin-g-10", subjectId: "hindi", chapterNumber: 10, titleHindi: "मछली", subtitle: "गोधूलि (गद्य) - विनोद कुमार शुक्ल", isImportant: true, hasPdfs: true },
  { id: "hin-g-11", subjectId: "hindi", chapterNumber: 11, titleHindi: "नौबतखाने में इबादत", subtitle: "गोधूलि (गद्य) - यतीन्द्र मिश्र", hasPdfs: true },
  { id: "hin-g-12", subjectId: "hindi", chapterNumber: 12, titleHindi: "शिक्षा और संस्कृति", subtitle: "गोधूलि (गद्य) - महात्मा गांधी", isImportant: true, hasPdfs: true, hasVideos: true },

  // Godhuli Part 2 - Poetry (काव्य खंड 13-24)
  { id: "hin-k-13", subjectId: "hindi", chapterNumber: 13, titleHindi: "रामनाम बिनु बिरथे जगि जन्मा / जो नर दुख में दुख न मानै", subtitle: "गोधूलि (काव्य) - गुरु नानक", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "hin-k-14", subjectId: "hindi", chapterNumber: 14, titleHindi: "प्रेम अयनि श्री राधिका / करील के कुंजन ऊपर वारौं", subtitle: "गोधूलि (काव्य) - रसखान", hasPdfs: true, hasVideos: true },
  { id: "hin-k-15", subjectId: "hindi", chapterNumber: 15, titleHindi: "अति सूधो सनेह को मारग है / मो अँसुवानिहिं लै बरसौ", subtitle: "गोधूलि (काव्य) - घनानंद", hasPdfs: true },
  { id: "hin-k-16", subjectId: "hindi", chapterNumber: 16, titleHindi: "स्वदेशी", subtitle: "गोधूलि (काव्य) - बदरीनारायण चौधरी 'प्रेमघन'", isImportant: true, hasPdfs: true },
  { id: "hin-k-17", subjectId: "hindi", chapterNumber: 17, titleHindi: "भारतमाता", subtitle: "गोधूलि (काव्य) - सुमित्रानंदन पंत", isImportant: true, hasPdfs: true },
  { id: "hin-k-18", subjectId: "hindi", chapterNumber: 18, titleHindi: "जनतंत्र का जन्म", subtitle: "गोधूलि (काव्य) - रामधारी सिंह 'दिनकर'", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "hin-k-19", subjectId: "hindi", chapterNumber: 19, titleHindi: "हिरोशिमा", subtitle: "गोधूलि (काव्य) - सच्चिदानंद हीरानंद वात्स्यायन 'अज्ञेय'", hasPdfs: true },
  { id: "hin-k-20", subjectId: "hindi", chapterNumber: 20, titleHindi: "एक वृक्ष की हत्या", subtitle: "गोधूलि (काव्य) - कुँवर नारायण", hasPdfs: true },
  { id: "hin-k-21", subjectId: "hindi", chapterNumber: 21, titleHindi: "हमारी नींद", subtitle: "गोधूलि (काव्य) - वीरेन डंगवाल", hasPdfs: true },
  { id: "hin-k-22", subjectId: "hindi", chapterNumber: 22, titleHindi: "अक्षर-ज्ञान", subtitle: "गोधूलि (काव्य) - अनामिका", hasPdfs: true },
  { id: "hin-k-23", subjectId: "hindi", chapterNumber: 23, titleHindi: "लौटकर आऊंगा फिर", subtitle: "गोधूलि (काव्य) - जीवनानंद दास", hasPdfs: true },
  { id: "hin-k-24", subjectId: "hindi", chapterNumber: 24, titleHindi: "मेरे बिना तुम प्रभु", subtitle: "गोधूलि (काव्य) - रेनर मारिया रिल्के", hasPdfs: true },

  // Varnika Part 2 - Supplementary (25-29)
  { id: "hin-v-25", subjectId: "hindi", chapterNumber: 25, titleHindi: "दही वाली मंगम्मा", subtitle: "वर्णिका - श्रीनिवास", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "hin-v-26", subjectId: "hindi", chapterNumber: 26, titleHindi: "ढहते विश्वास", subtitle: "वर्णिका - सातकोड़ी होता", isImportant: true, hasPdfs: true },
  { id: "hin-v-27", subjectId: "hindi", chapterNumber: 27, titleHindi: "माँ", subtitle: "वर्णिका - ईश्वर पेटलीकर", isImportant: true, hasPdfs: true },
  { id: "hin-v-28", subjectId: "hindi", chapterNumber: 28, titleHindi: "नगर", subtitle: "वर्णिका - सुजाता", hasPdfs: true },
  { id: "hin-v-29", subjectId: "hindi", chapterNumber: 29, titleHindi: "धरती कब तक घूमेगी", subtitle: "वर्णिका - साँवर दया", isImportant: true, hasPdfs: true },

  // ==========================================
  // 2. ENGLISH (23 CHAPTERS)
  // ==========================================
  // Panorama Part 2 - Prose (1-8)
  { id: "eng-p-1", subjectId: "english", chapterNumber: 1, titleHindi: "The Pace for Living", titleEnglish: "The Pace for Living", subtitle: "Panorama Part II (Prose) - R.C. Hutchinson", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "eng-p-2", subjectId: "english", chapterNumber: 2, titleHindi: "Me and the Ecology Bit", titleEnglish: "Me and the Ecology Bit", subtitle: "Panorama Part II (Prose) - Joan Lexau", hasPdfs: true },
  { id: "eng-p-3", subjectId: "english", chapterNumber: 3, titleHindi: "Gillu", titleEnglish: "Gillu", subtitle: "Panorama Part II (Prose) - Mahadevi Varma", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "eng-p-4", subjectId: "english", chapterNumber: 4, titleHindi: "What is Wrong with Indian Films", titleEnglish: "What is Wrong with Indian Films", subtitle: "Panorama Part II (Prose) - Satyajit Ray", hasPdfs: true },
  { id: "eng-p-5", subjectId: "english", chapterNumber: 5, titleHindi: "Acceptance Speech", titleEnglish: "Acceptance Speech", subtitle: "Panorama Part II (Prose) - Aung San Suu Kyi", hasPdfs: true },
  { id: "eng-p-6", subjectId: "english", chapterNumber: 6, titleHindi: "Once Upon a Time", titleEnglish: "Once Upon a Time", subtitle: "Panorama Part II (Prose) - Toni Morrison", hasPdfs: true },
  { id: "eng-p-7", subjectId: "english", chapterNumber: 7, titleHindi: "The Unity of Indian Culture", titleEnglish: "The Unity of Indian Culture", subtitle: "Panorama Part II (Prose) - Humayun Kabir", hasPdfs: true },
  { id: "eng-p-8", subjectId: "english", chapterNumber: 8, titleHindi: "Little Girls Wiser Than Men", titleEnglish: "Little Girls Wiser Than Men", subtitle: "Panorama Part II (Prose) - Leo Tolstoy", hasPdfs: true },

  // Panorama Part 2 - Poetry (9-16)
  { id: "eng-k-9", subjectId: "english", chapterNumber: 9, titleHindi: "God Made the Country", titleEnglish: "God Made the Country", subtitle: "Panorama Part II (Poetry) - William Cowper", isImportant: true, hasPdfs: true },
  { id: "eng-k-10", subjectId: "english", chapterNumber: 10, titleHindi: "Ode on Solitude", titleEnglish: "Ode on Solitude", subtitle: "Panorama Part II (Poetry) - Alexander Pope", hasPdfs: true },
  { id: "eng-k-11", subjectId: "english", chapterNumber: 11, titleHindi: "Polythene Bag", titleEnglish: "Polythene Bag", subtitle: "Panorama Part II (Poetry) - Durga Prasad Panda", isImportant: true, hasPdfs: true },
  { id: "eng-k-12", subjectId: "english", chapterNumber: 12, titleHindi: "Thinner Than a Crescent", titleEnglish: "Thinner Than a Crescent", subtitle: "Panorama Part II (Poetry) - Vidyapati", hasPdfs: true },
  { id: "eng-k-13", subjectId: "english", chapterNumber: 13, titleHindi: "The Empty Heart", titleEnglish: "The Empty Heart", subtitle: "Panorama Part II (Poetry) - Periasamy Thooran", hasPdfs: true },
  { id: "eng-k-14", subjectId: "english", chapterNumber: 14, titleHindi: "Koel", titleEnglish: "Koel", subtitle: "Panorama Part II (Poetry) - Puran Singh", hasPdfs: true },
  { id: "eng-k-15", subjectId: "english", chapterNumber: 15, titleHindi: "The Sleeping Porter", titleEnglish: "The Sleeping Porter", subtitle: "Panorama Part II (Poetry) - Laxmi Prasad Devkota", hasPdfs: true },
  { id: "eng-k-16", subjectId: "english", chapterNumber: 16, titleHindi: "Martha", titleEnglish: "Martha", subtitle: "Panorama Part II (Poetry) - Walter de la Mare", hasPdfs: true },

  // English Reader - Supplementary (17-23)
  { id: "eng-r-17", subjectId: "english", chapterNumber: 17, titleHindi: "January Night", titleEnglish: "January Night", subtitle: "English Reader - Premchand", isImportant: true, hasPdfs: true },
  { id: "eng-r-18", subjectId: "english", chapterNumber: 18, titleHindi: "Allergy", titleEnglish: "Allergy", subtitle: "English Reader - Dr. Rana V.P. Singh", hasPdfs: true },
  { id: "eng-r-19", subjectId: "english", chapterNumber: 19, titleHindi: "The Bet", titleEnglish: "The Bet", subtitle: "English Reader - Anton Chekhov", isImportant: true, hasPdfs: true },
  { id: "eng-r-20", subjectId: "english", chapterNumber: 20, titleHindi: "Quality", titleEnglish: "Quality", subtitle: "English Reader - John Galsworthy", hasPdfs: true },
  { id: "eng-r-21", subjectId: "english", chapterNumber: 21, titleHindi: "Sun and Moon", titleEnglish: "Sun and Moon", subtitle: "English Reader - Katherine Mansfield", hasPdfs: true },
  { id: "eng-r-22", subjectId: "english", chapterNumber: 22, titleHindi: "Two Horizons", titleEnglish: "Two Horizons", subtitle: "English Reader - Binapani Mohanty", hasPdfs: true },
  { id: "eng-r-23", subjectId: "english", chapterNumber: 23, titleHindi: "Love Defiled", titleEnglish: "Love Defiled", subtitle: "English Reader - Giridhar Jha", hasPdfs: true },

  // ==========================================
  // 3. MATHEMATICS (15 CHAPTERS)
  // ==========================================
  { id: "mth-1", subjectId: "math", chapterNumber: 1, titleHindi: "वास्तविक संख्याएँ", titleEnglish: "Real Numbers", subtitle: "यूक्लिड विभाजन प्रमेयिका, अभाज्य गुणनखंडन एवं अपरिमेयता सिद्ध करना", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "mth-2", subjectId: "math", chapterNumber: 2, titleHindi: "बहुपद", titleEnglish: "Polynomials", subtitle: "शून्यक और उनके गुणांकों के बीच संबंध तथा विभाजन एल्गोरिदम", hasPdfs: true, hasVideos: true },
  { id: "mth-3", subjectId: "math", chapterNumber: 3, titleHindi: "दो चर वाले रैखिक समीकरण युग्म", titleEnglish: "Pair of Linear Equations in Two Variables", subtitle: "प्रतिस्थापन, विलोपन एवं वज्र-गुणन विधि", isImportant: true, hasPdfs: true },
  { id: "mth-4", subjectId: "math", chapterNumber: 4, titleHindi: "द्विघात समीकरण", titleEnglish: "Quadratic Equations", subtitle: "गुणनखंडन, पूर्ण वर्ग बनाकर हल तथा द्विघाती सूत्र", isImportant: true, hasPdfs: true },
  { id: "mth-5", subjectId: "math", chapterNumber: 5, titleHindi: "समांतर श्रेढियाँ (AP)", titleEnglish: "Arithmetic Progressions", subtitle: "nवाँ पद एवं प्रथम n पदों का योग", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "mth-6", subjectId: "math", chapterNumber: 6, titleHindi: "त्रिभुज", titleEnglish: "Triangles", subtitle: "थेल्स प्रमेय, समरूपता कसौटियाँ एवं पाइथागोरस प्रमेय", isImportant: true, hasPdfs: true },
  { id: "mth-7", subjectId: "math", chapterNumber: 7, titleHindi: "निर्देशांक ज्यामिति", titleEnglish: "Coordinate Geometry", subtitle: "दूरी सूत्र, विभाजन सूत्र एवं त्रिभुज का क्षेत्रफल", hasPdfs: true },
  { id: "mth-8", subjectId: "math", chapterNumber: 8, titleHindi: "त्रिकोणमिति का परिचय", titleEnglish: "Introduction to Trigonometry", subtitle: "त्रिकोणमितीय अनुपात, कोणों के मान एवं सर्वसमिकाएँ", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "mth-9", subjectId: "math", chapterNumber: 9, titleHindi: "त्रिकोणमिति के कुछ अनुप्रयोग", titleEnglish: "Some Applications of Trigonometry", subtitle: "उन्नयन और अवनमन कोण पर आधारित ऊँचाई एवं दूरी प्रश्न", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "mth-10", subjectId: "math", chapterNumber: 10, titleHindi: "वृत्त", titleEnglish: "Circles", subtitle: "स्पर्श रेखा, स्पर्श बिंदु एवं वृत्त संबंधी प्रमेय", hasPdfs: true },
  { id: "mth-11", subjectId: "math", chapterNumber: 11, titleHindi: "रचनाएँ", titleEnglish: "Constructions", subtitle: "रेखाखंड का विभाजन, त्रिभुज की रचना एवं स्पर्श रेखाएँ खींचना", hasPdfs: true },
  { id: "mth-12", subjectId: "math", chapterNumber: 12, titleHindi: "वृत्तों से संबंधित क्षेत्रफल", titleEnglish: "Areas Related to Circles", subtitle: "त्रिज्यखंड एवं वृत्तखंड का क्षेत्रफल", hasPdfs: true },
  { id: "mth-13", subjectId: "math", chapterNumber: 13, titleHindi: "पृष्ठीय क्षेत्रफल और आयतन", titleEnglish: "Surface Areas and Volumes", subtitle: "घन, घनाभ, गोला, बेलन, शंकु एवं छिन्नक का आयतन", isImportant: true, hasPdfs: true },
  { id: "mth-14", subjectId: "math", chapterNumber: 14, titleHindi: "सांख्यिकी", titleEnglish: "Statistics", subtitle: "माध्य, माध्यक (माध्यिका) और बहुलक की गणना", isImportant: true, hasPdfs: true },
  { id: "mth-15", subjectId: "math", chapterNumber: 15, titleHindi: "प्रायिकता", titleEnglish: "Probability", subtitle: "सैद्धांतिक प्रायिकता, पासा, सिक्का एवं ताश के पत्ते के प्रश्न", isImportant: true, hasPdfs: true },

  // ==========================================
  // 4. SCIENCE (16 CHAPTERS)
  // ==========================================
  // Physics (1-5)
  { id: "sci-p-1", subjectId: "science", chapterNumber: 1, titleHindi: "प्रकाश - परावर्तन तथा अपवर्तन", titleEnglish: "Light - Reflection & Refraction", subtitle: "भौतिकी - दर्पण एवं लेंस सूत्र, आवर्धन एवं अपवर्तनांक", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "sci-p-2", subjectId: "science", chapterNumber: 2, titleHindi: "मानव नेत्र तथा रंगबिरंगा संसार", titleEnglish: "Human Eye & Colorful World", subtitle: "भौतिकी - दृष्टि दोष, वर्ण विक्षेपण एवं वायुमंडलीय अपवर्तन", hasPdfs: true, hasVideos: true },
  { id: "sci-p-3", subjectId: "science", chapterNumber: 3, titleHindi: "विद्युत", titleEnglish: "Electricity", subtitle: "भौतिकी - ओम का नियम, प्रतिरोधों का संयोजन एवं जूल का तापीय नियम", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "sci-p-4", subjectId: "science", chapterNumber: 4, titleHindi: "विद्युत धारा के चुंबकीय प्रभाव", titleEnglish: "Magnetic Effects of Electric Current", subtitle: "भौतिकी - फ्लेमिंग का नियम, विद्युत मोटर एवं जनित्र", isImportant: true, hasPdfs: true },
  { id: "sci-p-5", subjectId: "science", chapterNumber: 5, titleHindi: "ऊर्जा के स्रोत", titleEnglish: "Sources of Energy", subtitle: "भौतिकी - पारंपरिक एवं गैर-पारंपरिक ऊर्जा स्रोत", hasPdfs: true },

  // Chemistry (6-10)
  { id: "sci-c-6", subjectId: "science", chapterNumber: 6, titleHindi: "रासायनिक अभिक्रियाएँ एवं समीकरण", titleEnglish: "Chemical Reactions & Equations", subtitle: "रसायन शास्त्र - संतुलन, संयोजन, वियोजन एवं विस्थापन अभिक्रियाएँ", isImportant: true, hasPdfs: true },
  { id: "sci-c-7", subjectId: "science", chapterNumber: 7, titleHindi: "अम्ल, क्षारक एवं लवण", titleEnglish: "Acids, Bases & Salts", subtitle: "रसायन शास्त्र - pH सूचकांक, प्लास्टर ऑफ पेरिस, बेकिंग सोडा", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "sci-c-8", subjectId: "science", chapterNumber: 8, titleHindi: "धातु एवं अधातु", titleEnglish: "Metals & Non-metals", subtitle: "रसायन शास्त्र - भौतिक एवं रासायनिक गुण, आयनिक यौगिक, संक्षारण", isImportant: true, hasPdfs: true },
  { id: "sci-c-9", subjectId: "science", chapterNumber: 9, titleHindi: "कार्बन एवं उसके यौगिक", titleEnglish: "Carbon & Its Compounds", subtitle: "रसायन शास्त्र - सहसंयोजी आबंध, सजातीय श्रेणी, साबुन एवं अपमार्जक", isImportant: true, hasPdfs: true },
  { id: "sci-c-10", subjectId: "science", chapterNumber: 10, titleHindi: "तत्वों का आवर्त वर्गीकरण", titleEnglish: "Periodic Classification of Elements", subtitle: "रसायन शास्त्र - डोबेराइनर, न्यूलैंड्स एवं आधुनिक आवर्त सारणी", hasPdfs: true },

  // Biology (11-16)
  { id: "sci-b-11", subjectId: "science", chapterNumber: 11, titleHindi: "जैव प्रक्रम", titleEnglish: "Life Processes", subtitle: "जीव विज्ञान - पोषण, श्वसन, परिसंचरण/वहन एवं उत्सर्जन", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "sci-b-12", subjectId: "science", chapterNumber: 12, titleHindi: "नियंत्रण एवं समन्वय", titleEnglish: "Control & Coordination", subtitle: "जीव विज्ञान - तंत्रिका तंत्र, मस्तिष्क, पादप हार्मोन एवं अंतःस्रावी ग्रंथियाँ", isImportant: true, hasPdfs: true },
  { id: "sci-b-13", subjectId: "science", chapterNumber: 13, titleHindi: "जीव जनन कैसे करते हैं?", titleEnglish: "How do Organisms Reproduce?", subtitle: "जीव विज्ञान - लैंगिक एवं अलैंगिक जनन, पुष्प की संरचना एवं जनन स्वास्थ्य", isImportant: true, hasPdfs: true },
  { id: "sci-b-14", subjectId: "science", chapterNumber: 14, titleHindi: "आनुवंशिकता एवं जैव विकास", titleEnglish: "Heredity & Evolution", subtitle: "जीव विज्ञान - मेंडेल का नियम, लिंग निर्धारण एवं विकास सिद्धांत", hasPdfs: true },
  { id: "sci-b-15", subjectId: "science", chapterNumber: 15, titleHindi: "हमारा पर्यावरण", titleEnglish: "Our Environment", subtitle: "जीव विज्ञान - पारितंत्र, खाद्य श्रृंखला, ओजोन परत का क्षय", hasPdfs: true },
  { id: "sci-b-16", subjectId: "science", chapterNumber: 16, titleHindi: "प्राकृतिक संसाधनों का प्रबंधन", titleEnglish: "Management of Natural Resources", subtitle: "जीव विज्ञान - वन, वन्यजीव, जल संरक्षण (3R सिद्धांत)", hasPdfs: true },

  // ==========================================
  // 5. SOCIAL SCIENCE (32 CHAPTERS)
  // ==========================================
  // History (इतिहास 1-8)
  { id: "soc-h-1", subjectId: "social_science", chapterNumber: 1, titleHindi: "यूरोप में राष्ट्रवाद", titleEnglish: "Nationalism in Europe", subtitle: "इतिहास - मेजिनी, काबूर, गैरीबाल्डी एवं बिस्मार्क का योगदान", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "soc-h-2", subjectId: "social_science", chapterNumber: 2, titleHindi: "समाजवाद एवं साम्यवाद", titleEnglish: "Socialism & Communism", subtitle: "इतिहास - कार्ल मार्क्स एवं 1917 की रूसी क्रांति (बोल्शेविक क्रांति)", hasPdfs: true },
  { id: "soc-h-3", subjectId: "social_science", chapterNumber: 3, titleHindi: "हिंद-चीन में राष्ट्रवादी आंदोलन", titleEnglish: "Nationalist Movement in Indo-China", subtitle: "इतिहास - फ्रांसीसी उपनिवेशवाद एवं हो-ची-मिन्ह का संघर्ष", hasPdfs: true },
  { id: "soc-h-4", subjectId: "social_science", chapterNumber: 4, titleHindi: "भारत में राष्ट्रवाद", titleEnglish: "Nationalism in India", subtitle: "इतिहास - जलियांवाला बाग, असहयोग आंदोलन, सविनय अवज्ञा एवं भारत छोड़ो", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "soc-h-5", subjectId: "social_science", chapterNumber: 5, titleHindi: "अर्थव्यवस्था और आजीविका", titleEnglish: "Economy & Livelihood", subtitle: "इतिहास - औद्योगिकीकरण का युग एवं मजदूरों का जीवन", hasPdfs: true },
  { id: "soc-h-6", subjectId: "social_science", chapterNumber: 6, titleHindi: "शहरीकरण एवं शहरी जीवन", titleEnglish: "Urbanization & Urban Life", subtitle: "इतिहास - प्राचीन, मध्यकालीन एवं आधुनिक नगरों का विकास", hasPdfs: true },
  { id: "soc-h-7", subjectId: "social_science", chapterNumber: 7, titleHindi: "व्यापार और भूमंडलीकरण", titleEnglish: "Trade & Globalization", subtitle: "इतिहास - रेशम मार्ग, महामंदी (1929) एवं विश्व बाजार", hasPdfs: true },
  { id: "soc-h-8", subjectId: "social_science", chapterNumber: 8, titleHindi: "प्रेस-संस्कृति और राष्ट्रवाद", titleEnglish: "Press Culture & Nationalism", subtitle: "इतिहास - प्रिंटिंग प्रेस का आविष्कार एवं भारतीय समाचार पत्रों की भूमिका", isImportant: true, hasPdfs: true },

  // Political Science (राजनीति विज्ञान 9-13)
  { id: "soc-p-9", subjectId: "social_science", chapterNumber: 9, titleHindi: "लोकतंत्र में सत्ता की साझेदारी", titleEnglish: "Power Sharing in Democracy", subtitle: "राजनीति विज्ञान - सामाजिक विभिन्नता, बेल्जियम व श्रीलंका का केस स्टडी", isImportant: true, hasPdfs: true },
  { id: "soc-p-10", subjectId: "social_science", chapterNumber: 10, titleHindi: "सत्ता में साझेदारी की कार्यप्रणाली", titleEnglish: "Working of Power Sharing", subtitle: "राजनीति विज्ञान - संघवाद, त्रिस्तरीय पंचायती राज व्यवस्था (73वाँ संशोधन)", isImportant: true, hasPdfs: true },
  { id: "soc-p-11", subjectId: "social_science", chapterNumber: 11, titleHindi: "लोकतंत्र में प्रतिस्पर्धा एवं संघर्ष", titleEnglish: "Competition & Contest in Democracy", subtitle: "राजनीति विज्ञान - जनसंघर्ष, आंदोलन एवं राजनीतिक दल", hasPdfs: true },
  { id: "soc-p-12", subjectId: "social_science", chapterNumber: 12, titleHindi: "लोकतंत्र के परिणाम", titleEnglish: "Outcomes of Democracy", subtitle: "राजनीति विज्ञान - उत्तरदायी, वैध एवं पारदर्शी शासन प्रणाली", hasPdfs: true },
  { id: "soc-p-13", subjectId: "social_science", chapterNumber: 13, titleHindi: "लोकतंत्र की चुनौतियाँ", titleEnglish: "Challenges to Democracy", subtitle: "राजनीति विज्ञान - जातिवाद, सांप्रदायिकता, क्षेत्रवाद एवं सुधार", hasPdfs: true },

  // Geography (भूगोल 14-20)
  { id: "soc-g-14", subjectId: "social_science", chapterNumber: 14, titleHindi: "भारत : संसाधन एवं उपयोग", titleEnglish: "India: Resources & Utilization", subtitle: "भूगोल - मृदा, जल, वन एवं वन्यप्राणि संसाधन", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "soc-g-15", subjectId: "social_science", chapterNumber: 15, titleHindi: "कृषि", titleEnglish: "Agriculture", subtitle: "भूगोल - रबी, खरीफ एवं जायद फसलें, कृषि सुधार", isImportant: true, hasPdfs: true },
  { id: "soc-g-16", subjectId: "social_science", chapterNumber: 16, titleHindi: "निर्माण उद्योग", titleEnglish: "Manufacturing Industries", subtitle: "भूगोल - सूती वस्त्र, लोहा-इस्पात एवं आईटी उद्योग", hasPdfs: true },
  { id: "soc-g-17", subjectId: "social_science", chapterNumber: 17, titleHindi: "परिवहन, संचार एवं व्यापार", titleEnglish: "Transport, Communication & Trade", subtitle: "भूगोल - सड़क मार्ग, रेल मार्ग, जल मार्ग एवं अंतरराष्ट्रीय व्यापार", hasPdfs: true },
  { id: "soc-g-18", subjectId: "social_science", chapterNumber: 18, titleHindi: "बिहार : कृषि एवं वन संसाधन", titleEnglish: "Bihar: Agriculture & Forest Resources", subtitle: "भूगोल - बिहार की कृषि समस्याएँ एवं वन विस्तार", hasPdfs: true },
  { id: "soc-g-19", subjectId: "social_science", chapterNumber: 19, titleHindi: "बिहार : खनिज एवं ऊर्जा संसाधन", titleEnglish: "Bihar: Mineral & Energy Resources", subtitle: "भूगोल - बिहार के खनिज संपदा एवं ताप/जल विद्युत परियोजनाएँ", hasPdfs: true },
  { id: "soc-g-20", subjectId: "social_science", chapterNumber: 20, titleHindi: "मानचित्र अध्ययन", titleEnglish: "Map Reading", subtitle: "भूगोल - हैश्यूर विधि, स्तर रंजन एवं समोच्च रेखाएँ", hasPdfs: true },

  // Economics (अर्थशास्त्र 21-27)
  { id: "soc-e-21", subjectId: "social_science", chapterNumber: 21, titleHindi: "अर्थव्यवस्था एवं इसके विकास का इतिहास", titleEnglish: "Economy & History of Development", subtitle: "अर्थशास्त्र - प्राथमिक, द्वितीयक, तृतीयक क्षेत्र एवं मानव विकास सूचकांक (HDI)", isImportant: true, hasPdfs: true },
  { id: "soc-e-22", subjectId: "social_science", chapterNumber: 22, titleHindi: "राज्य एवं राष्ट्र की आय", titleEnglish: "State & National Income", subtitle: "अर्थशास्त्र - प्रतिव्यक्ति आय (PCI), सकल घरेलू उत्पाद (GDP)", isImportant: true, hasPdfs: true },
  { id: "soc-e-23", subjectId: "social_science", chapterNumber: 23, titleHindi: "मुद्रा, बचत एवं साख", titleEnglish: "Money, Savings & Credit", subtitle: "अर्थशास्त्र - वस्तु विनिमय प्रणाली एवं प्लास्टिक मनी (ATM/Debit/Credit)", isImportant: true, hasPdfs: true },
  { id: "soc-e-24", subjectId: "social_science", chapterNumber: 24, titleHindi: "हमारी वित्तीय संस्थाएँ", titleEnglish: "Our Financial Institutions", subtitle: "अर्थशास्त्र - व्यावसायिक बैंक, RBI, स्वयं सहायता समूह (SHG)", hasPdfs: true },
  { id: "soc-e-25", subjectId: "social_science", chapterNumber: 25, titleHindi: "रोजगार एवं सेवाएँ", titleEnglish: "Employment & Services", subtitle: "अर्थशास्त्र - सरकारी व गैर-सरकारी सेवा क्षेत्र", hasPdfs: true },
  { id: "soc-e-26", subjectId: "social_science", chapterNumber: 26, titleHindi: "वैश्वीकरण", titleEnglish: "Globalization", subtitle: "अर्थशास्त्र - बहुराष्ट्रीय कंपनियां (MNCs), निजीकरण एवं उदारीकरण", hasPdfs: true },
  { id: "soc-e-27", subjectId: "social_science", chapterNumber: 27, titleHindi: "उपभोक्ता अधिकार", titleEnglish: "Consumer Rights", subtitle: "अर्थशास्त्र - उपभोक्ता संरक्षण अधिनियम 1986, जागो ग्राहक जागो", isImportant: true, hasPdfs: true },

  // Disaster Management (आपदा प्रबंधन 28-32)
  { id: "soc-d-28", subjectId: "social_science", chapterNumber: 28, titleHindi: "प्राकृतिक आपदा : एक परिचय", titleEnglish: "Natural Disaster: An Introduction", subtitle: "आपदा प्रबंधन - प्राकृतिक एवं मानव जनित आपदाएँ", isImportant: true, hasPdfs: true },
  { id: "soc-d-29", subjectId: "social_science", chapterNumber: 29, titleHindi: "प्राकृतिक आपदा और प्रबंधन : बाढ़ और सुखाड़", titleEnglish: "Floods & Droughts", subtitle: "आपदा प्रबंधन - उत्तरी बिहार की बाढ़ एवं सुरक्षा उपाय", isImportant: true, hasPdfs: true },
  { id: "soc-d-30", subjectId: "social_science", chapterNumber: 30, titleHindi: "प्राकृतिक आपदा और प्रबंधन : भूकंप और सुनामी", titleEnglish: "Earthquakes & Tsunami", subtitle: "आपदा प्रबंधन - भूकंपीय तरंगें (P, S, L) एवं सुरक्षा", isImportant: true, hasPdfs: true },
  { id: "soc-d-31", subjectId: "social_science", chapterNumber: 31, titleHindi: "जीवन रक्षक आकस्मिक प्रबंधन", titleEnglish: "Life Saving Emergency Management", subtitle: "आपदा प्रबंधन - प्राथमिक उपचार एवं त्वरित बचाव दल", hasPdfs: true },
  { id: "soc-d-32", subjectId: "social_science", chapterNumber: 32, titleHindi: "आपदा काल में वैकल्पिक संचार व्यवस्था", titleEnglish: "Alternative Communication in Disaster", subtitle: "आपदा प्रबंधन - हैम रेडियो, उपग्रह फोन एवं वायरलेस", hasPdfs: true },

  // ==========================================
  // 6. SANSKRIT (14 CHAPTERS)
  // ==========================================
  { id: "san-1", subjectId: "sanskrit", chapterNumber: 1, titleHindi: "मङ्गलम्", subtitle: "पीयूषम् (भाग 2) - उपनिषद् के पाँच मन्त्र एवं सत्य की व्याख्या", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "san-2", subjectId: "sanskrit", chapterNumber: 2, titleHindi: "पाटलिपुत्रवैभवम्", subtitle: "पीयूषम् (भाग 2) - प्राचीन पटना का गौरवशाली इतिहास", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "san-3", subjectId: "sanskrit", chapterNumber: 3, titleHindi: "अलसकथा", subtitle: "पीयूषम् (भाग 2) - विद्यापति रचित आलसियों की परीक्षा", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "san-4", subjectId: "sanskrit", chapterNumber: 4, titleHindi: "संस्कृतसाहित्ये लेखिकाः", subtitle: "पीयूषम् (भाग 2) - संस्कृत साहित्य में विदुषी महिलाओं का योगदान", isImportant: true, hasPdfs: true },
  { id: "san-5", subjectId: "sanskrit", chapterNumber: 5, titleHindi: "भारतमहिमा", subtitle: "पीयूषम् (भाग 2) - पुराणों से संकलित भारतवर्ष के गुणगान", isImportant: true, hasPdfs: true },
  { id: "san-6", subjectId: "sanskrit", chapterNumber: 6, titleHindi: "भारतीयसंस्काराः", subtitle: "पीयूषम् (भाग 2) - जीवन के 16 प्रमुख संस्कार", isImportant: true, hasPdfs: true },
  { id: "san-7", subjectId: "sanskrit", chapterNumber: 7, titleHindi: "नीतिश्लोकाः", subtitle: "पीयूषम् (भाग 2) - विदुरनीति से संकलित नैतिक उपदेश", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "san-8", subjectId: "sanskrit", chapterNumber: 8, titleHindi: "कर्मवीरकथा", subtitle: "पीयूषम् (भाग 2) - भीखनटोला के रामप्रवेश राम की सफलता की गाथा", isImportant: true, hasPdfs: true, hasVideos: true },
  { id: "san-9", subjectId: "sanskrit", chapterNumber: 9, titleHindi: "स्वामी दयानन्दः", subtitle: "पीयूषम् (भाग 2) - आर्य समाज संस्थापक स्वामी दयानंद का जीवन", isImportant: true, hasPdfs: true },
  { id: "san-10", subjectId: "sanskrit", chapterNumber: 10, titleHindi: "मन्दाकिनीवर्णनम्", subtitle: "पीयूषम् (भाग 2) - वाल्मीकि रामायण से संकलित मंदाकिनी नदी का सौंदर्य", hasPdfs: true },
  { id: "san-11", subjectId: "sanskrit", chapterNumber: 11, titleHindi: "व्याघ्रपथिककथा", subtitle: "पीयूषम् (भाग 2) - हितोपदेश से संकलित लोभ के दुष्परिणाम", isImportant: true, hasPdfs: true },
  { id: "san-12", subjectId: "sanskrit", chapterNumber: 12, titleHindi: "कर्णस्य दानवीरता", subtitle: "पीयूषम् (भाग 2) - भास रचित कर्ण का कवच-कुंडल दान", isImportant: true, hasPdfs: true },
  { id: "san-13", subjectId: "sanskrit", chapterNumber: 13, titleHindi: "विश्वशान्तिः", subtitle: "पीयूषम् (भाग 2) - संसार में अशान्ति के कारण और निवारण के उपाय", hasPdfs: true },
  { id: "san-14", subjectId: "sanskrit", chapterNumber: 14, titleHindi: "शास्त्रकाराः", subtitle: "पीयूषम् (भाग 2) - प्राचीन भारतीय दर्शन, व्याकरण एवं शास्त्रकारों का परिचय", isImportant: true, hasPdfs: true }
];

export const INITIAL_PDFS: PDFMaterial[] = [
  {
    id: "pdf-101",
    subjectId: "math",
    chapterId: "mth-1",
    chapterTitle: "अध्याय 1: वास्तविक संख्याएँ (Real Numbers)",
    title: "वास्तविक संख्याएँ - संपूर्ण हस्तलिखित नोट्स एवं VVI प्रश्न",
    description: "BSEB 2026 बोर्ड परीक्षा हेतु यूक्लिड विभाजन, सिद्ध करने वाले अपरिमेय प्रश्न एवं OMR वस्तुनिष्ठ उत्तर।",
    fileUrl: "https://www.w3.org/W3C/DesignIssues/PDF.pdf",
    fileSizeMb: 4.2,
    pageCount: 18,
    uploadDate: "2026-08-10",
    isNew: true,
    isPublished: true,
    orderIndex: 1
  },
  {
    id: "pdf-102",
    subjectId: "science",
    chapterId: "sci-p-1",
    chapterTitle: "अध्याय 1: प्रकाश - परावर्तन तथा अपवर्तन",
    title: "प्रकाश - परावर्तन तथा अपवर्तन : संपूर्ण चित्र सहित नोट्स",
    description: "अवतल/उत्तल दर्पण किरण आरेख, आवर्धन सूत्र एवं न्यूमेरिकल हल।",
    fileUrl: "https://www.w3.org/W3C/DesignIssues/PDF.pdf",
    fileSizeMb: 5.8,
    pageCount: 24,
    uploadDate: "2026-08-08",
    isNew: true,
    isPublished: true,
    orderIndex: 1
  },
  {
    id: "pdf-103",
    subjectId: "sanskrit",
    chapterId: "san-1",
    chapterTitle: "अध्याय 1: मङ्गलम्",
    title: "मङ्गलम् पाठ - अर्थ, श्लोक व्याख्या एवं प्रश्नोत्तर",
    description: "सभी 5 मन्त्रों का हिंदी अनुवाद, परीक्षा में पूछे जाने वाले 2 अंक और 5 अंक वाले प्रश्न।",
    fileUrl: "https://www.w3.org/W3C/DesignIssues/PDF.pdf",
    fileSizeMb: 2.1,
    pageCount: 10,
    uploadDate: "2026-08-05",
    isUpdated: true,
    isPublished: true,
    orderIndex: 1
  },
  {
    id: "pdf-104",
    subjectId: "social_science",
    chapterId: "soc-h-4",
    chapterTitle: "अध्याय 4: भारत में राष्ट्रवाद",
    title: "भारत में राष्ट्रवाद - मास्टर रिवीजन नोट्स",
    description: "जलियांवाला बाग, चंपारण सत्याग्रह, दांडी यात्रा एवं गांधी-इरविन समझौता टाइमलाइन।",
    fileUrl: "https://www.w3.org/W3C/DesignIssues/PDF.pdf",
    fileSizeMb: 6.4,
    pageCount: 32,
    uploadDate: "2026-08-02",
    isPublished: true,
    orderIndex: 1
  },
  {
    id: "pdf-105",
    subjectId: "hindi",
    chapterId: "hin-g-1",
    chapterTitle: "अध्याय 1: श्रम विभाजन और जाति प्रथा",
    title: "श्रम विभाजन और जाति प्रथा - संपूर्ण व्याख्या एवं MCQ",
    description: "डॉ. भीमराव अंबेडकर जी के निबंध का सारांश एवं परीक्षा उपयोगी प्रश्नोत्तरी।",
    fileUrl: "https://www.w3.org/W3C/DesignIssues/PDF.pdf",
    fileSizeMb: 3.5,
    pageCount: 14,
    uploadDate: "2026-07-28",
    isPublished: true,
    orderIndex: 1
  }
];

export const INITIAL_YOUTUBE_VIDEOS: YouTubeVideo[] = [
  {
    id: "yt-201",
    subjectId: "math",
    chapterId: "mth-8",
    chapterTitle: "अध्याय 8: त्रिकोणमिति का परिचय",
    title: "Class 10th Math Trigonometry Full Concept & Formula Revision",
    youtubeUrl: "https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8",
    youtubeVideoId: "dQw4w9WgXcQ",
    description: "SK MISSION BOARD आधिकारिक यूट्यूब चैनल पर संपूर्ण त्रिकोणमिति सारणी और ट्रिक सीखें।",
    durationText: "48:15",
    uploadDate: "2026-08-11",
    isPublished: true,
    orderIndex: 1
  },
  {
    id: "yt-202",
    subjectId: "science",
    chapterId: "sci-p-1",
    chapterTitle: "अध्याय 1: प्रकाश - परावर्तन तथा अपवर्तन",
    title: "Class 10th Science Reflection of Light One-Shot Lecture",
    youtubeUrl: "https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8",
    youtubeVideoId: "dQw4w9WgXcQ",
    description: "प्रकाश के परावर्तन के नियम, समतल एवं गोलीय दर्पण की मुख्य अवधारणाएँ।",
    durationText: "55:30",
    uploadDate: "2026-08-09",
    isPublished: true,
    orderIndex: 1
  },
  {
    id: "yt-203",
    subjectId: "sanskrit",
    chapterId: "san-2",
    chapterTitle: "अध्याय 2: पाटलिपुत्रवैभवम्",
    title: "Class 10th Sanskrit पाटलिपुत्रवैभवम् पूर्ण पाठ हिंदी अर्थ सहित",
    youtubeUrl: "https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8",
    youtubeVideoId: "dQw4w9WgXcQ",
    description: "प्राचीन पटना का ऐतिहासिक वैभव, मौर्य काल, गुप्त काल एवं गुरु गोबिंद सिंह जन्मस्थान।",
    durationText: "36:40",
    uploadDate: "2026-08-06",
    isPublished: true,
    orderIndex: 1
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "ann-1",
    title: "🚀 SK MISSION BOARD आधिकारिक एंड्रॉइड ऐप में स्वागत है!",
    content: "बिहार बोर्ड वर्ग 10 के सभी विषयों के VVI नोट्स, मॉडल पेपर और पीडीएफ यहाँ निःशुल्क उपलब्ध हैं। नियमित अध्ययन करें और टॉप रैंक हासिल करें।",
    date: "2026-08-12",
    isImportant: true,
    isPublished: true
  },
  {
    id: "ann-2",
    title: "📢 बोर्ड परीक्षा 2026 हेतु गणित एवं विज्ञान विशेष सीरीज प्रारंभ",
    content: "त्रिकोणमिति, वास्तविक संख्याएँ तथा प्रकाश परावर्तन के नए हस्तलिखित पीडीएफ जारी कर दिए गए हैं। 'PDF Material' सेक्शन से डाउनलोड करें।",
    date: "2026-08-11",
    isImportant: false,
    isPublished: true
  }
];

export const CURRENT_APP_VERSION: AppVersionInfo = {
  versionName: "2.0.0",
  versionCode: 200,
  releaseDate: "2026-08-23",
  apkDownloadUrl: "https://github.com/skmissionboard/app-releases/releases/latest/download/sk-mission-board.apk",
  apkUrl: "https://github.com/skmissionboard/app-releases/releases/latest/download/sk-mission-board.apk",
  updateMessage: "SK MISSION BOARD का नया संस्करण v2.0.0 उपलब्ध है। नए 2026 नोट्स, VVI प्रश्न एवं तेज़ परफॉर्मेंस का लाभ उठाएं।",
  forceUpdate: false,
  releaseNotes: [
    "✨ Ultra-Smooth GPU Neon Wave Shader System added with responsive touch ripples.",
    "📚 Complete 6-Subject Bihar Board Class 10 Curriculum Architecture (All 129 Chapters).",
    "📑 Integrated HD Document Reader with Zoom, Page Navigation, Offline Cache & Direct Download.",
    "🎥 Official SK MISSION BOARD YouTube Channel Video Lecture Stream.",
    "🔒 Secure Single-Administrator Control Board with Firebase Cloud Auth & Rules.",
    "🔄 Custom In-App APK Download & Seamless Installer without Google Play dependencies."
  ],
  isMandatory: false,
  latestVersionCode: 200
};

export const INITIAL_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "music-1",
    title: "Focus Music 01",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    durationText: "2:45",
    isPublished: true,
    orderIndex: 1,
    addedDate: "2026-08-14"
  },
  {
    id: "music-2",
    title: "Calm Piano",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=piano-moment-9835.mp3",
    durationText: "3:10",
    isPublished: true,
    orderIndex: 2,
    addedDate: "2026-08-14"
  },
  {
    id: "music-3",
    title: "Study Ambient",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=ambient-piano-amp-strings-10711.mp3",
    durationText: "4:02",
    isPublished: true,
    orderIndex: 3,
    addedDate: "2026-08-14"
  },
  {
    id: "music-4",
    title: "Deep Focus",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=lofi-chill-medium-version-159456.mp3",
    durationText: "3:30",
    isPublished: true,
    orderIndex: 4,
    addedDate: "2026-08-14"
  },
  {
    id: "music-5",
    title: "Alpha Waves Study",
    audioUrl: "https://cdn.pixabay.com/download/audio/2021/11/01/audio_00fa27d046.mp3?filename=relaxing-mountains-rivers-streams-running-water-18178.mp3",
    durationText: "3:15",
    isPublished: true,
    orderIndex: 5,
    addedDate: "2026-08-14"
  },
  {
    id: "music-6",
    title: "Peaceful Lo-Fi Beats",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/26/audio_d0c6ff1101.mp3?filename=the-beat-of-nature-122841.mp3",
    durationText: "2:50",
    isPublished: true,
    orderIndex: 6,
    addedDate: "2026-08-14"
  }
];
