import React, { useState, useEffect } from "react";
import { 
  SubjectInfo, 
  Chapter, 
  PDFMaterial, 
  YouTubeVideo, 
  Announcement, 
  AppVersionInfo,
  MusicTrack,
  NavTab
} from "./types";
import { OFFICIAL_SUBJECTS } from "./data/bsebClass10Data";
import { StoreService } from "./services/storeService";
import { DownloadService } from "./services/downloadService";
import { BookmarkService } from "./services/bookmarkService";
import { UpdateService } from "./services/updateService";
import { UserService } from "./services/userService";
import { AnalyticsService } from "./services/analyticsService";

// UI Components
import { CosmicBackground } from "./components/CosmicBackground";
import { NeonShaderCanvas } from "./components/NeonShaderCanvas";
import { SplashScreen } from "./components/SplashScreen";
import { LogoHeader } from "./components/LogoHeader";
import { BottomNavBar } from "./components/BottomNavBar";
import { HomeSection } from "./components/HomeSection";
import { SubjectSection } from "./components/SubjectSection";
import { SpecialSection } from "./components/SpecialSection";
import { MusicSection } from "./components/MusicSection";
import { DownloadSection } from "./components/DownloadSection";

// Modals
import { ChapterListModal } from "./components/ChapterListModal";
import { PdfViewerModal } from "./components/PdfViewerModal";
import { YouTubeViewerModal } from "./components/YouTubeViewerModal";
import { MusicModal } from "./components/MusicModal";
import { PdfListModal } from "./components/PdfListModal";
import { VideoListModal } from "./components/VideoListModal";
import { GlobalMusicBar } from "./components/GlobalMusicBar";
import { UpdatesModal } from "./components/UpdatesModal";
import { AdminPanelModal } from "./components/AdminPanelModal";
import { GlobalSearchModal } from "./components/GlobalSearchModal";
import { FavoritesModal } from "./components/FavoritesModal";
import { UserProfileModal } from "./components/UserProfileModal";

// Icons
import { 
  Search, 
  Smartphone, 
  Lock, 
  ExternalLink, 
  Music,
  Sparkles,
  User,
  Bookmark
} from "lucide-react";

