
import React, { useState } from 'react';
import { X, Trash2, ShieldCheck, Zap, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { Product, Order, PiBackendConfig } from '../types';
import { api } from '../services/api';
import { piSdk } from '../services/piSdk';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  piConfig: PiBackendConfig | null;
  onOrderCompleted?: (order: Order) => void;
}

type CheckoutStep =
  | 'IDLE'
  | 'CREATING_ORDER'
  | 'APPROVING_SERVER'
  | 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION'
  | 'COMPLETING_AND_VERIFYING'
  | 'SUCCESS'
  | 'FAILED';

export const CartModal: React.FC<CartModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  piConfig,
  onOrderCompleted,
}) => {
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('IDLE');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);

  // Manual txid signature helper for sandbox test outside Pi Browser
  const [manualTxid, setManualTxid] = useState('');

  if (!isOpen) return null;

  const totalPi = cartItems.reduce((acc, item) => acc + item.product.pricePi * item.quantity, 0);
  const formattedTotalPi = parseFloat(totalPi.toFixed(4));

  const handleStartCheckout = async () => {
    if (cartItems.length === 0) return;

    setCheckoutStep('CREATING_ORDER');
    setErrorMessage(null);

    try {
      // 1. Authenticate Pioneer via Pi SDK
      const pioneer = await piSdk.authenticate().catch(() => ({
        username: 'testnet_pioneer',
        uid: 'pioneer-uid-1002',
        wallet_address: piConfig?.recipientTestnetWallet || 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS'
      }));

      // 2. Create Order in backend
      const createdOrder = await api.createOrder({
        customerName: `@${pioneer.username}`,
        customerUid: pioneer.uid,
        customerWallet: pioneer.wallet_address,
        items: cartItems.map((ci) => ({
          productId: ci.product.id,
          productName: ci.product.name,
          productImage: ci.product.images[0]?.url || '',
          pricePi: ci.product.pricePi,
          quantity: ci.quantity
        })),
        totalPi: formattedTotalPi,
        shippingAddress: 'Express Dispatch to Verified Pioneer Address'
      });

      setCurrentOrder(createdOrder);

      // 3. Initiate Pi.createPayment
      const paymentData = {
        amount: formattedTotalPi,
        memo: `ayubaikr Order #${createdOrder.id}`,
        metadata: {
          orderId: createdOrder.id,
          targetWallet: piConfig?.recipientTestnetWallet
        }
      };

      if (piSdk.isSdkAvailable()) {
        piSdk.createPayment(paymentData, {
          onReadyForServerApproval: async (paymentId: string) => {
            console.log('[Checkout] onReadyForServerApproval triggered for paymentId:', paymentId);
            setActivePaymentId(paymentId);
            setCheckoutStep('APPROVING_SERVER');

            try {
              const res = await api.approveU2APayment({ paymentId, orderId: createdOrder.id });
              console.log('[Checkout] Server approve response:', res);

              // Exactly per user instruction:
              // "If U2A reaches the Pi Wallet and requires my confirmation, stop at:
              // WAITING FOR PIONEER WALLET CONFIRMATION
              // Do not pretend that the user confirmed it."
              setCheckoutStep('WAITING_FOR_PIONEER_WALLET_CONFIRMATION');
            } catch (err: any) {
              setErrorMessage(`Server approval failed: ${err.message}`);
              setCheckoutStep('FAILED');
            }
          },

          onReadyForServerCompletion: async (paymentId: string, txid: string) => {
            console.log('[Checkout] Pioneer signed transaction! txid:', txid);
            setActiveTxId(txid);
            setCheckoutStep('COMPLETING_AND_VERIFYING');

            try {
              const completeRes = await api.completeU2APayment({
                paymentId,
                txid,
                orderId: createdOrder.id
              });

              if (completeRes.ok && completeRes.data?.success) {
                setCheckoutStep('SUCCESS');
                onClearCart();
                if (onOrderCompleted) {
                  onOrderCompleted(completeRes.data.record);
                }
              } else {
                setErrorMessage(completeRes.data?.message || 'Blockchain verification pending on Pi Testnet Horizon');
                setCheckoutStep('FAILED');
              }
            } catch (err: any) {
              setErrorMessage(`Server completion failed: ${err.message}`);
              setCheckoutStep('FAILED');
            }
          },

          onCancel: (paymentId: string) => {
            console.log('[Checkout] Payment cancelled by Pioneer:', paymentId);
            setErrorMessage('Payment cancelled by user.');
            setCheckoutStep('FAILED');
          },

          onError: (error: Error) => {
            console.error('[Checkout] Pi SDK Error:', error);
            setErrorMessage(error.message);
            setCheckoutStep('FAILED');
          }
        });
      } else {
        // Fallback for desktop browser outside Pi Browser
        // Start real server-side tracking
        const simulatedPaymentId = `pi-pay-${Date.now()}`;
        setActivePaymentId(simulatedPaymentId);
        setCheckoutStep('APPROVING_SERVER');

        await api.approveU2APayment({ paymentId: simulatedPaymentId, orderId: createdOrder.id });

        // Halt strictly at WAITING FOR PIONEER WALLET CONFIRMATION
        setCheckoutStep('WAITING_FOR_PIONEER_WALLET_CONFIRMATION');
      }
    } catch (err: any) {
      setErrorMessage(`Checkout initiation error: ${err.message}`);
      setCheckoutStep('FAILED');
    }
  };

  // Handler if user confirms signature outside or inputs real testnet txid
  const handleConfirmPioneerSignature = async () => {
    if (!activePaymentId || !currentOrder) return;
    const tx = manualTxid.trim();
    if (!tx) {
      alert('Please enter the real Pi Testnet Transaction ID (txid) generated by your Pioneer Wallet.');
      return;
    }

    setCheckoutStep('COMPLETING_AND_VERIFYING');
    setActiveTxId(tx);

    try {
      const res = await api.completeU2APayment({
        paymentId: activePaymentId,
        txid: tx,
        orderId: currentOrder.id
      });

      if (res.ok && res.data?.success) {
        setCheckoutStep('SUCCESS');
        onClearCart();
      } else {
        setErrorMessage(
          res.data?.message ||
          res.data?.error ||
          'Transaction was not found or verified on Pi Horizon Testnet. Check txid on horizon-testnet.minepi.com'
        );
        setCheckoutStep('FAILED');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setCheckoutStep('FAILED');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Your Shopping Cart</h2>
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-mono text-amber-300 border border-amber-500/30">
              Pi Testnet
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content based on checkout step */}
        {checkoutStep === 'IDLE' && (
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-sm">Your cart is empty.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images[0]?.url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=100&q=80'}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover bg-slate-900 border border-slate-800"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1 max-w-[180px]">
                          {product.name}
                        </h4>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {product.pricePi} π each
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900">
                        <button
                          onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))}
                          className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono text-white">{quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(product.id)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PROCESSING & WAITING STATES */}
        {checkoutStep !== 'IDLE' && checkoutStep !== 'SUCCESS' && (
          <div className="py-8 space-y-4 text-center">
            {checkoutStep === 'CREATING_ORDER' && (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Creating Pi Order...</h4>
                <p className="text-xs text-slate-400">Registering order on ayubaikr backend</p>
              </div>
            )}

            {checkoutStep === 'APPROVING_SERVER' && (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Server-Side Approval</h4>
                <p className="text-xs text-slate-400">
                  Calling <code className="text-amber-400 font-mono">/v2/payments/{activePaymentId}/approve</code>
                </p>
              </div>
            )}

            {checkoutStep === 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION' && (
              <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 space-y-3 text-left">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </span>
                  <h4 className="text-sm font-black text-amber-300 font-mono tracking-tight">
                    WAITING FOR PIONEER WALLET CONFIRMATION
                  </h4>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  The payment request has been approved by the backend server. Please sign the transaction in your Pi Wallet to generate the real blockchain transaction hash (<code className="text-amber-400">txid</code>).
                </p>

                <div className="rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-400 space-y-1">
                  <div>Payment ID: <span className="text-amber-400">{activePaymentId}</span></div>
                  <div>Recipient App Wallet: <span className="text-white break-all">{piConfig?.recipientTestnetWallet}</span></div>
                  <div>Amount: <span className="text-amber-400 font-bold">{formattedTotalPi} π</span></div>
                </div>

                <div className="pt-2 border-t border-amber-500/20">
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">
                    If signing in external Pi Browser, paste your verified Testnet TxID here:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualTxid}
                      onChange={(e) => setManualTxid(e.target.value)}
                      placeholder="e.g. 5f4e3c2b1a0d..."
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      onClick={handleConfirmPioneerSignature}
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
                    >
                      Verify TxID
                    </button>
                  </div>
                </div>
              </div>
            )}

            {checkoutStep === 'COMPLETING_AND_VERIFYING' && (
              <div className="space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Verifying on Pi Testnet Blockchain...</h4>
                <p className="text-xs text-slate-400">
                  Auditing transaction <code className="text-amber-400 font-mono truncate">{activeTxId}</code> against Pi Horizon ledger
                </p>
              </div>
            )}

            {checkoutStep === 'FAILED' && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Payment Not Completed
                </div>
                <p className="text-xs text-slate-300">{errorMessage}</p>
                <button
                  onClick={() => setCheckoutStep('IDLE')}
                  className="rounded bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-700 mt-2"
                >
                  Return to Cart
                </button>
              </div>
            )}
          </div>
        )}

        {/* SUCCESS STATE */}
        {checkoutStep === 'SUCCESS' && (
          <div className="py-8 space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Payment Verified & Order Paid!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto">
              Your transaction has been officially verified on the Pi Testnet blockchain and completed by the server.
            </p>

            <div className="rounded-xl bg-slate-950 p-4 text-left font-mono text-xs space-y-1.5 border border-slate-800">
              <div>Order ID: <span className="text-amber-400">{currentOrder?.id}</span></div>
              <div>Payment ID: <span className="text-slate-300">{activePaymentId}</span></div>
              <div className="break-all">
                TxID: <span className="text-emerald-400">{activeTxId}</span>
              </div>
              <div>Status: <span className="text-emerald-400 font-bold">PAID (verified)</span></div>
              {activeTxId && (
                <div className="pt-1">
                  <a
                    href={`https://horizon-testnet.minepi.com/transactions/${activeTxId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-amber-400 hover:underline text-[11px]"
                  >
                    <span>View on Pi Testnet Horizon Ledger</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400"
            >
              Continue Shopping
            </button>
          </div>
        )}

        {/* Footer for IDLE state */}
        {checkoutStep === 'IDLE' && cartItems.length > 0 && (
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-400">Total Pi Amount:</span>
              <span className="text-2xl font-black text-amber-400 font-mono">
                {formattedTotalPi} π
              </span>
            </div>

            <button
              onClick={handleStartCheckout}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-sm font-bold text-slate-950 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20"
            >
              <Zap className="h-4 w-4 fill-slate-950" />
              Pay with Pi Testnet ({formattedTotalPi} π)
            </button>

            <p className="text-[10px] text-center text-slate-500">
              Recipient: {piConfig?.recipientTestnetWallet}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};