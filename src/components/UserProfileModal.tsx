import React, { useState, useEffect } from "react";
import { UserGender, UserProfile } from "../types";
import { UserService } from "../services/userService";
import { LogoHeader } from "./LogoHeader";
import { 
  User, 
  MapPin, 
  Sparkles, 
  Check, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Heart,
  Edit3
} from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  mode?: "onboarding" | "edit";
  onClose?: () => void;
  onProfileSaved?: (profile: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  mode = "onboarding",
  onClose,
  onProfileSaved
}) => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<UserGender | "">("");
  const [villageOrTown, setVillageOrTown] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const existing = UserService.getProfile();
      if (existing) {
        setName(existing.name || "");
        setGender(existing.gender || "");
        setVillageOrTown(existing.villageOrTown || "");
      } else {
        setName("");
        setGender("");
        setVillageOrTown("");
      }
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isOnboarding = mode === "onboarding";

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setErrorMsg("कृपया अपना नाम दर्ज करें (Name is required)");
      return;
    }

    if (cleanName.length > 50) {
      setErrorMsg("नाम 50 अक्षरों से कम होना चाहिए");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const selectedGender = gender ? (gender as UserGender) : undefined;
      const saved = await UserService.saveProfile({
        name: cleanName,
        gender: selectedGender,
        villageOrTown: villageOrTown.trim() || undefined
      });

      onProfileSaved?.(saved);
      if (onClose) {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg("प्रोफाइल सहेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkipOptional = () => {
    // If name is filled, save and continue
    if (name.trim()) {
      handleSave();
    } else {
      setErrorMsg("कृपया आगे बढ़ने के लिए अपना नाम दर्ज करें (Name is required)");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl overflow-y-auto animate-fade-in">
      {/* Background glow orb */}
      <div className="absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/10 to-purple-600/20 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-cyan-500/30 p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.2)] text-slate-100 overflow-hidden my-auto">
        {/* Decorative corner light */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button (only for edit mode) */}
        {!isOnboarding && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3">
            <LogoHeader size="sm" showSubtitle={false} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{isOnboarding ? "Welcome to SK MISSION BOARD" : "Student Profile & Personalization"}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isOnboarding ? "Student Profile Setup" : "Edit Profile Details"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm">
            {isOnboarding 
              ? "SK AI Study Assistant customizes answers and explanations for your study goals."
              : "This information is used for personalizing your AI study assistance."}
          </p>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
          {/* 1. Name Field (Required) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                <span>What's your name? (आपका नाम)</span>
              </span>
              <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                Required
              </span>
            </label>
            <input
              id="profile-input-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Enter your name"
              maxLength={50}
              autoFocus={isOnboarding}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-white placeholder-slate-500 text-sm sm:text-base outline-none transition-all"
            />
          </div>

          {/* 2. Gender / Pronoun Preference (Optional) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-400" />
                <span>How should the AI address you?</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                Optional
              </span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* Male Option */}
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  gender === "male"
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]"
                    : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                }`}
              >
                <span className="text-base mb-0.5">👦</span>
                <span>Male</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">(छात्र)</span>
              </button>

              {/* Female Option */}
              <button
                type="button"
                onClick={() => setGender("female")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  gender === "female"
                    ? "bg-pink-500/20 border-pink-400 text-pink-300 shadow-[0_0_15px_rgba(244,114,182,0.3)] scale-[1.02]"
                    : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                }`}
              >
                <span className="text-base mb-0.5">👧</span>
                <span>Female</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">(छात्रा)</span>
              </button>

              {/* Prefer not to say */}
              <button
                type="button"
                onClick={() => setGender("prefer_not_to_say")}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  gender === "prefer_not_to_say"
                    ? "bg-purple-500/20 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-[1.02]"
                    : "bg-slate-950/60 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20"
                }`}
              >
                <span className="text-base mb-0.5">✨</span>
                <span>Prefer not to say</span>
                <span className="text-[10px] font-normal text-slate-400 mt-0.5">(तटस्थ)</span>
              </button>
            </div>
          </div>

          {/* 3. Village / Town Field (Optional) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Village / Town (गाँव या शहर)</span>
              </span>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                Optional
              </span>
            </label>
            <input
              id="profile-input-village"
              type="text"
              value={villageOrTown}
              onChange={(e) => setVillageOrTown(e.target.value)}
              placeholder="Enter your village or town"
              maxLength={60}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/80 border border-white/15 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 text-white placeholder-slate-500 text-sm sm:text-base outline-none transition-all"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-fade-in flex items-center gap-2">
              <span className="shrink-0 font-bold">⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Your information is 100% private and stored locally on your device for AI personalization.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            {isOnboarding && (
              <button
                type="button"
                onClick={handleSkipOptional}
                className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 font-bold text-sm transition-all cursor-pointer active:scale-95"
              >
                Skip Optional
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className={`flex-[1.5] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 text-slate-950 font-black text-sm sm:text-base shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isSaving ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span>{isOnboarding ? "Continue" : "Save Changes"}</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
