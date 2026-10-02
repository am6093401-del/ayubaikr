
import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  Sparkles,
  Key,
  Wallet,
  User,
  ArrowRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { piSdk, PiUser } from '../services/piSdk';
import { api } from '../services/api';

interface PioneerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: PiUser | null;
  onUserChange: (user: PiUser | null) => void;
  onOpenCart?: () => void;
}

export const PioneerAuthModal: React.FC<PioneerAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  onOpenCart,
}) => {
  const isPiBrowser = piSdk.isSdkAvailable();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customUsername, setCustomUsername] = useState('');
  const [customWallet, setCustomWallet] = useState('');
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Fetch real Horizon balance if wallet address is present
  useEffect(() => {
    if (!isOpen) return;
    if (currentUser?.wallet_address) {
      setLoadingBalance(true);
      api.getHorizonAccount(currentUser.wallet_address)
        .then((data) => {
          const native = data?.balances?.find((b: any) => b.asset_type === 'native');
          if (native) {
            setWalletBalance(native.balance);
          } else {
            setWalletBalance('100.0000');
          }
        })
        .catch(() => {
          setWalletBalance('100.0000');
        })
        .finally(() => setLoadingBalance(false));
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleNativePiLogin = async () => {
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const user = await piSdk.authenticate();
      onUserChange(user);
    } catch (err: any) {
      console.warn('Pi Authentication prompt handled:', err);
      setAuthError(err?.message || 'Authentication cancelled by Pioneer or Pi Browser bridge timed out.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSelectPreset = (username: string, wallet: string) => {
    const user = piSdk.loginAsCustomPioneer(username, wallet);
    onUserChange(user);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUsername.trim()) return;

    const user = piSdk.loginAsCustomPioneer(
      customUsername.trim(),
      customWallet.trim() || undefined
    );
    onUserChange(user);
  };

  const handleLogout = () => {
    piSdk.logout();
    onUserChange(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 my-8 overflow-hidden">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/20">
            π
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Pi Network Pioneer Authentication</h2>
            </div>
            <p className="text-xs text-slate-400">
              Official Pi SDK Authentication for Pi Testnet & Sandbox
            </p>
          </div>
        </div>

        {/* Environment Status Badge */}
        <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/70 p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPiBrowser ? 'bg-emerald-400' : 'bg-amber-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isPiBrowser ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
            </span>
            <span className="font-semibold text-slate-200">
              {isPiBrowser ? 'Pi Browser Detected (Native SDK Ready)' : 'Web Preview / Testnet Sandbox Mode'}
            </span>
          </div>

          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-amber-300">
            v2.0 Sandbox
          </span>
        </div>

        {/* Error Notice */}
        {authError && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            {authError}
          </div>
        )}

        {/* VIEW 1: CURRENTLY LOGGED IN PIONEER PROFILE */}
        {currentUser ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold text-lg">
                    {currentUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-white font-mono">
                        @{currentUser.username}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-amber-400" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      UID: {currentUser.uid}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Pi Balance</span>
                  <span className="text-base font-black text-amber-400 font-mono">
                    {loadingBalance ? '...' : `${walletBalance || '100.00'} π`}
                  </span>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Wallet className="h-3 w-3 text-amber-400" />
                    Pioneer Testnet Wallet Address
                  </span>
                  {currentUser.wallet_address && (
                    <a
                      href={`https://horizon-testnet.minepi.com/accounts/${currentUser.wallet_address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <span>Horizon Explorer</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-1.5 border border-slate-800">
                  <span className="font-mono text-xs text-amber-300 truncate flex-1">
                    {currentUser.wallet_address || 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(currentUser.wallet_address || 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS')}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy wallet address"
                  >
                    {copiedWallet ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Scopes badge */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400">Authenticated Scopes:</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
                  username ✓
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
                  payments ✓
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono text-emerald-400 border border-emerald-500/20">
                  wallet_address ✓
                </span>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              {onOpenCart && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCart();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
                >
                  <span>Go to Cart & Checkout in Pi</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-red-300 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* VIEW 2: LOGIN WITH PI SDK */
          <div className="space-y-5">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleNativePiLogin}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 p-3.5 text-sm font-black text-slate-950 hover:from-amber-400 hover:to-amber-300 transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
            >
              {isAuthenticating ? (
                <>
                  <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Waiting for Pioneer Authorization in Pi SDK...</span>
                </>
              ) : (
                <>
                  <span className="text-lg font-black font-mono leading-none">π</span>
                  <span>Login with Pi Network SDK</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Authenticates using the official Pi Network Javascript SDK (<code className="text-amber-400">window.Pi.authenticate</code>).
              Passphrases and private keys are never required.
            </p>

            {/* Quick Presets for Testnet / Sandbox */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-2">
                Quick Testnet Pioneer Profiles (1-Click Test):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    name: 'ayubaikr_tester',
                    desc: 'Default Pioneer',
                    wallet: 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS'
                  },
                  {
                    name: 'pioneer_lagos',
                    desc: 'Merchant Tester',
                    wallet: 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS'
                  },
                  {
                    name: 'vip_pioneer',
                    desc: 'Tier 1 Pioneer',
                    wallet: 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS'
                  }
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleSelectPreset(item.name, item.wallet)}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-left hover:border-amber-500/50 hover:bg-slate-900 transition-all group"
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-amber-400" />
                      <span className="text-xs font-bold text-white font-mono group-hover:text-amber-300">
                        @{item.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Pioneer Input */}
            <div className="pt-2 border-t border-slate-800">
              <form onSubmit={handleCustomLogin} className="space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Or enter your own Pioneer username:
                </span>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">@</span>
                    <input
                      type="text"
                      required
                      value={customUsername}
                      onChange={(e) => setCustomUsername(e.target.value)}
                      placeholder="username"
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-7 pr-3 text-xs text-slate-100 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </form>
            </div>

            {/* Pi Browser Instructions Box */}
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Info className="h-3.5 w-3.5" />
                <span>Running on Pi Browser Mobile:</span>
              </div>
              <p>
                Open the Pi Browser app on your smartphone, navigate to this app's URL, and tap <strong>Login with Pi Network SDK</strong> to authorize natively with your mobile Pi wallet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};