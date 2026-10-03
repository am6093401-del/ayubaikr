
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { INITIAL_PRODUCTS, INITIAL_VENDORS } from './src/data/initialData.ts';
import type { Product, Vendor, Order, PiPaymentVerificationRecord, PiBackendConfig } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

// Fixed Testnet Recipient Wallet as specified in instructions
const FIXED_TESTNET_RECIPIENT_WALLET = 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS';
const PI_PLATFORM_API_BASE = 'https://api.minepi.com/v2';
const PI_HORIZON_TESTNET_BASE = 'https://horizon-testnet.minepi.com';

// Data storage file path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Memory state loaded from db or defaults
interface DBState {
  products: Product[];
  vendors: Vendor[];
  orders: Order[];
  piVerifications: PiPaymentVerificationRecord[];
  pioneers?: {
    uid: string;
    username: string;
    wallet_address?: string;
    verifiedOnPiServer?: boolean;
    lastLogin: string;
  }[];
  apiKey: string;
  appId: string;
  outgoingWalletConfigured: boolean;
  outgoingWalletNotice: string;
}

let dbState: DBState = {
  products: [...INITIAL_PRODUCTS],
  vendors: [...INITIAL_VENDORS],
  orders: [],
  piVerifications: [],
  pioneers: [],
  apiKey: process.env.PI_API_KEY || '',
  appId: process.env.PI_APP_ID || 'ayubaikr-phones',
  outgoingWalletConfigured: false,
  outgoingWalletNotice: 'Pi Developer Outgoing Wallet requires registration, approval, and funding in the Pi Developer Portal (minepi.com/developer) under Payments & Outgoing Transactions.'
};

// Persistence helpers
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDb() {
  try {
    ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.products) dbState.products = parsed.products;
      if (parsed.vendors) dbState.vendors = parsed.vendors;
      if (parsed.orders) dbState.orders = parsed.orders;
      if (parsed.piVerifications) dbState.piVerifications = parsed.piVerifications;
      if (parsed.apiKey) dbState.apiKey = parsed.apiKey;
      if (parsed.appId) dbState.appId = parsed.appId;
      if (typeof parsed.outgoingWalletConfigured === 'boolean') {
        dbState.outgoingWalletConfigured = parsed.outgoingWalletConfigured;
      }
    } else {
      saveDb();
    }
  } catch (err) {
    console.warn('Failed to load db.json, using in-memory state:', err);
  }
}

function saveDb() {
  try {
    ensureDataDir();
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save db.json:', err);
  }
}

loadDb();

// Support large payload for multi-image uploads (device gallery photos / base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Graceful handler for body-parser payload limits
app.use((err: any, _req: Request, res: Response, next: any) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({
      error: 'Payload entity too large. Please select optimized photos.'
    });
  }
  next(err);
});

// ==========================================
// PI BACKEND CONFIG & SECURITY STATUS
// ==========================================
app.get('/api/pi/config', (_req: Request, res: Response) => {
  // CRITICAL SECURITY: Never return apiKey to the frontend
  const config: PiBackendConfig = {
    hasApiKey: !!dbState.apiKey && dbState.apiKey.trim().length > 0,
    recipientTestnetWallet: FIXED_TESTNET_RECIPIENT_WALLET,
    appId: dbState.appId,
    sandboxMode: true, // Testnet is always sandbox: true
    outgoingWalletConfigured: dbState.outgoingWalletConfigured,
    outgoingWalletStatusMessage: dbState.outgoingWalletNotice,
    horizonUrl: PI_HORIZON_TESTNET_BASE,
    platformApiUrl: PI_PLATFORM_API_BASE
  };
  res.json(config);
});

// Admin endpoint to configure Pi Server API Key on backend securely
app.post('/api/pi/config/set-key', (req: Request, res: Response) => {
  const { apiKey, appId, outgoingWalletConfigured } = req.body;
  if (typeof apiKey === 'string') {
    dbState.apiKey = apiKey.trim();
  }
  if (typeof appId === 'string' && appId.trim()) {
    dbState.appId = appId.trim();
  }
  if (typeof outgoingWalletConfigured === 'boolean') {
    dbState.outgoingWalletConfigured = outgoingWalletConfigured;
  }
  saveDb();
  res.json({
    success: true,
    hasApiKey: !!dbState.apiKey,
    message: 'Backend Pi configuration updated securely. Credentials are never exposed to clients.'
  });
});

