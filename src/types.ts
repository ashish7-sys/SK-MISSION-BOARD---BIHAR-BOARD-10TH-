export type SubjectId = "hindi" | "english" | "math" | "science" | "social_science" | "sanskrit";

export interface SubjectInfo {
  id: SubjectId;
  nameHindi: string;
  nameEnglish: string;
  code: string;
  iconName: string;
  themeColor: string;
  totalChapters: number;
  description: string;
  bookNames: string[];
}

export interface Chapter {
  id: string;
  subjectId: SubjectId;
  chapterNumber: number;
  titleHindi: string;
  titleEnglish?: string;
  subtitle?: string;
  isImportant?: boolean;
  hasPdfs?: boolean;
  hasVideos?: boolean;
}

export type PdfSourceType = "DIRECT_UPLOAD" | "DRIVE_LINK" | "OFFLINE_LOCAL";

export interface UnifiedPdfDocument {
  id: string;
  title: string;
  sourceType: PdfSourceType;
  remoteUrl?: string;
  localFileUri?: string;
  fileSizeMb?: number;
  mimeType?: string;
  pageCount?: number;
  chapterTitle?: string;
  subjectId?: SubjectId;
  chapterId?: string;
  downloadStatus?: "idle" | "downloading" | "completed" | "failed";
  downloadProgress?: number;
  offlineAvailable?: boolean;
  lastUpdated?: string;
}

export interface PDFMaterial {
  id: string;
  subjectId: SubjectId;
  chapterId: string;
  chapterTitle: string;
  title: string;
  description: string;
  fileUrl: string;
  fileSizeMb?: number;
  pageCount?: number;
  uploadDate: string;
  updatedDate?: string;
  isNew?: boolean;
  isUpdated?: boolean;
  isPublished: boolean;
  orderIndex: number;
  sourceType?: PdfSourceType;
  localFileUri?: string;
  offlineAvailable?: boolean;
  tags?: string[];
  topic?: string;
  subtopic?: string;
  classLevel?: number;
  language?: "hindi" | "english" | "bilingual";
  resourceType?: string;
  isAiDiscovered?: boolean;
  sourceName?: string;
}

export interface YouTubeVideo {
  id: string;
  subjectId: SubjectId;
  chapterId: string;
  chapterTitle: string;
  title: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  description: string;
  durationText?: string;
  uploadDate: string;
  isPublished: boolean;
  orderIndex: number;
  tags?: string[];
  topic?: string;
  subtopic?: string;
}

export type AnnouncementType = "INFO" | "IMPORTANT" | "NEW_CONTENT" | "UPDATE" | "NOTICE";

export interface Announcement {
  id: string;
  title: string;
  content: string;
  message?: string;
  type?: AnnouncementType;
  date: string;
  startTime?: string;
  endTime?: string;
  actionButton?: string;
  actionUrl?: string;
  isImportant?: boolean;
  isActive?: boolean;
  isPublished: boolean;
}

export interface RemoteFeatureFlags {
  ai: boolean;
  music: boolean;
  videos: boolean;
  pdfSearch: boolean;
  announcements: boolean;
  globalSearch: boolean;
  bookmarks: boolean;
}

export interface MusicTrack {
  id: string;
  title: string;
  audioUrl: string;
  durationText?: string;
  isPublished: boolean;
  orderIndex: number;
  addedDate?: string;
}

export interface WhatsNewItem {
  category?: "feature" | "fix" | "improvement" | string;
  title?: string;
  description: string;
}

export interface AppVersionInfo {
  versionName: string;
  versionCode: number;
  releaseDate: string;
  apkDownloadUrl: string;
  apkUrl?: string; // alias for remote JSON standard
  updateMessage?: string; // custom remote update message
  forceUpdate?: boolean; // toggle mandatory upgrade screen
  releaseNotes: string[];
  whatsNew?: (string | WhatsNewItem)[];
  isMandatory: boolean;
  latestVersionCode: number;
  latestVersionName?: string;
}

export type NavTab = "home" | "subject" | "ai" | "music" | "download" | "special";

export type BookmarkType = "pdf" | "video" | "chapter" | "resource";

export interface BookmarkItem {
  id: string;
  targetId: string;
  type: BookmarkType;
  title: string;
  subjectId?: SubjectId;
  subjectName?: string;
  chapterTitle?: string;
  chapterNumber?: number;
  fileUrl?: string;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  description?: string;
  addedAt: string;
}

export interface DownloadedItem {
  id: string;
  title: string;
  fileType: "pdf" | "music" | "other";
  fileUrl: string;
  subjectId?: SubjectId;
  subjectName?: string;
  chapterTitle?: string;
  fileSize?: string;
  downloadedAt: string;
  status: "completed" | "downloading" | "failed" | "paused" | "queued";
  progress?: number; // 0 to 100
  downloadedBytes?: number;
  totalBytes?: number;
  errorMsg?: string;
  isOfflineAvailable?: boolean;
  blobStorageKey?: string;
}

