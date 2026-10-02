
import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { StoreView } from './components/StoreView';
import { AdminDashboard } from './components/AdminDashboard';
import { VendorPortal } from './components/VendorPortal';
import { PiTestnetLab } from './components/PiTestnetLab';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartModal, CartItem } from './components/CartModal';
import { PioneerAuthModal } from './components/PioneerAuthModal';
import { Product, Vendor, Order, PiBackendConfig } from './types';
import { api } from './services/api';
import { piSdk, PiUser } from './services/piSdk';

export default function App() {
  const [activeTab, setActiveTab] = useState<'store' | 'admin' | 'vendors' | 'lab'>('store');
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [piConfig, setPiConfig] = useState<PiBackendConfig | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<PiUser | null>(piSdk.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial backend state
  const loadData = async () => {
    try {
      const [prodsData, vendsData, ordsData, cfgData] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getVendors().catch(() => []),
        api.getOrders().catch(() => []),
        api.getPiConfig().catch(() => null)
      ]);

      setProducts(prodsData);
      setVendors(vendsData);
      setOrders(ordsData);
      setPiConfig(cfgData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Initialize Pi SDK in Sandbox mode
    piSdk.init();

    // Listen to Pioneer authentication state updates
    const unsubscribe = piSdk.subscribeAuth((user) => {
      setCurrentUser(user);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleBuyNowWithPi = (product: Product) => {
    handleAddToCart(product);
    setSelectedProduct(null);
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Admin / Vendor actions
  const handleCreateProduct = async (productData: Partial<Product>) => {
    const created = await api.createProduct(productData);
    setProducts((prev) => [created, ...prev]);
  };

  const handleDeleteProduct = async (id: string) => {
    await api.deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreateVendor = async (vendorData: Partial<Vendor>) => {
    const created = await api.createVendor(vendorData);
    setVendors((prev) => [...prev, created]);
  };

  const handleUpdatePiKey = async (apiKey: string, appId?: string, outgoingWalletConfigured?: boolean) => {
    await api.setPiKey(apiKey, appId, outgoingWalletConfigured);
    const updatedCfg = await api.getPiConfig();
    setPiConfig(updatedCfg);
  };

  const cartTotalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartTotalItems}
        openCart={() => setIsCartOpen(true)}
        piConfig={piConfig}
        pioneerUsername={currentUser?.username || null}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-3">
              <div className="h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-mono text-slate-400">Loading ayubaikr Pi Testnet Store & Ledger...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'store' && (
              <StoreView
                products={products}
                onSelectProduct={(p) => setSelectedProduct(p)}
                onAddToCart={handleAddToCart}
                onBuyNowWithPi={handleBuyNowWithPi}
                onNavigateToLab={() => setActiveTab('lab')}
                currentUser={currentUser}
                onOpenAuthModal={() => setIsAuthModalOpen(true)}
              />
            )}

            {activeTab === 'admin' && (
              <AdminDashboard
                products={products}
                vendors={vendors}
                orders={orders}
                piConfig={piConfig}
                onRefreshData={loadData}
                onCreateProduct={handleCreateProduct}
                onDeleteProduct={handleDeleteProduct}
                onCreateVendor={handleCreateVendor}
                onUpdatePiKey={handleUpdatePiKey}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorPortal
                vendors={vendors}
                products={products}
                orders={orders}
                piConfig={piConfig}
                onAddProduct={handleCreateProduct}
              />
            )}

            {activeTab === 'lab' && (
              <PiTestnetLab
                piConfig={piConfig}
                onRefreshConfig={loadData}
              />
            )}
          </>
        )}
      </main>

      {/* Product Detail Modal (Multi-Image Gallery & Specs) */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNowWithPi={handleBuyNowWithPi}
      />

      {/* Cart & Checkout Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        piConfig={piConfig}
        onOrderCompleted={() => loadData()}
      />

      {/* Pioneer Pi SDK Authentication Modal */}
      <PioneerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(user) => setCurrentUser(user)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">ayubaikr</span>
            <span>—</span>
            <span>Phones & Accessories Business Ltd</span>
          </div>

          <div className="font-mono text-[11px] text-slate-400 text-center sm:text-right">
            <span>Recipient: </span>
            <span className="text-amber-400 font-bold break-all">
              GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}