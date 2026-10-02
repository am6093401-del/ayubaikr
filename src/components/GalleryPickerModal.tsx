
import React, { useState, useRef } from 'react';
import { X, Search, Check, Upload, Image as ImageIcon, Sparkles, Filter, Trash2, CheckCircle2 } from 'lucide-react';
import { CURATED_GALLERY, GalleryAsset } from '../data/galleryData';

interface GalleryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImages: (images: { url: string; altText: string }[]) => void;
  currentlySelectedUrls?: string[];
}

export const GalleryPickerModal: React.FC<GalleryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectImages,
  currentlySelectedUrls = [],
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customUploads, setCustomUploads] = useState<GalleryAsset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<{ url: string; altText: string }[]>(
    currentlySelectedUrls.map((url, idx) => ({
      url,
      altText: `Product angle ${idx + 1}`
    }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Combine curated gallery with user device uploads
  const allAssets = [...customUploads, ...CURATED_GALLERY];

  const filteredAssets = allAssets.filter((asset) => {
    const matchesCategory = activeCategory === 'all' || asset.category === activeCategory;
    const matchesSearch =
      searchQuery === '' ||
      asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isSelected = (url: string) => selectedAssets.some((s) => s.url === url);

  const getSelectedIndex = (url: string) =>
    selectedAssets.findIndex((s) => s.url === url);

  const handleToggleSelect = (asset: GalleryAsset) => {
    const index = getSelectedIndex(asset.url);
    if (index >= 0) {
      // Deselect
      setSelectedAssets((prev) => prev.filter((_, i) => i !== index));
    } else {
      // Select
      setSelectedAssets((prev) => [
        ...prev,
        { url: asset.url, altText: asset.title }
      ]);
    }
  };

  // Compress large camera photos from device before converting to Base64
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      // If it's not an image file or SVG, fallback to direct reader
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // High quality JPEG downscale
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };

        img.onerror = () => {
          resolve((e.target?.result as string) || '');
        };

        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle uploading photos directly from device / phone gallery
  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);

    for (let idx = 0; idx < fileList.length; idx++) {
      const file = fileList[idx];
      try {
        const dataUrl = await compressImageFile(file);
        if (dataUrl) {
          const newAsset: GalleryAsset = {
            id: `upload-${Date.now()}-${idx}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            category: 'cases',
            url: dataUrl,
            tags: ['custom', 'device', 'upload']
          };

          setCustomUploads((prev) => [newAsset, ...prev]);

          // Automatically select newly uploaded image
          setSelectedAssets((prev) => [
            ...prev,
            { url: dataUrl, altText: file.name }
          ]);
        }
      } catch (err) {
        console.warn('Failed to compress device photo:', err);
      }
    }

    if (e.target) e.target.value = '';
  };

  const handleConfirm = () => {
    onSelectImages(selectedAssets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-hidden">
      <div className="relative flex flex-col w-full max-w-5xl h-[88vh] rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Select Product Images from Gallery</h2>
                <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-amber-300">
                  Multiple Select Enabled
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Choose phone and accessories photos from the curated store library or upload from your device gallery.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleDeviceUpload}
              multiple
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload from Device
            </button>

            <button
              onClick={onClose}
              className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/90 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Photos' },
              { id: 'smartphones', label: 'Phones' },
              { id: 'cases', label: 'Cases & Kevlar' },
              { id: 'chargers', label: 'GaN Chargers' },
              { id: 'audio', label: 'Earbuds & Audio' },
              { id: 'power_banks', label: 'Power Banks' },
              { id: 'screen_protectors', label: 'Screen Glass' },
              { id: 'parts', label: 'OEM Parts' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`rounded-lg px-3 py-1 text-xs whitespace-nowrap font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search gallery photos..."
              className="w-full rounded-lg border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Gallery Image Grid */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAssets.map((asset) => {
              const selected = isSelected(asset.url);
              const selectedIdx = getSelectedIndex(asset.url);

              return (
                <div
                  key={asset.id}
                  onClick={() => handleToggleSelect(asset)}
                  className={`group relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200 bg-slate-950 ${
                    selected
                      ? 'border-amber-500 ring-2 ring-amber-500/30 scale-[0.98] shadow-lg shadow-amber-500/10'
                      : 'border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img
                    src={asset.url}
                    alt={asset.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  {/* Selected checkmark / order badge */}
                  {selected && (
                    <div className="absolute top-2 right-2 flex items-center justify-center rounded-full bg-amber-500 text-slate-950 font-bold text-xs h-6 w-6 shadow-md border-2 border-slate-900">
                      {selectedIdx + 1}
                    </div>
                  )}

                  {/* Primary label on first selected */}
                  {selectedIdx === 0 && (
                    <div className="absolute top-2 left-2 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-slate-950 font-mono shadow-sm">
                      PRIMARY
                    </div>
                  )}

                  {/* Bottom caption overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 pt-6">
                    <p className="text-[11px] font-medium text-white line-clamp-1">
                      {asset.title}
                    </p>
                    <span className="text-[9px] font-mono text-amber-400 capitalize">
                      {asset.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Photos Tray & Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-300 font-mono whitespace-nowrap">
              Selected ({selectedAssets.length}):
            </span>

            {selectedAssets.length === 0 ? (
              <span className="text-xs text-slate-500 italic">No photos selected. Click any image to select.</span>
            ) : (
              <div className="flex gap-2">
                {selectedAssets.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden border border-amber-500/60"
                  >
                    <img src={item.url} alt="selected" className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[8px] font-bold text-amber-400 font-mono">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {selectedAssets.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedAssets([])}
                className="text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                Clear Selection
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedAssets.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 transition-all shadow-md shadow-amber-500/20"
            >
              <CheckCircle2 className="h-4 w-4" />
              Add {selectedAssets.length} Photos to Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};