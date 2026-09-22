import { useQuery as useConvexQuery } from "convex/react";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useI18n } from "@/store/language";
import { unwrapResult } from "@/lib/api-client";
import { formatINRCompact } from "@/lib/format";

interface ReferralDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: () => Promise<void>;
  generating: boolean;
}

/** Refer & Earn modal — generated code + tracked referral stats. */
export function ReferralDialog({ open, onOpenChange, onGenerate, generating }: ReferralDialogProps) {
  const { t } = useI18n();
  // Envelope-unwrapping query; refetches on dialog open via key change.
  const res = useConvexQuery(api.referrals.me, open ? {} : "skip");
  interface ReferralData {
    code: string | null;
    referralUrl: string | null;
    referrals: { id: string; status: string; rewardAmount: number }[];
    rewardPerSignup: number;
  }
  let data: ReferralData | null = null;
  let error: string | null = null;
  if (res !== undefined) {
    try {
      data = unwrapResult<ReferralData>(res);
    } catch {
      error = "Could not load referral info.";
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] p-5">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold tracking-tight">{t("refer.title")}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {t("refer.earn", { amount: data?.rewardPerSignup ?? 10 })}
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        {!data ? (
          <div className="py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
        ) : data.code ? (
          <>
            <div className="mt-2 flex items-center gap-1.5">
              <code className="min-w-0 flex-1 truncate rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-[12px] text-foreground">
                {data.referralUrl}
              </code>
              <Button
                variant="outline"
                className="rounded-xl font-semibold"
                onClick={() => void navigator.clipboard.writeText(data!.referralUrl ?? "")}
              >
                {t("common.copy")}
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl border border-border p-3">
                <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground">
                  <Users className="size-3.5" />
                  {t("refer.signups", { n: data.referrals.length })}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">{data.referrals.length}</p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-[11.5px] font-medium text-muted-foreground">{t("refer.earned")}</p>
                <p className="mt-1 text-lg font-bold text-primary">
                  {formatINRCompact(data.referrals.reduce((a, r) => a + r.rewardAmount, 0))}
                </p>
              </div>
            </div>
          </>
        ) : (
          <Button className="mt-2 w-full rounded-xl font-bold" disabled={generating} onClick={() => void onGenerate()}>
            {generating ? "…" : t("refer.generate")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
