
import React, { useState } from 'react';
import { X, Shield, Truck, Star, Zap, Smartphone, Check, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onBuyNowWithPi: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNowWithPi,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!product) return null;

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ id: 'default', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', isPrimary: true }];

  const activeImage = images[selectedImageIndex] || images[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-slate-800/80 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Multi-Image Gallery */}
          <div className="flex flex-col bg-slate-950/60 p-6 border-b md:border-b-0 md:border-r border-slate-800">
            {/* Primary Main Image with Navigation Arrows */}
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center group">
              <img
                src={activeImage.url}
                alt={activeImage.altText || product.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80';
                }}
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Photo indicator badge */}
              <div className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2 py-1 text-[11px] font-mono text-slate-300 backdrop-blur-sm">
                {selectedImageIndex + 1} / {images.length} Photos
              </div>
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.altText || `View ${idx + 1}`}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Vendor & Guarantee Box */}
            <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Sold & Fulfilled by:</span>
                <span className="font-semibold text-slate-200">{product.vendorName}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <Shield className="h-4 w-4" />
                <span>{product.warranty}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Truck className="h-4 w-4 text-amber-400" />
                <span>Express Dispatch with Pi Testnet Instant Escrow</span>
              </div>
            </div>
          </div>

          {/* Right Column: Product Info & Pi Purchase */}
          <div className="flex flex-col p-6 max-h-[85vh] overflow-y-auto">
            {/* Category & Condition */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-mono">
              <span className="uppercase text-amber-400 font-semibold">{product.brand}</span>
              <span>•</span>
              <span className="capitalize">{product.category.replace('_', ' ')}</span>
              <span>•</span>
              <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 font-sans">{product.condition}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {product.name}
            </h2>

            {/* Ratings */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="ml-1 text-sm font-semibold text-white">{product.rating}</span>
              </div>
              <span className="text-xs text-slate-400">({product.reviewCount} customer reviews)</span>
              <span className="text-xs text-slate-600">|</span>
              <span className="text-xs text-emerald-400 font-medium">{product.stock} units in stock</span>
            </div>

            {/* Price Box with Pi (π) */}
            <div className="mt-5 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 p-4">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400/80 block">Price in Pi Network (Testnet)</span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  {product.pricePi} <span className="text-2xl">π</span>
                </span>
                {product.fiatEquivalentUsd && (
                  <span className="text-xs font-mono text-slate-400">
                    (~${product.fiatEquivalentUsd.toLocaleString()} USD reference)
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Pay directly using official Pi Wallet via Pi Sandbox Testnet. No card or fiat required.
              </p>
            </div>

            {/* Description */}
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">Overview</h4>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{product.description}</p>
            </div>

            {/* Specifications */}
            {product.specs && product.specs.length > 0 && (
              <div className="mt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono mb-2.5">
                  Technical Specifications
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {product.specs.map((spec, idx) => (
                    <div key={idx} className="rounded-lg bg-slate-950/50 border border-slate-800/80 p-2.5">
                      <span className="text-slate-400 block text-[11px]">{spec.name}</span>
                      <span className="font-semibold text-slate-200 mt-0.5 block">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call to action buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => onAddToCart(product)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 py-3 px-4 text-sm font-semibold text-white hover:bg-slate-700 hover:border-slate-600 transition-all"
              >
                <ShoppingBag className="h-4 w-4" />
                Add to Cart
              </button>

              <button
                onClick={() => onBuyNowWithPi(product)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 px-4 text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
              >
                <Zap className="h-4 w-4 fill-slate-950" />
                Buy with Pi ({product.pricePi} π)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};