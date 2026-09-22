import { CircleAlert, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/store/language";

interface VideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Video title (judge name / winner name). */
  title: string;
  subtitle?: string;
  videoUrl?: string;
}

/**
 * Video modal used for judge intro and previous-winner videos.
 * Plays the real URL when present; renders a graceful "Video unavailable"
 * state instead of crashing when absent or failing to load.
 */
export function VideoDialog({ open, onOpenChange, title, subtitle, videoUrl }: VideoDialogProps) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="text-[15px] font-bold tracking-tight">{title}</DialogTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </DialogHeader>

        {videoUrl ? (
          <video
            key={videoUrl}
            controls
            autoPlay
            playsInline
            className="aspect-video w-full bg-black"
            src={videoUrl}
            onError={(e) => {
              const el = e.currentTarget;
              el.replaceWith(Object.assign(document.createElement("div")));
            }}
          />
        ) : (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-muted">
            <CircleAlert className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">{t("judge.videoUnavailable")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