export default function App() {
  // Navigation State (HOME, SUBJECT, AI, MUSIC, DOWNLOAD)
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [previousTab, setPreviousTab] = useState<NavTab>("home");

  const handleSelectNavTab = (tab: NavTab) => {
    if (activeTab !== "ai" && activeTab !== "special") {
      setPreviousTab(activeTab);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExitAi = () => {
    setActiveTab(previousTab === "ai" || previousTab === "special" ? "home" : previousTab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // App Data State
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pdfs, setPdfs] = useState<PDFMaterial[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>(StoreService.getMusicTracks());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo>(StoreService.getVersionInfo());
  const [featureFlags, setFeatureFlags] = useState(StoreService.getFeatureFlags());
  const [downloadCount, setDownloadCount] = useState<number>(DownloadService.getDownloads().length);

  // Modal View States
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(null);
  const [activePdf, setActivePdf] = useState<PDFMaterial | null>(null);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [showUpdatesModal, setShowUpdatesModal] = useState(false);
  const [hasAppUpdate, setHasAppUpdate] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showPdfListModal, setShowPdfListModal] = useState(false);
  const [showVideoListModal, setShowVideoListModal] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState<number>(BookmarkService.getBookmarks().length);

  // User Profile States
  const [userProfile, setUserProfile] = useState(UserService.getProfile());
  const [showOnboarding, setShowOnboarding] = useState(!UserService.hasCompletedProfile());
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const handleOpenPdf = (pdf: PDFMaterial | null) => {
    setActivePdf(pdf);
    if (pdf) {
      AnalyticsService.trackPdfOpen(pdf.id, pdf.title, pdf.subjectId, pdf.chapterTitle);
    }
  };

  const handleOpenVideo = (video: YouTubeVideo | null) => {
    setActiveVideo(video);
    if (video) {
      AnalyticsService.trackVideoOpen(video.id, video.title, video.subjectId, video.chapterTitle);
    }
  };

  const handleSelectSubject = (subject: SubjectInfo | null) => {
    setSelectedSubject(subject);
    if (subject) {
      AnalyticsService.trackSubjectView(subject.id, subject.nameHindi);
    }
  };

  // Load Data on Mount & subscribe to changes
  const refreshData = () => {
    setChapters(StoreService.getChapters());
    setPdfs(StoreService.getPdfs());
    setVideos(StoreService.getVideos());
    setMusicTracks(StoreService.getMusicTracks());
    setAnnouncements(StoreService.getAnnouncements());
    setVersionInfo(StoreService.getVersionInfo());
    setFeatureFlags(StoreService.getFeatureFlags());
  };

  useEffect(() => {
    AnalyticsService.init();
    AnalyticsService.trackAppOpen();
    StoreService.initRealtimeSync();
    UserService.fetchRemoteProfileIfAvailable();
    refreshData();
    const unsubscribeStore = StoreService.subscribe(refreshData);
    const unsubscribeUser = UserService.subscribe(() => {
      setUserProfile(UserService.getProfile());
    });
    const unsubscribeDownloads = DownloadService.subscribe(() => {
      setDownloadCount(DownloadService.getDownloads().length);
    });
    const unsubscribeBookmarks = BookmarkService.subscribe(() => {
      setBookmarkCount(BookmarkService.getBookmarks().length);
    });
    const unsubscribeUpdates = UpdateService.subscribe((updateState) => {
      setShowUpdatesModal(updateState.isModalOpen);
      setHasAppUpdate(Boolean(updateState.hasUpdate));
    });
    const cleanupLifecycle = UpdateService.initLifecycle();

    return () => {
      unsubscribeStore();
      unsubscribeUser();
      unsubscribeDownloads();
      unsubscribeBookmarks();
      unsubscribeUpdates();
      cleanupLifecycle();
    };
  }, []);

  const isAiFullScreen = activeTab === "ai" || activeTab === "special";

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden">
      {/* 1. Dynamic Space Theme with Falling Stars Loop */}
      <CosmicBackground />

      {/* 2. WebGL Neon Wave Particles Canvas */}
      <NeonShaderCanvas intensity={0.8} interactive={true} />

      {/* 3. Initial Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* 4. IF AI IS ACTIVE: RENDER DEDICATED FULL-SCREEN AI EXPERIENCE WITHOUT WEBSITE CLUTTER */}
      {isAiFullScreen ? (
        <SpecialSection
          pdfs={pdfs}
          videos={videos}
          chapters={chapters}
          onOpenPdf={(pdf) => setActivePdf(pdf)}
          onOpenVideo={(video) => setActiveVideo(video)}
          onExit={handleExitAi}
        />
      ) : (
        /* NORMAL APPLICATION CONTAINER WITH HEADER, MAIN CONTENT, FOOTER & BOTTOM NAVIGATION */
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* Sticky Top Navigation Header (Translucent Glassmorphism) */}
          <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-xl border-b border-white/10 px-3 sm:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-2xl transition-all">
            {/* Left: SK Logo ONLY — Directly triggers Admin Login & Panel */}
            <div 
              id="btn-header-admin-logo"
              onClick={() => setShowAdminModal(true)}
              className="flex items-center cursor-pointer group shrink-0"
              title="SK MISSION BOARD — Admin Access"
            >
              <LogoHeader size="sm" showSubtitle={false} iconOnly={true} />
            </div>

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* AI Study Assistant Trigger Button in Header */}
              {featureFlags.ai !== false && (
                <button
                  id="btn-header-ai-special"
                  onClick={() => {
                    handleSelectNavTab("ai");
                  }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/25 via-blue-600/25 to-purple-600/25 hover:from-cyan-500/40 hover:to-blue-500/40 backdrop-blur-md border border-cyan-400/50 text-cyan-200 text-xs sm:text-sm font-black transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                  title="✨ AI STUDY ASSISTANT"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse shrink-0" />
                  <span className="hidden sm:inline">✨ AI STUDY ASSISTANT</span>
                  <span className="sm:hidden font-extrabold">✨ AI</span>
                </button>
              )}

              {/* Music Trigger Button in Header */}
              {featureFlags.music !== false && (
                <button
                  onClick={() => handleSelectNavTab("music")}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 backdrop-blur-md border border-cyan-500/30 text-cyan-200 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                  title="STUDY MUSIC - [संगीत]"
                >
                  <Music className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="hidden sm:inline font-bold">STUDY MUSIC - [संगीत]</span>
                </button>
              )}

              {/* Favorites / Bookmarks Button */}
              <button
                id="btn-header-favorites"
                onClick={() => setShowFavoritesModal(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                title="बुकमार्क्स / पसंदीदा सामग्री (Saved Favorites)"
              >
                <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400/30 shrink-0" />
                <span className="hidden sm:inline">Saved</span>
                {bookmarkCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                    {bookmarkCount}
                  </span>
                )}
              </button>

              {/* Search Button */}
              {featureFlags.globalSearch !== false && (
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-md border border-white/15 hover:border-cyan-500/50 text-slate-100 hover:text-cyan-300 text-xs sm:text-base font-bold transition-all shadow-md cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="hidden sm:inline">Search</span>
                </button>
              )}

              {/* Student Profile Button in Header */}
              <button
                id="btn-header-user-profile"
                onClick={() => setShowEditProfileModal(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                title="विद्यार्थी प्रोफाइल (Student Profile)"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
                <span className="hidden sm:inline max-w-[90px] truncate">{userProfile?.name || "Profile"}</span>
              </button>

              {/* Updates Button */}
              <button
                id="btn-header-app-updates"
                onClick={() => {
                  UpdateService.checkForUpdate(true);
                  setShowUpdatesModal(true);
                }}
                className={`relative flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl backdrop-blur-md text-xs sm:text-base font-bold transition-all shadow-md cursor-pointer shrink-0 whitespace-nowrap ${
                  hasAppUpdate
                    ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 animate-pulse"
                    : "bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200"
                }`}
                title={hasAppUpdate ? "नया अपडेट उपलब्ध है!" : "ऐप वर्जन (नवीनतम)"}
              >
                <Smartphone className={`w-4 h-4 shrink-0 ${hasAppUpdate ? "text-amber-400" : "text-purple-400"}`} />
                <span className="font-mono text-xs sm:text-sm">v{versionInfo.versionName}</span>
                {hasAppUpdate && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-1 -right-1" />
                )}
              </button>
            </div>
          </header>

          {/* Main Content Area with generous padding for mobile bottom bar */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-10 pb-36">
            {/* SECTION 1: HOME */}
            {activeTab === "home" && (
              <HomeSection
                announcements={announcements}
                onNavigateToSubjects={() => handleSelectNavTab("subject")}
                onNavigateToSpecial={() => handleSelectNavTab("ai")}
                featureFlags={featureFlags}
              />
            )}

            {/* SECTION 2: SUBJECT */}
            {activeTab === "subject" && (
              <SubjectSection
                chapters={chapters}
                pdfs={pdfs}
                videos={videos}
                onSelectSubject={(subject) => handleSelectSubject(subject)}
              />
            )}

            {/* SECTION 3: MUSIC */}
            {activeTab === "music" && (
              <div className="w-full max-w-4xl mx-auto py-2">
                <MusicSection tracks={musicTracks} />
              </div>
            )}

            {/* SECTION 4: DOWNLOAD */}
            {activeTab === "download" && (
              <DownloadSection
                onOpenPdf={(pdf) => handleOpenPdf(pdf)}
                onNavigateToSubjects={() => handleSelectNavTab("subject")}
                onNavigateToSpecial={() => handleSelectNavTab("ai")}
              />
            )}
          </main>

          {/* Footer (Translucent Glassmorphism) */}
          <footer className="mt-auto border-t border-white/10 bg-slate-950/40 backdrop-blur-md py-8 text-center text-sm sm:text-base text-slate-300 mb-16">
            <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3">
              <LogoHeader size="sm" showSubtitle={false} />
              <p className="text-slate-300 max-w-xl leading-relaxed text-xs sm:text-sm font-medium">
                SK MISSION BOARD — Dedicated exam preparation, study materials & notes portal for BSEB Class 10 students.
              </p>
              <div className="flex items-center gap-4 text-cyan-400 font-bold text-xs sm:text-sm">
                <a href="https://youtube.com/@skmissionboard?si=wckj0D5alOeUnVW8" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1.5">
                  <span>YouTube Channel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span>•</span>
                <button onClick={() => setShowUpdatesModal(true)} className="hover:underline cursor-pointer">
                  Release v{versionInfo.versionName}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                © 2026 SK MISSION BOARD. All Rights Reserved.
              </p>
            </div>
          </footer>

          {/* FIXED BOTTOM NAVIGATION BAR: HOME | SUBJECT | AI | MUSIC | DOWNLOAD */}
          <BottomNavBar
            activeTab={activeTab}
            onSelectTab={handleSelectNavTab}
            downloadCount={downloadCount}
            featureFlags={featureFlags}
          />
        </div>
      )}

      {/* MODALS */}

      {/* Study Instrumental Music Modal */}
      {showMusicModal && (
        <MusicModal
          tracks={musicTracks}
          onClose={() => setShowMusicModal(false)}
        />
      )}

      {/* PDF Notes & Materials Modal */}
      {showPdfListModal && (
        <PdfListModal
          pdfs={pdfs}
          onClose={() => setShowPdfListModal(false)}
          onOpenPdf={(pdf) => {
            handleOpenPdf(pdf);
          }}
        />
      )}

      {/* YouTube Video Lectures Modal */}
      {showVideoListModal && (
        <VideoListModal
          videos={videos}
          onClose={() => setShowVideoListModal(false)}
          onOpenVideo={(video) => {
            handleOpenVideo(video);
          }}
        />
      )}

      {/* Subject Chapter List Modal */}
      {selectedSubject && (
        <ChapterListModal
          subject={selectedSubject}
          chapters={chapters.filter((c) => c.subjectId === selectedSubject.id)}
          pdfs={pdfs}
          videos={videos}
          onClose={() => handleSelectSubject(null)}
          onOpenPdf={(pdf) => handleOpenPdf(pdf)}
          onOpenVideo={(video) => handleOpenVideo(video)}
        />
      )}

      {/* PDF Viewer Modal */}
      {activePdf && (
        <PdfViewerModal pdf={activePdf} onClose={() => handleOpenPdf(null)} />
      )}

      {/* YouTube Viewer Modal */}
      {activeVideo && (
        <YouTubeViewerModal video={activeVideo} onClose={() => handleOpenVideo(null)} />
      )}

      {/* Version Updates Modal */}
      {showUpdatesModal && (
        <UpdatesModal 
          versionInfo={versionInfo} 
          onClose={() => {
            setShowUpdatesModal(false);
            UpdateService.setModalOpen(false);
          }} 
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminModal && (
        <AdminPanelModal
          chapters={chapters}
          pdfs={pdfs}
          videos={videos}
          announcements={announcements}
          versionInfo={versionInfo}
          musicTracks={musicTracks}
          onClose={() => setShowAdminModal(false)}
          onRefreshData={refreshData}
        />
      )}

      {/* Global Search Modal */}
      {showSearchModal && (
        <GlobalSearchModal
          chapters={chapters}
          pdfs={pdfs}
          videos={videos}
          musicTracks={musicTracks}
          announcements={announcements}
          onClose={() => setShowSearchModal(false)}
          onOpenPdf={(pdf) => handleOpenPdf(pdf)}
          onOpenVideo={(video) => handleOpenVideo(video)}
          onSelectSubject={(subject) => handleSelectSubject(subject)}
          onOpenAiConversation={(_convId) => {
            setShowSearchModal(false);
            handleSelectNavTab("ai");
          }}
        />
      )}

      {/* Favorites / Bookmarks Modal */}
      {showFavoritesModal && (
        <FavoritesModal
          isOpen={showFavoritesModal}
          onClose={() => setShowFavoritesModal(false)}
          allPdfs={pdfs}
          allVideos={videos}
          allChapters={chapters}
          onOpenPdf={(pdf) => {
            setShowFavoritesModal(false);
            handleOpenPdf(pdf);
          }}
          onOpenVideo={(video) => {
            setShowFavoritesModal(false);
            handleOpenVideo(video);
          }}
          onSelectSubject={(subj) => {
            setShowFavoritesModal(false);
            handleSelectSubject(subj);
          }}
        />
      )}

      {/* First-Time User Profile Setup Onboarding Modal */}
      {showOnboarding && !showSplash && (
        <UserProfileModal
          isOpen={showOnboarding}
          mode="onboarding"
          onClose={() => setShowOnboarding(false)}
          onProfileSaved={(profile) => {
            setUserProfile(profile);
            setShowOnboarding(false);
          }}
        />
      )}

      {/* User Profile Edit Modal */}
      {showEditProfileModal && (
        <UserProfileModal
          isOpen={showEditProfileModal}
          mode="edit"
          onClose={() => setShowEditProfileModal(false)}
          onProfileSaved={(profile) => {
            setUserProfile(profile);
            setShowEditProfileModal(false);
          }}
        />
      )}

      {/* Persistent Floating Music Controller */}
      <GlobalMusicBar />
    </div>
  );
}
