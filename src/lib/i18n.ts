/**
 * i18n architecture — structured for adding more Indian languages later.
 * One dictionary per language, flat dot keys, typed via the English dict.
 * Language preference persists (localStorage + backend user profile).
 */
export type Language = "ENG" | "HINDI";

export const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: "ENG", label: "ENG", native: "English" },
  { code: "HINDI", label: "हिंदी", native: "Hindi" },
];

const en = {
  "common.loading": "Loading…",
  "common.retry": "Retry",
  "common.copy": "Copy Link",
  "common.copied": "Copied!",
  "common.back": "Go back",
  "common.viewMore": "View more",
  "common.viewLess": "View less",
  "common.error": "Something went wrong",
  "common.errorHint": "We couldn't reach Feedants. Check your connection and try again.",
  "common.empty": "Nothing here yet",

  "nav.home": "Home",
  "nav.explore": "Explore",
  "nav.competitions": "Competitions",
  "nav.profile": "Profile",

  "top.registered": "Registered",

  "comp.prizePool": "Prize Pool",
  "comp.entryFee": "Entry Fee",
  "comp.spotsLeft": "Only {n} spots left",
  "comp.booked": "{booked} / {total} Booked",
  "comp.winnersGetCertificate": "Winners get certificate",
  "comp.registrationClosesIn": "Registration closes in",
  "comp.hurryUp": "Hurry up!",
  "comp.submissionClosesIn": "Submission closes in",
  "comp.importantDates": "Important Dates",
  "comp.registerBefore": "Register Before",
  "comp.submissionStarts": "Submission Starts",
  "comp.submissionEnds": "Submission Ends",
  "comp.resultDate": "Result Date",
  "comp.previousWinners": "Previous Winners",
  "comp.aboutCompetition": "About Competition",
  "comp.judgingParameters": "Judging Parameters",
  "comp.rulesEligibility": "Rules & Eligibility",
  "comp.rules": "Rules",
  "comp.eligibility": "Eligibility",
  "comp.rewards": "Rewards",
  "comp.allPositions": "All Positions",
  "comp.disclaimer": "Disclaimer",
  "comp.noWinners": "Winners will be announced soon.",
  "comp.noRewards": "Rewards will be updated soon.",
  "comp.noJudging": "Judging parameters will be updated soon.",
  "comp.weight": "{w}% weight",

  "judge.label": "Judge",
  "judge.introVideo": "Intro Video",
  "judge.videoUnavailable": "Video unavailable",

  "cta.loginToRegister": "Login to Register",
  "cta.registerNow": "Register Now",
  "cta.payAndRegister": "Pay ₹{fee} & Register",
  "cta.completePayment": "Complete Payment",
  "cta.registered": "Registered",
  "cta.uploadSubmission": "Upload Submission",
  "cta.registrationClosed": "Registration Closed",
  "cta.competitionFull": "Competition Full",
  "cta.cancelled": "Competition Cancelled",
  "cta.viewResults": "View Results",
  "cta.submissionClosed": "Submission Closed",

  "pay.title": "Complete your registration",
  "pay.subtitle": "Secure payment · {fee}",
  "pay.simulatedNote": "Development gateway — no real money moves.",
  "pay.payNow": "Pay ₹{fee} Now",
  "pay.processing": "Processing…",
  "pay.success": "Payment successful! You're registered.",
  "pay.failed": "Payment failed. Please try again.",
  "pay.simulateFailure": "Simulate failure",
  "pay.securedBy": "Secured payments powered by",
  "pay.refundPolicy": "Refund policy",

  "sub.title": "Upload your submission",
  "sub.chooseVideo": "Choose video",
  "sub.videoTitle": "Performance title",
  "sub.videoTitlePh": "e.g. Kathak — Teentaal",
  "sub.description": "Description (optional)",
  "sub.descriptionPh": "Tell the judges about your performance…",
  "sub.submit": "Submit entry",
  "sub.submitting": "Uploading…",
  "sub.windowClosed": "The submission window has closed.",
  "sub.windowNotOpen": "Submissions are not open yet.",
  "sub.uploaded": "Submission uploaded!",
  "sub.updated": "Submission updated!",
  "sub.current": "Your submission",
  "sub.edit": "Edit submission",
  "sub.submittedOn": "Submitted on {date}",
  "sub.status": "Status",

  "refer.title": "Refer & Earn more discount",
  "refer.referNow": "Refer Now",
  "refer.earn": "You earn ₹{amount} for every signup",
  "refer.generate": "Get my referral link",
  "refer.mine": "Your referral link",
  "refer.signups": "{n} signups",
  "refer.earned": "₹{amount} earned",

  "users.hearFrom": "Hear From Our Users",
  "users.seeWhat": "See what participants say about Feedants",
  "users.prizeQ": "How will you receive prize money?",
  "users.watchToKnow": "Watch video to know more",
  "ad.here": "Ad Here",

  "auth.loginToContinue": "Login to register for competitions",
  "auth.demoHint": "Demo: use any email — you'll receive a login code.",

  "list.title": "Competitions",
  "list.subtitle": "Showcase your talent, win rewards",
  "list.open": "Registration Open",
  "list.closed": "Closed",
  "list.upcoming": "Upcoming",
  "list.live": "Live",
  "list.empty": "No competitions right now. Check back soon!",

  "explore.title": "Explore",
  "explore.subtitle": "Find your stage by category",
  "explore.searchPh": "Search competitions…",
  "explore.noResults": "No matches found",
  "explore.all": "All",

  "home.greeting": "Namaste",
  "home.tagline": "Your stage awaits",
  "home.featured": "Featured competition",
  "home.viewAll": "View all",
  "home.quickStats.spots": "spots left",

  "profile.title": "Profile",
  "profile.signedInAs": "Signed in as",
  "profile.language": "Language",
  "profile.referral": "Referral",
  "profile.signOut": "Sign out",
  "profile.mySubmissions": "My submissions",
  "profile.notSignedIn": "You're browsing as a guest",
  "profile.signIn": "Sign in",
} as const;

