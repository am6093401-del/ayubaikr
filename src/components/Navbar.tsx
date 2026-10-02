import React from 'react';
import { Smartphone, ShoppingBag, ShieldCheck, Store, Terminal, CheckCircle2, AlertTriangle, Key, User } from 'lucide-react';
import { PiBackendConfig } from '../types';

interface NavbarProps {
  activeTab: 'store' | 'admin' | 'vendors' | 'lab';
  setActiveTab: (tab: 'store' | 'admin' | 'vendors' | 'lab') => void;
  cartCount: number;
  openCart: () => void;
  piConfig: PiBackendConfig | null;
  pioneerUsername: string | null;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  cartCount,
  openCart,
  piConfig,
  pioneerUsername,
  onOpenAuthModal,
}) => {
  const shortWallet = piConfig?.recipientTestnetWallet
    ? `${piConfig.recipientTestnetWallet.slice(0, 6)}...${piConfig.recipientTestnetWallet.slice(-6)}`
    : 'GBNEKR...LBACS';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('store')}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 shadow-lg shadow-amber-500/20 font-black text-xl">
            <Smartphone className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono">ayubaikr</span>
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                PI TESTNET
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Phones & Accessories Business Ltd</p>
          </div>
        </div>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800 text-sm font-medium">
          <button
            onClick={() => setActiveTab('store')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition-all ${
              activeTab === 'store'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Store className="h-4 w-4" />
            Store Catalog
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Admin Dashboard
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition-all ${
              activeTab === 'vendors'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Store className="h-4 w-4" />
            Vendors
          </button>

          <button
            onClick={() => setActiveTab('lab')}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 transition-all ${
              activeTab === 'lab'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Terminal className="h-4 w-4" />
            Pi Verification Lab (A2U ↔ U2A)
          </button>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Pi Network status badge */}
          <div className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="text-left font-mono">
              <span className="text-slate-400 text-[10px] block">Testnet Recipient</span>
              <span className="text-amber-300 font-semibold text-[11px]" title={piConfig?.recipientTestnetWallet}>
                {shortWallet}
              </span>
            </div>
          </div>

          {/* Pioneer Auth status */}
          {pioneerUsername ? (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/20 font-mono transition-all group"
              title="Click to view Pioneer Profile & Wallet"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                π
              </div>
              <span className="font-bold">@{pioneerUsername}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3 py-1.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-md shadow-amber-500/20 transition-all"
              title="Login with Pi Network SDK"
            >
              <span className="font-mono text-sm leading-none font-black">π</span>
              <span>Login with Pi</span>
            </button>
          )}

          {/* Cart button */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-amber-500/40 hover:text-white transition-all shadow-sm"
          >
            <ShoppingBag className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline text-xs font-medium">Cart</span>
            {cartCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-slate-950">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden border-t border-slate-800/80 bg-slate-900/60 px-3 py-2 justify-between items-center text-xs">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('store')}
            className={`px-2 py-1 rounded ${activeTab === 'store' ? 'text-amber-300 font-bold' : 'text-slate-400'}`}
          >
            Store
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2 py-1 rounded ${activeTab === 'admin' ? 'text-amber-300 font-bold' : 'text-slate-400'}`}
          >
            Admin
          </button>
          <button
            onClick={() => setActiveTab('vendors')}
            className={`px-2 py-1 rounded ${activeTab === 'vendors' ? 'text-amber-300 font-bold' : 'text-slate-400'}`}
          >
            Vendors
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30`}
          >
            Pi Lab
          </button>
        </div>

        <button
          onClick={onOpenAuthModal}
          className="text-amber-400 font-mono text-[11px] font-semibold flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg"
        >
          <span>π</span>
          <span>{pioneerUsername ? `@${pioneerUsername}` : 'Pi Login'}</span>
        </button>
      </div>
    </header>
  );
};
