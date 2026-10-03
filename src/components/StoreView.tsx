
import React, { useState } from 'react';
import { Search, SlidersHorizontal, Star, ShoppingBag, Eye, Zap, Shield, Sparkles, Smartphone, Layers, CheckCircle } from 'lucide-react';
import { Product } from '../types';
import { PiUser } from '../services/piSdk';

interface StoreViewProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onBuyNowWithPi: (product: Product) => void;
  onNavigateToLab: () => void;
  currentUser?: PiUser | null;
  onOpenAuthModal?: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'smartphones', label: 'Smartphones & Foldables' },
  { id: 'cases', label: 'MagSafe & Kevlar Cases' },
  { id: 'chargers', label: 'GaN Fast Chargers' },
  { id: 'audio', label: 'Hi-Res Wireless Audio' },
  { id: 'power_banks', label: 'High-Capacity Power Banks' },
  { id: 'screen_protectors', label: 'Sapphire Screen Glass' },
];

export const StoreView: React.FC<StoreViewProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onBuyNowWithPi,
  onNavigateToLab,
  currentUser,
  onOpenAuthModal,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  filteredProducts.sort((a, b) => {
    if (sortBy === 'price-asc') return a.pricePi - b.pricePi;
    if (sortBy === 'price-desc') return b.pricePi - a.pricePi;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/40 p-6 sm:p-10 mb-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-mono text-amber-300 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Official Pi Testnet E-Commerce Flagship</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            ayubaikr <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Phones & Accessories</span> Business Ltd
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
            Authorized retailer for premier flagship smartphones, MagSafe aramid accessories, and ultra-fast GaN chargers. Priced transparently in Pi (π) with instant Testnet blockchain settlement.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {currentUser ? (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-2.5 text-xs sm:text-sm font-mono text-amber-300 hover:bg-amber-500/20 transition-all shadow-sm"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-xs">
                  π
                </div>
                <span className="font-bold">@{currentUser.username}</span>
                <span className="text-[10px] text-emerald-400 font-sans font-semibold">● Pioneer Logged In</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20"
              >
                <span className="font-black font-mono text-base leading-none">π</span>
                <span>Login with Pi SDK</span>
              </button>
            )}

            <button
              onClick={() => setSelectedCategory('smartphones')}
              className="rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
            >
              Browse Flagship Phones
            </button>
            <button
              onClick={onNavigateToLab}
              className="rounded-xl border border-amber-500/40 bg-slate-900/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
            >
              Run A2U ↔ U2A Payment Tests
            </button>
          </div>
        </div>

        {/* Decorative corner element */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phones, chargers, cases, displays..."
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
            />
          </div>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High (π)</option>
              <option value="price-desc">Price: High to Low (π)</option>
            </select>
          </div>
        </div>

        {/* Category horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-4 py-2 text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <Smartphone className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-white">No products found</h3>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search terms or category filter.</p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="mt-4 rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-amber-300 hover:bg-slate-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const primaryImg = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80';
            const photoCount = product.images?.length || 1;

            return (
              <div
                key={product.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-amber-500/40 hover:bg-slate-900 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div>
                  {/* Image container */}
                  <div
                    className="relative aspect-square w-full overflow-hidden bg-slate-950 cursor-pointer"
                    onClick={() => onSelectProduct(product)}
                  >
                    <img
                      src={primaryImg}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80';
                      }}
                    />

                    {/* Multi-image photo count badge */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 rounded-md bg-black/75 px-2 py-0.5 text-[10px] font-mono text-slate-300 backdrop-blur-sm">
                      <Layers className="h-3 w-3 text-amber-400" />
                      <span>{photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}</span>
                    </div>

                    {/* Stock badge */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="rounded bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-white/10">
                        {product.condition}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
                      <span className="font-semibold text-amber-400">{product.brand}</span>
                      <span className="truncate max-w-[120px] text-slate-500">{product.vendorName}</span>
                    </div>

                    <h3
                      onClick={() => onSelectProduct(product)}
                      className="text-sm font-semibold text-white line-clamp-2 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      {product.name}
                    </h3>

                    {/* Specs peek */}
                    {product.specs && product.specs[0] && (
                      <p className="mt-1 text-[11px] text-slate-400 truncate">
                        {product.specs[0].name}: {product.specs[0].value}
                      </p>
                    )}

                    {/* Ratings */}
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <div className="flex items-center text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="ml-1 text-[11px] font-medium text-white">{product.rating}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">({product.reviewCount})</span>
                      <span className="text-slate-700">·</span>
                      <span className="text-[10px] text-emerald-400">{product.stock} in stock</span>
                    </div>
                  </div>
                </div>

                {/* Footer price & actions */}
                <div className="p-4 pt-0 border-t border-slate-800/80 mt-2">
                  <div className="flex items-baseline justify-between py-2">
                    <div>
                      <span className="text-lg font-black text-amber-400 font-mono tracking-tight">
                        {product.pricePi} <span className="text-sm">π</span>
                      </span>
                      {product.fiatEquivalentUsd && (
                        <span className="ml-1.5 text-[10px] font-mono text-slate-500">
                          (~${product.fiatEquivalentUsd})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => onSelectProduct(product)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Gallery
                    </button>

                    <button
                      onClick={() => onBuyNowWithPi(product)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-amber-500 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-sm"
                    >
                      <Zap className="h-3.5 w-3.5 fill-slate-950" />
                      Buy (Pi)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};