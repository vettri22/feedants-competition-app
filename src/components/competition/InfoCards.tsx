import { useState } from "react";
import {
  BadgeIndianRupee,
  Check,
  CircleAlert,
  Copy,
  Megaphone,
  MessageCircle,
  Play,
  ShieldCheck,
  SquareArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/store/language";
import { formatINRCompact } from "@/lib/format";

/** Teal-tinted disclaimer strip from competition data. */
export function DisclaimerBanner({ text }: { text: string }) {
  const { t } = useI18n();
  return (
    <div
      role="note"
      className="flex items-start gap-2.5 rounded-2xl border border-teal-100 bg-teal-50/70 px-4 py-3 dark:border-teal-900 dark:bg-teal-950/40"
    >
      <CircleAlert className="mt-0.5 size-4.5 shrink-0 text-primary" />
      <p className="text-[13px] leading-5 text-foreground">
        <span className="font-bold">{t("comp.disclaimer")}:</span> {text}
      </p>
    </div>
  );
}

/** Prize-money video, refund policy and secure payments info row. */
export function PaymentInfoCard({ refundPolicy }: { refundPolicy: string }) {
  const { t } = useI18n();
  return (
    <section className="grid grid-cols-2 gap-3">
      <button className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-left cursor-pointer transition-colors hover:border-primary/40">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
          <Play className="size-5 fill-primary text-primary" />
        </span>
        <span>
          <span className="block text-[13px] font-bold leading-4.5 text-foreground">
            {t("users.prizeQ")}
          </span>
          <span className="mt-1 block text-[11.5px] text-muted-foreground">
            {t("users.watchToKnow")}
          </span>
        </span>
      </button>

      <div className="flex flex-col justify-between gap-2 rounded-2xl border border-border bg-card p-3.5">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-4.5 shrink-0 text-primary" />
          <span className="text-[12.5px] font-medium text-foreground">{t("pay.refundPolicy")}</span>
        </div>
        <p className="text-[11px] leading-4 text-muted-foreground">{refundPolicy}</p>
        <div className="flex items-center gap-1.5 border-t border-border pt-2">
          <BadgeIndianRupee className="size-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-muted-foreground">
            {t("pay.securedBy")} <span className="font-bold text-foreground">Razorpay</span>
          </span>
        </div>
      </div>
    </section>
  );
}

interface ReferralCardProps {
  rewardAmount: number;
  referralUrl: string | null;
  onGenerate: () => Promise<void>;
  generating: boolean;
  signedIn: boolean;
}

/** Refer & Earn card: link generation, copy-to-clipboard, reward caption. */
export function ReferralCard({ rewardAmount, referralUrl, onGenerate, generating, signedIn }: ReferralCardProps) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success(t("common.copied"));
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed — long-press the link to copy.");
    }
  };

  return (
    <section className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-3.5 dark:border-teal-900 dark:bg-teal-950/40">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <Megaphone className="size-5 text-primary" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-foreground">{t("refer.title")}</p>
        {referralUrl ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] text-muted-foreground">
              {referralUrl}
            </code>
            <button
              onClick={copy}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground cursor-pointer hover:bg-muted transition-colors"
            >
              {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
              {copied ? t("common.copied") : t("common.copy")}
            </button>
          </div>
        ) : (
          <button
            onClick={() => void onGenerate()}
            disabled={generating || !signedIn}
            className="mt-1.5 rounded-lg bg-secondary px-3 py-1.5 text-[11.5px] font-semibold text-primary cursor-pointer disabled:opacity-50"
          >
            {generating ? "…" : signedIn ? t("refer.generate") : t("profile.signIn")}
          </button>
        )}
        <p className="mt-1.5 text-[11.5px] text-muted-foreground">
          {t("refer.earn", { amount: rewardAmount })}
        </p>
      </div>
      <button className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-[12.5px] font-bold text-primary-foreground cursor-pointer transition-transform active:scale-95">
        {t("refer.referNow")}
      </button>
    </section>
  );
}

/** Testimonials entry row. */
export function UserReviewsButton() {
  const { t } = useI18n();
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left cursor-pointer transition-colors hover:border-primary/40">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border">
        <MessageCircle className="size-4.5 text-primary" />
      </span>
      <span className="flex-1">
        <span className="block text-[13.5px] font-bold text-foreground">{t("users.hearFrom")}</span>
        <span className="block text-[11.5px] text-muted-foreground">{t("users.seeWhat")}</span>
      </span>
      <SquareArrowUpRight className="size-4 text-muted-foreground" />
    </button>
  );
}

/** Advertisement placeholder. */
export function AdPlaceholder() {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-4 text-sm text-muted-foreground">
      <Megaphone className="size-4" />
      {t("ad.here")}
    </div>
  );
}
