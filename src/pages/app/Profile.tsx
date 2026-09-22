import { useState } from "react";
import { useMutation, useQuery as useConvexQuery } from "convex/react";
import { useNavigate } from "react-router";
import { Copy, LogOut, Megaphone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { StatusBar } from "@/components/mobile/StatusBar";
import { BottomNav } from "@/components/mobile/BottomNav";
import { LanguageSwitcher } from "@/components/mobile/TopBar";
import { ReferralDialog } from "@/components/competition/ReferralDialog";
import { PhoneShell } from "@/pages/app/CompetitionDetail";
import { useI18n } from "@/store/language";
import { useAuth } from "@/hooks/use-auth";
import { unwrapResult, describeError } from "@/lib/api-client";

export default function Profile() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isAuthenticated, user, signOut } = useAuth();
  const generateReferral = useMutation(api.referrals.generate);
  const [refOpen, setRefOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const referralMe = useConvexQuery(api.referrals.me, isAuthenticated ? {} : "skip");
  const referralCode = (() => {
    if (referralMe === undefined) return null;
    try {
      return unwrapResult<{ code: string | null }>(referralMe).code;
    } catch {
      return null;
    }
  })();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      unwrapResult(await generateReferral({}));
    } catch (err) {
      toast.error(describeError(err).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <PhoneShell>
      <StatusBar />
      <header className="px-4 pb-3 pt-4">
        <h1 className="text-[22px] font-bold tracking-tight text-foreground">{t("profile.title")}</h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        {/* Identity card */}
        <section className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4">
          {isAuthenticated && user?.image ? (
            <img src={user.image} alt="" className="size-14 rounded-full object-cover" />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-full bg-secondary">
              <UserRound className="size-7 text-primary" />
            </span>
          )}
          <div className="min-w-0">
            <p className="text-[11.5px] font-medium text-muted-foreground">{t("profile.signedInAs")}</p>
            <p className="truncate text-[15.5px] font-bold text-foreground">
              {isAuthenticated ? user?.name || user?.email || "—" : t("profile.notSignedIn")}
            </p>
            {!isAuthenticated && (
              <button
                onClick={() => navigate("/auth?returnTo=%2Fapp%2Fprofile")}
                className="mt-1 text-[12.5px] font-bold text-primary cursor-pointer"
              >
                {t("profile.signIn")} →
              </button>
            )}
          </div>
        </section>

        {/* Language */}
        <section className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-[14px] font-bold text-foreground">{t("profile.language")}</p>
            <p className="text-[12px] text-muted-foreground">English · हिंदी</p>
          </div>
          <LanguageSwitcher />
        </section>

        {/* Referral */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              navigate("/auth?returnTo=%2Fapp%2Fprofile");
              return;
            }
            if (!referralCode) void handleGenerate();
            setRefOpen(true);
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-4 text-left cursor-pointer dark:border-teal-900 dark:bg-teal-950/40"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Megaphone className="size-5 text-primary" />
          </span>
          <span className="flex-1">
            <span className="block text-[14px] font-bold text-foreground">{t("refer.title")}</span>
            <span className="block truncate text-[12px] text-muted-foreground">
              {referralCode ? `${t("refer.mine")}: ${referralCode}` : t("refer.generate")}
            </span>
          </span>
          {referralCode && (
            <Copy
              className="size-4 text-primary"
              onClick={(e) => {
                e.stopPropagation();
                void navigator.clipboard.writeText(`https://feedants.com/r/${referralCode}`);
                toast.success(t("common.copied"));
              }}
            />
          )}
        </button>

        {isAuthenticated && (
          <button
            onClick={() => void handleSignOut()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3.5 text-[14px] font-bold text-destructive cursor-pointer"
          >
            <LogOut className="size-4" />
            {t("profile.signOut")}
          </button>
        )}
      </div>

      <BottomNav />

      <ReferralDialog
        open={refOpen}
        onOpenChange={setRefOpen}
        generating={generating}
        onGenerate={handleGenerate}
      />
    </PhoneShell>
  );
}
