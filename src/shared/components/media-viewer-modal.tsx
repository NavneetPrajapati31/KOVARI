import { useEffect, useRef } from "react";
import { XIcon } from "lucide-react";

interface MediaViewerModalProps {
  open: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: "image" | "video";
  timestamp?: string;
  sender?: string;
}

export const MediaViewerModal = ({
  open,
  onClose,
  mediaUrl,
  mediaType,
  timestamp,
  sender,
}: MediaViewerModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus trap: focus close button on open
  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-lg transition-all"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative max-w-full max-h-full w-full h-full flex items-center justify-center p-2 sm:p-8">
        {/* Close button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close media viewer"
          className="ring-offset-background bg-gray-200 rounded-full p-1 focus:ring-0 data-[state=open]:bg-secondary absolute top-5 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-offset-0 focus:outline-hidden disabled:pointer-events-none"
        >
          <XIcon className="size-4" />
        </button>
        <div className="flex flex-col items-center justify-center w-full h-full">
          {mediaType === "image" ? (
            <img
              src={mediaUrl}
              alt="media"
              className="max-h-[70vh] max-w-full rounded-2xl shadow-lg object-contain"
              draggable={false}
            />
          ) : (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-h-[70vh] max-w-full rounded-2xl shadow-lg object-contain bg-black"
            />
          )}
          <div className="flex flex-row items-center justify-between w-full mt-6 px-2 gap-2">
            {sender && (
              <span
                className="text-xs text-white/80 font-medium truncate max-w-xs"
                aria-label="Sender"
              >
                {sender}
              </span>
            )}
            {timestamp && (
              <span
                className="text-xs text-white/80 ml-auto"
                aria-label="Timestamp"
              >
                {timestamp}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaViewerModal;
