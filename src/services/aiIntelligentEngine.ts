import { 
  SubjectId, 
  PDFMaterial, 
  YouTubeVideo, 
  Chapter, 
  UserProfile,
  ChatMessage 
} from "../types";
import { APP_METADATA, APP_NAVIGATION_MAP, STEP_BY_STEP_GUIDES, FEATURE_AVAILABILITY } from "../data/appKnowledge";
import { OFFICIAL_SUBJECTS, INITIAL_CHAPTERS } from "../data/bsebClass10Data";

export type ContinuityType = 
  | "CONTINUATION"     // Current message expands previous request (same task)
  | "REFINEMENT"        // Modifies/refines previous requirements (e.g. faster, add emoji, shorter)
  | "OUTPUT_REQUEST"    // Asking for output (prompt, code, steps, implementation)
  | "NEW_TOPIC"         // Clean switch to new topic
  | "MIXED_INTENT"      // Combines old context with new topic/action
  | "SINGLE_QUERY";     // Standalone query without history

export type InternalIntent = 
  | "APP_NAVIGATION"
  | "APP_FEATURE"
  | "STUDY"
  | "TROUBLESHOOTING"
  | "AI_IMPROVEMENT"
  | "PROMPT_REQUEST"
  | "CODE_REQUEST"
  | "CONTINUATION"
  | "REFINEMENT"
  | "NEW_TOPIC"
  | "MIXED_INTENT"
  | "GENERAL_CONVERSATION";

export interface ContextAnalysisResult {
  continuity: ContinuityType;
  primaryIntent: InternalIntent;
  resolvedMeaning: string;
  activeTopic: string;
  activeSubject?: SubjectId;
  accumulatedTaskRequirements: string[];
  isPromptRequest: boolean;
  isCodeRequest: boolean;
  isAppNavigation: boolean;
  isAcademicStudy: boolean;
  needsClarification: boolean;
  clarificationQuestion?: string;
  suggestedSteps?: string[];
}

export class AiIntelligentEngine {
  /**
   * Extract conversational task state and accumulated requirements from message history
   */
  public static extractTaskState(history: Array<{ sender: string; text: string }> = []): {
    accumulatedRequirements: string[];
    recentTopics: string[];
    isAiImprovementDiscussion: boolean;
    lastUserQuery: string;
    lastAssistantText: string;
    discussedSubjects: SubjectId[];
  } {
    const accumulatedRequirements: string[] = [];
    const recentTopics: string[] = [];
    const discussedSubjects: SubjectId[] = [];
    let isAiImprovementDiscussion = false;
    let lastUserQuery = "";
    let lastAssistantText = "";

    for (const m of history) {
      if (!m.text) continue;
      const text = m.text.trim();

      if (m.sender === "user") {
        lastUserQuery = text;
        const lower = text.toLowerCase();

        // Check if discussing AI / App improvements
        if (/ai|prompt|feature|bot|response|memory|navigation|context|studio|bug|slow|fast|delay|greeting|improve|theek karo|sahi karo/i.test(lower)) {
          isAiImprovementDiscussion = true;
          accumulatedRequirements.push(text);
        }

        // Detect subjects mentioned
        if (/vigyan|science|physics|chemistry|biology/i.test(lower)) discussedSubjects.push("science");
        if (/ganit|math|maths/i.test(lower)) discussedSubjects.push("math");
        if (/social|samajik|history|geography|civics/i.test(lower)) discussedSubjects.push("social_science");
        if (/hindi|godhuli|varnika/i.test(lower)) discussedSubjects.push("hindi");
        if (/sanskrit|piyusham/i.test(lower)) discussedSubjects.push("sanskrit");
        if (/english|panorama/i.test(lower)) discussedSubjects.push("english");

      } else if (m.sender === "assistant") {
        lastAssistantText = text;
      }
    }

    return {
      accumulatedRequirements,
      recentTopics,
      isAiImprovementDiscussion,
      lastUserQuery,
      lastAssistantText,
      discussedSubjects
    };
  }

