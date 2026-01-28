import { useState, useEffect, useRef } from "react";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Loader2, Plus, Video } from "lucide-react";
import { HiPlay } from "react-icons/hi";
import { Skeleton } from "@heroui/react";
import MediaViewerModal from "@/shared/components/media-viewer-modal";
import { useGroupMembers } from "@/shared/hooks/useGroupMembers";

interface MediaItem {
  id: string;
  url: string;
  type: "image" | "video";
  uploaded_by: string;
  created_at: string;
}

interface Props {
  groupId: string;
  userId: string;
  /** When true, open the full-screen gallery immediately (e.g. from chat header button). */
  initialGalleryOpen?: boolean;
  /** Called when the gallery is closed (so parent can close sheet/overlay). */
  onGalleryClose?: () => void;
}

export const GroupMediaSection = ({
  groupId,
  userId,
  initialGalleryOpen = false,
  onGalleryClose,
}: Props) => {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal state (single media viewer, with optional gallery index for nav)
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState<string | null>(null);
  const [modalMediaType, setModalMediaType] = useState<
    "image" | "video" | null
  >(null);
  const [modalTimestamp, setModalTimestamp] = useState<string | undefined>(
    undefined
  );
  const [modalSender, setModalSender] = useState<string | undefined>(undefined);
  const [modalCurrentIndex, setModalCurrentIndex] = useState(0);

  // Full-screen "See all" gallery (WhatsApp/Telegram style)
  const [galleryOpen, setGalleryOpen] = useState(initialGalleryOpen);

  // Fetch group members
  const { members } = useGroupMembers(groupId);

  const fetchMedia = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/media`);
      console.log("[MEDIA][GET] status:", res.status);
      if (!res.ok) throw new Error("Failed to fetch media");
      const data = await res.json();
      console.log("[MEDIA][GET] data:", data);
      setMedia(data);
    } catch (err: any) {
      console.error("[MEDIA][GET] error:", err);
      setError(err.message || "Error fetching media");
    } finally {
      setLoading(false);
      console.log("[MEDIA][GET] media state:", media);
    }
  };

  useEffect(() => {
    fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // When parent asks for gallery to open immediately (e.g. from chat header)
  useEffect(() => {
    if (initialGalleryOpen) setGalleryOpen(true);
  }, [initialGalleryOpen]);

  const handleCloseGallery = () => {
    setGalleryOpen(false);
    onGalleryClose?.();
  };

  // Close gallery on Escape
  useEffect(() => {
    if (!galleryOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseGallery();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [galleryOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploaded_by", userId); // <-- use real userId
      const res = await fetch(`/api/groups/${groupId}/media`, {
        method: "POST",
        body: formData,
      });
      console.log("[MEDIA][POST] status:", res.status);
      if (!res.ok) {
        const err = await res.json();
        console.error("[MEDIA][POST] error:", err);
        throw new Error(err.error || "Failed to upload");
      }
      const uploaded = await res.json();
      console.log("[MEDIA][POST] uploaded:", uploaded);
      await fetchMedia();
    } catch (err: any) {
      console.error("[MEDIA][POST] error:", err);
      setError(err.message || "Error uploading");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Photos and videos
        </h3>
        {media.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              className="bg-transparent text-primary text-sm p-0 h-auto font-medium"
              aria-label="See all media"
              tabIndex={0}
              onClick={() => setGalleryOpen(true)}
            >
              See all
            </Button>
            {/* <Button
              type="button"
              className="bg-transparent text-primary p-0 h-auto w-8 flex items-center justify-center"
              aria-label="Add photo or video"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </Button> */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
              aria-label="Upload photo or video"
            />
          </div>
        )}
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="aspect-[4/3] w-full h-full rounded-xl"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center text-xs text-red-500 py-4">{error}</div>
      ) : media.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 mx-auto mb-3 bg-muted rounded-full flex items-center justify-center">
            <Video className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            No photos or videos yet
          </p>
          <p className="text-xs text-muted-foreground">
            Share memories with your group
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {media.slice(0, 4).map((item, idx) => {
            return (
              <button
                key={item.id}
                type="button"
                className="aspect-[4/3] rounded-xl overflow-hidden relative group focus:outline-none focus:ring-0"
                aria-label={`View ${item.type} in full screen`}
                tabIndex={0}
                onClick={() => {
                  const idx = media.findIndex((m) => m.id === item.id);
                  setModalCurrentIndex(idx >= 0 ? idx : 0);
                  const displayName =
                    members.find((m) => m.id === item.uploaded_by)?.name ||
                    "Unknown";
                  setModalMediaUrl(item.url);
                  setModalMediaType(item.type);
                  setModalTimestamp(item.created_at);
                  setModalSender(displayName);
                  setModalOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    const idx = media.findIndex((m) => m.id === item.id);
                    setModalCurrentIndex(idx >= 0 ? idx : 0);
                    const displayName =
                      members.find((m) => m.id === item.uploaded_by)?.name ||
                      "Unknown";
                    setModalMediaUrl(item.url);
                    setModalMediaType(item.type);
                    setModalTimestamp(item.created_at);
                    setModalSender(displayName);
                    setModalOpen(true);
                  }
                }}
              >
                {item.type === "image" ? (
                  <img
                    src={item.url}
                    alt={"Media " + (idx + 1)}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <>
                    <video
                      src={item.url}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      controls={false}
                      aria-label="Video preview"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <HiPlay className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </>
                )}
                {idx === 3 && media.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                    <span className="text-primary-foreground font-semibold text-sm">
                      +{media.length - 4}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Full-screen "See all" gallery (WhatsApp/Telegram style) */}
      {galleryOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-card"
          aria-modal="true"
          role="dialog"
          aria-label="Photos and videos gallery"
        >
          {/* Header */}
          <div className="flex items-center gap-3 shrink-0 border-b border-border px-3 py-3 safe-area-top">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:bg-transparent hover:text-foreground"
              aria-label="Close gallery"
              onClick={handleCloseGallery}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-base font-semibold text-foreground">
              Photos and videos
            </h2>
            <span className="text-sm text-muted-foreground ml-1">
              {media.length}
            </span>
          </div>

          {/* Scrollable grid - 3 cols on small, 4 on sm+ */}
          <div className="flex-1 overflow-y-auto hide-scrollbar p-4 sm:p-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {loading ? (
                Array.from({ length: 24 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="aspect-[4/3] w-full rounded-lg"
                  />
                ))
              ) : (
                media.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    className="aspect-[4/3] rounded-lg overflow-hidden relative group focus:outline-none focus:ring-0 focus:ring-offset-0"
                    aria-label={`View ${item.type} ${idx + 1} of ${media.length}`}
                    onClick={() => {
                      setModalCurrentIndex(idx);
                      const displayName =
                        members.find((m) => m.id === item.uploaded_by)?.name ||
                        "Unknown";
                      setModalMediaUrl(item.url);
                      setModalMediaType(item.type);
                      setModalTimestamp(item.created_at);
                      setModalSender(displayName);
                      setModalOpen(true);
                    }}
                  >
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt=""
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <video
                          src={item.url}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                          muted
                          playsInline
                          preload="metadata"
                          aria-hidden
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                          <HiPlay className="h-8 w-8 text-white drop-shadow" />
                        </div>
                      </>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Single media viewer modal (opens from grid or preview) */}
      <MediaViewerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mediaUrl={modalMediaUrl || ""}
        mediaType={modalMediaType as "image" | "video"}
        timestamp={modalTimestamp}
        sender={modalSender}
        mediaItems={
          media.length > 0
            ? media.map((m) => ({
                url: m.url,
                type: m.type,
                timestamp: m.created_at,
                sender:
                  members.find((mb) => mb.id === m.uploaded_by)?.name ||
                  "Unknown",
              }))
            : undefined
        }
        currentIndex={modalCurrentIndex}
        onIndexChange={(i) => {
          if (i < 0 || i >= media.length) return;
          setModalCurrentIndex(i);
          const m = media[i];
          setModalMediaUrl(m.url);
          setModalMediaType(m.type);
          setModalTimestamp(m.created_at);
          setModalSender(
            members.find((mb) => mb.id === m.uploaded_by)?.name || "Unknown"
          );
        }}
      />
    </div>
  );
};

export default GroupMediaSection;
