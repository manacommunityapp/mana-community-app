import React, { useState, useRef } from 'react';
import type { MatchPhoto } from '../../types/sports-enhanced';
import { sportsEnhancedService } from '../../services/sportsEnhancedService';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  matchId: number;
  photos:  MatchPhoto[];
  currentUserId?: number;
  onRefresh: () => void;
}

export function MatchPhotoGallery({ matchId, photos, currentUserId, onRefresh }: Props) {
  const [lightbox,  setLightbox]  = useState<MatchPhoto | null>(null);
  const [uploading, setUploading] = useState(false);
  const [caption,   setCaption]   = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl,  setPreviewUrl]  = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCaption('');
  }

  async function handleUpload() {
    if (!pendingFile) return;
    setUploading(true);
    try {
      await sportsEnhancedService.uploadMatchPhoto(matchId, pendingFile, caption || undefined);
      setPendingFile(null);
      setPreviewUrl(null);
      setCaption('');
      onRefresh();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleLike(photo: MatchPhoto) {
    try {
      await sportsEnhancedService.togglePhotoLike(matchId, photo.id);
      onRefresh();
    } catch {}
  }

  async function handleDelete(photo: MatchPhoto) {
    if (!confirm('Delete this photo?')) return;
    try {
      await sportsEnhancedService.deleteMatchPhoto(matchId, photo.id);
      setLightbox(null);
      onRefresh();
    } catch {}
  }

  return (
    <div className="space-y-4">
      {/* Upload section */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-semibold"
        >
          📷 Add Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {photos.length > 0 && (
          <span className="text-sm text-gray-500">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Pending upload preview */}
      {pendingFile && previewUrl && (
        <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 space-y-3">
          <img src={previewUrl} alt="preview" className="w-full max-h-48 object-cover rounded-lg" />
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption (optional)…"
            maxLength={120}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setPendingFile(null); setPreviewUrl(null); }}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex-2 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-2">📸</p>
          <p className="font-semibold text-gray-700">No photos yet</p>
          <p className="text-sm text-gray-500">Be the first to share a match memory.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {photos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(photo)}
              className="relative aspect-square overflow-hidden rounded-lg group"
            >
              <img
                src={photo.imageUrl}
                alt={photo.caption ?? 'Match photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
              {photo.likeCount > 0 && (
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs rounded-md px-1.5 py-0.5">
                  ❤️ {photo.likeCount}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex flex-col"
          onClick={(e) => { if (e.target === e.currentTarget) setLightbox(null); }}
        >
          {/* Close */}
          <div className="flex justify-end p-4">
            <button
              onClick={() => setLightbox(null)}
              className="text-white text-2xl w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* Image */}
          <div className="flex-1 flex items-center justify-center p-4">
            <img
              src={lightbox.imageUrl}
              alt={lightbox.caption ?? 'Match photo'}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Meta bar */}
          <div className="p-4 flex items-center gap-3 text-white">
            <div className="flex-1">
              <p className="font-semibold text-sm">{lightbox.uploaderName}</p>
              {lightbox.caption && <p className="text-gray-300 text-sm">{lightbox.caption}</p>}
              <p className="text-gray-400 text-xs mt-0.5">
                {formatDistanceToNow(new Date(lightbox.createdAt), { addSuffix: true })}
              </p>
            </div>
            <button
              onClick={() => handleLike(lightbox)}
              className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 rounded-full px-4 py-2 text-sm font-semibold"
            >
              {lightbox.isLiked ? '❤️' : '🤍'} {lightbox.likeCount}
            </button>
            {lightbox.uploadedById === currentUserId && (
              <button
                onClick={() => handleDelete(lightbox)}
                className="bg-red-500/30 hover:bg-red-500/50 rounded-full p-2"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