  /**
   * Deeply analyze current query in light of previous conversation history
   */
  public static analyzeConversationContext(
    currentQuery: string,
    history: Array<{ sender: string; text: string }> = [],
    previousTopic?: string,
    previousSubject?: SubjectId
  ): ContextAnalysisResult {
    const q = (currentQuery || "").trim();
    const qLower = q.toLowerCase();
    const taskState = AiIntelligentEngine.extractTaskState(history);

    // 1. Check for OUTPUT_REQUEST / PROMPT_REQUEST
    const isPromptKeyword = /prompt.*(do|dijiye|bana|chahiye|de|dena)|(iske|iska|uska|ai studio).*prompt|prompt.*(ai studio|banao)/i.test(qLower) ||
      /^(prompt do|prompt de do|prompt dijiye|prompt bana do|abhi prompt do|ab prompt do|iske liye prompt do|iska prompt do|ai studio ke liye prompt do|prompt|give prompt|generate prompt)$/i.test(qLower);

    const isCodeKeyword = /code.*(do|dijiye|likho|dikhao)|(isko|ise).*implement.*(karo|kijiye)|(iske|iska).*code/i.test(qLower) ||
      /^(code do|code likho|implement karo|ab code do|iske liye code do)$/i.test(qLower);

    if (isPromptKeyword) {
      const resolved = taskState.isAiImprovementDiscussion
        ? "User is requesting an AI Studio implementation prompt synthesizing all discussed AI/App improvements."
        : previousTopic
        ? `User is requesting an implementation/study prompt for "${previousTopic}".`
        : "User is requesting a comprehensive implementation prompt based on the active discussion.";

      return {
        continuity: "OUTPUT_REQUEST",
        primaryIntent: "PROMPT_REQUEST",
        resolvedMeaning: resolved,
        activeTopic: previousTopic || "AI Improvement Task",
        activeSubject: previousSubject || (taskState.discussedSubjects.length > 0 ? taskState.discussedSubjects[taskState.discussedSubjects.length - 1] : undefined),
        accumulatedTaskRequirements: taskState.accumulatedRequirements,
        isPromptRequest: true,
        isCodeRequest: false,
        isAppNavigation: false,
        isAcademicStudy: false,
        needsClarification: false
      };
    }

    if (isCodeKeyword) {
      return {
        continuity: "OUTPUT_REQUEST",
        primaryIntent: "CODE_REQUEST",
        resolvedMeaning: "User is requesting executable code/implementation for the current task.",
        activeTopic: previousTopic || "Code Implementation",
        activeSubject: previousSubject,
        accumulatedTaskRequirements: taskState.accumulatedRequirements,
        isPromptRequest: false,
        isCodeRequest: true,
        isAppNavigation: false,
        isAcademicStudy: false,
        needsClarification: false
      };
    }

    // 2. Check for REFINEMENT or CONTINUATION phrases with pronouns
    const isRefinementPhrase = /^(ise|isko|isme|ismein|ye|yeh|iska|iski|unhe|unko)\s*(bhi|aur|bhee)?\s*(theek|sahi|fast|improve|add|chota|bada|shorter|longer|emoji|speed)/i.test(qLower) ||
      /(ise bhi theek karo|isme ye bhi add kar do|ise aur fast karo|iska response chota rakho|isme emoji bhi add karo|wahi wala bana do|isko update karo)/i.test(qLower);

    const isContinuationPhrase = /^(aur|aur bhi|and|also|plus|iske sath|iske saath|saath me|phir|fir|aur usko|aur use)/i.test(qLower) ||
      /^(aur.*kahan|aur.*kaise|aur response|aur speed|aur pdf)/i.test(qLower);

    if (isRefinementPhrase || isContinuationPhrase) {
      const isRefinement = isRefinementPhrase;
      const resolved = `Continuation/Refinement of active task "${previousTopic || 'Current Topic'}": Adding requirement: "${q}"`;
      
      const newRequirements = [...taskState.accumulatedRequirements, q];

      return {
        continuity: isRefinement ? "REFINEMENT" : "CONTINUATION",
        primaryIntent: isRefinement ? "REFINEMENT" : "CONTINUATION",
        resolvedMeaning: resolved,
        activeTopic: previousTopic || (taskState.isAiImprovementDiscussion ? "AI Improvement" : "Current Task"),
        activeSubject: previousSubject,
        accumulatedTaskRequirements: newRequirements,
        isPromptRequest: false,
        isCodeRequest: false,
        isAppNavigation: /pdf|music|download|search|exit/i.test(qLower),
        isAcademicStudy: /science|math|formula|chapter|shloka|concept/i.test(qLower),
        needsClarification: false
      };
    }

    // 3. Pronoun-led Short References (e.g. "अब इसका PDF app में कहाँ मिलेगा?", "इसके नोट्स कहाँ हैं?")
    if (/(iska|iske|uski|uske|iska wala)\s*(pdf|notes|video|chapter|kahan|kidhar|kaise)/i.test(qLower)) {
      const subject = previousSubject || (taskState.discussedSubjects.length > 0 ? taskState.discussedSubjects[taskState.discussedSubjects.length - 1] : undefined);
      return {
        continuity: "MIXED_INTENT",
        primaryIntent: "APP_NAVIGATION",
        resolvedMeaning: `Find PDF/resources for previous topic "${previousTopic || 'selected subject'}" in the app.`,
        activeTopic: previousTopic || "PDF Navigation",
        activeSubject: subject,
        accumulatedTaskRequirements: taskState.accumulatedRequirements,
        isPromptRequest: false,
        isCodeRequest: false,
        isAppNavigation: true,
        isAcademicStudy: false,
        needsClarification: false,
        suggestedSteps: STEP_BY_STEP_GUIDES.howToFindPdf
      };
    }

    // 4. Check for Clear NEW_TOPIC: Academic Subject Intent
    let matchedSubject: SubjectId | undefined = undefined;
    if (/vigyan|science|physics|chemistry|biology|bhautiki|rasayan|jeev vigyan/i.test(qLower)) matchedSubject = "science";
    else if (/ganit|math|maths|ankganit|rekhaganit|trigonometry/i.test(qLower)) matchedSubject = "math";
    else if (/social|samajik|itihaas|history|geography|bhugol|civics|nagrik|arthshastra|economics/i.test(qLower)) matchedSubject = "social_science";
    else if (/hindi|godhuli|varnika/i.test(qLower)) matchedSubject = "hindi";
    else if (/sanskrit|piyusham|shloka|sandhi|dhatu/i.test(qLower)) matchedSubject = "sanskrit";
    else if (/english|panorama|grammar/i.test(qLower)) matchedSubject = "english";

    // 5. App Navigation Intent
    const hasPdfWord = /pdf|notes|download/i.test(qLower);
    const hasMusicWord = /music|gaana|audio|focus|lofi/i.test(qLower);
    const hasExitAi = /exit ai|ai se bahar|bahar kaise nikle|home par kaise jaye/i.test(qLower);
    const hasSearch = /search|khoje/i.test(qLower);
    const hasBookmarks = /bookmark|favorite|pasandida/i.test(qLower);

    if (hasExitAi) {
      return {
        continuity: "NEW_TOPIC",
        primaryIntent: "APP_NAVIGATION",
        resolvedMeaning: "User wants to exit AI screen back to Home.",
        activeTopic: "Exit AI",
        accumulatedTaskRequirements: [],
        isPromptRequest: false,
        isCodeRequest: false,
        isAppNavigation: true,
        isAcademicStudy: false,
        needsClarification: false,
        suggestedSteps: STEP_BY_STEP_GUIDES.howToExitAi
      };
    }

    if (hasMusicWord) {
      return {
        continuity: "NEW_TOPIC",
        primaryIntent: "APP_NAVIGATION",
        resolvedMeaning: "User is asking about Study Music & Focus player.",
        activeTopic: "Study Music",
        accumulatedTaskRequirements: [],
        isPromptRequest: false,
        isCodeRequest: false,
        isAppNavigation: true,
        isAcademicStudy: false,
        needsClarification: false,
        suggestedSteps: STEP_BY_STEP_GUIDES.howToFindMusic
      };
    }

    if (hasPdfWord && matchedSubject) {
      return {
        continuity: "MIXED_INTENT",
        primaryIntent: "MIXED_INTENT",
        resolvedMeaning: `User wants PDF notes and guidance for subject: ${matchedSubject}.`,
        activeTopic: `${matchedSubject} PDF Notes`,
        activeSubject: matchedSubject,
        accumulatedTaskRequirements: [],
        isPromptRequest: false,
        isCodeRequest: false,
        isAppNavigation: true,
        isAcademicStudy: true,
        needsClarification: false,
        suggestedSteps: STEP_BY_STEP_GUIDES.howToFindPdf
      };
    }

    if (hasPdfWord) {
      return {
        continuity: "NEW_TOPIC",
        primaryIntent: "APP_NAVIGATION",
        resolvedMeaning: "User is asking how to find or download PDFs in the app.",
        activeTopic: "PDF Finder",
        accumulatedTaskRequirements: [],
        isPromptRequest: false,
        isCodeRequest: false,
        isAppNavigation: true,
        isAcademicStudy: false,
        needsClarification: false,
        suggestedSteps: qLower.includes("download") ? STEP_BY_STEP_GUIDES.howToFindDownloadedPdf : STEP_BY_STEP_GUIDES.howToFindPdf
      };
    }

    if (matchedSubject) {
      return {
        continuity: "NEW_TOPIC",
        primaryIntent: "STUDY",
        resolvedMeaning: `Academic study question on subject: ${matchedSubject}.`,
        activeTopic: q.length < 50 ? q : `${matchedSubject} Study Topic`,
        activeSubject: matchedSubject,
        accumulatedTaskRequirements: [],
        isPromptRequest: false,
        isCodeRequest: false,
        isAppNavigation: false,
        isAcademicStudy: true,
        needsClarification: false
      };
    }

    // Identity / New User
    if (/^(who are you|tum kaun ho|aap kaun ho|tum kon ho|apna parichay)/i.test(qLower)) {
      return {
        continuity: "SINGLE_QUERY",
        primaryIntent: "GENERAL_CONVERSATION",
        resolvedMeaning: "Identity inquiry.",
        activeTopic: "AI Assistant Identity",
        accumulatedTaskRequirements: [],
        isPromptRequest: false,
        isCodeRequest: false,
        isAppNavigation: true,
        isAcademicStudy: false,
        needsClarification: false
      };
    }

    if (/^(hi|hello|hey|namaste|pranam|namaskar)$/i.test(qLower)) {
      return {
        continuity: "SINGLE_QUERY",
        primaryIntent: "GENERAL_CONVERSATION",
        resolvedMeaning: "Greeting.",
        activeTopic: "Greeting",
        accumulatedTaskRequirements: [],
        isPromptRequest: false,
        isCodeRequest: false,
        isAppNavigation: false,
        isAcademicStudy: false,
        needsClarification: false
      };
    }

    // Default Fallback
    return {
      continuity: history.length > 0 ? "CONTINUATION" : "SINGLE_QUERY",
      primaryIntent: "STUDY",
      resolvedMeaning: `General user inquiry: "${q}"`,
      activeTopic: previousTopic || q,
      activeSubject: previousSubject,
      accumulatedTaskRequirements: taskState.accumulatedRequirements,
      isPromptRequest: false,
      isCodeRequest: false,
      isAppNavigation: false,
      isAcademicStudy: true,
      needsClarification: false
    };
  }

