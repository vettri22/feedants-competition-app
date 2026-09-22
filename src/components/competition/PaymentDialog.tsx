import { useState } from "react";
import { useMutation } from "convex/react";
import { Loader2, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
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
import { formatINRCompact } from "@/lib/format";
import { unwrapResult, describeError, type ApiError } from "@/lib/api-client";
import { toast } from "sonner";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionIdOrSlug: string;
  entryFee: number;
  onSuccess: () => void;
}

/**
 * Development payment gateway — clearly-labeled simulation standing in for
 * Razorpay. Flow is REAL: creates a PENDING order on the backend, then a
 * backend mutation (not client state) transitions PENDING → PAID|FAILED and
 * updates the registration. With Razorpay env credentials the same dialog
 * would open the Razorpay checkout and verify via backend webhook.
 */
export function PaymentDialog({ open, onOpenChange, competitionIdOrSlug, entryFee, onSuccess }: PaymentDialogProps) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<"idle" | "processing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const createOrder = useMutation(api.payments.createOrder);
  const confirm = useMutation(api.payments.confirmSimulated);

  const runPayment = async (outcome: "SUCCESS" | "FAILED") => {
    setPhase("processing");
    setError(null);
    try {
      const order = unwrapResult<{ orderId: string; simulated: boolean }>(
        await createOrder({ idOrSlug: competitionIdOrSlug }),
      );
      if ("alreadyPaid" in order && order.alreadyPaid) {
        onSuccess();
        onOpenChange(false);
        return;
      }
      const res = unwrapResult<{ status: string }>(
        await confirm({ orderId: order.orderId as never, outcome }),
      );
      if (res.status === "PAID") {
        toast.success(t("pay.success"));
        onSuccess();
        onOpenChange(false);
      } else {
        setPhase("idle");
        toast.error(t("pay.failed"));
      }
    } catch (err) {
      const e: ApiError = describeError(err);
      setError(e.message);
      setPhase("error");
    }
  };

  const busy = phase === "processing";

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-w-[400px] p-5">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold tracking-tight">{t("pay.title")}</DialogTitle>
          <DialogDescription className="text-[13px]">
            {t("pay.subtitle", { fee: formatINRCompact(entryFee) })}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          {t("pay.simulatedNote")}
        </div>

        <div className="mt-3 space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">Entry fee</span>
            <span className="font-bold text-foreground">{formatINRCompact(entryFee)}</span>
          </div>
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">Platform</span>
            <span className="inline-flex items-center gap-1 font-semibold text-foreground">
              <Lock className="size-3.5 text-primary" /> Razorpay (sim)
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2 text-[13px]">
            <span className="font-semibold text-foreground">Total</span>
            <span className="text-[15px] font-bold text-primary">{formatINRCompact(entryFee)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-destructive">
            <TriangleAlert className="size-3.5" />
            {error}
          </p>
        )}

        <div className="mt-4 space-y-2">
          <Button
            className="w-full rounded-xl font-bold"
            disabled={busy}
            onClick={() => void runPayment("SUCCESS")}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("pay.processing")}
              </>
            ) : (
              t("pay.payNow", { fee: formatINRCompact(entryFee) })
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl font-semibold"
            disabled={busy}
            onClick={() => void runPayment("FAILED")}
          >
            {t("pay.simulateFailure")}
          </Button>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          {t("pay.securedBy")} <span className="font-bold text-foreground">Razorpay</span>
        </p>
      </DialogContent>
    </Dialog>
  );
}
