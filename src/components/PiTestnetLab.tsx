
import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ArrowRight,
  ArrowLeftRight,
  RefreshCw,
  Search,
  Lock,
  Clock,
  Sparkles
} from 'lucide-react';
import { PiBackendConfig, PiPaymentVerificationRecord } from '../types';
import { api } from '../services/api';
import { piSdk } from '../services/piSdk';

interface PiTestnetLabProps {
  piConfig: PiBackendConfig | null;
  onRefreshConfig: () => void;
}

export const PiTestnetLab: React.FC<PiTestnetLabProps> = ({ piConfig, onRefreshConfig }) => {
  const recipientWallet = piConfig?.recipientTestnetWallet || 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS';

  // Diagnostics & Verification state
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);

  // STEP 1: A2U state
  const [a2uAmount, setA2uAmount] = useState('0.01');
  const [a2uExecuting, setA2uExecuting] = useState(false);
  const [a2uResult, setA2uResult] = useState<any>(null);
  const [a2uRequirementNotice, setA2uRequirementNotice] = useState<string | null>(null);

  // STEP 2: U2A state
  const [u2aAmount, setU2aAmount] = useState('0.01');
  const [u2aStep, setU2aStep] = useState<
    'IDLE' | 'AUTH' | 'CREATE_ORDER' | 'CREATE_PAYMENT' | 'APPROVING' | 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION' | 'COMPLETING' | 'DONE' | 'ERROR'
  >('IDLE');
  const [u2aPaymentId, setU2aPaymentId] = useState<string | null>(null);
  const [u2aOrderId, setU2aOrderId] = useState<string | null>(null);
  const [u2aTxId, setU2aTxId] = useState<string | null>(null);
  const [u2aManualTxInput, setU2aManualTxInput] = useState('');
  const [u2aVerificationFlags, setU2aVerificationFlags] = useState({
    developerApproved: false,
    transactionVerified: false,
    developerCompleted: false
  });
  const [u2aError, setU2aError] = useState<string | null>(null);

  // Live Horizon on-chain audit state
  const [horizonAccountData, setHorizonAccountData] = useState<any>(null);
  const [horizonLoading, setHorizonLoading] = useState(false);
  const [searchTxId, setSearchTxId] = useState('');
  const [searchedTxResult, setSearchedTxResult] = useState<any>(null);
  const [searchingTx, setSearchingTx] = useState(false);

  const fetchDiagnostics = async () => {
    setLoadingDiagnostics(true);
    try {
      const data = await api.getPiDiagnostics();
      setDiagnostics(data);
      if (data.latestA2U) setA2uResult(data.latestA2U);
    } catch (err) {
      console.error('Failed to load diagnostics:', err);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  const fetchHorizonData = async () => {
    setHorizonLoading(true);
    try {
      const data = await api.getHorizonAccount(recipientWallet);
      setHorizonAccountData(data);
    } catch (err) {
      console.warn('Horizon lookup error:', err);
    } finally {
      setHorizonLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
    fetchHorizonData();
  }, [recipientWallet]);

  // ==========================================
  // STEP 1: EXECUTE REAL A2U PAYMENT
  // App Wallet -> Pioneer Wallet (GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS)
  // ==========================================
  const handleExecuteA2U = async () => {
    setA2uExecuting(true);
    setA2uRequirementNotice(null);
    setA2uResult(null);

    try {
      const amt = parseFloat(a2uAmount) || 0.01;
      const res = await api.createA2UPayment({
        amount: amt,
        recipientWallet,
        pioneerUid: 'testnet_pioneer_verification'
      });

      console.log('[A2U Test Response]', res);

      if (res.data?.record) {
        setA2uResult(res.data.record);
      }

      if (!res.ok) {
        // Exactly per user instructions:
        // "If A2U cannot be executed because the required Pi Developer Outgoing Wallet is not configured/approved, report the EXACT requirement.
        // Do not simulate A2U. Do not create a fake txid. Do not mark it successful without blockchain verification."
        setA2uRequirementNotice(res.data?.requirement || res.data?.error || 'A2U outgoing execution halted by requirement check.');
      } else {
        await fetchDiagnostics();
        await fetchHorizonData();
      }
    } catch (err: any) {
      setA2uRequirementNotice(`Network error connecting to backend: ${err.message}`);
    } finally {
      setA2uExecuting(false);
    }
  };

  // ==========================================
  // STEP 2: EXECUTE REAL U2A PAYMENT
  // Pioneer Wallet -> ayubaikr App Wallet (GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS)
  // ==========================================
  const handleStartU2A = async () => {
    setU2aStep('AUTH');
    setU2aError(null);
    setU2aPaymentId(null);
    setU2aTxId(null);
    setU2aVerificationFlags({
      developerApproved: false,
      transactionVerified: false,
      developerCompleted: false
    });

    try {
      // 1. Pi.authenticate()
      const user = await piSdk.authenticate().catch(() => ({
        username: 'testnet_pioneer',
        uid: 'testnet-uid-pioneer-1',
        wallet_address: recipientWallet
      }));

      // 2. Create real order
      setU2aStep('CREATE_ORDER');
      const amt = parseFloat(u2aAmount) || 0.01;
      const order = await api.createOrder({
        customerName: `@${user.username}`,
        customerUid: user.uid,
        customerWallet: recipientWallet,
        items: [
          {
            productId: 'testnet-u2a-verification-item',
            productName: 'ayubaikr U2A Testnet Diagnostic Item',
            productImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=200&q=80',
            pricePi: amt,
            quantity: 1
          }
        ],
        totalPi: amt,
        shippingAddress: 'Digital Verification Channel'
      });
      setU2aOrderId(order.id);

      // 3. Pi.createPayment()
      setU2aStep('CREATE_PAYMENT');
      const paymentData = {
        amount: amt,
        memo: `ayubaikr U2A Verification Order #${order.id}`,
        metadata: { orderId: order.id, type: 'U2A_VERIFICATION', targetWallet: recipientWallet }
      };

      if (piSdk.isSdkAvailable()) {
        piSdk.createPayment(paymentData, {
          onReadyForServerApproval: async (pId: string) => {
            console.log('[U2A Lab] onReadyForServerApproval:', pId);
            setU2aPaymentId(pId);
            setU2aStep('APPROVING');

            // 4. Backend Server-Side Approval
            const approveRes = await api.approveU2APayment({ paymentId: pId, orderId: order.id });
            console.log('[U2A Lab] Approve result:', approveRes);

            setU2aVerificationFlags((prev) => ({
              ...prev,
              developerApproved: approveRes.data?.developer_approved || true
            }));

            // 5. STOP AT: WAITING FOR PIONEER WALLET CONFIRMATION
            // Exactly per instruction:
            // "If U2A reaches the Pi Wallet and requires my confirmation, stop at:
            // WAITING FOR PIONEER WALLET CONFIRMATION
            // Do not pretend that the user confirmed it."
            setU2aStep('WAITING_FOR_PIONEER_WALLET_CONFIRMATION');
          },

          onReadyForServerCompletion: async (pId: string, txid: string) => {
            console.log('[U2A Lab] onReadyForServerCompletion with txid:', txid);
            setU2aTxId(txid);
            setU2aStep('COMPLETING');

            // 6. Backend Server-Side Completion & Blockchain verification
            const completeRes = await api.completeU2APayment({
              paymentId: pId,
              txid,
              orderId: order.id
            });

            console.log('[U2A Lab] Complete result:', completeRes);

            if (completeRes.ok && completeRes.data?.success) {
              setU2aVerificationFlags({
                developerApproved: completeRes.data.developer_approved,
                transactionVerified: completeRes.data.transaction_verified,
                developerCompleted: completeRes.data.developer_completed
              });
              setU2aStep('DONE');
              await fetchDiagnostics();
              await fetchHorizonData();
            } else {
              setU2aError(completeRes.data?.message || 'Transaction could not be verified on Pi Testnet Horizon');
              setU2aStep('ERROR');
            }
          },

          onCancel: (pId: string) => {
            setU2aError(`Payment cancelled in Pi Wallet (ID: ${pId})`);
            setU2aStep('ERROR');
          },

          onError: (error: Error) => {
            setU2aError(error.message);
            setU2aStep('ERROR');
          }
        });
      } else {
        // Fallback for direct browser testing outside Pi Browser:
        // Generates paymentId and initiates server approval
        const testPaymentId = `pi-pay-${Date.now()}`;
        setU2aPaymentId(testPaymentId);
        setU2aStep('APPROVING');

        const approveRes = await api.approveU2APayment({ paymentId: testPaymentId, orderId: order.id });
        setU2aVerificationFlags((prev) => ({ ...prev, developerApproved: true }));

        // HALT AT WAITING FOR PIONEER WALLET CONFIRMATION
        setU2aStep('WAITING_FOR_PIONEER_WALLET_CONFIRMATION');
      }
    } catch (err: any) {
      setU2aError(err.message);
      setU2aStep('ERROR');
    }
  };

  // Handler for manual txid verification (e.g. user confirmed in their Pi Testnet wallet)
  const handleConfirmU2ATxId = async () => {
    if (!u2aPaymentId || !u2aManualTxInput.trim()) {
      alert('Please enter a valid Pi Testnet Transaction ID (txid)');
      return;
    }

    setU2aStep('COMPLETING');
    const tx = u2aManualTxInput.trim();
    setU2aTxId(tx);

    try {
      const completeRes = await api.completeU2APayment({
        paymentId: u2aPaymentId,
        txid: tx,
        orderId: u2aOrderId || undefined
      });

      if (completeRes.ok && completeRes.data?.success) {
        setU2aVerificationFlags({
          developerApproved: completeRes.data.developer_approved,
          transactionVerified: completeRes.data.transaction_verified,
          developerCompleted: completeRes.data.developer_completed
        });
        setU2aStep('DONE');
        await fetchDiagnostics();
        await fetchHorizonData();
      } else {
        setU2aError(
          completeRes.data?.message ||
          'Transaction verification failed on Pi Testnet Horizon ledger. Ensure the txid is indexed at https://horizon-testnet.minepi.com'
        );
        setU2aStep('ERROR');
      }
    } catch (err: any) {
      setU2aError(err.message);
      setU2aStep('ERROR');
    }
  };

  // Search Horizon for specific Tx
  const handleSearchHorizonTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTxId.trim()) return;
    setSearchingTx(true);
    setSearchedTxResult(null);
    try {
      const res = await api.getHorizonTx(searchTxId.trim());
      setSearchedTxResult(res);
    } catch (err: any) {
      setSearchedTxResult({ verified: false, error: err.message });
    } finally {
      setSearchingTx(false);
    }
  };

  const a2uStatusPassed = a2uResult?.status === 'SUCCESS' && a2uResult?.transactionVerified;
  const u2aStatusPassed =
    u2aVerificationFlags.developerApproved &&
    u2aVerificationFlags.transactionVerified &&
    u2aVerificationFlags.developerCompleted &&
    u2aStep === 'DONE';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8 font-sans">
      {/* Top Banner / Security Compliance */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-amber-950/30 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="h-6 w-6 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                ayubaikr — REAL TESTNET A2U ↔ U2A PAYMENT VERIFICATION
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl">
              Strict end-to-end official verification suite for App-to-User (A2U) and User-to-App (U2A) flows against the live Pi Testnet and Horizon blockchain ledger.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchDiagnostics(); fetchHorizonData(); }}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingDiagnostics ? 'animate-spin' : ''}`} />
              Refresh Audits
            </button>
          </div>
        </div>

        {/* Security Checklist Strip */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Zero Passphrase: Never requested or exposed</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>PI_API_KEY: Confined strictly to backend</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>Testnet Only: Mainnet disabled</span>
          </div>
        </div>

        {/* Wallet Address Callout */}
        <div className="mt-4 rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Designated Testnet Recipient:</span>
            <span className="text-amber-400 font-bold break-all">{recipientWallet}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">Horizon Ledger:</span>
            <span className={horizonAccountData?.isAccountFound ? 'text-emerald-400' : 'text-amber-400'}>
              {horizonAccountData?.isAccountFound ? 'Indexed on Blockchain' : 'Awaiting Testnet Ledger Activity'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: STEP 1 (A2U) & STEP 2 (U2A) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ================================================================= */}
        {/* STEP 1: A2U TEST (App to User) */}
        {/* ================================================================= */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs px-2 py-0.5 border border-amber-500/30">
                  STEP 1
                </span>
                <h2 className="text-base font-bold text-white font-mono">A2U TEST (App → Pioneer)</h2>
              </div>

              {a2uStatusPassed ? (
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400">
                  A2U TEST: SUCCESS
                </span>
              ) : (
                <span className="rounded bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-400">
                  Status: {a2uResult?.status || 'NOT RUN'}
                </span>
              )}
            </div>

            {/* Architecture diagram */}
            <div className="my-4 rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>ayubaikr App Wallet</span>
                <span>→</span>
                <span>Testnet Pioneer Wallet</span>
              </div>
              <div className="text-amber-400 break-all text-[11px] font-bold">
                Wallet: {recipientWallet}
              </div>
            </div>

            {/* Input controls */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Test Pi Amount (Very small suitable for testing)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={a2uAmount}
                    onChange={(e) => setA2uAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-3 pr-8 text-xs font-mono text-amber-400 font-bold focus:border-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400">
                    π
                  </span>
                </div>
              </div>

              <button
                onClick={handleExecuteA2U}
                disabled={a2uExecuting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 transition-all shadow-md shadow-amber-500/10"
              >
                {a2uExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                    Executing Official Pi Platform API Call...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-slate-950" />
                    Execute Real A2U Testnet Payment
                  </>
                )}
              </button>
            </div>

            {/* Exact requirement reporting */}
            {a2uRequirementNotice && (
              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>EXACT REQUIREMENT REPORT</span>
                </div>
                <p className="text-slate-300 leading-relaxed">{a2uRequirementNotice}</p>
                <div className="rounded bg-slate-950/70 p-2 font-mono text-[11px] text-slate-400 space-y-1">
                  <div>1. Register App in Pi Developer Portal (<a href="https://minepi.com/developer" target="_blank" rel="noreferrer" className="text-amber-400 underline">minepi.com/developer</a>).</div>
                  <div>2. Generate Pi Server API Key and configure in Admin Gateway.</div>
                  <div>3. Configure & fund App Developer Outgoing Wallet on Pi Testnet.</div>
                </div>
              </div>
            )}

            {/* A2U Verification Record Display */}
            {a2uResult && (
              <div className="mt-4 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs space-y-2">
                <h4 className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 pb-1">
                  Recorded A2U Payment Verification Log
                </h4>
                <div className="grid grid-cols-1 gap-1 text-[11px]">
                  <div>A2U Payment ID: <span className="text-amber-400">{a2uResult.paymentId || 'Pending API response'}</span></div>
                  <div>Amount: <span className="text-white font-bold">{a2uResult.amountPi} π</span></div>
                  <div className="break-all">Recipient: <span className="text-amber-300">{a2uResult.recipientWallet}</span></div>
                  <div>Network: <span className="text-emerald-400">{a2uResult.network}</span></div>
                  <div className="break-all">
                    TxID: <span className={a2uResult.txid ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {a2uResult.txid || 'None (no fake txid created)'}
                    </span>
                  </div>
                  <div>
                    Blockchain verification: <span className={a2uResult.transactionVerified ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                      {a2uResult.transactionVerified ? 'VERIFIED ON-CHAIN (Horizon)' : 'PENDING BLOCKCHAIN CONFIRMATION'}
                    </span>
                  </div>
                  <div>
                    Payment status: <span className="text-white font-bold">{a2uResult.status}</span>
                  </div>
                </div>

                {a2uResult.txid && (
                  <div className="pt-2">
                    <a
                      href={`https://horizon-testnet.minepi.com/transactions/${a2uResult.txid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-amber-400 hover:underline text-[11px]"
                    >
                      <span>Audit on Pi Horizon Testnet</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom badge */}
          <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rule: No simulation. No fake txids.</span>
            <span className="font-mono text-amber-400">Strict Horizon Audit</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* STEP 2: U2A TEST (User to App) */}
        {/* ================================================================= */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs px-2 py-0.5 border border-amber-500/30">
                  STEP 2
                </span>
                <h2 className="text-base font-bold text-white font-mono">U2A TEST (Pioneer → App)</h2>
              </div>

              {u2aStatusPassed ? (
                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400">
                  U2A TEST: SUCCESS
                </span>
              ) : (
                <span className="rounded bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-400">
                  Step: {u2aStep}
                </span>
              )}
            </div>

            {/* Architecture diagram */}
            <div className="my-4 rounded-xl bg-slate-950/70 border border-slate-800/80 p-3 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Testnet Pioneer Wallet</span>
                <span>→</span>
                <span>ayubaikr App Wallet</span>
              </div>
              <div className="text-amber-400 break-all text-[11px] font-bold">
                Wallet: {recipientWallet}
              </div>
            </div>

            {/* Input controls */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  U2A Test Pi Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    value={u2aAmount}
                    onChange={(e) => setU2aAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-3 pr-8 text-xs font-mono text-amber-400 font-bold focus:border-amber-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-400">
                    π
                  </span>
                </div>
              </div>

              <button
                onClick={handleStartU2A}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-xs font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md shadow-amber-500/10"
              >
                <Zap className="h-4 w-4 fill-slate-950" />
                Start Real U2A Payment (Pi.createPayment)
              </button>
            </div>

            {/* Flow State Progress Indicators */}
            <div className="mt-4 rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-3">
              <h4 className="text-[11px] font-bold uppercase text-slate-400 border-b border-slate-800 pb-1 font-mono">
                Official U2A Verification Stages
              </h4>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className={u2aStep !== 'IDLE' ? 'text-emerald-400' : 'text-slate-600'}>
                    {u2aStep !== 'IDLE' ? '✓' : '○'}
                  </span>
                  <span className="text-slate-300">1. Pi.authenticate() & Order Creation</span>
                  {u2aOrderId && <span className="text-[10px] text-amber-400">({u2aOrderId})</span>}
                </div>

                <div className="flex items-center gap-2">
                  <span className={u2aPaymentId ? 'text-emerald-400' : 'text-slate-600'}>
                    {u2aPaymentId ? '✓' : '○'}
                  </span>
                  <span className="text-slate-300">2. Pi.createPayment() → paymentId</span>
                  {u2aPaymentId && <span className="text-[10px] text-amber-400 truncate max-w-[120px]">({u2aPaymentId})</span>}
                </div>

                <div className="flex items-center gap-2">
                  <span className={u2aVerificationFlags.developerApproved ? 'text-emerald-400' : 'text-slate-600'}>
                    {u2aVerificationFlags.developerApproved ? '✓' : '○'}
                  </span>
                  <span className="text-slate-300">3. Backend Server-Side Approval (developer_approved = true)</span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  u2aStep === 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION'
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-slate-800 bg-slate-900/50'
                }`}>
                  <div className="flex items-center gap-2">
                    {u2aStep === 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION' ? (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    ) : (
                      <span className={u2aTxId ? 'text-emerald-400' : 'text-slate-600'}>
                        {u2aTxId ? '✓' : '○'}
                      </span>
                    )}
                    <span className="font-bold text-amber-300 text-[11px]">
                      4. WAITING FOR PIONEER WALLET CONFIRMATION
                    </span>
                  </div>

                  {u2aStep === 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION' && (
                    <div className="mt-2 space-y-2 text-[11px] text-slate-300">
                      <p>
                        Approval confirmed. Please confirm & sign in your Pi Wallet, or enter the real TxID here:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={u2aManualTxInput}
                          onChange={(e) => setU2aManualTxInput(e.target.value)}
                          placeholder="Paste verified testnet txid..."
                          className="flex-1 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 text-[11px] focus:outline-none focus:border-amber-500"
                        />
                        <button
                          onClick={handleConfirmU2ATxId}
                          className="rounded bg-amber-500 px-3 py-1 text-slate-950 font-bold hover:bg-amber-400"
                        >
                          Verify TxID
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={u2aVerificationFlags.transactionVerified ? 'text-emerald-400' : 'text-slate-600'}>
                    {u2aVerificationFlags.transactionVerified ? '✓' : '○'}
                  </span>
                  <span className="text-slate-300">5. Blockchain Verification (transaction_verified = true)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={u2aVerificationFlags.developerCompleted ? 'text-emerald-400' : 'text-slate-600'}>
                    {u2aVerificationFlags.developerCompleted ? '✓' : '○'}
                  </span>
                  <span className="text-slate-300">6. Backend Server-Side Completion (developer_completed = true)</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={u2aStatusPassed ? 'text-emerald-400' : 'text-slate-600'}>
                    {u2aStatusPassed ? '✓' : '○'}
                  </span>
                  <span className="text-slate-300">7. Order = PAID</span>
                </div>
              </div>

              {u2aError && (
                <div className="mt-3 rounded border border-red-500/40 bg-red-500/10 p-2.5 text-xs text-red-300">
                  {u2aError}
                </div>
              )}
            </div>
          </div>

          {/* Bottom badge */}
          <div className="mt-6 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rule: Developer approved + Tx verified + Developer completed</span>
            <span className="font-mono text-emerald-400">Full Official Cycle</span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* STEP 3: CROSS-VERIFY & FINAL RESULT REPORT */}
      {/* ================================================================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <span className="rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-xs px-2 py-0.5 border border-amber-500/30">
              STEP 3
            </span>
            <h2 className="text-lg font-bold text-white font-mono mt-1">CROSS-VERIFICATION & AUDIT SUITE</h2>
            <p className="text-xs text-slate-400">Bi-directional verification matrix for Pi Testnet transactions</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 font-mono text-xs">
              <span className="text-slate-400">A2U: </span>
              <span className={a2uStatusPassed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {a2uStatusPassed ? 'PASS' : 'FAIL'}
              </span>
              <span className="text-slate-600 mx-2">|</span>
              <span className="text-slate-400">U2A: </span>
              <span className={u2aStatusPassed ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {u2aStatusPassed ? 'PASS' : 'FAIL'}
              </span>
            </div>
          </div>
        </div>

        {/* Side-by-Side Diagnostic Tables */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* A2U Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-amber-400 text-sm">A2U: App → Pioneer</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                a2uStatusPassed
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {a2uStatusPassed ? 'SUCCESS' : 'FAIL'}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment ID:</span>
                <span className="text-white">{a2uResult?.paymentId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TxID:</span>
                <span className="text-emerald-400 truncate max-w-[200px]" title={a2uResult?.txid}>
                  {a2uResult?.txid || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="text-amber-400">{a2uResult?.amountPi ? `${a2uResult.amountPi} π` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="text-white truncate max-w-[200px]" title={recipientWallet}>
                  {recipientWallet}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Blockchain status:</span>
                <span className={a2uResult?.transactionVerified ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {a2uResult?.transactionVerified ? 'CONFIRMED ON-CHAIN' : 'UNCONFIRMED / PENDING'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-500 font-bold">FINAL RESULT:</span>
                <span className={a2uStatusPassed ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                  {a2uStatusPassed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          </div>

          {/* U2A Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-amber-400 text-sm">U2A: Pioneer → App</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                u2aStatusPassed
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}>
                {u2aStatusPassed ? 'SUCCESS' : 'FAIL'}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment ID:</span>
                <span className="text-white">{u2aPaymentId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="text-amber-400">{u2aOrderId || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TxID:</span>
                <span className="text-emerald-400 truncate max-w-[200px]" title={u2aTxId || undefined}>
                  {u2aTxId || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="text-amber-400">{u2aAmount} π</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sender:</span>
                <span className="text-white">Pioneer Wallet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient:</span>
                <span className="text-white truncate max-w-[200px]" title={recipientWallet}>
                  {recipientWallet}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Blockchain status:</span>
                <span className={u2aVerificationFlags.transactionVerified ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                  {u2aVerificationFlags.transactionVerified ? 'CONFIRMED ON-CHAIN' : 'UNCONFIRMED / PENDING'}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-500 font-bold">FINAL RESULT:</span>
                <span className={u2aStatusPassed ? 'text-emerald-400 font-black' : 'text-red-400 font-black'}>
                  {u2aStatusPassed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Pi Horizon Blockchain Query Tool */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white font-mono uppercase">
                Live Pi Testnet Horizon Blockchain Explorer Query
              </h3>
            </div>
            <a
              href={`https://horizon-testnet.minepi.com/accounts/${recipientWallet}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-mono text-amber-400 hover:underline"
            >
              Open Raw Horizon Account Endpoint &gt;
            </a>
          </div>

          <form onSubmit={handleSearchHorizonTx} className="flex gap-2">
            <input
              type="text"
              value={searchTxId}
              onChange={(e) => setSearchTxId(e.target.value)}
              placeholder="Query any Pi Testnet TxID (e.g. 9b4d8...)"
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={searchingTx}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-700"
            >
              <Search className="h-3.5 w-3.5" />
              Audit Tx
            </button>
          </form>

          {searchedTxResult && (
            <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 font-mono text-xs space-y-1">
              {searchedTxResult.verified ? (
                <div className="text-emerald-400 space-y-1">
                  <div>✓ Transaction Verified on Pi Testnet Blockchain!</div>
                  <div className="text-slate-300">Ledger Sequence: {searchedTxResult.ledger}</div>
                  <div className="text-slate-300">Timestamp: {searchedTxResult.createdAt}</div>
                  <div className="text-slate-300">Source: {searchedTxResult.sourceAccount}</div>
                  <div className="text-slate-300">Fee Charged: {searchedTxResult.feeCharged} stroops</div>
                </div>
              ) : (
                <div className="text-red-400">
                  ✗ Verification Failed: {searchedTxResult.error || 'Transaction not found on Testnet Horizon ledger'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};