export type TranslationKey = keyof typeof en;

const hi: Record<TranslationKey, string> = {
  "common.loading": "लोड हो रहा है…",
  "common.retry": "पुनः प्रयास",
  "common.copy": "लिंक कॉपी करें",
  "common.copied": "कॉपी हो गया!",
  "common.back": "वापस जाएँ",
  "common.viewMore": "और देखें",
  "common.viewLess": "कम देखें",
  "common.error": "कुछ गड़बड़ हो गई",
  "common.errorHint": "हम फ़ीडैंट्स तक नहीं पहुँच पाए। कनेक्शन जाँचें और फिर से प्रयास करें।",
  "common.empty": "यहाँ अभी कुछ नहीं है",

  "nav.home": "होम",
  "nav.explore": "एक्सप्लोर",
  "nav.competitions": "प्रतियोगिताएँ",
  "nav.profile": "प्रोफ़ाइल",

  "top.registered": "पंजीकृत",

  "comp.prizePool": "पुरस्कार कोष",
  "comp.entryFee": "प्रवेश शुल्क",
  "comp.spotsLeft": "केवल {n} स्थान शेष",
  "comp.booked": "{booked} / {total} बुक",
  "comp.winnersGetCertificate": "विजेताओं को प्रमाणपत्र",
  "comp.registrationClosesIn": "पंजीकरण बंद होने में",
  "comp.hurryUp": "जल्दी करें!",
  "comp.submissionClosesIn": "प्रस्तुति बंद होने में",
  "comp.importantDates": "महत्वपूर्ण तिथियाँ",
  "comp.registerBefore": "पंजीकरण से पहले",
  "comp.submissionStarts": "प्रस्तुति शुरू",
  "comp.submissionEnds": "प्रस्तुति अंतिम",
  "comp.resultDate": "परिणाम तिथि",
  "comp.previousWinners": "पिछले विजेता",
  "comp.aboutCompetition": "प्रतियोगिता के बारे में",
  "comp.judgingParameters": "निर्णय मापदंड",
  "comp.rulesEligibility": "नियम और पात्रता",
  "comp.rules": "नियम",
  "comp.eligibility": "पात्रता",
  "comp.rewards": "पुरस्कार",
  "comp.allPositions": "सभी पद",
  "comp.disclaimer": "अस्वीकरण",
  "comp.noWinners": "विजेताओं की घोषणा शीघ्र ही की जाएगी।",
  "comp.noRewards": "पुरस्कार शीघ्र ही अद्यतन किए जाएँगे।",
  "comp.noJudging": "निर्णय मापदंड शीघ्र ही अद्यतन किए जाएँगे।",
  "comp.weight": "{w}% भार",

  "judge.label": "निर्णायक",
  "judge.introVideo": "परिचय वीडियो",
  "judge.videoUnavailable": "वीडियो उपलब्ध नहीं",

  "cta.loginToRegister": "पंजीकरण के लिए लॉगिन करें",
  "cta.registerNow": "अभी पंजीकरण करें",
  "cta.payAndRegister": "₹{fee} भुगतान कर पंजीकरण करें",
  "cta.completePayment": "भुगतान पूर्ण करें",
  "cta.registered": "पंजीकृत",
  "cta.uploadSubmission": "प्रस्तुति अपलोड करें",
  "cta.registrationClosed": "पंजीकरण बंद",
  "cta.competitionFull": "प्रतियोगिता पूर्ण",
  "cta.cancelled": "प्रतियोगिता रद्द",
  "cta.viewResults": "परिणाम देखें",
  "cta.submissionClosed": "प्रस्तुति बंद",

  "pay.title": "पंजीकरण पूर्ण करें",
  "pay.subtitle": "सुरक्षित भुगतान · {fee}",
  "pay.simulatedNote": "विकास गेटवे — कोई वास्तविक भुगतान नहीं।",
  "pay.payNow": "अभी ₹{fee} भुगतान करें",
  "pay.processing": "प्रक्रिया में…",
  "pay.success": "भुगतान सफल! आप पंजीकृत हैं।",
  "pay.failed": "भुगतान असफल। कृपया पुनः प्रयास करें।",
  "pay.simulateFailure": "असफल होने का अनुकरण",
  "pay.securedBy": "सुरक्षित भुगतान",
  "pay.refundPolicy": "धनवापसी नीति",

  "sub.title": "अपनी प्रस्तुति अपलोड करें",
  "sub.chooseVideo": "वीडियो चुनें",
  "sub.videoTitle": "प्रदर्शन शीर्षक",
  "sub.videoTitlePh": "जैसे कथक — तीनताल",
  "sub.description": "विवरण (वैकल्पिक)",
  "sub.descriptionPh": "निर्णायकों को अपने प्रदर्शन के बारे में बताएँ…",
  "sub.submit": "प्रविष्टि जमा करें",
  "sub.submitting": "अपलोड हो रहा है…",
  "sub.windowClosed": "प्रस्तुति की समय-सीमा समाप्त हो गई है।",
  "sub.windowNotOpen": "प्रस्तुतियाँ अभी शुरू नहीं हुईं।",
  "sub.uploaded": "प्रस्तुति अपलोड हो गई!",
  "sub.updated": "प्रस्तुति अद्यतन हो गई!",
  "sub.current": "आपकी प्रस्तुति",
  "sub.edit": "प्रस्तुति संपादित करें",
  "sub.submittedOn": "जमा की गई {date}",
  "sub.status": "स्थिति",

  "refer.title": "रेफर करें और अधिक छूट पाएँ",
  "refer.referNow": "अब रेफर करें",
  "refer.earn": "प्रत्येक साइनअप पर आप कमाएँ ₹{amount}",
  "refer.generate": "मेरा रेफरल लिंक पाएँ",
  "refer.mine": "आपका रेफरल लिंक",
  "refer.signups": "{n} साइनअप",
  "refer.earned": "₹{amount} कमाए",

  "users.hearFrom": "हमारे उपयोगकर्ताओं से सुनें",
  "users.seeWhat": "देखें प्रतिभागी फ़ीडैंट्स के बारे में क्या कहते हैं",
  "users.prizeQ": "पुरस्कार राशि कैसे प्राप्त करें?",
  "users.watchToKnow": "जानने के लिए वीडियो देखें",
  "ad.here": "विज्ञापन यहाँ",

  "auth.loginToContinue": "प्रतियोगिताओं में भाग लेने के लिए लॉगिन करें",
  "auth.demoHint": "डेमो: कोई भी ईमेल डालें — आपको लॉगिन कोड मिलेगा।",

  "list.title": "प्रतियोगिताएँ",
  "list.subtitle": "अपनी प्रतिभा दिखाएँ, पुरस्कार जीतें",
  "list.open": "पंजीकरण खुला",
  "list.closed": "बंद",
  "list.upcoming": "आगामी",
  "list.live": "लाइव",
  "list.empty": "अभी कोई प्रतियोगिता नहीं। शीघ्र फिर देखें!",

  "explore.title": "एक्सप्लोर",
  "explore.subtitle": "श्रेणी से अपना मंच खोजें",
  "explore.searchPh": "प्रतियोगिताएँ खोजें…",
  "explore.noResults": "कोई मेल नहीं मिला",
  "explore.all": "सभी",

  "home.greeting": "नमस्ते",
  "home.tagline": "आपका मंच तैयार है",
  "home.featured": "विशेष प्रतियोगिता",
  "home.viewAll": "सभी देखें",
  "home.quickStats.spots": "स्थान शेष",

  "profile.title": "प्रोफ़ाइल",
  "profile.signedInAs": "साइन इन किया",
  "profile.language": "भाषा",
  "profile.referral": "रेफरल",
  "profile.signOut": "साइन आउट",
  "profile.mySubmissions": "मेरी प्रस्तुतियाँ",
  "profile.notSignedIn": "आप अतिथि के रूप में देख रहे हैं",
  "profile.signIn": "साइन इन",
};

export const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  ENG: en,
  HINDI: hi,
};

/** Interpolates {placeholders} in a translation string. */
export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

const STORAGE_KEY = "feedants.language";

export function loadPersistedLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ENG" || stored === "HINDI") return stored;
  } catch {
    // storage unavailable (private mode) — fall through
  }
  return "ENG";
}

export function persistLanguage(lang: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // ignore — preference still applies for the session
  }
}
