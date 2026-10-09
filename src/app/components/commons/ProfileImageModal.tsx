import { useEffect } from "react";
import { X, User } from "lucide-react";
import { resolveImageUrl } from "../../../utils/imageUrlUtils";

interface ProfileImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  name?: string;
  subtitle?: string;
}

export function ProfileImageModal({
  isOpen,
  onClose,
  imageUrl,
  name,
  subtitle,
}: ProfileImageModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resolved = resolveImageUrl(imageUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full bg-card border border-border/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/70 bg-muted/40">
          <div className="min-w-0 pr-4">
            <h3 className="text-base sm:text-lg font-black text-foreground truncate">
              {name || "Profile Photo"}
            </h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Canvas */}
        <div className="p-4 sm:p-6 flex items-center justify-center bg-black/5 dark:bg-black/20 min-h-[300px] max-h-[75vh] overflow-hidden">
          {resolved ? (
            <img
              src={resolved}
              alt={name || "Profile"}
              className="max-h-[65vh] w-auto max-w-full rounded-xl sm:rounded-2xl object-contain shadow-md"
              onError={(e) => {
                const currentSrc = e.currentTarget.src;
                if (currentSrc && !currentSrc.includes("/api/files/")) {
                  const s3Match = currentSrc.match(/users\/\d+\/gallery\/.+/);
                  if (s3Match) {
                    e.currentTarget.src = `/api/files/${s3Match[0].split("?")[0]}`;
                    return;
                  }
                }
              }}
            />
          ) : (
            <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-muted flex flex-col items-center justify-center text-muted-foreground gap-2 border-2 border-dashed border-border">
              <User className="w-16 h-16 opacity-40" />
              <span className="text-xs font-semibold">No picture available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