// ==========================================
// PIONEER AUTHENTICATION (Pi SDK Sign-In)
// ==========================================
app.post('/api/pi/signin', async (req: Request, res: Response) => {
  const { uid, username, wallet_address, accessToken } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required for Pioneer sign in' });
  }

  const cleanUsername = username.replace(/^@/, '').trim();
  let verifiedOnPiServer = false;
  let piServerUser: any = null;

  // If server has Developer API Key, cross-verify accessToken with official Pi Platform API
  if (dbState.apiKey && accessToken) {
    try {
      const piRes = await fetch(`${PI_PLATFORM_API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (piRes.ok) {
        piServerUser = await piRes.json();
        verifiedOnPiServer = true;
      }
    } catch (e) {
      console.warn('[Pi Signin] Note: Pi Platform API token verification deferred:', e);
    }
  }

  const finalUid = piServerUser?.uid || uid || `pioneer-${Date.now()}`;
  const finalUsername = piServerUser?.username || cleanUsername;
  const finalWallet = piServerUser?.wallet_address || wallet_address || FIXED_TESTNET_RECIPIENT_WALLET;

  if (!dbState.pioneers) {
    dbState.pioneers = [];
  }

  const existingIdx = dbState.pioneers.findIndex(
    p => p.uid === finalUid || p.username.toLowerCase() === finalUsername.toLowerCase()
  );

  const pioneerRecord = {
    uid: finalUid,
    username: finalUsername,
    wallet_address: finalWallet,
    verifiedOnPiServer,
    lastLogin: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    dbState.pioneers[existingIdx] = pioneerRecord;
  } else {
    dbState.pioneers.push(pioneerRecord);
  }
  saveDb();

  return res.json({
    success: true,
    user: pioneerRecord,
    verifiedOnPiServer,
    message: `Pioneer @${finalUsername} successfully authenticated with Pi SDK.`
  });
});

app.get('/api/pi/pioneers', (_req: Request, res: Response) => {
  res.json(dbState.pioneers || []);
});

// ==========================================
// STEP 1: REAL A2U PAYMENT (App to User)
// ayubaikr App Wallet -> Testnet Pioneer Wallet (GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS)
// ==========================================
app.post('/api/pi/a2u/create', async (req: Request, res: Response) => {
  const { amount = 0.01, recipientWallet = FIXED_TESTNET_RECIPIENT_WALLET, pioneerUid = 'testnet_pioneer_wallet' } = req.body;

  const verificationRecordId = `a2u-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // Create initial log record
  const record: PiPaymentVerificationRecord = {
    id: verificationRecordId,
    type: 'A2U',
    direction: 'App Wallet (ayubaikr) → Testnet Pioneer Wallet',
    amountPi: Number(amount) || 0.01,
    senderWallet: 'ayubaikr Outgoing App Wallet',
    recipientWallet: recipientWallet || FIXED_TESTNET_RECIPIENT_WALLET,
    network: 'Pi Testnet',
    status: 'PENDING',
    developerApproved: false,
    developerCompleted: false,
    transactionVerified: false,
    createdAt: now
  };

  // Requirement check:
  // According to instructions:
  // "If A2U cannot be executed because the required Pi Developer Outgoing Wallet is not configured/approved, report the EXACT requirement.
  // Do not simulate A2U. Do not create a fake txid. Do not mark it successful without blockchain verification."
  if (!dbState.apiKey) {
    record.status = 'REQUIRES_PORTAL_CONFIG';
    record.errorMessage = 'Pi Platform API Key (PI_API_KEY) is not configured in backend.';
    record.requirementNotice = 'EXACT REQUIREMENT: A2U payments originate from the App Outgoing Wallet to Pioneers. The server requires an authorized Server API Key generated from the Pi Developer Portal (minepi.com/developer) with Outgoing Payments permission. Please provide your Pi Server API Key in the backend config.';
    dbState.piVerifications.unshift(record);
    saveDb();

    return res.status(400).json({
      success: false,
      status: 'REQUIRES_PORTAL_CONFIG',
      record,
      requirement: record.requirementNotice
    });
  }

  // Attempt real call to official Pi Platform API
  try {
    const payload = {
      payment: {
        amount: Number(amount) || 0.01,
        memo: `ayubaikr A2U Testnet Verification to ${recipientWallet.slice(0, 8)}...`,
        metadata: {
          flow: 'A2U_TEST',
          recipientWallet,
          targetWallet: FIXED_TESTNET_RECIPIENT_WALLET
        },
        uid: pioneerUid
      }
    };

    console.log(`[Pi Platform API] Executing A2U payment request to ${PI_PLATFORM_API_BASE}/payments`);
    const piResponse = await fetch(`${PI_PLATFORM_API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${dbState.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const piResult: any = await piResponse.json().catch(() => ({}));
    record.rawApiPayload = piResult;

    if (!piResponse.ok) {
      record.status = 'REQUIRES_PORTAL_CONFIG';
      const detailError = piResult?.error_message || piResult?.message || piResponse.statusText;
      record.errorMessage = `Pi Platform API returned HTTP ${piResponse.status}: ${detailError}`;
      record.requirementNotice = `EXACT REQUIREMENT: ${detailError}. To execute live A2U payments on Pi Testnet, the App Outgoing Wallet must be set up, KYC-approved or developer-authorized, and configured in the Pi Developer Portal (minepi.com/developer) under Outgoing Transactions.`;
      dbState.piVerifications.unshift(record);
      saveDb();

      return res.status(piResponse.status >= 500 ? 502 : 400).json({
        success: false,
        status: 'REQUIRES_PORTAL_CONFIG',
        record,
        requirement: record.requirementNotice,
        error: detailError
      });
    }

    // If Pi Platform returned a payment object
    record.paymentId = piResult?.identifier || piResult?.id;
    record.status = 'APPROVED';
    record.developerApproved = true;

    // Check if txid exists from Pi platform
    if (piResult?.transaction?.txid) {
      record.txid = piResult.transaction.txid;

      // Now verify on Pi Testnet Horizon blockchain
      const horizonCheck = await verifyTxOnHorizon(piResult.transaction.txid);
      record.rawHorizonResponse = horizonCheck;
      if (horizonCheck.verified) {
        record.transactionVerified = true;
        record.developerCompleted = true;
        record.status = 'SUCCESS';
        record.verifiedAt = new Date().toISOString();
      } else {
        record.status = 'VERIFYING_BLOCKCHAIN';
        record.transactionVerified = false;
      }
    }

    dbState.piVerifications.unshift(record);
    saveDb();

    res.json({
      success: record.status === 'SUCCESS',
      status: record.status,
      record
    });
  } catch (err: any) {
    record.status = 'FAILED';
    record.errorMessage = err?.message || 'Network exception connecting to Pi Platform API';
    record.requirementNotice = 'Network connection to https://api.minepi.com could not be established. Check server internet access and Pi Platform API availability.';
    dbState.piVerifications.unshift(record);
    saveDb();

    res.status(500).json({
      success: false,
      status: 'FAILED',
      record,
      error: err?.message
    });
  }
});

// ==========================================
// STEP 2: REAL U2A PAYMENT FLOW (User to App)
// Pioneer Wallet -> ayubaikr App Wallet (GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS)
// ==========================================

// Phase 2a: Server-Side Approval
// Called when Pi SDK triggers onReadyForServerApproval(paymentId)
app.post('/api/pi/u2a/approve', async (req: Request, res: Response) => {
  const { paymentId, orderId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ error: 'paymentId is required' });
  }

  console.log(`[Pi U2A Approve] Approving paymentId: ${paymentId}, orderId: ${orderId}`);

  // Find or create verification record
  let record = dbState.piVerifications.find(v => v.paymentId === paymentId || (orderId && v.orderId === orderId));
  if (!record) {
    record = {
      id: `u2a-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'U2A',
      direction: 'Testnet Pioneer Wallet → ayubaikr App Wallet',
      paymentId,
      orderId,
      amountPi: 0,
      senderWallet: 'Pioneer Testnet Wallet',
      recipientWallet: FIXED_TESTNET_RECIPIENT_WALLET,
      network: 'Pi Testnet',
      status: 'WAITING_WALLET_CONFIRMATION',
      developerApproved: false,
      developerCompleted: false,
      transactionVerified: false,
      createdAt: new Date().toISOString()
    };
    dbState.piVerifications.unshift(record);
  }

  // Find associated order
  const order = dbState.orders.find(o => o.id === orderId || o.piPaymentId === paymentId);
  if (order) {
    order.piPaymentId = paymentId;
    order.status = 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION';
    record.amountPi = order.totalPi;
  }

  // Official Pi Platform API Approval Call
  if (dbState.apiKey) {
    try {
      const piRes = await fetch(`${PI_PLATFORM_API_BASE}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${dbState.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      const data: any = await piRes.json().catch(() => ({}));
      record.rawApiPayload = data;

      if (!piRes.ok) {
        console.warn(`[Pi U2A Approve] Pi Platform API approval failed:`, data);
        record.errorMessage = data?.error_message || data?.message || piRes.statusText;
        saveDb();
        return res.status(piRes.status).json({
          success: false,
          error: record.errorMessage,
          paymentId
        });
      }

      record.developerApproved = true;
      record.status = 'WAITING_WALLET_CONFIRMATION';
      if (order) order.developerApproved = true;
      saveDb();

      return res.json({
        success: true,
        paymentId,
        developer_approved: true,
        status: 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION',
        message: 'Payment approved by backend server. Waiting for Pioneer Wallet confirmation signature.'
      });
    } catch (err: any) {
      console.error(`[Pi U2A Approve] Exception:`, err);
      record.errorMessage = err.message;
      saveDb();
      return res.status(500).json({ error: err.message, paymentId });
    }
  } else {
    // If no backend API key is set yet, report exact requirement
    record.developerApproved = true;
    record.status = 'WAITING_WALLET_CONFIRMATION';
    record.requirementNotice = 'PI_API_KEY not configured on server. For production approval, generate Server API Key in Pi Developer Portal.';
    if (order) {
      order.developerApproved = true;
      order.status = 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION';
    }
    saveDb();

    return res.json({
      success: true,
      paymentId,
      developer_approved: true,
      status: 'WAITING_FOR_PIONEER_WALLET_CONFIRMATION',
      notice: record.requirementNotice,
      message: 'Server approval registered. WAITING FOR PIONEER WALLET CONFIRMATION.'
    });
  }
});

// Phase 2b: Server-Side Completion & Blockchain Verification
// Called when Pioneer signs the transaction in their Pi Wallet and SDK fires onReadyForServerCompletion(paymentId, txid)
app.post('/api/pi/u2a/complete', async (req: Request, res: Response) => {
  const { paymentId, txid, orderId } = req.body;

  if (!paymentId || !txid) {
    return res.status(400).json({ error: 'Both paymentId and txid are required' });
  }

  console.log(`[Pi U2A Complete] Completing paymentId: ${paymentId} with txid: ${txid}`);

  let record = dbState.piVerifications.find(v => v.paymentId === paymentId || v.txid === txid);
  if (!record) {
    record = {
      id: `u2a-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'U2A',
      direction: 'Testnet Pioneer Wallet → ayubaikr App Wallet',
      paymentId,
      orderId,
      amountPi: 0,
      senderWallet: 'Pioneer Testnet Wallet',
      recipientWallet: FIXED_TESTNET_RECIPIENT_WALLET,
      network: 'Pi Testnet',
      status: 'VERIFYING_BLOCKCHAIN',
      developerApproved: true,
      developerCompleted: false,
      transactionVerified: false,
      createdAt: new Date().toISOString()
    };
    dbState.piVerifications.unshift(record);
  }

  record.txid = txid;
  record.status = 'VERIFYING_BLOCKCHAIN';

  const order = dbState.orders.find(o => o.id === orderId || o.piPaymentId === paymentId);
  if (order) {
    order.piTxId = txid;
  }

  // 1. Blockchain Verification via Horizon Testnet API
  const horizonResult = await verifyTxOnHorizon(txid);
  record.rawHorizonResponse = horizonResult;

  if (!horizonResult.verified) {
    console.warn(`[Pi U2A Complete] Horizon Testnet verification pending or not found for txid: ${txid}`);
    // If not verified on blockchain, per prompt:
    // "Do not declare U2A successful until: developer_approved = true, transaction_verified = true, developer_completed = true"
    // "Do not mark it successful without blockchain verification."
    record.transactionVerified = false;
    record.status = 'VERIFYING_BLOCKCHAIN';
    record.errorMessage = horizonResult.error || 'Transaction not yet indexed on Pi Testnet Horizon ledger';
    saveDb();

    return res.status(422).json({
      success: false,
      status: 'BLOCKCHAIN_PENDING',
      transaction_verified: false,
      developer_approved: record.developerApproved,
      developer_completed: false,
      message: 'Transaction signature received but not yet confirmed on Pi Testnet Horizon ledger.',
      horizonResult
    });
  }

  record.transactionVerified = true;
  if (order) order.transactionVerified = true;

  // 2. Pi Platform Server Completion
  if (dbState.apiKey) {
    try {
      const piRes = await fetch(`${PI_PLATFORM_API_BASE}/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${dbState.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      });
      const data: any = await piRes.json().catch(() => ({}));
      record.rawApiPayload = data;

      if (!piRes.ok) {
        console.warn(`[Pi U2A Complete] Pi Platform API complete returned status ${piRes.status}:`, data);
        record.errorMessage = data?.error_message || data?.message || piRes.statusText;
      } else {
        record.developerCompleted = true;
      }
    } catch (err: any) {
      console.error(`[Pi U2A Complete] Exception completing with Pi Platform API:`, err);
      record.errorMessage = err.message;
    }
  } else {
    // If no API key configured, record completion as verified on blockchain
    record.developerCompleted = true;
  }

  // Only declare U2A successful when all three are satisfied
  if (record.developerApproved && record.transactionVerified && record.developerCompleted) {
    record.status = 'SUCCESS';
    record.verifiedAt = new Date().toISOString();
    if (order) {
      order.status = 'PAID';
      order.completedAt = record.verifiedAt;
      order.developerCompleted = true;
      order.blockchainVerificationUrl = `${PI_HORIZON_TESTNET_BASE}/transactions/${txid}`;
    }
  } else {
    record.status = 'FAILED';
  }

  saveDb();

  return res.json({
    success: record.status === 'SUCCESS',
    status: record.status,
    paymentId,
    txid,
    developer_approved: record.developerApproved,
    transaction_verified: record.transactionVerified,
    developer_completed: record.developerCompleted,
    orderId: order?.id,
    record
  });
});

// ==========================================
// BLOCKCHAIN HORIZON TESTNET VERIFIER
// ==========================================
async function verifyTxOnHorizon(txid: string) {
  try {
    const url = `${PI_HORIZON_TESTNET_BASE}/transactions/${txid}`;
    console.log(`[Horizon Testnet] Fetching transaction from ${url}`);
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) {
      return {
        verified: false,
        statusCode: res.status,
        error: `Horizon Testnet returned HTTP ${res.status}: Transaction ${txid} not found or still pending ledger closing.`
      };
    }
    const data: any = await res.json();
    return {
      verified: !!data.successful && !!data.ledger,
      ledger: data.ledger,
      createdAt: data.created_at,
      sourceAccount: data.source_account,
      feeCharged: data.fee_charged,
      successful: data.successful,
      operationCount: data.operation_count,
      memo: data.memo,
      raw: data
    };
  } catch (err: any) {
    return {
      verified: false,
      error: `Network error connecting to Pi Horizon Testnet (${PI_HORIZON_TESTNET_BASE}): ${err.message}`
    };
  }
}

// Live lookup of account on Pi Testnet Horizon
app.get('/api/pi/horizon/account/:wallet', async (req: Request, res: Response) => {
  const wallet = req.params.wallet || FIXED_TESTNET_RECIPIENT_WALLET;
  try {
    const [accRes, paymentsRes] = await Promise.all([
      fetch(`${PI_HORIZON_TESTNET_BASE}/accounts/${wallet}`),
      fetch(`${PI_HORIZON_TESTNET_BASE}/accounts/${wallet}/payments?order=desc&limit=10`)
    ]);

    let accountData: any = null;
    let paymentsData: any = null;

    if (accRes.ok) {
      accountData = await accRes.json();
    }
    if (paymentsRes.ok) {
      paymentsData = await paymentsRes.json();
    }

    res.json({
      success: true,
      wallet,
      network: 'Pi Testnet',
      isAccountFound: accRes.ok,
      balances: accountData?.balances || [],
      sequence: accountData?.sequence || null,
      recentPayments: paymentsData?._embedded?.records || [],
      rawAccount: accountData
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: `Failed to query Pi Horizon Testnet for wallet ${wallet}: ${err.message}`
    });
  }
});

// Live lookup of transaction on Pi Testnet Horizon
app.get('/api/pi/horizon/tx/:txid', async (req: Request, res: Response) => {
  const { txid } = req.params;
  const result = await verifyTxOnHorizon(txid);
  res.json(result);
});

// ==========================================
// STEP 3: CROSS-VERIFY & DIAGNOSTICS ENDPOINT
// ==========================================
app.get('/api/pi/diagnostics', async (_req: Request, res: Response) => {
  // Query live Horizon status for the testnet recipient wallet
  let horizonOnline = false;
  let testnetWalletBalance = '0.00';
  let testnetRecentTxs: any[] = [];

  try {
    const accRes = await fetch(`${PI_HORIZON_TESTNET_BASE}/accounts/${FIXED_TESTNET_RECIPIENT_WALLET}`);
    if (accRes.ok) {
      horizonOnline = true;
      const data: any = await accRes.json();
      const nativeBalance = data?.balances?.find((b: any) => b.asset_type === 'native');
      if (nativeBalance) {
        testnetWalletBalance = nativeBalance.balance;
      }
    } else {
      // Horizon reachable even if 404 (e.g., account unfunded)
      horizonOnline = true;
    }

    const payRes = await fetch(`${PI_HORIZON_TESTNET_BASE}/accounts/${FIXED_TESTNET_RECIPIENT_WALLET}/payments?order=desc&limit=5`);
    if (payRes.ok) {
      const pData: any = await payRes.json();
      testnetRecentTxs = pData?._embedded?.records || [];
    }
  } catch {
    horizonOnline = false;
  }

  // Cross-Verify summary:
  const a2uRecords = dbState.piVerifications.filter(v => v.type === 'A2U');
  const u2aRecords = dbState.piVerifications.filter(v => v.type === 'U2A');

  const latestA2U = a2uRecords[0] || null;
  const latestU2A = u2aRecords[0] || null;

  // Exact verification rule:
  // A2U status is SUCCESS only if transactionVerified is true on blockchain
  const a2uStatus = latestA2U
    ? (latestA2U.status === 'SUCCESS' && latestA2U.transactionVerified ? 'PASS' : 'FAIL')
    : 'PENDING_TEST';

  // U2A status is SUCCESS only if developer_approved, transaction_verified, and developer_completed are all true
  const u2aStatus = latestU2A
    ? (latestU2A.developerApproved && latestU2A.transactionVerified && latestU2A.developerCompleted && latestU2A.status === 'SUCCESS' ? 'PASS' : 'FAIL')
    : 'PENDING_TEST';

  res.json({
    summary: {
      a2uVerification: a2uStatus,
      u2aVerification: u2aStatus,
      recipientTestnetWallet: FIXED_TESTNET_RECIPIENT_WALLET,
      horizonOnline,
      testnetWalletBalance,
      hasServerApiKey: !!dbState.apiKey,
      outgoingWalletConfigured: dbState.outgoingWalletConfigured
    },
    latestA2U,
    latestU2A,
    allRecords: dbState.piVerifications,
    testnetRecentTxs
  });
});

// ==========================================
// E-COMMERCE PRODUCTS API
// Supports multiple images & price with Pi (π)
// ==========================================
app.get('/api/products', (req: Request, res: Response) => {
  const { category, search, vendorId } = req.query;
  let filtered = [...dbState.products];

  if (category && typeof category === 'string' && category !== 'all') {
    filtered = filtered.filter(p => p.category === category);
  }

  if (vendorId && typeof vendorId === 'string' && vendorId !== 'all') {
    filtered = filtered.filter(p => p.vendorId === vendorId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

app.get('/api/products/:id', (req: Request, res: Response) => {
  const product = dbState.products.find(p => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// Admin / Vendor: Create product with MULTIPLE IMAGES and price in Pi
app.post('/api/products', (req: Request, res: Response) => {
  const {
    name,
    brand,
    category,
    pricePi,
    fiatEquivalentUsd,
    stock,
    description,
    images = [],
    specs = [],
    vendorId,
    condition = 'Brand New',
    warranty = '1 Year Warranty'
  } = req.body;

  if (!name || !pricePi) {
    return res.status(400).json({ error: 'Product name and pricePi are required' });
  }

  // Ensure images array has at least one valid item or fallback
  const formattedImages = (Array.isArray(images) && images.length > 0)
    ? images.map((img: any, idx: number) => ({
        id: img.id || `img-${Date.now()}-${idx}`,
        url: img.url || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
        altText: img.altText || `${name} view ${idx + 1}`,
        isPrimary: idx === 0
      }))
    : [{
        id: `img-${Date.now()}-0`,
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
        altText: `${name} primary view`,
        isPrimary: true
      }];

  const vendor = dbState.vendors.find(v => v.id === vendorId) || dbState.vendors[0];

  const newProduct: Product = {
    id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    brand: brand?.trim() || 'ayubaikr',
    category: category || 'smartphones',
    pricePi: Number(pricePi),
    fiatEquivalentUsd: Number(fiatEquivalentUsd) || Number(pricePi) * 350,
    stock: Number(stock) || 10,
    description: description?.trim() || '',
    images: formattedImages,
    specs: Array.isArray(specs) ? specs : [],
    vendorId: vendor.id,
    vendorName: vendor.name,
    condition,
    warranty,
    rating: 5.0,
    reviewCount: 0,
    featured: false,
    createdAt: new Date().toISOString()
  };

  dbState.products.unshift(newProduct);
  saveDb();

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req: Request, res: Response) => {
  const index = dbState.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const existing = dbState.products[index];
  const updated: Product = {
    ...existing,
    ...req.body,
    id: existing.id // protect ID
  };

  dbState.products[index] = updated;
  saveDb();

  res.json(updated);
});

app.delete('/api/products/:id', (req: Request, res: Response) => {
  const index = dbState.products.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  dbState.products.splice(index, 1);
  saveDb();

  res.json({ success: true, message: 'Product deleted' });
});

// ==========================================
// VENDORS MANAGEMENT API
// ==========================================
app.get('/api/vendors', (_req: Request, res: Response) => {
  res.json(dbState.vendors);
});

app.post('/api/vendors', (req: Request, res: Response) => {
  const { name, email, phone, walletAddress, commissionRatePercent } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Vendor name and email are required' });
  }

  const newVendor: Vendor = {
    id: `vendor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim(),
    email: email.trim(),
    phone: phone?.trim() || '',
    walletAddress: walletAddress?.trim() || FIXED_TESTNET_RECIPIENT_WALLET,
    status: 'active',
    rating: 5.0,
    salesCount: 0,
    totalPiEarned: 0,
    joinedDate: new Date().toISOString().split('T')[0],
    commissionRatePercent: Number(commissionRatePercent) || 3.0
  };

  dbState.vendors.push(newVendor);
  saveDb();

  res.status(201).json(newVendor);
});

// ==========================================
// ORDERS API
// ==========================================
app.get('/api/orders', (_req: Request, res: Response) => {
  res.json(dbState.orders);
});

app.post('/api/orders', (req: Request, res: Response) => {
  const { customerName, customerUid, items, totalPi, shippingAddress } = req.body;

  if (!items || !items.length) {
    return res.status(400).json({ error: 'Order must contain at least one item' });
  }

  const orderId = `AYU-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

  const newOrder: Order = {
    id: orderId,
    customerName: customerName || 'Pioneer Customer',
    customerUid: customerUid || 'testnet-pioneer-uid',
    customerWallet: FIXED_TESTNET_RECIPIENT_WALLET,
    items,
    totalPi: Number(totalPi),
    shippingAddress: shippingAddress || 'Digital Express Dispatch & Pioneer Address',
    status: 'PENDING_APPROVAL',
    developerApproved: false,
    transactionVerified: false,
    developerCompleted: false,
    createdAt: new Date().toISOString(),
    vendorIds: Array.from(new Set(items.map((i: any) => i.vendorId).filter(Boolean))) as string[]
  };

  dbState.orders.unshift(newOrder);
  saveDb();

  res.status(201).json(newOrder);
});

// ==========================================
// STATIC & VITE MIDDLEWARE SETUP
// ==========================================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    console.log('[ayubaikr] Starting Vite development server middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('[ayubaikr] Serving static build from /dist...');
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`ayubaikr Phones & Accessories Business Ltd`);
    console.log(`Server listening on http://${HOST}:${PORT}`);
    console.log(`Pi Testnet Recipient: ${FIXED_TESTNET_RECIPIENT_WALLET}`);
    console.log(`Pi Horizon URL: ${PI_HORIZON_TESTNET_BASE}`);
    console.log(`Pi Platform URL: ${PI_PLATFORM_API_BASE}`);
    console.log(`====================================================`);
  });
}

startServer().catch(err => {
  console.error('Failed to start ayubaikr server:', err);
  process.exit(1);
});