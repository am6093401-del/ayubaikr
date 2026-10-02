
import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Shield,
  Layers,
  CheckCircle2,
  ExternalLink,
  Store,
  Key,
  Smartphone,
  Save,
  X,
  AlertCircle,
  RefreshCw,
  Eye,
  Sliders,
  Sparkles,
  Upload,
  ArrowUpRight,
  Calculator
} from 'lucide-react';
import { Product, Vendor, Order, PiBackendConfig, ProductImage, ProductSpec } from '../types';
import { GalleryPickerModal } from './GalleryPickerModal';

interface AdminDashboardProps {
  products: Product[];
  vendors: Vendor[];
  orders: Order[];
  piConfig: PiBackendConfig | null;
  onRefreshData: () => void;
  onCreateProduct: (product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onCreateVendor: (vendor: Partial<Vendor>) => Promise<void>;
  onUpdatePiKey: (apiKey: string, appId?: string, outgoingWalletConfigured?: boolean) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  vendors,
  orders,
  piConfig,
  onRefreshData,
  onCreateProduct,
  onDeleteProduct,
  onCreateVendor,
  onUpdatePiKey,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'vendors' | 'orders' | 'pi-gateway'>('products');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [showGalleryPickerModal, setShowGalleryPickerModal] = useState(false);

  // New Product Form State
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('ayubaikr');
  const [category, setCategory] = useState<Product['category']>('smartphones');
  const [pricePi, setPricePi] = useState<string>('0.15');
  const [stock, setStock] = useState<string>('20');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState<Product['condition']>('Brand New');
  const [warranty, setWarranty] = useState('1 Year Official Warranty');
  const [vendorId, setVendorId] = useState(vendors[0]?.id || 'vendor-ayubaikr-official');

  // Multiple Images State
  const [images, setImages] = useState<{ url: string; altText: string }[]>([
    {
      url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80',
      altText: 'Primary product front angle'
    },
    {
      url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80',
      altText: 'Back camera cluster and finish'
    }
  ]);

  // Specs State
  const [specs, setSpecs] = useState<ProductSpec[]>([
    { name: 'Display / Build', value: 'Aerospace Grade Titanium & OLED' },
    { name: 'Compatibility', value: 'Universal USB-C / MagSafe / Qi2' }
  ]);

  // Vendor Form State
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorWallet, setVendorWallet] = useState(piConfig?.recipientTestnetWallet || 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS');
  const [vendorCommission, setVendorCommission] = useState('3.5');

  // Pi Gateway Form State (Backend only)
  const [inputApiKey, setInputApiKey] = useState('');
  const [inputAppId, setInputAppId] = useState(piConfig?.appId || 'ayubaikr-phones');
  const [outgoingConfigured, setOutgoingConfigured] = useState(piConfig?.outgoingWalletConfigured || false);
  const [gatewayMessage, setGatewayMessage] = useState<string | null>(null);
  const [productSaveError, setProductSaveError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Helpers for multi-image management
  const addImageField = () => {
    setImages((prev) => [...prev, { url: '', altText: '' }]);
  };

  const updateImageUrl = (index: number, val: string) => {
    setImages((prev) => {
      const next = [...prev];
      next[index].url = val;
      return next;
    });
  };

  const updateImageAlt = (index: number, val: string) => {
    setImages((prev) => {
      const next = [...prev];
      next[index].altText = val;
      return next;
    });
  };

  const removeImageField = (index: number) => {
    if (images.length <= 1) return;
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const target = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [target, ...rest];
    });
  };

  const handleSelectImagesFromGallery = (selected: { url: string; altText: string }[]) => {
    if (selected.length > 0) {
      setImages(selected);
    }
  };

