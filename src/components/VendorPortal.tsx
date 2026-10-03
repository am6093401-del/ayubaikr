
import React, { useState } from 'react';
import { Store, Plus, Package, DollarSign, Wallet, CheckCircle, ExternalLink, Smartphone, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { Vendor, Product, Order, PiBackendConfig } from '../types';
import { GalleryPickerModal } from './GalleryPickerModal';

interface VendorPortalProps {
  vendors: Vendor[];
  products: Product[];
  orders: Order[];
  piConfig: PiBackendConfig | null;
  onAddProduct: (product: Partial<Product>) => Promise<void>;
}

export const VendorPortal: React.FC<VendorPortalProps> = ({
  vendors,
  products,
  orders,
  piConfig,
  onAddProduct,
}) => {
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGalleryPickerModal, setShowGalleryPickerModal] = useState(false);

  const activeVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0];
  const vendorProducts = products.filter((p) => p.vendorId === activeVendor?.id);
  const vendorOrders = orders.filter((o) => o.vendorIds?.includes(activeVendor?.id));

  // Quick product add state
  const [pName, setPName] = useState('');
  const [pBrand, setPBrand] = useState('ayubaikr');
  const [pCategory, setPCategory] = useState<Product['category']>('smartphones');
  const [pPricePi, setPPricePi] = useState('0.10');
  const [pStock, setPStock] = useState('15');
  const [pDescription, setPDescription] = useState('');
  const [vendorImages, setVendorImages] = useState<{ url: string; altText: string }[]>([
    { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80', altText: 'Front angle' },
    { url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80', altText: 'Rear finish' }
  ]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pPricePi) return;

    const formattedImages = vendorImages
      .filter((i) => i.url.trim().length > 0)
      .map((img, idx) => ({
        id: `img-v-${Date.now()}-${idx}`,
        url: img.url.trim(),
        altText: img.altText || `${pName} View ${idx + 1}`,
        isPrimary: idx === 0
      }));

    if (formattedImages.length === 0) {
      formattedImages.push({
        id: `img-v-${Date.now()}-0`,
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
        altText: pName,
        isPrimary: true
      });
    }

    await onAddProduct({
      name: pName,
      brand: pBrand,
      category: pCategory,
      pricePi: parseFloat(pPricePi),
      stock: parseInt(pStock, 10) || 10,
      description: pDescription,
      vendorId: activeVendor.id,
      images: formattedImages
    });

    setShowAddModal(false);
    setPName('');
    setPDescription('');
  };

  const handleSelectFromGallery = (selected: { url: string; altText: string }[]) => {
    if (selected.length > 0) {
      setVendorImages(selected);
    }
  };

  if (!activeVendor) {
    return <div className="p-8 text-center text-slate-400">No vendors registered yet.</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header & Vendor Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Vendor Portal</h1>
            <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-mono text-amber-300">
              Merchant Center
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your phones & phone accessories storefront, list new inventory with multiple images, and audit Pi earnings.
          </p>
        </div>

        {/* Switch Vendor profile */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Active Vendor:</label>
          <select
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 font-semibold focus:border-amber-500 focus:outline-none"
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vendor Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Total Pi Balance</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400 font-mono">{activeVendor.totalPiEarned} π</span>
            <Wallet className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Testnet Settlement</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Listed Products</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{vendorProducts.length}</span>
            <Package className="h-4 w-4 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-500">Live in catalog</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Platform Commission</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{activeVendor.commissionRatePercent}%</span>
            <span className="text-xs text-amber-400">Standard</span>
          </div>
          <span className="text-[10px] text-slate-500">ayubaikr Platform Fee</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Payout Wallet</span>
          <div className="mt-1 truncate font-mono text-xs text-amber-300 font-semibold" title={activeVendor.walletAddress}>
            {activeVendor.walletAddress || piConfig?.recipientTestnetWallet}
          </div>
          <span className="text-[10px] text-emerald-400">Pi Testnet Verified</span>
        </div>
      </div>

      {/* Main Vendor Content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Your Listed Inventory ({vendorProducts.length})</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add New Item
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendorProducts.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-950 border border-slate-800">
                <img
                  src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80'}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[9px] font-mono text-amber-400">
                  {p.images?.length || 1} imgs
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono uppercase text-amber-400">{p.brand}</span>
                <h4 className="font-semibold text-white text-xs line-clamp-1">{p.name}</h4>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-sm font-bold text-amber-400 font-mono">{p.pricePi} π</span>
                  <span className="text-[10px] text-slate-500 font-mono">({p.stock} in stock)</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 line-clamp-1">{p.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-4">Add Item for {activeVendor.name}</h2>
            <form onSubmit={handleQuickAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Ultra Thin Magnetic Case"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Price in Pi (π)</label>
                  <div className="flex gap-1 text-[10px] font-mono">
                    {[0.05, 0.15, 0.28, 1.25, 3.10].map((pr) => (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => setPPricePi(pr.toString())}
                        className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 hover:bg-slate-700"
                      >
                        {pr}π
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pPricePi}
                    onChange={(e) => setPPricePi(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-3 pr-8 text-xs text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-amber-400">π</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stock</label>
                <input
                  type="number"
                  required
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Product Photos / Gallery */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Product Photos ({vendorImages.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGalleryPickerModal(true)}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Select from Gallery
                  </button>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {vendorImages.map((img, idx) => (
                    <div key={idx} className="relative h-14 w-14 flex-shrink-0 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                      <img src={img.url} alt="angle" className="h-full w-full object-cover" />
                      <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[8px] font-mono text-amber-400">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  placeholder="Specs and key features..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gallery Picker Modal for Vendor */}
      <GalleryPickerModal
        isOpen={showGalleryPickerModal}
        onClose={() => setShowGalleryPickerModal(false)}
        onSelectImages={handleSelectFromGallery}
        currentlySelectedUrls={vendorImages.map((v) => v.url)}
      />
    </div>
  );
};