export type ViewTab = "home" | "subjects" | "pdfs" | "videos" | "music" | "announcements" | "updates" | "admin" | "ai_assistant";

// AI STUDY ASSISTANT TYPES
export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  topic?: string;
  subjectId?: SubjectId;
  chapterTitle?: string;
  imageUrl?: string;
  imageBase64?: string;
  matchedPdfIds?: string[];
  matchedVideoIds?: string[];
  suggestedPdfs?: Array<{
    id?: string;
    title: string;
    chapterTitle?: string;
    subjectId?: SubjectId;
    fileUrl?: string;
    isInternal: boolean;
  }>;
  suggestedVideos?: Array<{
    id?: string;
    title: string;
    youtubeUrl?: string;
    youtubeVideoId?: string;
  }>;
  isPdfUnavailable?: boolean;
  isVideoUnavailable?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  currentTopic?: string;
  subjectId?: SubjectId;
  chapterId?: string;
  messages: ChatMessage[];
  discoveredPdfIds?: string[];
}

export interface AiDiscoveredResource {
  id: string;
  topic: string;
  title: string;
  source: string;
  url: string;
  subjectId: SubjectId;
  chapterTitle?: string;
  classLevel: number;
  relevanceScore?: number;
  qualityNotes?: string;
  discoveredAt: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string;
  reviewedBy?: string;
}

export type UserGender = "male" | "female" | "prefer_not_to_say";

export interface UserProfile {
  userId: string;
  name: string;
  gender?: UserGender;
  villageOrTown?: string;
  createdAt: string;
  updatedAt: string;
  isProfileCompleted: boolean;
}

export type AnalyticsTimeframe = "today" | "7days" | "30days" | "all";

export type AnalyticsEventType = 
  | "app_open"
  | "subject_view"
  | "chapter_view"
  | "pdf_view"
  | "pdf_open"
  | "pdf_download"
  | "video_open"
  | "video_play"
  | "music_play"
  | "ai_conversation_start"
  | "ai_question"
  | "ai_pdf_request"
  | "ai_video_request";

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: string;
  date: string;
  targetId?: string;
  targetTitle?: string;
  subjectId?: SubjectId;
  chapterTitle?: string;
  meta?: {
    hasImage?: boolean;
    isDownload?: boolean;
    count?: number;
  };
}

export interface ResourceAnalyticsStat {
  id: string;
  type: "pdf" | "video" | "music" | "chapter" | "subject";
  title: string;
  subjectId?: SubjectId;
  chapterTitle?: string;
  views: number;
  opens: number;
  plays: number;
  downloads: number;
}

export interface AnalyticsSummary {
  timeframe: AnalyticsTimeframe;
  totalActiveUsers: number;
  dailyActiveUsers: number;
  todayActiveUsers: number;
  totalAppOpens: number;
  totalResourceViews: number;
  totalPdfOpens: number;
  totalPdfViews: number;
  totalPdfDownloads: number;
  totalVideoOpens: number;
  totalVideoPlays: number;
  totalMusicPlays: number;
  aiConversationsStarted: number;
  aiQuestionsAsked: number;
  aiImageQuestions: number;
  aiPdfRequests: number;
  aiVideoRequests: number;
  topSubjects: Array<{ subjectId: SubjectId; name: string; nameHindi: string; count: number; percentage: number }>;
  topChapters: Array<{ chapterId: string; title: string; subjectId: SubjectId; count: number }>;
  resourceStats: {
    pdfs: ResourceAnalyticsStat[];
    videos: ResourceAnalyticsStat[];
    music: ResourceAnalyticsStat[];
  };
  dailyActivityTrend: Array<{
    date: string;
    label: string;
    users: number;
    pdfOpens: number;
    videoPlays: number;
    aiQuestions: number;
  }>;
}

export interface AppBranding {
  appName: string;
  appSubtitle: string;
  logoUrl: string;
  themeVideoUrl?: string;
  accentTheme?: "cosmic" | "neon" | "gold" | "cyberpunk" | "emerald";
  customCss?: string;
}

export type HealthIssueSeverity = "critical" | "warning" | "info";

export interface DiagnosticIssue {
  id: string;
  title: string;
  description: string;
  severity: HealthIssueSeverity;
  category: "branding" | "flags" | "resources" | "network" | "storage" | "integrity";
  suggestedAction: string;
  autoFixPayload?: {
    actionType: string;
    payload: any;
  };
}

export interface AppHealthScanResult {
  scanTimestamp: string;
  status: "healthy" | "warning" | "critical";
  score: number; // 0 - 100
  issues: DiagnosticIssue[];
  metrics: {
    totalPdfs: number;
    totalVideos: number;
    totalMusic: number;
    totalAnnouncements: number;
    brokenLinksCount: number;
    flagsStatus: Record<string, boolean>;
    brandingConfigured: boolean;
  };
}



