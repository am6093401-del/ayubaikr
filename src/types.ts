export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  isPrimary?: boolean;
}

export interface ProductSpec {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'smartphones' | 'cases' | 'chargers' | 'screen_protectors' | 'audio' | 'power_banks' | 'parts' | 'cables';
  pricePi: number;
  fiatEquivalentUsd?: number;
  stock: number;
  description: string;
  images: ProductImage[];
  specs: ProductSpec[];
  vendorId: string;
  vendorName: string;
  condition: 'Brand New' | 'Refurbished Grade A' | 'OEM Original';
  warranty: string;
  rating: number;
  reviewCount: number;
  featured?: boolean;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletAddress?: string;
  status: 'active' | 'pending' | 'suspended';
  rating: number;
  salesCount: number;
  totalPiEarned: number;
  joinedDate: string;
  commissionRatePercent: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  pricePi: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerUid?: string;
  customerWallet?: string;
  items: OrderItem[];
  totalPi: number;
  shippingAddress: string;
  status: 'PENDING_APPROVAL' | 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION' | 'SIGNED' | 'COMPLETED' | 'PAID' | 'FAILED' | 'CANCELLED';
  piPaymentId?: string;
  piTxId?: string;
  developerApproved?: boolean;
  transactionVerified?: boolean;
  developerCompleted?: boolean;
  createdAt: string;
  completedAt?: string;
  blockchainVerificationUrl?: string;
  vendorIds: string[];
}

export interface PiPaymentVerificationRecord {
  id: string;
  type: 'A2U' | 'U2A';
  direction: string;
  paymentId?: string;
  orderId?: string;
  amountPi: number;
  senderWallet: string;
  recipientWallet: string;
  network: 'Pi Testnet';
  txid?: string;
  status: 'PENDING' | 'WAITING_WALLET_CONFIRMATION' | 'APPROVED' | 'VERIFYING_BLOCKCHAIN' | 'SUCCESS' | 'FAILED' | 'REQUIRES_PORTAL_CONFIG';
  developerApproved: boolean;
  developerCompleted: boolean;
  transactionVerified: boolean;
  rawApiPayload?: any;
  rawHorizonResponse?: any;
  errorMessage?: string;
  requirementNotice?: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface PiBackendConfig {
  hasApiKey: boolean;
  recipientTestnetWallet: string;
  appId?: string;
  sandboxMode: boolean;
  outgoingWalletConfigured: boolean;
  outgoingWalletStatusMessage?: string;
  horizonUrl: string;
  platformApiUrl: string;
}
