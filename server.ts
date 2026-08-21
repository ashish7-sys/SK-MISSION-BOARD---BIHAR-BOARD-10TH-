import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure public/uploads directory exists
const publicUploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

// Ensure dist/uploads exists in production
const distUploadsDir = path.join(process.cwd(), "dist", "uploads");
if (fs.existsSync(path.join(process.cwd(), "dist")) && !fs.existsSync(distUploadsDir)) {
  fs.mkdirSync(distUploadsDir, { recursive: true });
}

// Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    }
    cb(null, publicUploadsDir);
  },
  filename: (_req, file, cb) => {
    // Generate safe, clean filename with timestamp
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}_${safeName}`;
    cb(null, uniqueName);
  }
});

// Max 150MB file size limit to accommodate large PDFs, theme videos, and study audio
const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024
  }
});

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && process.env.GEMINI_API_KEY) {
    genAIClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return genAIClient;
}

// Safe Gemini generation with model fallback and exponential retry on 503 / 429 errors
async function generateContentSafe(
  ai: GoogleGenAI,
  options: {
    contents: any;
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  },
  candidateModels = ["gemini-3.5-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-flash-latest"]
): Promise<string> {
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens ?? 2048,
            ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {})
          }
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const statusCode = err?.status || err?.error?.code || err?.statusCode;
        const errMsg = String(err?.message || "");
        const isTransient = 
          statusCode === 503 || 
          statusCode === 429 || 
          statusCode === 500 || 
          errMsg.includes("503") || 
          errMsg.includes("demand") || 
          errMsg.includes("UNAVAILABLE");
        
        if (isTransient && attempt === 0) {
          // Wait 200ms before quick retry
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }
        // If not transient or second attempt failed, break to next model
        break;
      }
    }
  }

  throw lastError || new Error("All AI models unavailable");
}

function extractJsonArray(text: string): any[] {
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          return [];
        }
      }
      return [];
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Global CORS and Header Support for Web, Iframe, and Capacitor Android WebViews
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Static serving for direct uploaded files (PDFs, Videos, Music, Themes, etc.)
  app.use("/uploads", express.static(publicUploadsDir));
  if (fs.existsSync(distUploadsDir)) {
    app.use("/uploads", express.static(distUploadsDir));
  }

  // API: Direct Multi-Format File Upload with Realtime Chunk Tracking & Multer Error Interception
  app.post("/api/upload", (req, res) => {
    upload.single("file")(req, res, (err: any) => {
      if (err) {
        console.error("[Multer Upload Error]:", err);
        return res.status(400).json({
          success: false,
          error: err.message || "File processing error during upload"
        });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ success: false, error: "No file was uploaded" });
        }

        const file = req.file;
        const originalName = file.originalname;
        const sizeBytes = file.size;
        const sizeMb = Number((sizeBytes / (1024 * 1024)).toFixed(2));
        const mimeType = file.mimetype;
        const relativeUrl = `/uploads/${file.filename}`;

        // If dist folder exists, copy file there so it's instantly available in production builds too
        if (fs.existsSync(distUploadsDir)) {
          try {
            const destDistPath = path.join(distUploadsDir, file.filename);
            fs.copyFileSync(file.path, destDistPath);
          } catch (copyErr) {
            console.warn("Could not mirror file to dist/uploads:", copyErr);
          }
        }

        console.log(`[File Upload Success] ${originalName} (${sizeMb} MB) -> ${relativeUrl}`);

        return res.json({
          success: true,
          url: relativeUrl,
          fileName: originalName,
          storedFileName: file.filename,
          sizeBytes,
          sizeMb,
          mimeType,
          uploadedAt: new Date().toISOString()
        });
      } catch (saveErr: any) {
        console.error("File upload save error:", saveErr);
        return res.status(500).json({
          success: false,
          error: "Upload failed on server",
          details: saveErr?.message || String(saveErr)
        });
      }
    });
  });

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: "SK MISSION BOARD", timestamp: new Date().toISOString() });
  });

  // In-memory app update config (can also sync with remote/Firestore)
  let appUpdateConfig = {
    versionCode: 104,
    versionName: "1.0.4",
    apkUrl: "https://github.com/skmissionboard/app-releases/releases/latest/download/sk-mission-board.apk",
    updateMessage: "SK MISSION BOARD का नया संस्करण उपलब्ध है। नए 2026 नोट्स, VVI प्रश्न एवं तेज़ परफॉर्मेंस का लाभ उठाएं।",
    forceUpdate: false,
    releaseDate: "2026-08-12",
    releaseNotes: [
      "✨ Ultra-Smooth GPU Neon Wave Shader System added with responsive touch ripples.",
      "📚 Complete 6-Subject Bihar Board Class 10 Curriculum Architecture (All 129 Chapters).",
      "📑 Integrated HD Document Reader with Zoom, Page Navigation, Offline Cache & Direct Download.",
      "🎥 Official SK MISSION BOARD YouTube Channel Video Lecture Stream.",
      "🔒 Secure Single-Administrator Control Board with Firebase Cloud Auth & Rules.",
      "🔄 Custom In-App APK Download & Seamless Installer without Google Play dependencies."
    ]
  };

  app.get("/api/app-update", (_req, res) => {
    res.json(appUpdateConfig);
  });

  app.post("/api/app-update", (req, res) => {
    try {
      const { versionCode, versionName, apkUrl, updateMessage, forceUpdate, releaseNotes, releaseDate } = req.body || {};
      if (versionCode) appUpdateConfig.versionCode = Number(versionCode);
      if (versionName) appUpdateConfig.versionName = String(versionName).trim();
      if (apkUrl) appUpdateConfig.apkUrl = String(apkUrl).trim();
      if (updateMessage !== undefined) appUpdateConfig.updateMessage = String(updateMessage).trim();
      if (forceUpdate !== undefined) appUpdateConfig.forceUpdate = Boolean(forceUpdate);
      if (releaseDate) appUpdateConfig.releaseDate = String(releaseDate).trim();
      if (Array.isArray(releaseNotes)) appUpdateConfig.releaseNotes = releaseNotes;

      res.json({ success: true, config: appUpdateConfig });
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Failed to update version config" });
    }
  });

  app.get("/api/app-info", (_req, res) => {
    res.json({
      appName: "SK MISSION BOARD",
      versionName: "1.0.4",
      versionCode: 104,
      releaseDate: "2026-08-12",
      channelUrl: "https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8",
      board: "Bihar State Examination Board (BSEB) Class 10",
      officialApp: true,
      updateAvailable: false,
      latestVersion: "1.0.4",
      changelog: [
        "AI Study Assistant - BSEB Class 10 Smart Tutor Engine",
        "ChatGPT-Style Multi-Turn Conversation Memory Drawer",
        "Tri-View System: CHAT, PDF Notes & Official Video Lectures",
        "Internal Resource Matcher & Admin Discovered PDF Library",
        "Interactive GPU Neon Energy Light-Wave System",
        "Full 6-Subject Bihar Board Class 10 Chapter Indexing",
        "Built-in High Definition PDF Viewer & Download Engine",
        "Official YouTube Lecture Video Integration",
        "Secure Single-Admin Panel with Cloud & Local Persistence"
      ]
    });
  });

  // Helper to solve basic linear equations like "2x + 5 = 15"
  function trySolveLinearEquation(query: string): string | null {
    const match = query.match(/(\d*)\s*x\s*([+-])\s*(\d+)\s*=\s*(\d+)/i);
    if (match) {
      const coeff = match[1] ? parseInt(match[1], 10) : 1;
      const op = match[2].trim();
      const c1 = parseInt(match[3], 10);
      const c2 = parseInt(match[4], 10);

      const rhsAfterConst = op === "+" ? c2 - c1 : c2 + c1;
      const xVal = rhsAfterConst / coeff;

      return `**समीकरण का हल (Step-by-Step Solution):**\n\n` +
        `दिया गया समीकरण:\n` +
        `$$${coeff === 1 ? "" : coeff}x ${op} ${c1} = ${c2}$$\n\n` +
        `**चरण 1: अचर पद (Constant) को दाएँ पक्ष (RHS) में पक्षांतर करने पर:**\n` +
        `$$${coeff === 1 ? "" : coeff}x = ${c2} ${op === "+" ? "-" : "+"} ${c1}$$\n` +
        `$$${coeff === 1 ? "" : coeff}x = ${rhsAfterConst}$$\n\n` +
        (coeff !== 1 ? `**चरण 2: दोनों पक्षों में ${coeff} से भाग देने पर:**\n$$x = \\frac{${rhsAfterConst}}{${coeff}}$$\n$$x = ${xVal}$$\n\n` : "") +
        `**उत्तर:** **$x = ${xVal}$**`;
    }
    return null;
  }

  // Multi-turn History Sanitizer for Gemini API
  function formatChatHistoryForGemini(
    messages: Array<{ sender: string; text?: string; imageBase64?: string }>,
    currentQuery: string,
    imageBase64?: string,
    imageMimeType?: string
  ): Array<{ role: "user" | "model"; parts: Array<any> }> {
    const turns: Array<{ role: "user" | "model"; parts: Array<any> }> = [];

    // Filter messages: exclude if the last message in history is identical to currentQuery to prevent duplication
    const historyToProcess = Array.isArray(messages) ? [...messages] : [];
    if (
      historyToProcess.length > 0 && 
      historyToProcess[historyToProcess.length - 1].sender === "user" &&
      historyToProcess[historyToProcess.length - 1].text?.trim() === currentQuery?.trim()
    ) {
      historyToProcess.pop();
    }

    for (const m of historyToProcess) {
      if (!m.text && !m.imageBase64) continue;
      const role: "user" | "model" = m.sender === "user" ? "user" : "model";
      const parts: any[] = [];

      if (m.imageBase64 && role === "user") {
        const rawBase64 = m.imageBase64.includes(",") ? m.imageBase64.split(",")[1] : m.imageBase64;
        parts.push({
          inlineData: {
            data: rawBase64,
            mimeType: "image/jpeg"
          }
        });
      }

      if (m.text && m.text.trim()) {
        parts.push({ text: m.text.trim() });
      }

      if (parts.length > 0) {
        if (turns.length > 0 && turns[turns.length - 1].role === role) {
          turns[turns.length - 1].parts.push(...parts);
        } else {
          turns.push({ role, parts });
        }
      }
    }

    // Ensure history starts with 'user'
    while (turns.length > 0 && turns[0].role === "model") {
      turns.shift();
    }

    // Build current turn parts
    const currentParts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
      currentParts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: imageMimeType || "image/jpeg"
        }
      });
    }

    const queryText = (currentQuery || "").trim() || (imageBase64 ? "कृपया इस चित्र/प्रश्न को ध्यानपूर्वक समझाइए और पूर्ण हल दीजिए।" : "");
    if (queryText) {
      currentParts.push({ text: queryText });
    }

    if (currentParts.length > 0) {
      if (turns.length > 0 && turns[turns.length - 1].role === "user") {
        turns[turns.length - 1].parts = currentParts;
      } else {
        turns.push({ role: "user", parts: currentParts });
      }
    }

    if (turns.length === 0 && queryText) {
      turns.push({ role: "user", parts: [{ text: queryText }] });
    }

    return turns;
  }

  // Intelligent Server Fallback Generator for SK MISSION BOARD (Used ONLY during genuine technical/API failure)
  function generateServerFallbackResponse(
    query: string, 
    userProfile: any, 
    matchedPdfs: any[] = [], 
    messages: any[] = []
  ): string {
    const q = (query || "").trim();
    const qLower = q.toLowerCase();
    const studentName = userProfile?.name ? userProfile.name.trim() : "";
    const namePrefix = studentName ? ` ${studentName}` : "";

    // Extract recent user & assistant turns for continuous context
    let lastUserQuery = "";
    const userHistory: string[] = [];

    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (!m.text) continue;
        if (m.sender === "user") {
          lastUserQuery = m.text.trim();
          userHistory.push(lastUserQuery.toLowerCase());
        }
      }
    }

    // 1. GREETINGS & CASUAL (NO academic template!)
    if (/^(hi+|hello+|hey+|namaste+|namaskar+|pranam+|kaise ho|how are you|kya hal hai|good morning|good evening|good afternoon|ram ram|radhe radhe)[\s!?.👋]*$/i.test(qLower)) {
      return `नमस्ते${namePrefix}! 👋 मैं SK AI Study Assistant हूँ। बताइए, आज क्या पढ़ना या पूछना चाहते हैं?`;
    }

    // 1B. "Aap kaise ho" / Casual inquiry
    if (/aap kaise ho|kaise ho aap|how are you|tum kaise ho|kya haal hai/i.test(qLower)) {
      return `मैं बिल्कुल ठीक हूँ, धन्यवाद! 😊 आपकी पढ़ाई कैसी चल रही है? बताइए, मैं आपकी क्या मदद कर सकता हूँ?`;
    }

    // 2. CONTEXTUAL FOLLOW-UP: Gandhi ji death / Population vs Area
    if (/(unki|unka|unki mrityu|unka nidhan|mrityu kab|death kab)/i.test(qLower) && userHistory.some(h => h.includes("gandhi"))) {
      return `महात्मा गांधी की मृत्यु **30 जनवरी 1948** को नई दिल्ली में हुई थी।`;
    }

    if (/(aur|aur bhi|and)?\s*(jansankhya|abadi|population)\s*(ke hisab se|ke anusaar|me|mein|me kaun)?/i.test(qLower)) {
      if (userHistory.some(h => h.includes("rajya") || h.includes("state") || h.includes("bharat"))) {
        return `जनसंख्या (Population) के आधार पर भारत का सबसे बड़ा राज्य **उत्तर प्रदेश** है।\n\n(जबकि क्षेत्रफल यानी Area के आधार पर सबसे बड़ा राज्य **राजस्थान** है।)`;
      }
      return `जनसंख्या की दृष्टि से भारत का सबसे बड़ा राज्य **उत्तर प्रदेश** है।`;
    }

    // 3. GENERAL KNOWLEDGE (GK) & FACTS (Direct factual answers)
    // 3A. Mahatma Gandhi birth & death
    if (qLower.includes("gandhi") && (qLower.includes("janm") || qLower.includes("mrityu") || qLower.includes("birth") || qLower.includes("death") || qLower.includes("paida"))) {
      return `महात्मा गांधी का जन्म **2 अक्टूबर 1869** को पोरबंदर (गुजरात) में हुआ था और उनकी मृत्यु **30 जनवरी 1948** को नई दिल्ली में हुई थी।`;
    }

    // 3B. Capital of India
    if (/bharat.*rajdhani|capital of india|india.*capital|rajdhani.*bharat/i.test(qLower)) {
      return `**नई दिल्ली** भारत की राजधानी है।`;
    }

    // 3C. Cricket Bharat Ratna
    if ((qLower.includes("cricket") || qLower.includes("khiladi") || qLower.includes("player")) && qLower.includes("bharat ratna")) {
      return `**सचिन तेंदुलकर** भारत रत्न पाने वाले पहले (और एकमात्र) क्रिकेट खिलाड़ी हैं। उन्हें वर्ष **2014** में देश के सर्वोच्च नागरिक सम्मान 'भारत रत्न' से सम्मानित किया गया था।`;
    }

    // 3D. President of India
    if (/president.*india|bharat.*rashtrapati|rashtrapati.*kaun/i.test(qLower)) {
      return `वर्तमान में भारत की राष्ट्रपति **श्रीमती द्रौपदी मुर्मू** (Droupadi Murmu) हैं। वे भारत की 15वीं राष्ट्रपति हैं।`;
    }

    // 3E. Prime Minister of India
    if (/prime minister.*india|bharat.*pradhan mantri|pradhanmantri.*kaun|pm of india/i.test(qLower)) {
      return `वर्तमान में भारत के प्रधानमंत्री **श्री नरेंद्र मोदी** (Narendra Modi) हैं।`;
    }

    // 3F. Largest State in India
    if (/bharat.*sabse bada rajya|largest state.*india|area.*sabse bada rajya/i.test(qLower)) {
      return `क्षेत्रफल (Area) के आधार पर **राजस्थान** भारत का सबसे बड़ा राज्य है।\n\n(यदि जनसंख्या के आधार पर देखें तो **उत्तर प्रदेश** सबसे बड़ा राज्य है।)`;
    }

    // 3G. Capital of Bihar
    if (/bihar.*rajdhani|capital of bihar|rajdhani.*bihar/i.test(qLower)) {
      return `बिहार की राजधानी **पटना** है।`;
    }

    // 4. MATHEMATICS PROBLEMS & EQUATIONS
    // 4A. Linear equation like "2x + 5 = 15"
    const solvedEquation = trySolveLinearEquation(q);
    if (solvedEquation) {
      return solvedEquation;
    }

    // 4B. Pythagoras Theorem
    if (/pythagoras|पाइथागोरस|pythagorean/i.test(qLower)) {
      return `**पाइथागोरस प्रमेय (Pythagoras Theorem):**\n\n` +
        `किसी समकोण त्रिभुज (Right-Angled Triangle) में, सबसे लम्बी भुजा यानी **कर्ण (Hypotenuse)** का वर्ग शेष दोनों भुजाओं (**लम्ब एवं आधार**) के वर्गों के योग के बराबर होता है।\n\n` +
        `$$\\text{कर्ण}^2 = \\text{लम्ब}^2 + \\text{आधार}^2$$\n` +
        `$$h^2 = p^2 + b^2$$\n\n` +
        `**उदाहरण:**\n` +
        `यदि किसी समकोण त्रिभुज में लम्ब ($p$) = 3 सेमी और आधार ($b$) = 4 सेमी हो:\n` +
        `$$\\text{कर्ण}^2 = 3^2 + 4^2 = 9 + 16 = 25$$\n` +
        `$$\\text{कर्ण} = \\sqrt{25} = 5\\text{ सेमी}$$\n\n` +
        `यह प्रमेय त्रिकोणमिति और ज्यामिति के प्रश्नों को हल करने में अत्यंत उपयोगी है।`;
    }

    // 5. SCIENCE / ACADEMIC CONCEPTS
    // 5A. Reflection of Light (प्रकाश का परावर्तन)
    if (/prakash.*paravartan|reflection.*light|paravartan.*kya hai/i.test(qLower)) {
      return `**प्रकाश का परावर्तन (Reflection of Light):**\n\n` +
        `जब प्रकाश की किरण किसी चिकनी या पॉलिशदार सतह (जैसे समतल दर्पण) से टकराकर पुनः उसी माध्यम में लौट जाती है, तो इस परिघटना को **प्रकाश का परावर्तन** कहते हैं।\n\n` +
        `**परावर्तन के दो मुख्य नियम:**\n` +
        `1. **आपतित किरण**, **परावर्तित किरण** तथा आपतन बिंदु पर खींचा गया **अभिलंब** — तीनों एक ही समतल में होते हैं।\n` +
        `2. **आपतन कोण ($\\angle i$)** सदैव **परावर्तन कोण ($\\angle r$)** के बराबर होता है:\n` +
        `   $$\\angle i = \\angle r$$`;
    }

    // 5B. Refraction of Light (प्रकाश का अपवर्तन)
    if (/prakash.*apavartan|refraction.*light|apavartan.*kya hai/i.test(qLower)) {
      return `**प्रकाश का अपवर्तन (Refraction of Light):**\n\n` +
        `जब प्रकाश की किरण एक पारदर्शी माध्यम से दूसरे पारदर्शी माध्यम में प्रवेश करती है, तो वह अपने मूल मार्ग से विचलित (मुड़) जाती है। इसे **प्रकाश का अपवर्तन** कहते हैं।\n\n` +
        `**स्नेल का नियम (Snell's Law):**\n` +
        `$$\\frac{\\sin i}{\\sin r} = \\mu \\quad (\\text{स्थिरांक})$$`;
    }

    // 5C. Ohm's Law (ओम का नियम)
    if (/ohm.*law|ohm.*niyam|ओम का नियम/i.test(qLower)) {
      return `**ओम का नियम (Ohm's Law):**\n\n` +
        `यदि किसी चालक (तार) की भौतिक अवस्थाएँ (जैसे तापमान) स्थिर रहें, तो चालक के दोनों सिरों के बीच का **विभवांतर ($V$)** उसमें प्रवाहित होने वाली **विद्युत धारा ($I$)** के समानुपाती होता है।\n\n` +
        `$$V \\propto I \\implies V = IR$$\n\n` +
        `- $V$ = विभवांतर (मात्रक: वोल्ट / V)\n` +
        `- $I$ = विद्युत धारा (मात्रक: एम्पियर / A)\n` +
        `- $R$ = चालक का प्रतिरोध (मात्रक: ओम / $\\Omega$)`;
    }

    // 5D. Photosynthesis (प्रकाश संश्लेषण)
    if (/photosynthesis|prakash sanshleshan|प्रकाश संश्लेषण/i.test(qLower)) {
      return `**प्रकाश संश्लेषण (Photosynthesis):**\n\n` +
        `हरे पौधे सूर्य के प्रकाश और क्लोरोफिल की उपस्थिति में जल ($H_2O$) और कार्बन डाइऑक्साइड ($CO_2$) की सहायता से अपना भोजन (ग्लूकोज) बनाते हैं तथा ऑक्सीजन गैस ($O_2$) मुक्त करते हैं।\n\n` +
        `**रासायनिक समीकरण:**\n` +
        `$$6CO_2 + 12H_2O \\xrightarrow[\\text{क्लोरोफिल}]{\\text{सूर्य का प्रकाश}} C_6H_{12}O_6 + 6O_2 + 6H_2O$$`;
    }

    // 6. STUDY PREPARATION GUIDANCE
    if (/science.*(prepare|taiyari|kaise padhe|kaise kare|kaise padhu)|bihar board.*(science|math|10th).*kaise/i.test(qLower)) {
      return `**बिहार बोर्ड 10वीं विज्ञान (Science) की बेहतरीन तैयारी के टिप्स:** 📚💡\n\n` +
        `1. **तीनों खंडों को समझें**: भौतिकी (Physics), रसायनशास्त्र (Chemistry) और जीवविज्ञान (Biology) के मूल सिद्धांतों को NCERT और ऐप के नोट्स से समझें।\n` +
        `2. **वस्तुनिष्ठ प्रश्न (50% MCQs)**: बोर्ड परीक्षा में 50% वस्तुनिष्ठ प्रश्न पूछे जाते हैं। हर चैप्टर के मुख्य सूत्रों, रासायनिक सूत्रों और परिभाषाओं पर आधारित MCQs का रोज़ अभ्यास करें।\n` +
        `3. **चित्रों का अभ्यास (Diagrams)**: मानव पाचन तंत्र, नेफ्रॉन, मानव नेत्र, और प्रकाश के किरण आरेख को खुद बनाकर देखें।\n` +
        `4. **सूत्र एवं समीकरण**: ओम का नियम, दर्पण सूत्र ($1/f = 1/v + 1/u$), और रासायनिक समीकरणों को संतुलित करने का अभ्यास करें।\n` +
        `5. **पिछले वर्षों के प्रश्न (PYQs)**: पिछले 5 वर्षों के बोर्ड प्रश्न पत्रों और मॉडल सेट्स को हल करें।`;
    }

    // 7. APP NAVIGATION & UI HELP
    // 7A. Exit AI
    if (/exit ai|ai se bahar|bahar kaise nikle|home par kaise jaye|ai band kaise kare/i.test(qLower)) {
      return `👉 **AI से बाहर निकलने के लिए:**\nस्क्रीन के ऊपर दाएँ कोने में दिए गए लाल बॉर्डर वाले **'Exit AI'** बटन पर टैप करें। इससे आप तुरंत Home स्क्रीन पर पहुँच जाएंगे।`;
    }
    // 7B. Download Section
    if (/download.*kahan|downloaded.*pdf.*kahan|offline.*pdf.*kahan|download.*section/i.test(qLower) ||
        (qLower.includes("download") && (qLower.includes("kahan") || qLower.includes("kidhar") || qLower.includes("dekhe")))) {
      return `⬇️ **डाउनलोड किए गए PDFs देखने के लिए:**\n\n1. ऊपर दाएँ कोने में दिए गए **'Exit AI'** बटन पर टैप करें।\n2. नीचे Bottom Navigation Bar में **'DOWNLOAD'** टैब पर टैप करें।\n3. यहाँ आपके द्वारा डाउनलोड किए गए सभी PDFs बिना इंटरनेट के कभी भी पढ़ने के लिए उपलब्ध हैं।`;
    }
    // 7C. PDF Section
    if (/pdf.*kahan|notes.*kahan|kahan milega.*pdf|pdf.*section|notes.*kaise.*dekhe/i.test(qLower) && !/solve|formula|definition/i.test(qLower)) {
      return `📄 **PDF सेक्शन और नोट्स पाने के लिए:**\n\n1. ऊपर दाएँ **'Exit AI'** बटन दबाकर Home स्क्रीन पर आएँ।\n2. नीचे **'SUBJECT'** टैब पर जाएँ और अपना विषय (जैसे विज्ञान, गणित) चुनें।\n3. जिस अध्याय का नोट्स पढ़ना चाहते हैं, उस पर टैप करके **'Read PDF'** दबाएँ।\n\n💡 *टिप:* आप AI स्क्रीन में ऊपर दिए गए **'PDF'** टैब पर टैप करके भी सभी उपलब्ध नोट्स देख सकते हैं।`;
    }
    // 7D. Music Section
    if (/music.*kahan|gaana.*kahan|audio.*kahan|focus.*music|study.*music/i.test(qLower)) {
      return `🎵 **स्टडी म्यूजिक पाने के लिए:**\n\n1. ऊपर दाएँ **'Exit AI'** दबाएँ।\n2. नीचे Bottom Bar में **'MUSIC'** टैब पर टैप करें।\n3. यहाँ आपको 4 फोकस ट्रैक्स (Lofi Study, Alpha Waves, Raga, Flute) और टाइमर मिलेगा।`;
    }
    // 7E. Identity
    if (/^(who are you|tum kaun ho|aap kaun ho|tum kon ho|apna parichay)/i.test(qLower)) {
      return `मैं **SK MISSION BOARD** का आधिकारिक AI Study Assistant हूँ। 🎓🤖\n\nमैं आपके अध्ययन के सभी सवालों, सामान्य ज्ञान, गणित व विज्ञान के प्रश्नों, और ऐप नेविगेशन में सहायता प्रदान करता हूँ।`;
    }

    // 8. Matched PDF Resource Context (if specific resource requested)
    if (matchedPdfs && matchedPdfs.length > 0 && /pdf|notes|chapter/i.test(qLower)) {
      const first = matchedPdfs[0];
      return `📖 **${first.title}:**\n\n- **अध्याय**: ${first.chapterTitle || "Notes"}\n- **विषय**: ${first.subjectId}\n\n👉 इस टॉपिक का पूरा PDF पढ़ने के लिए नीचे दिए गए **'Open PDF Notes'** बटन पर टैप करें।`;
    }

    // 9. CLEAN TECHNICAL FAILURE FALLBACK (NO MISLEADING FORMULA/EQUATION PROMPT!)
    return `अभी AI सेवा से उत्तर प्राप्त करने में अस्थायी समस्या आ रही है। कृपया थोड़ी देर बाद दोबारा प्रयास करें।`;
  }

  // AI STUDY ASSISTANT ENDPOINT (MULTIMODAL & INTELLIGENT ROUTING)
  app.post("/api/ai/study-assistant", async (req, res) => {
    try {
      const { 
        messages = [], 
        currentQuery = "", 
        imageBase64, 
        imageMimeType,
        internalPdfs = [], 
        internalVideos = [], 
        chapters = [],
        userProfile = null
      } = req.body;

      if (!currentQuery && !imageBase64) {
        return res.status(400).json({ error: "Either currentQuery or image is required" });
      }

      const ai = getGenAI();

      // Resource matching based on actual query
      const queryLower = (currentQuery || "").toLowerCase();
      const matchedPdfs = internalPdfs.filter((p: any) => {
        if (!queryLower || queryLower.length < 2) return false;
        const titleMatch = p.title && queryLower.includes(p.title.toLowerCase().trim());
        const chapterMatch = p.chapterTitle && (queryLower.includes(p.chapterTitle.toLowerCase().trim()) || p.chapterTitle.toLowerCase().includes(queryLower));
        const tagMatch = p.tags && Array.isArray(p.tags) && p.tags.some((t: string) => queryLower.includes(t.toLowerCase().trim()));
        const topicMatch = p.topic && queryLower.includes(p.topic.toLowerCase().trim());
        return titleMatch || chapterMatch || tagMatch || topicMatch;
      });

      const matchedVideos = internalVideos.filter((v: any) => {
        if (!queryLower || queryLower.length < 2) return false;
        const titleMatch = v.title && queryLower.includes(v.title.toLowerCase().trim());
        const chapterMatch = v.chapterTitle && (queryLower.includes(v.chapterTitle.toLowerCase().trim()) || v.chapterTitle.toLowerCase().includes(queryLower));
        const tagMatch = v.tags && Array.isArray(v.tags) && v.tags.some((t: string) => queryLower.includes(t.toLowerCase().trim()));
        const topicMatch = v.topic && queryLower.includes(v.topic.toLowerCase().trim());
        return titleMatch || chapterMatch || tagMatch || topicMatch;
      });

      // Personalization profile context
      let personalizationDirective = "";
      if (userProfile && userProfile.name && String(userProfile.name).trim()) {
        const studentName = String(userProfile.name).trim();
        personalizationDirective = `CURRENT USER PROFILE (DYNAMIC DATA):
The current user's exact name from their profile is: "${studentName}".
- When greeting (e.g. "Hii", "Hello", "Namaste", "Hi"), address the student warmly using their exact profile name: "${studentName}" (e.g. "नमस्ते ${studentName}! 👋").
- STRICT RULE: Always use the exact name "${studentName}" provided here. Never assume, invent, or default to any other name from examples.`;
      } else {
        personalizationDirective = `CURRENT USER PROFILE: The student has not provided a profile name. Greet them warmly as a student without assuming any specific person's name.`;
      }

      // Comprehensive, Intelligent & User-Intent Driven System Instruction
      const systemInstruction = `You are SK AI Study Assistant for Bihar Board Class 10 students.

Answer the user's actual question directly and accurately.

Do not assume that every question is a mathematics, science, chapter, or exam question.

First understand what the user is asking. Then answer according to the actual topic.

For general knowledge questions, provide the direct factual answer.

For casual conversation and greetings ("Hii", "Aap kaise ho?"), respond naturally and warmly.

For mathematics ("2x + 5 = 15", "Pythagoras theorem"), provide a clear step-by-step solution.

For science and academic questions ("Photosynthesis kya hai?", "प्रकाश का परावर्तन"), explain the relevant concept with definition and key formulas/examples.

Use Bihar Board/Class 10 exam-oriented guidance only when the question is actually related to Bihar Board or Class 10 studies.

Never replace a factual answer with a generic study template.

Never ask the user to provide an equation when the user has asked a factual/general question.

Always answer the user's question directly before adding any optional related study information.

Do not quote or repeat the user's entire question before answering (e.g. avoid starting with "आपके प्रश्न '...' का उत्तर"). Give a clean, direct, natural answer.

Maintain conversational context across multi-turn messages (e.g., if user asks "Gandhi ji ka janm kab hua?" and follows up with "Unki mrityu kab hui?", understand that "Unki" refers to Mahatma Gandhi).

Respond in the user's language (Hindi, Hinglish, or English).
${personalizationDirective}`;

      // Build clean alternating conversation history for Gemini API
      const chatHistory = formatChatHistoryForGemini(messages, currentQuery, imageBase64, imageMimeType);

      let generatedText = "";

      if (ai) {
        try {
          generatedText = await generateContentSafe(ai, {
            contents: chatHistory,
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 2048
          });
        } catch (geminiError: any) {
          console.warn("Gemini API fallback engaged:", geminiError?.message || geminiError);
          generatedText = generateServerFallbackResponse(currentQuery, userProfile, matchedPdfs, messages);
        }
      } else {
        generatedText = generateServerFallbackResponse(currentQuery, userProfile, matchedPdfs, messages);
      }

      // Check if query was asking for PDF or video
      const isPdfRequest = /pdf|नोट्स|notes|किताब|book/i.test(currentQuery);
      const isVideoRequest = /video|वीडियो|lecture|क्लास/i.test(currentQuery);

      res.json({
        text: generatedText,
        matchedPdfIds: matchedPdfs.map((p: any) => p.id),
        matchedVideoIds: matchedVideos.map((v: any) => v.id),
        suggestedPdfs: matchedPdfs.map((p: any) => ({
          id: p.id,
          title: p.title,
          chapterTitle: p.chapterTitle,
          subjectId: p.subjectId,
          fileUrl: p.fileUrl,
          isInternal: true
        })),
        suggestedVideos: matchedVideos.map((v: any) => ({
          id: v.id,
          title: v.title,
          youtubeUrl: v.youtubeUrl,
          youtubeVideoId: v.youtubeVideoId
        })),
        isPdfUnavailable: isPdfRequest && matchedPdfs.length === 0,
        isVideoUnavailable: isVideoRequest && matchedVideos.length === 0
      });

    } catch (err: any) {
      console.error("AI Study Assistant error:", err);
      res.status(500).json({ 
        error: "AI service temporarily unavailable. Please try again.",
        details: err.message 
      });
    }
  });

  // EXTERNAL PDF DISCOVERY SEARCH ENDPOINT
  app.post("/api/ai/search-pdf", async (req, res) => {
    try {
      const { topic, subjectId = "science", chapterTitle = "" } = req.body;

      if (!topic || typeof topic !== "string") {
        return res.status(400).json({ error: "topic is required" });
      }

      const ai = getGenAI();

      let discoveredItems: any[] = [];

      if (ai) {
        try {
          const prompt = `You are a curriculum resource locator for Bihar Board (BSEB) Class 10.
User is searching for educational study PDFs for Topic: "${topic}", Subject: "${subjectId}", Chapter: "${chapterTitle}".

Find or generate 3-4 realistic, educational candidate PDF study resources from verified open educational sources (e.g. NCERT Official Portal, BSEB Bihar State Repository, DIKSHA Portal, State Open Educational Resources).

Output strictly valid JSON with an array of objects:
[
  {
    "title": "Exact descriptive Hindi/English title of study notes",
    "topic": "${topic}",
    "source": "Source repository name (e.g. NCERT Official Portal, Bihar State Text Book Board, DIKSHA Open Portal)",
    "url": "https://ncert.nic.in/textbook.php?jesc1=1-16 (or relevant authoritative educational link)",
    "subjectId": "${subjectId}",
    "chapterTitle": "${chapterTitle || topic}",
    "classLevel": 10,
    "relevanceScore": 95,
    "qualityNotes": "High-quality comprehensive Hindi medium notes covering definitions, diagrams, and board questions."
  }
]`;

          const rawText = await generateContentSafe(ai, {
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            temperature: 0.2,
            responseMimeType: "application/json"
          });

          discoveredItems = extractJsonArray(rawText);
        } catch (aiErr: any) {
          // Graceful fallback to verified curated BSEB links when AI demand spike occurs
          console.warn("AI PDF discovery using curated BSEB fallback repository");
        }
      }

      // Default curated candidates if AI did not return or returned empty
      if (!discoveredItems || discoveredItems.length === 0) {
        const subjectRepoMap: Record<string, { portal: string; url: string; note: string }> = {
          science: {
            portal: "NCERT & BSEB Science e-Library",
            url: "https://ncert.nic.in/textbook.php?jesc1=1-16",
            note: "बिहार बोर्ड कक्षा 10वीं विज्ञान: भौतिकी, रसायन एवं जीवविज्ञान सम्पूर्ण अध्याय नोट्स।"
          },
          math: {
            portal: "NCERT & BSEB Ganit e-Repository",
            url: "https://ncert.nic.in/textbook.php?jemh1=1-15",
            note: "बिहार बोर्ड कक्षा 10वीं गणित: सभी प्रमेय, सूत्र एवं प्रश्नावली हल।"
          },
          social_science: {
            portal: "BSEB Samajik Vigyan Resource Portal",
            url: "https://ncert.nic.in/textbook.php?jess1=1-5",
            note: "इतिहास, भूगोल, राजनीति विज्ञान एवं अर्थशास्त्र 2-अंकीय व 5-अंकीय प्रश्नोत्तर।"
          },
          hindi: {
            portal: "Bihar State Hindi Textbook Repository",
            url: "https://ncert.nic.in/textbook.php?jhhk1=1-12",
            note: "गोधूलि भाग 2 एवं वर्णिका भाग 2: काव्य खंड, गद्य खंड एवं व्याकरण।"
          },
          sanskrit: {
            portal: "BSEB Sanskrit Piyusham Repository",
            url: "https://ncert.nic.in/textbook.php?jhsk1=1-14",
            note: "पीयूषम् भाग 2: सभी पाठों के श्लोकार्थ, संधि, समास एवं अनुवाद।"
          },
          english: {
            portal: "NCERT Panorama English Portal",
            url: "https://ncert.nic.in/textbook.php",
            note: "Panorama Part 2: Prose, Poetry, Reading Comprehension & Grammar."
          }
        };

        const matchedSubjectMeta = subjectRepoMap[subjectId] || subjectRepoMap["science"];

        discoveredItems = [
          {
            title: `${topic} - बिहार बोर्ड कक्षा 10वीं सम्पूर्ण अध्याय नोट्स`,
            topic: topic,
            source: matchedSubjectMeta.portal,
            url: matchedSubjectMeta.url,
            subjectId: subjectId,
            chapterTitle: chapterTitle || topic,
            classLevel: 10,
            relevanceScore: 96,
            qualityNotes: matchedSubjectMeta.note
          },
          {
            title: `${topic} - महत्वपूर्ण प्रश्नोत्तर, वस्तुनिष्ठ (MCQ) एवं सारांश`,
            topic: topic,
            source: "DIKSHA Educational Portal (BSEB)",
            url: "https://diksha.gov.in",
            subjectId: subjectId,
            chapterTitle: chapterTitle || topic,
            classLevel: 10,
            relevanceScore: 92,
            qualityNotes: "मैट्रिक परीक्षा 2026 अभ्यास हेतु मॉडल पेपर्स एवं उत्तरमाला।"
          }
        ];
      }

      res.json({
        success: true,
        topic,
        results: discoveredItems
      });

    } catch (err: any) {
      console.error("External PDF search error:", err);
      res.status(500).json({ error: "PDF search failed", details: err.message });
    }
  });

  // Serve static assets in production or mount Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SK MISSION BOARD] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

