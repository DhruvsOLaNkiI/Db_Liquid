import { Camera, ImagePlus, Loader2, Star, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import type { PropertyPhoto } from '../../types/listing';
import { readImageFileAsDataUrl } from '../../utils/fileUpload';
import { randomId } from '../../utils/randomId';

const MAX_PHOTOS = 8;

type Props = {
  photos: PropertyPhoto[];
  photoNote: string;
  onPhotosChange: (photos: PropertyPhoto[]) => void;
  onPhotoNoteChange: (value: string) => void;
};

export function SellerPhotosStep({ photos, photoNote, onPhotosChange, onPhotoNoteChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const remaining = MAX_PHOTOS - photos.length;

  async function handleFiles(files: FileList | File[] | null) {
    if (!files?.length) return;
    if (remaining <= 0) {
      setError(`You can upload up to ${MAX_PHOTOS} photos. Remove one to add another.`);
      return;
    }

    setError('');
    setUploading(true);

    const fileList = Array.from(files).slice(0, remaining);
    const next = [...photos];
    const errors: string[] = [];

    try {
      for (const file of fileList) {
        try {
          const dataUrl = await readImageFileAsDataUrl(file);
          next.push({
            id: randomId(),
            fileName: file.name,
            mimeType: file.type,
            dataUrl,
            uploadedAt: new Date().toISOString(),
          });
        } catch (err) {
          errors.push(
            `${file.name}: ${err instanceof Error ? err.message : 'Upload failed.'}`,
          );
        }
      }

      onPhotosChange(next.slice(0, MAX_PHOTOS));

      if (errors.length > 0) {
        setError(errors.join(' '));
      } else if (fileList.length < Array.from(files).length) {
        setError(`Only ${remaining} more photo${remaining === 1 ? '' : 's'} can be added.`);
      }
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(id: string) {
    onPhotosChange(photos.filter((photo) => photo.id !== id));
    setError('');
  }

  function makeCover(id: string) {
    const index = photos.findIndex((photo) => photo.id === id);
    if (index <= 0) return;
    const next = [...photos];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onPhotosChange(next);
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault();
    if (remaining > 0) setDragActive(true);
  }

  function onDragLeave(event: DragEvent) {
    event.preventDefault();
    setDragActive(false);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragActive(false);
    if (remaining <= 0) return;
    void handleFiles(event.dataTransfer.files);
  }

  return (
    <div className="space-y-6">
      <div>
        <Camera className="text-primary mb-4" size={28} />
        <h1 className="text-3xl font-bold tracking-tight mb-2">Property photos</h1>
        <p className="text-gray-600">
          Add multiple photos buyers will see on your listing. The first image is used as the cover.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{photos.length}</span> of {MAX_PHOTOS}{' '}
          photos added
        </p>
        {photos.length > 0 && (
          <p className="text-xs text-gray-500">Select several files at once from your device</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {photos.length === 0 ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`w-full border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 bg-gray-50 hover:border-primary/40 hover:bg-primary/5'
          }`}
        >
          {uploading ? (
            <Loader2 className="mx-auto text-primary mb-3 animate-spin" size={36} />
          ) : (
            <ImagePlus className="mx-auto text-gray-400 mb-3" size={36} />
          )}
          <p className="text-gray-700 font-medium">
            {uploading ? 'Uploading photos…' : 'Tap or drag photos here'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Up to {MAX_PHOTOS} images · JPG, PNG, or WEBP · max 2 MB each
          </p>
        </button>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group"
            >
              <img src={photo.dataUrl} alt={photo.fileName} className="w-full h-full object-cover" />
              {index === 0 && (
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-semibold">
                  Cover
                </span>
              )}
              <div className="absolute top-2 right-2 flex gap-1">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => makeCover(photo.id)}
                    className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label="Set as cover photo"
                    title="Set as cover"
                  >
                    <Star size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  aria-label={`Remove ${photo.fileName}`}
                >
                  <X size={14} />
                </button>
              </div>
              <p className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 text-[10px] text-white truncate">
                {photo.fileName}
              </p>
            </div>
          ))}

          {remaining > 0 && (
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-primary/40 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              {uploading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <ImagePlus size={24} />
              )}
              <span className="text-xs font-medium px-2 text-center">
                {uploading ? 'Adding…' : `Add more (${remaining} left)`}
              </span>
            </button>
          )}
        </div>
      )}

      {photos.length > 1 && (
        <p className="text-xs text-gray-500">
          Tap the star on any photo to make it the cover image shown on listing cards.
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-2">Photo note (optional)</label>
        <textarea
          value={photoNote}
          onChange={(e) => onPhotoNoteChange(e.target.value)}
          rows={3}
          placeholder="e.g. Drone shots available on request"
          className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors text-sm"
        />
      </div>
    </div>
  );
}
