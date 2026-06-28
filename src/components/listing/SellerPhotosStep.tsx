import { Camera, ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { PropertyPhoto } from '../../types/listing';
import { readImageFileAsDataUrl } from '../../utils/fileUpload';

type Props = {
  photos: PropertyPhoto[];
  photoNote: string;
  onPhotosChange: (photos: PropertyPhoto[]) => void;
  onPhotoNoteChange: (value: string) => void;
};

export function SellerPhotosStep({ photos, photoNote, onPhotosChange, onPhotoNoteChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError('');

    try {
      const next = [...photos];
      for (const file of Array.from(files)) {
        const dataUrl = await readImageFileAsDataUrl(file);
        next.push({
          id: crypto.randomUUID(),
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        });
      }
      onPhotosChange(next.slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

  function removePhoto(id: string) {
    onPhotosChange(photos.filter((photo) => photo.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <Camera className="text-primary mb-4" size={28} />
        <h1 className="text-3xl font-bold tracking-tight mb-2">Property photos</h1>
        <p className="text-gray-600">
          Add photos buyers will see on your listing. Document verification comes in the next step.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center bg-gray-50 hover:border-primary/40 hover:bg-primary/5 transition-colors"
      >
        <ImagePlus className="mx-auto text-gray-400 mb-3" size={36} />
        <p className="text-gray-700 font-medium">Tap to upload property photos</p>
        <p className="text-gray-400 text-sm mt-1">Up to 8 images · JPG or PNG · max 2 MB each</p>
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-gray-200">
              <img src={photo.dataUrl} alt={photo.fileName} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label={`Remove ${photo.fileName}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

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