  /**
   * Generates a context-rich offline/fallback response, resolving conversation history,
   * continuous tasks, prompt requests, and academic questions.
   */
  public static generateSmartOfflineResponse(
    query: string,
    profile: UserProfile | null,
    matchedPdfs: PDFMaterial[] = [],
    matchedVideos: YouTubeVideo[] = [],
    chapters: Chapter[] = [],
    history: Array<{ sender: string; text: string }> = [],
    previousTopic?: string,
    previousSubject?: SubjectId
  ): string {
    const analysis = AiIntelligentEngine.analyzeConversationContext(query, history, previousTopic, previousSubject);
    const studentName = profile?.name ? profile.name.trim() : "";
    const namePrefix = studentName ? `${studentName}, ` : "";

    // 1. User is requesting an AI Studio Implementation Prompt ("prompt do", "iske liye prompt do")
    if (analysis.isPromptRequest) {
      const requirements = analysis.accumulatedTaskRequirements.length > 0 
        ? analysis.accumulatedTaskRequirements
        : [
            "AI Assistant में generic greeting ('नमस्ते छात्र! आपका प्रश्न प्राप्त हुआ') को पूरी तरह हटाना",
            "App navigation knowledge (PDFs, Downloads, Music, Exit AI, Search) को accurately guide करना",
            "Continuous conversational context और intent detection (Continuation, Refinement, Prompt Request) लागू करना",
            "Bihar Board Class 10th के सभी 6 विषयों का curriculum grounded solution देना",
            "Fast multimodal response और smart offline fallback support"
          ];

      return `यहाँ आपके द्वारा बताए गए सभी सुधारों को लागू करने के लिए **AI Studio Implementation Prompt** तैयार है: 🚀📝\n\n` +
        `\`\`\`markdown\n` +
        `# SK MISSION BOARD - AI Assistant Continuous Context & Knowledge Upgrade\n\n` +
        `## Goal & Purpose:\n` +
        `Upgrade the SK MISSION BOARD AI Assistant into an intelligent, continuous-context-aware study and app navigation tutor for BSEB Class 10 students.\n\n` +
        `## Core Requirements to Implement:\n` +
        requirements.map((req, idx) => `${idx + 1}. **${req}**`).join("\n") +
        `\n\n## Key Behavioral Rules:\n` +
        `- Continuous Context: Treat conversations as continuous flows. Resolve pronouns and short commands ('इसे भी ठीक करो', 'अब prompt दो', 'वही वाला') from previous turns.\n` +
        `- Intent Classification: Distinguish between Academic Study, App Navigation, Prompt Requests, Continuation, Refinements, and New Topics.\n` +
        `- Grounded UI Navigation: Guide users with exact UI names ('Exit AI', 'SUBJECT', 'DOWNLOAD', 'MUSIC', 'HOME', 'Search').\n` +
        `- No Repetitive Greetings: Never start answers with fixed bot formulas.\n` +
        `- Full Multimodal Support: Read diagrams, equations, and question images accurately.\n` +
        `\`\`\`\n\n` +
        `👉 आप इस prompt को सीधे कॉपी करके AI Studio में उपयोग कर सकते हैं। क्या आप इसमें कोई और विशिष्ट नियम जोड़ना चाहते हैं?`;
    }

    // 2. User is requesting Code implementation
    if (analysis.isCodeRequest) {
      return `यहाँ आपके अनुरोधित टास्क का कार्यान्वयन (Implementation Overview) है: 💻⚙️\n\n` +
        `- **Context Management**: \`AiIntelligentEngine\` लगातार बातचीत के इतिहास (History) का विश्लेषण करके टास्क स्टेट और रिक्वायरमेंट्स को ट्रैक करता है।\n` +
        `- **Intent Routing**: \`analyzeConversationContext\` फंक्शन के द्वारा \`CONTINUATION\`, \`REFINEMENT\`, \`OUTPUT_REQUEST\` और \`NEW_TOPIC\` को तुरंत क्लासिफाई किया जाता है।\n` +
        `- **Seamless Continuity**: अब छोटे कमांड्स जैसे *"इसे भी ठीक करो"*, *"अब prompt दो"*, *"इसमें ये भी जोड़ दो"* बिना किसी कन्फ्यूजन के पिछले संदर्भ से हल होते हैं।\n\n` +
        `क्या आप किसी विशेष फाइल (जैसे \`server.ts\` या \`aiStudyService.ts\`) के कोड में कोई अन्य बदलाव करना चाहते हैं?`;
    }

    // 3. App Navigation
    if (analysis.isAppNavigation && analysis.suggestedSteps) {
      return `🧭 **${analysis.activeTopic} - नेविगेशन गाइड:**\n\n` +
        analysis.suggestedSteps.map((step, idx) => `${idx + 1}. ${step}`).join("\n") +
        `\n\n💡 *टिप:* यदि आप इस विषय के किसी खास सवाल या अध्याय को पढ़ना चाहते हैं, तो उसका नाम यहाँ लिखें!`;
    }

    // 4. Mixed Intent: Study + App
    if (analysis.continuity === "MIXED_INTENT") {
      return `📚 **${analysis.activeTopic} (अध्ययन सामग्री एवं गाइड):**\n\n` +
        `1. **ऐप में नोट्स कैसे देखें**: ऊपर दाएँ **'Exit AI'** बटन दबाएँ, नीचे **'SUBJECT'** में जाएँ और संबंधित अध्याय पर टैप करें। वहाँ आपको **'Read PDF'** और **'Download' (⬇️)** दोनों विकल्प मिलेंगे।\n` +
        `2. **अध्ययन सहायता**: इस विषय के मुख्य सूत्रों और बोर्ड परीक्षा 2026 के महत्वपूर्ण प्रश्नों की तैयारी के लिए आप अपना सवाल यहाँ कभी भी पूछ सकते हैं।\n\n` +
        `👉 क्या आप इस अध्याय का कोई विशेष सूत्र या परिभाषा समझना चाहते हैं?`;
    }

    // 5. Identity & Greetings
    if (analysis.primaryIntent === "GENERAL_CONVERSATION") {
      if (/who are you|tum kaun ho|aap kaun ho/i.test(query)) {
        return `मैं **SK MISSION BOARD** का आधिकारिक AI Study Assistant हूँ। 🎓🤖\n\nमैं आपके अध्ययन के सभी प्रश्नों, गणित व विज्ञान के सवालों, और ऐप नेविगेशन में तुरंत सहायता प्रदान करता हूँ।`;
      }
      const namePart = studentName ? ` ${studentName}` : "";
      return `नमस्ते${namePart}! 👋 मैं SK AI Study Assistant हूँ। बताइए, आज क्या पढ़ना या पूछना चाहते हैं?`;
    }

    // 6. GK / Fact checks / Arithmetic
    const qLower = query.toLowerCase();

    // 6A. Arithmetic calculation check
    const arithMatch = query.match(/(\d+(?:\.\d+)?)\s*([\+\-\*\/xX÷×])\s*(\d+(?:\.\d+)?)/);
    if (arithMatch) {
      const n1 = parseFloat(arithMatch[1]);
      const op = arithMatch[2];
      const n2 = parseFloat(arithMatch[3]);
      let resVal = 0;
      let symbol = op;
      if (op === "+") { resVal = n1 + n2; symbol = "+"; }
      else if (op === "-") { resVal = n1 - n2; symbol = "-"; }
      else if (op === "*" || op === "x" || op === "X" || op === "×") { resVal = n1 * n2; symbol = "×"; }
      else if (op === "/" || op === "÷") { 
        if (n2 !== 0) { resVal = n1 / n2; symbol = "÷"; } 
      }
      const formatted = Number.isInteger(resVal) ? resVal.toString() : resVal.toFixed(2);
      return `**${n1} ${symbol} ${n2} = ${formatted}**\n\n(उत्तर: **${formatted}**)`;
    }

    if (/bharat.*rajdhani|capital of india|india.*capital/i.test(qLower)) {
      return `**नई दिल्ली** भारत की राजधानी है।`;
    }
    if (/bihar.*rajdhani|capital of bihar/i.test(qLower)) {
      return `बिहार की राजधानी **पटना** है।`;
    }
    if (/president.*india|bharat.*rashtrapati|rashtrapati.*kaun/i.test(qLower)) {
      return `वर्तमान में भारत की राष्ट्रपति **श्रीमती द्रौपदी मुर्मू** हैं।`;
    }
    if (/prime minister.*india|bharat.*pradhan mantri|pradhanmantri.*kaun|pm of india/i.test(qLower)) {
      return `वर्तमान में भारत के प्रधानमंत्री **श्री नरेंद्र मोदी** हैं।`;
    }
    if ((qLower.includes("cricket") || qLower.includes("khiladi") || qLower.includes("player")) && qLower.includes("bharat ratna")) {
      return `**सचिन तेंदुलकर** भारत रत्न पाने वाले पहले (और एकमात्र) क्रिकेट खिलाड़ी हैं। उन्हें वर्ष **2014** में देश के सर्वोच्च नागरिक सम्मान 'भारत रत्न' से सम्मानित किया गया था।`;
    }
    if (/pythagoras|पाइथागोरस/i.test(qLower)) {
      return `**पाइथागोरस प्रमेय (Pythagoras Theorem):**\n\n` +
        `किसी समकोण त्रिभुज (Right-Angled Triangle) में, **कर्ण (Hypotenuse)** का वर्ग शेष दोनों भुजाओं (**लम्ब एवं आधार**) के वर्गों के योग के बराबर होता है:\n\n` +
        `$$\\text{कर्ण}^2 = \\text{लम्ब}^2 + \\text{आधार}^2$$\n` +
        `$$h^2 = p^2 + b^2$$\n\n` +
        `**उदाहरण:** यदि लम्ब = 3 सेमी और आधार = 4 सेमी हो, तो कर्ण = $\\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$ सेमी।`;
    }
    if (/prakash.*paravartan|reflection.*light/i.test(qLower)) {
      return `**प्रकाश का परावर्तन (Reflection of Light):**\n\n` +
        `जब प्रकाश की किरण किसी पॉलिशदार या चिकनी सतह (जैसे समतल दर्पण) से टकराकर उसी माध्यम में लौटती है, तो इसे **प्रकाश का परावर्तन** कहते हैं।\n\n` +
        `**परावर्तन के दो नियम:**\n` +
        `1. आपतित किरण, परावर्तित किरण और आपतन बिंदु पर अभिलंब — तीनों एक ही तल में होते हैं।\n` +
        `2. आपतन कोण ($\\angle i$) = परावर्तन कोण ($\\angle r$)`;
    }

    // 7. Matched PDF Context
    if (matchedPdfs.length > 0) {
      const first = matchedPdfs[0];
      return `📖 **${first.title}:**\n\n` +
        `- **अध्याय**: ${first.chapterTitle || "Notes"}\n` +
        `- **विषय**: ${first.subjectId}\n\n` +
        `👉 इस टॉपिक का पूरा PDF पढ़ने के लिए नीचे दिए गए **'Open PDF Notes'** बटन पर टैप करें।`;
    }

    // 8. Robust Contextual Study & Academic Advisor Fallback
    const heading = query.length > 40 ? query.substring(0, 40) + "..." : query;
    return `📚 **${heading} — अध्ययन सहायता एवं मुख्य बिंदु:**\n\n` +
      `1. **मुख्य अवधारणा**: बिहार बोर्ड वर्ग 10 के पाठ्यक्रम के अनुसार इस टॉपिक के मुख्य सूत्रों, समीकरणों और परिभाषाओं को ध्यानपूर्वक समझें।\n` +
      `2. **परीक्षा की दृष्टि से**: 2026 बोर्ड परीक्षा में आने वाले महत्वपूर्ण वस्तुनिष्ठ (MCQs) और लघु उत्तरीय प्रश्नों का अभ्यास करें।\n` +
      `3. **PDF नोट्स**: संबंधित विषय का पूरा नोट्स पढ़ने के लिए **'SUBJECT'** सेक्शन में जाएँ।\n\n` +
      `💡 *टिप:* आप यहाँ किसी भी विशिष्ट प्रश्न, गणित के सवाल, या फॉर्मूला के बारे में पूछ सकते हैं!`;
  }

  /**
   * Helper method for single-query intent analysis
   */
  public static analyzeIntent(
    query: string,
    currentTopic?: string,
    history: Array<{ sender: string; text: string }> = []
  ): {
    category: string;
    detectedTopic?: string;
    detectedSubject?: SubjectId;
    isAppHelp: boolean;
    isStudyQuestion: boolean;
    isGreeting: boolean;
    isIdentityQuery: boolean;
    isNewUser: boolean;
    isTroubleshooting: boolean;
  } {
    const analysis = AiIntelligentEngine.analyzeConversationContext(query, history, currentTopic);
    return {
      category: analysis.primaryIntent,
      detectedTopic: analysis.activeTopic,
      detectedSubject: analysis.activeSubject,
      isAppHelp: analysis.isAppNavigation,
      isStudyQuestion: analysis.isAcademicStudy,
      isGreeting: analysis.primaryIntent === "GENERAL_CONVERSATION",
      isIdentityQuery: /who are you|tum kaun ho|aap kaun ho/i.test(query),
      isNewUser: /naya|first time/i.test(query),
      isTroubleshooting: analysis.primaryIntent === "TROUBLESHOOTING"
    };
  }
}