  // Preset image gallery loaders for quick demo testing
  const loadPresetImages = (type: 'phone' | 'charger' | 'case' | 'audio') => {
    if (type === 'phone') {
      setImages([
        { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80', altText: 'Titanium phone side edge' },
        { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80', altText: 'Front and rear camera module' },
        { url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=900&q=80', altText: 'High refresh rate OLED display' }
      ]);
    } else if (type === 'charger') {
      setImages([
        { url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80', altText: 'GaN 100W multi-port charger' },
        { url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=900&q=80', altText: 'Compact foldout plug profile' }
      ]);
    } else if (type === 'case') {
      setImages([
        { url: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=80', altText: 'Carbon fiber texture weave' },
        { url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=900&q=80', altText: 'Inside magnetic alignment ring' }
      ]);
    } else {
      setImages([
        { url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80', altText: 'ANC wireless buds with matte charging case' },
        { url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=900&q=80', altText: 'Ergonomic in-ear buds profile' }
      ]);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pricePi) return;

    const formattedImages: ProductImage[] = images
      .filter((img) => img.url.trim().length > 0)
      .map((img, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        url: img.url.trim(),
        altText: img.altText || `${name} view ${idx + 1}`,
        isPrimary: idx === 0
      }));

    if (formattedImages.length === 0) {
      formattedImages.push({
        id: `img-${Date.now()}-0`,
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
        altText: name,
        isPrimary: true
      });
    }

    const newProd: Partial<Product> = {
      name,
      brand,
      category,
      pricePi: parseFloat(pricePi),
      stock: parseInt(stock, 10) || 10,
      description,
      condition,
      warranty,
      vendorId,
      images: formattedImages,
      specs: specs.filter((s) => s.name && s.value)
    };

    setProductSaveError(null);
    setIsSavingProduct(true);

    try {
      await onCreateProduct(newProd);
      setShowAddProductModal(false);
      // Reset form
      setName('');
      setDescription('');
    } catch (err: any) {
      console.error('Error creating product:', err);
      setProductSaveError(err.message || 'Failed to save product');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName || !vendorEmail) return;

    await onCreateVendor({
      name: vendorName,
      email: vendorEmail,
      phone: vendorPhone,
      walletAddress: vendorWallet,
      commissionRatePercent: parseFloat(vendorCommission) || 3.0
    });

    setShowAddVendorModal(false);
    setVendorName('');
    setVendorEmail('');
    setVendorPhone('');
  };

  const handleSavePiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setGatewayMessage(null);
    try {
      await onUpdatePiKey(inputApiKey, inputAppId, outgoingConfigured);
      setGatewayMessage('Backend Pi Platform configuration updated successfully. Keys are preserved strictly on the server.');
      setInputApiKey('');
    } catch (err: any) {
      setGatewayMessage(`Error: ${err.message}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header and Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Operations Dashboard</h1>
            <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-xs font-mono text-amber-300">
              ayubaikr Ltd
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Product catalog management with multiple images & Pi pricing, vendor oversight, and live blockchain transaction audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRefreshData}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>

          <button
            onClick={() => {
              setShowAddProductModal(true);
              setShowGalleryPickerModal(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/20"
          >
            <ImageIcon className="h-4 w-4" />
            Add Product from Gallery (Pi)
          </button>

          <button
            onClick={() => setShowAddProductModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Custom
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Total Catalog</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{products.length}</span>
            <Smartphone className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500">Phones & Accessories</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Active Vendors</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{vendors.length}</span>
            <Store className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500">Verified merchants</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Customer Orders</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white font-mono">{orders.length}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-[10px] text-slate-500">Pi Testnet Orders</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-[11px] font-mono uppercase text-slate-400">Pi Server Gateway</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xs font-bold text-amber-300 font-mono">
              {piConfig?.hasApiKey ? 'KEY CONFIGURED' : 'KEY PENDING'}
            </span>
            <Key className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-[10px] text-slate-500">Backend Secured</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'products'
              ? 'border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Product Catalog ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'vendors'
              ? 'border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Vendor Management ({vendors.length})
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'orders'
              ? 'border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Orders & Blockchain Hashes ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('pi-gateway')}
          className={`pb-3 px-3 text-xs sm:text-sm font-semibold transition-colors border-b-2 ${
            activeTab === 'pi-gateway'
              ? 'border-amber-500 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Pi Server Gateway & Security
        </button>
      </div>

      {/* TAB CONTENT: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Images & Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price (Pi / π)</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-slate-950 border border-slate-800">
                          <img
                            src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80'}
                            alt={prod.name}
                            className="h-full w-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 bg-black/80 px-1 text-[9px] font-mono text-amber-400">
                            {prod.images?.length || 1} imgs
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-white line-clamp-1">{prod.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {prod.brand} • {prod.condition}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize font-mono text-slate-300">
                      {prod.category.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-amber-400 font-mono text-sm">{prod.pricePi} π</span>
                      {prod.fiatEquivalentUsd && (
                        <span className="block text-[10px] text-slate-500 font-mono">~${prod.fiatEquivalentUsd}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={prod.stock > 5 ? 'text-emerald-400' : 'text-amber-400'}>
                        {prod.stock} units
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {prod.vendorName}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteProduct(prod.id)}
                        className="rounded p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: VENDORS */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setShowAddVendorModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Register New Vendor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{vendor.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{vendor.email}</p>
                  </div>
                  <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 uppercase">
                    {vendor.status}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Commission Rate:</span>
                    <span className="font-mono text-amber-300">{vendor.commissionRatePercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Sales:</span>
                    <span className="font-mono text-white">{vendor.salesCount} orders</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pi Volume Earned:</span>
                    <span className="font-mono text-amber-400 font-semibold">{vendor.totalPiEarned} π</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pt-1 font-mono truncate" title={vendor.walletAddress}>
                    Wallet: {vendor.walletAddress || 'Default App Wallet'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: ORDERS & BLOCKCHAIN */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
              <p className="text-xs text-slate-400">No orders placed yet. Place an order via Store or test U2A in Pi Testnet Lab.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total Pi</th>
                    <th className="py-3 px-4">Flow Verification</th>
                    <th className="py-3 px-4">TxID / Blockchain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-amber-300">
                        {ord.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{ord.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{ord.customerUid}</div>
                      </td>
                      <td className="py-3 px-4">
                        {ord.items.map((i, idx) => (
                          <div key={idx} className="text-slate-300">
                            {i.quantity}x {i.productName}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-amber-400 text-sm">
                        {ord.totalPi} π
                      </td>
                      <td className="py-3 px-4 space-y-1">
                        <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-mono font-semibold ${
                          ord.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                        }`}>
                          {ord.status}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          dev_approved: {ord.developerApproved ? '✓' : '✗'} | tx_verified: {ord.transactionVerified ? '✓' : '✗'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {ord.piTxId ? (
                          <a
                            href={`https://horizon-testnet.minepi.com/transactions/${ord.piTxId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-amber-400 hover:underline"
                          >
                            <span className="truncate max-w-[140px]">{ord.piTxId}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">Awaiting signature</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: PI GATEWAY & SECURITY */}
      {activeTab === 'pi-gateway' && (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Pi Network Security & Backend Configuration</h2>
            </div>

            <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-4 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-amber-300">Security Architecture Verification:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong className="text-white">Zero Passphrase:</strong> Wallet passphrases and private seed keys are NEVER requested, logged, or stored.</li>
                <li><strong className="text-white">Backend-Only Credentials:</strong> The Pi Server API Key (<code className="text-amber-400">PI_API_KEY</code>) is stored exclusively on the Express backend server and never sent to browser clients.</li>
                <li><strong className="text-white">Pi Testnet Mode:</strong> Configured for Sandbox Testnet with Horizon API at <code className="text-amber-400">https://horizon-testnet.minepi.com</code>.</li>
                <li><strong className="text-white">Designated Testnet Recipient:</strong> <code className="text-amber-400 break-all">{piConfig?.recipientTestnetWallet}</code></li>
              </ul>
            </div>

            {gatewayMessage && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-300">
                {gatewayMessage}
              </div>
            )}

            <form onSubmit={handleSavePiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pi Developer Server API Key (Saved to Backend Only)
                </label>
                <input
                  type="password"
                  value={inputApiKey}
                  onChange={(e) => setInputApiKey(e.target.value)}
                  placeholder={piConfig?.hasApiKey ? "API Key is currently set (enter new key to replace)" : "Enter PI_API_KEY from Pi Developer Portal"}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Obtained from minepi.com/developer &gt; Your App &gt; Settings &gt; Server API Key.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Pi App ID / Slug
                </label>
                <input
                  type="text"
                  value={inputAppId}
                  onChange={(e) => setInputAppId(e.target.value)}
                  placeholder="e.g. ayubaikr-phones"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="outgoingCheck"
                  checked={outgoingConfigured}
                  onChange={(e) => setOutgoingConfigured(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="outgoingCheck" className="text-xs text-slate-300 cursor-pointer">
                  App Outgoing Wallet has been configured and approved in the Pi Developer Portal
                </label>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                <Save className="h-4 w-4" />
                Save Backend Configuration
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT WITH MULTIPLE IMAGES & PI PRICING */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddProductModal(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Add Product (Multiple Images & Price in Pi)</h2>
            </div>

            {productSaveError && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span>{productSaveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-5">
              {/* Row 1: Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apple iPhone 16 Pro 128GB - Black Titanium"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Apple, Samsung, Google, ayubaikr Pro"
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Category & Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="smartphones">Smartphones</option>
                    <option value="cases">Cases & Covers</option>
                    <option value="chargers">Chargers & Adapters</option>
                    <option value="screen_protectors">Screen Protectors</option>
                    <option value="audio">Audio & Earbuds</option>
                    <option value="power_banks">Power Banks</option>
                    <option value="parts">Repair Parts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor Provider</label>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Refurbished Grade A">Refurbished Grade A</option>
                    <option value="OEM Original">OEM Original</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Price in Pi & Inventory Economics */}
              <div className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    Price in Pi (π) Cryptocurrency & Settlement
                  </label>
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Native Pi Testnet Escrow (Zero Gateway Fees)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        required
                        value={pricePi}
                        onChange={(e) => setPricePi(e.target.value)}
                        placeholder="e.g. 2.45"
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-3 pr-8 text-base font-mono font-black text-amber-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-lg text-amber-400">
                        π
                      </span>
                    </div>

                    {/* Quick Pi Price Presets */}
                    <div className="mt-2.5 space-y-1.5">
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <span>Phone Presets:</span>
                        {[1.25, 2.45, 3.10, 3.25, 4.50].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setPricePi(val.toString())}
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                              pricePi === val.toString()
                                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-500/50'
                            }`}
                          >
                            {val}π
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                        <span>Accessory:</span>
                        {[0.04, 0.08, 0.15, 0.22, 0.28, 0.50].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setPricePi(val.toString())}
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                              pricePi === val.toString()
                                ? 'bg-amber-500 text-slate-950 font-bold border-amber-500'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-500/50'
                            }`}
                          >
                            {val}π
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stock & Warranty */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Stock Units</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">Warranty Term</label>
                        <input
                          type="text"
                          value={warranty}
                          onChange={(e) => setWarranty(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Pi Economics Bar */}
                    <div className="rounded-lg bg-slate-950/80 border border-slate-800/80 p-2.5 font-mono text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Total Batch Inventory:</span>
                        <span className="text-amber-400 font-bold">
                          {(parseFloat(pricePi || '0') * (parseInt(stock || '0') || 0)).toFixed(3)} π
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Reference Market Value:</span>
                        <span className="text-slate-300">
                          ~${((parseFloat(pricePi || '0') || 0) * 350).toLocaleString()} USD
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* MULTIPLE IMAGES SECTION WITH GALLERY PICKER */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ImageIcon className="h-4 w-4 text-amber-400" />
                      Product Image Gallery ({images.filter(i => i.url).length} Photos Added)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Add multiple photo angles. First image is primary. Select directly from the gallery or device.
                    </p>
                  </div>

                  {/* Gallery action trigger */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowGalleryPickerModal(true)}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-sm transition-all"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Choose from Image Gallery (30+ Photos)
                    </button>

                    {/* Presets */}
                    <div className="hidden sm:flex gap-1">
                      <button
                        type="button"
                        onClick={() => loadPresetImages('phone')}
                        className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white"
                      >
                        Phone Preset
                      </button>
                      <button
                        type="button"
                        onClick={() => loadPresetImages('case')}
                        className="rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-300 hover:text-white"
                      >
                        Case Preset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Selected Gallery Thumbnails Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-xl border border-slate-800 bg-slate-900 p-2 space-y-2 group"
                    >
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center">
                        {img.url ? (
                          <img
                            src={img.url}
                            alt={img.altText || `Angle ${idx + 1}`}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=200&q=80';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-slate-600 font-mono">Empty Image</span>
                        )}

                        {/* Primary Badge or Set Primary Button */}
                        {idx === 0 ? (
                          <span className="absolute top-1.5 left-1.5 rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold text-slate-950 font-mono shadow">
                            PRIMARY
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(idx)}
                            className="absolute top-1.5 left-1.5 rounded bg-black/70 hover:bg-amber-500 hover:text-slate-950 px-1.5 py-0.5 text-[9px] font-mono text-slate-300 backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100"
                          >
                            Set Primary
                          </button>
                        )}

                        {/* Remove button */}
                        {images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(idx)}
                            className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1 text-slate-400 hover:text-red-400 hover:bg-black transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* URL input */}
                      <input
                        type="url"
                        value={img.url}
                        onChange={(e) => updateImageUrl(idx, e.target.value)}
                        placeholder="Image URL"
                        className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] text-slate-200 placeholder-slate-600 font-mono focus:border-amber-500 focus:outline-none"
                      />

                      {/* Alt Caption */}
                      <input
                        type="text"
                        value={img.altText}
                        onChange={(e) => updateImageAlt(idx, e.target.value)}
                        placeholder="Caption / Angle"
                        className="w-full rounded border border-slate-800 bg-slate-950 px-2 py-1 text-[10px] text-slate-400 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={addImageField}
                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Image URL Slot
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowGalleryPickerModal(true)}
                    className="text-xs text-slate-400 hover:text-amber-300 font-mono flex items-center gap-1"
                  >
                    <span>Browse Full Photo Library &gt;</span>
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail hardware specs, features, package contents..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSavingProduct ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                      Saving Product...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Publish Product in Pi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD VENDOR */}
      {showAddVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowAddVendorModal(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-4">Register New Vendor</h2>

            <form onSubmit={handleSaveVendor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Vendor / Business Name</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Apex Tech Ltd"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  placeholder="vendor@company.com"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                <input
                  type="text"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  placeholder="+234 800 000 0000"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Pi Testnet Payout Wallet</label>
                <input
                  type="text"
                  value={vendorWallet}
                  onChange={(e) => setVendorWallet(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vendorCommission}
                  onChange={(e) => setVendorCommission(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVendorModal(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                >
                  Create Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* GALLERY PICKER MODAL */}
      <GalleryPickerModal
        isOpen={showGalleryPickerModal}
        onClose={() => setShowGalleryPickerModal(false)}
        onSelectImages={handleSelectImagesFromGallery}
        currentlySelectedUrls={images.map((i) => i.url).filter(Boolean)}
      />
    </div>
  );
};
