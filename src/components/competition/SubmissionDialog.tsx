import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { FileVideo, Loader2, Trash2, UploadCloud } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useI18n } from "@/store/language";
import { formatFileSize } from "@/lib/format";
import { unwrapResult, describeError, type ApiError } from "@/lib/api-client";
import { toast } from "sonner";

const MAX_SIZE = 100 * 1024 * 1024; // 100MB — mirrors server cap
const ALLOWED = ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"];

interface SubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitionIdOrSlug: string;
  existing?: {
    id: string;
    title: string;
    description: string | null;
    fileName: string | null;
    fileSize: number | null;
    submittedAt: number | null;
  } | null;
}

/**
 * Upload Submission flow — real client → storage upload, then a backend
 * mutation that re-validates registration, payment, window, file type/size
 * before persisting. Edits replace the file without resetting review state.
 */
export function SubmissionDialog({ open, onOpenChange, competitionIdOrSlug, existing }: SubmissionDialogProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ file: File; previewUrl: string } | null>(null);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.submissions.generateUploadUrl);
  const upsert = useMutation(api.submissions.upsert);

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError("Only MP4, MOV, WEBM or AVI video files are allowed.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError(`File is too large (max ${formatFileSize(MAX_SIZE)}).`);
      return;
    }
    setError(null);
    setFile({ file: f, previewUrl: URL.createObjectURL(f) });
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Please enter a performance title.");
      return;
    }
    if (!file && !existing) {
      setError("Please attach a video file.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let stored: { fileId?: Id<"_storage">; fileName?: string; fileType?: string; fileSize?: number } = {};
      if (file) {
        // 1. get short-lived upload URL from backend
        const { uploadUrl } = unwrapResult<{ uploadUrl: string }>(
          await generateUploadUrl({}),
        );
        // 2. PUT the raw video
        const res = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.file.type },
          body: file.file,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
        stored = {
          fileId: storageId,
          fileName: file.file.name,
          fileType: file.file.type,
          fileSize: file.file.size,
        };
      }
      // 3. backend re-validates everything before persisting
      const result = unwrapResult<{ edited: boolean }>(
        await upsert({
          idOrSlug: competitionIdOrSlug,
          title: title.trim(),
          description: description.trim() || undefined,
          ...stored,
        }),
      );
      toast.success(result.edited ? t("sub.updated") : t("sub.uploaded"));
      onOpenChange(false);
    } catch (err) {
      const e: ApiError = describeError(err);
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-h-[85dvh] max-w-[420px] overflow-y-auto p-5">
        <DialogHeader>
          <DialogTitle className="text-[17px] font-bold tracking-tight">
            {existing ? t("sub.edit") : t("sub.title")}
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            MP4, MOV, WEBM or AVI · up to {formatFileSize(MAX_SIZE)}
          </DialogDescription>
        </DialogHeader>

        {/* File picker */}
        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-msvideo"
            className="hidden"
            onChange={(e) => pickFile(e.target.files?.[0])}
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <video src={file.previewUrl} className="size-14 rounded-lg object-cover" muted />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-foreground">{file.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(file.file.size)}</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="rounded-lg p-1.5 text-muted-foreground cursor-pointer hover:bg-muted"
                aria-label="Remove video"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-border py-6 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              <UploadCloud className="size-6 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">{t("sub.chooseVideo")}</span>
            </button>
          )}
        </div>

        {/* Fields */}
        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="sub-title" className="text-[12.5px] font-semibold text-foreground">
              {t("sub.videoTitle")}
            </label>
            <Input
              id="sub-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("sub.videoTitlePh")}
              className="mt-1 rounded-xl"
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="sub-desc" className="text-[12.5px] font-semibold text-foreground">
              {t("sub.description")}
            </label>
            <Textarea
              id="sub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("sub.descriptionPh")}
              className="mt-1 min-h-20 rounded-xl"
              maxLength={600}
            />
          </div>
        </div>

        {error && (
          <p className="mt-2 text-[12.5px] font-medium text-destructive">{error}</p>
        )}

        <Button
          className="mt-4 w-full rounded-xl font-bold"
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("sub.submitting")}
            </>
          ) : (
            t("sub.submit")
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
