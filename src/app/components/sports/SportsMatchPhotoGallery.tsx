import { useState, useEffect, useRef } from "react";
import { Camera, Heart, Trash2, X, Upload, Loader2 } from "lucide-react";
import { sportsEnhancedService } from "../../../services/sports/sportsEnhancedService";
import type { MatchPhoto } from "../../../types/sports-enhanced";
import { useAuth } from "../../../contexts/AuthContext";

interface SportsMatchPhotoGalleryProps {
  matchId: number;
  onClose?: () => void;
  inline?: boolean;
}

export function SportsMatchPhotoGallery({ matchId, onClose, inline = false }: SportsMatchPhotoGalleryProps) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<MatchPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [fullscreen, setFullscreen] = useState<MatchPhoto | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sportsEnhancedService.getMatchPhotos(matchId)
      .then(setPhotos)
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, [matchId]);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const photo = await sportsEnhancedService.uploadMatchPhoto(matchId, file, caption || undefined);
      setPhotos(prev => [photo, ...prev]);
      setCaption("");
      setShowUpload(false);
    } catch { /* toast error */ }
    setUploading(false);
  };

  const handleLike = async (photoId: number) => {
    setPhotos(prev => prev.map(p =>
      p.id === photoId ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) } : p
    ));
    try { await sportsEnhancedService.togglePhotoLike(matchId, photoId); } catch {
      setPhotos(prev => prev.map(p =>
        p.id === photoId ? { ...p, isLiked: !p.isLiked, likeCount: p.likeCount + (p.isLiked ? -1 : 1) } : p
      ));
    }
  };

  const handleDelete = async (photoId: number) => {
    try {
      await sportsEnhancedService.deleteMatchPhoto(matchId, photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      setFullscreen(null);
    } catch { /* toast error */ }
  };

  const timeAgo = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div style={inline ? {} : {
      position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        ...(inline ? {} : {
          background: "var(--card)", borderRadius: 16, maxWidth: 700, width: "100%",
          maxHeight: "90vh", overflow: "auto",
        }),
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(148,163,184,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Camera size={16} style={{ color: "var(--gold)" }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Match Photos ({photos.length})</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowUpload(!showUpload)} style={{
              fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 6,
              background: "var(--gold)", color: "#000", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Upload size={12} /> Add Photo
            </button>
            {onClose && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}><X size={18} /></button>}
          </div>
        </div>

        {/* Upload Area */}
        {showUpload && (
          <div style={{ padding: 16, borderBottom: "1px solid rgba(148,163,184,0.1)", background: "rgba(212,160,23,0.04)" }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={caption} onChange={e => setCaption(e.target.value)}
                placeholder="Add a caption (optional)"
                style={{ flex: 1, fontSize: 12, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.15)", background: "var(--card)", color: "var(--text)" }}
              />
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
                fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 8,
                background: uploading ? "var(--muted)" : "var(--gold)", color: "#000", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 4,
              }}>
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                {uploading ? "Uploading..." : "Choose Photo"}
              </button>
            </div>
          </div>
        )}

        {/* Photo Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontSize: 12 }}>Loading photos...</div>
          </div>
        ) : photos.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--muted)" }}>
            <Camera size={32} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
            <div style={{ fontSize: 13 }}>No photos yet</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Be the first to share a moment from this match</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 4, padding: 8 }}>
            {photos.map(photo => (
              <div key={photo.id} onClick={() => setFullscreen(photo)} style={{
                position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden",
                cursor: "pointer", background: "rgba(148,163,184,0.08)",
              }}>
                <img src={photo.imageUrl} alt={photo.caption || "Match photo"} loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 6px 4px",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 9, color: "#fff", fontWeight: 600, display: "flex", alignItems: "center", gap: 2 }}>
                    <Heart size={9} fill={photo.isLiked ? "#ef4444" : "none"} stroke={photo.isLiked ? "#ef4444" : "#fff"} />
                    {photo.likeCount}
                  </span>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.7)" }}>{photo.uploaderName?.split(" ")[0]}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Viewer */}
      {fullscreen && (
        <div onClick={() => setFullscreen(null)} style={{
          position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.9)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: "100%", padding: 16 }}>
            <img src={fullscreen.imageUrl} alt={fullscreen.caption || ""} style={{
              width: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: 12,
            }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, color: "#fff" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{fullscreen.uploaderName}</div>
                {fullscreen.caption && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{fullscreen.caption}</div>}
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{timeAgo(fullscreen.createdAt)}</div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => handleLike(fullscreen.id)} style={{
                  background: "none", border: "none", cursor: "pointer", color: "#fff",
                  display: "flex", alignItems: "center", gap: 4, fontSize: 12,
                }}>
                  <Heart size={16} fill={fullscreen.isLiked ? "#ef4444" : "none"} stroke={fullscreen.isLiked ? "#ef4444" : "#fff"} />
                  {fullscreen.likeCount}
                </button>
                {user?.id === fullscreen.uploadedById && (
                  <button onClick={() => handleDelete(fullscreen.id)} style={{
                    background: "none", border: "none", cursor: "pointer", color: "#ef4444",
                    display: "flex", alignItems: "center", gap: 4, fontSize: 12,
                  }}>
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
