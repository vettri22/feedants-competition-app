import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery as useConvexQuery } from "convex/react";
import { useNavigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { StatusBar } from "@/components/mobile/StatusBar";
import { TopBar } from "@/components/mobile/TopBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { PrizeCards } from "@/components/competition/PrizeCards";
import { JudgeCard, JudgeSkeleton } from "@/components/competition/JudgeCard";
import { CountdownBanner } from "@/components/competition/CountdownBanner";
import { ImportantDates, ImportantDatesSkeleton } from "@/components/competition/ImportantDates";
import { WinnerCarousel, WinnerSkeleton, type Winner } from "@/components/competition/WinnerCarousel";
import { CompetitionTabs, type LocalizedText } from "@/components/competition/CompetitionTabs";
import { RewardsList } from "@/components/competition/RewardsList";
import {
  AdPlaceholder,
  DisclaimerBanner,
  PaymentInfoCard,
  ReferralCard,
  UserReviewsButton,
} from "@/components/competition/InfoCards";
import { VideoDialog } from "@/components/competition/VideoDialog";
import { PaymentDialog } from "@/components/competition/PaymentDialog";
import { SubmissionDialog } from "@/components/competition/SubmissionDialog";
import { ReferralDialog } from "@/components/competition/ReferralDialog";
import { useI18n } from "@/store/language";
import { useAuth } from "@/hooks/use-auth";
import { unwrapResult, describeError } from "@/lib/api-client";
import { deriveCta } from "@/lib/competition-lifecycle";
import type { CompetitionStatus } from "@/convex/schema";
import { toast } from "sonner";
import { CircleAlert, RotateCcw } from "lucide-react";

interface SerializedCompetition {
  id: string;
  slug: string;
  title: string;
  titleLocalized: { ENG: string; HINDI?: string } | null;
  category: string;
  tags: string[];
  prizePool: number;
  entryFee: number;
  maxParticipants: number;
  currentParticipants: number;
  remainingSpots: number;
  bookedFraction: number;
  status: CompetitionStatus;
  certificateEnabled: boolean;
  multiWin: boolean;
  introVideoUrl?: string;
  judge: {
    name: string;
    designation: string;
    experience: string;
    avatarUrl?: string;
    introVideoUrl?: string;
  };
  dates: {
    registrationStart: number;
    registrationEnd: number;
    submissionStart: number;
    submissionEnd: number;
    resultDate: number;
  };
  description: LocalizedText;
  judgingParameters: { name: LocalizedText; weight: number }[];
  rules: LocalizedText[];
  eligibility: LocalizedText[];
  rewards: { position: number; label: string; amount: number }[];
  disclaimer: LocalizedText;
  refundPolicy: LocalizedText;
  paymentProvider: string;
  previousWinners: Winner[];
  referralReward: number;
  referralEnabled: boolean;
  languageSupport: string[];
  heroImageUrl?: string;
}

interface DetailResponse {
  competition: SerializedCompetition;
  userState: UserState;
  rewardsValidation: { sum: number; prizePool: number; consistent: boolean };
}

interface UserState {
  authenticated: boolean;
  registered: boolean;
  paymentStatus: string | null;
  submissionStatus: string | null;
  hasSubmission: boolean;
  submission: {
    id: string;
    title: string;
    description: string | null;
    fileName: string | null;
    fileSize: number | null;
    status: string;
    submittedAt: number | null;
  } | null;
  isAdmin: boolean;
}

export default function CompetitionDetail() {
  const params = useParams();
  const idOrSlug = (params.idOrSlug ?? "feedants-classical-dance") as string;
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const raw = useConvexQuery(api.competitions.get, { idOrSlug });
  const referralMe = useConvexQuery(api.referrals.me, isAuthenticated ? {} : "skip");
  const generateReferral = useMutation(api.referrals.generate);

  const [video, setVideo] = useState<{ title: string; subtitle?: string; url?: string } | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [registering, setRegistering] = useState(false);

  const register = useMutation(api.registrations.register);

  // Envelope unwrap — undefined while loading; error surfaced below.
  let data: DetailResponse | null = null;
  let loadError: string | null = null;
  if (raw !== undefined) {
    try {
      data = unwrapResult<DetailResponse>(raw);
    } catch (err) {
      loadError = describeError(err).message;
    }
  }

  const comp = data?.competition ?? null;
  const userState = data?.userState ?? null;

  // Localized title per language preference (data-driven i18n).
  const title = useMemo(() => {
    if (!comp) return "";
    if (language === "HINDI" && comp.titleLocalized?.HINDI) return comp.titleLocalized.HINDI;
    return comp.title;
  }, [comp, language]);

  const pick = useCallback(
    (l: LocalizedText) => (language === "HINDI" && l.HINDI ? l.HINDI : l.ENG),
    [language],
  );

  const refreshAfterExpiry = useCallback(() => {
    // Convex queries are reactive; forcing a re-subscribe confirms fresh
    // status after a countdown hits zero (belt-and-braces for caching layers).
    void raw;
  }, [raw]);

  const doRegister = async () => {
    setRegistering(true);
    try {
      await register({ idOrSlug });
      toast.success(t("cta.registered"));
    } catch (err) {
      const e = describeError(err);
      toast.error(e.message);
    } finally {
      setRegistering(false);
    }
  };

  const referralUrl: string | null = (() => {
    if (referralMe === undefined) return null;
    try {
      const d = unwrapResult<{ code: string | null; referralUrl: string | null }>(referralMe);
      return d.referralUrl ?? null;
    } catch {
      return null;
    }
  })();

  if (authLoading || (raw === undefined && !loadError)) {
    return (
      <PhoneShell>
        <StatusBar />
        <TopBar />
        <div className="space-y-3 px-4">
          <TitleSkeleton />
          <JudgeSkeleton />
          <ImportantDatesSkeleton />
          <WinnerSkeleton />
        </div>
        <BottomNav />
      </PhoneShell>
    );
  }

  if (loadError || !comp || !userState) {
    return (
      <PhoneShell>
        <StatusBar />
        <TopBar />
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <CircleAlert className="size-10 text-muted-foreground" />
          <p className="text-[15px] font-bold text-foreground">
            {loadError ?? t("common.error")}
          </p>
          <p className="max-w-60 text-[13px] text-muted-foreground">{t("common.errorHint")}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground cursor-pointer"
          >
            <RotateCcw className="size-4" />
            {t("common.retry")}
          </button>
        </div>
        <BottomNav />
      </PhoneShell>
    );
  }

  // ─── CTA state machine (single source of truth for button state) ────────────
  const now = Date.now();
  const registrationOpen =
    comp.status === "REGISTRATION_OPEN" && now <= comp.dates.registrationEnd;
  // Window-based (matches backend enforcement): during the reference data's
  // overlapping windows a registered user can upload while status is still
  // REGISTRATION_OPEN — the backend re-checks the window server-side.
  const submissionOpen =
    now >= comp.dates.submissionStart && now <= comp.dates.submissionEnd;

  const cta = deriveCta({
    status: comp.status,
    authenticated: userState.authenticated,
    registered: userState.registered,
    paymentStatus: userState.paymentStatus as never,
    entryFee: comp.entryFee,
    remainingSpots: comp.remainingSpots,
    registrationOpen,
    submissionOpen,
    hasSubmission: userState.hasSubmission,
  });

  const onCtaClick = () => {
    switch (cta.action) {
      case "NAVIGATE_AUTH":
        navigate(`/auth?returnTo=${encodeURIComponent(`/app/competitions/${comp.slug}`)}`);
        break;
      case "REGISTER":
        if (userState.registered && userState.paymentStatus === "PENDING") {
          setPayOpen(true);
        } else if (comp.entryFee > 0) {
          void doRegister();
        } else {
          void doRegister();
        }
        break;
      case "UPLOAD":
        setSubOpen(true);
        break;
      case "VIEW_RESULTS":
        toast.info("Results will be announced on " + new Date(comp.dates.resultDate).toLocaleDateString());
        break;
      default:
        break;
    }
  };

  const ctaLabel =
    cta.state === "PAY_REGISTER"
      ? t("cta.payAndRegister", { fee: comp.entryFee })
      : t(cta.label as never);

  const countdownLabelKey = ["SUBMISSION_OPEN", "SUBMISSION_CLOSED"].includes(comp.status)
    ? "comp.submissionClosesIn"
    : "comp.registrationClosesIn";
  const countdownDeadline = ["SUBMISSION_OPEN", "SUBMISSION_CLOSED"].includes(comp.status)
    ? comp.dates.submissionEnd
    : comp.dates.registrationEnd;

  const showCountdown = !["RESULTS_PUBLISHED", "CANCELLED", "JUDGING", "DRAFT"].includes(comp.status) &&
    Date.now() < countdownDeadline;

  return (
    <PhoneShell>
      <StatusBar />
      <TopBar />

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        <PrizeCards
          title={title}
          category={comp.category}
          tags={comp.tags}
          certificateEnabled={comp.certificateEnabled}
          registered={userState.registered && userState.paymentStatus === "PAID"}
          prizePool={comp.prizePool}
          entryFee={comp.entryFee}
          remainingSpots={comp.remainingSpots}
          maxParticipants={comp.maxParticipants}
          currentParticipants={comp.currentParticipants}
        />

        <JudgeCard
          name={comp.judge.name}
          designation={comp.judge.designation}
          experience={comp.judge.experience}
          avatarUrl={comp.judge.avatarUrl}
          onPlayIntro={() =>
            setVideo({
              title: comp.judge.name,
              subtitle: comp.judge.designation,
              url: comp.judge.introVideoUrl ?? comp.introVideoUrl,
            })
          }
        />

        {showCountdown && (
          <CountdownBanner
            deadlineMs={countdownDeadline}
            labelKey={countdownLabelKey}
            onExpire={refreshAfterExpiry}
          />
        )}

        <ImportantDates dates={comp.dates} />

        <WinnerCarousel
          winners={comp.previousWinners}
          onPlay={(w) => setVideo({ title: w.name, subtitle: w.rankLabel, url: w.videoUrl })}
        />

        <CompetitionTabs
          description={comp.description}
          judgingParameters={comp.judgingParameters}
          rules={comp.rules}
          eligibility={comp.eligibility}
        />

        <RewardsList rewards={comp.rewards} prizePool={comp.prizePool} />

        <DisclaimerBanner text={pick(comp.disclaimer)} />

        <PaymentInfoCard refundPolicy={pick(comp.refundPolicy)} />

        <ReferralCard
          rewardAmount={comp.referralReward}
          referralUrl={referralUrl}
          signedIn={userState.authenticated}
          generating={false}
          onGenerate={async () => {
            try {
              unwrapResult(await generateReferral({}));
              toast.success(t("refer.generate"));
            } catch (err) {
              toast.error(describeError(err).message);
            }
          }}
        />

        <UserReviewsButton />
        <AdPlaceholder />
      </div>

      {/* Sticky CTA above bottom nav */}
      <div className="px-4 pb-2 pt-2">
        <button
          onClick={onCtaClick}
          disabled={!cta.enabled || registering}
          className={cnCta()}
          aria-live="polite"
        >
          {registering && <Loader2 className="size-4 animate-spin" />}
          <span>{ctaLabel}</span>
          {userState.registered && cta.enabled === false && (
            <span className="block text-[11px] font-medium opacity-80">{t("cta.registered")}</span>
          )}
        </button>
      </div>

      <BottomNav />

      {/* Dialogs */}
      <VideoDialog
        open={!!video}
        onOpenChange={(o) => !o && setVideo(null)}
        title={video?.title ?? ""}
        subtitle={video?.subtitle}
        videoUrl={video?.url}
      />
      <PaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        competitionIdOrSlug={comp.slug}
        entryFee={comp.entryFee}
        onSuccess={() => void 0}
      />
      <SubmissionDialog
        open={subOpen}
        onOpenChange={setSubOpen}
        competitionIdOrSlug={comp.slug}
        existing={userState.submission}
      />
      <ReferralDialog
        open={refOpen}
        onOpenChange={setRefOpen}
        generating={false}
        onGenerate={async () => {
          try {
            unwrapResult(await generateReferral({}));
          } catch (err) {
            toast.error(describeError(err).message);
          }
        }}
      />
    </PhoneShell>
  );
}

/** Full-height mobile shell shared by all app screens. */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-slate-200/70 dark:bg-slate-900 flex justify-center">
      <div className="w-full max-w-[430px] min-h-dvh bg-background flex flex-col sm:my-4 sm:rounded-[2rem] sm:border sm:border-border sm:shadow-sm sm:overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function cnCta() {
  return "flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-[15px] font-bold text-primary-foreground cursor-pointer transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";
}

function TitleSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4" aria-busy="true">
      <div className="h-6 w-56 animate-pulse rounded bg-muted" />
      <div className="mt-3 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-lg bg-muted" />
        <div className="h-6 w-20 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="mt-4 h-8 w-32 animate-pulse rounded bg-muted" />
    </div>
  );
}
