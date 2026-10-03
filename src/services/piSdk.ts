
/**
 * Official Pi Network SDK Wrapper & Pioneer Authentication Service
 * Configured for Pi Testnet (sandbox: true)
 */

import { api } from './api';

declare global {
  interface Window {
    Pi?: {
      init: (options: { version: string; sandbox: boolean }) => void;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound: (payment: any) => void
      ) => Promise<{
        accessToken: string;
        user: {
          uid: string;
          username: string;
          wallet_address?: string;
        };
      }>;
      createPayment: (
        paymentData: {
          amount: number;
          memo: string;
          metadata: Record<string, any>;
        },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void;
          onReadyForServerCompletion: (paymentId: string, txid: string) => void;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment?: any) => void;
        }
      ) => void;
      openShareDialog?: (title: string, message: string) => void;
    };
  }
}

export interface PiUser {
  uid: string;
  username: string;
  wallet_address?: string;
  accessToken?: string;
  authSource?: 'pi_browser_sdk' | 'testnet_sandbox';
}

type AuthChangeListener = (user: PiUser | null) => void;

class PiSdkService {
  private initialized = false;
  private currentUser: PiUser | null = null;
  private authListeners: AuthChangeListener[] = [];
  public readonly sandbox = true;

  constructor() {
    // Restore session from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ayubaikr_pi_user');
        if (stored) {
          this.currentUser = JSON.parse(stored);
        }
      } catch (err) {
        console.warn('[Pi SDK] Error reading cached Pioneer user:', err);
      }
    }
  }

  public subscribeAuth(listener: AuthChangeListener): () => void {
    this.authListeners.push(listener);
    // Immediately notify current status
    listener(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter((l) => l !== listener);
    };
  }

  private notifyAuthChange() {
    this.authListeners.forEach((l) => l(this.currentUser));
  }

  public isSdkAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.Pi !== 'undefined';
  }

  public init(): boolean {
    if (this.initialized) return true;
    if (this.isSdkAvailable()) {
      try {
        window.Pi!.init({ version: '2.0', sandbox: true });
        this.initialized = true;
        console.log('[Pi SDK] Initialized successfully in Sandbox mode (Pi Testnet)');
        return true;
      } catch (err) {
        console.warn('[Pi SDK] Initialization error:', err);
      }
    }
    return false;
  }

  public async authenticate(onIncompletePaymentFound?: (payment: any) => void): Promise<PiUser> {
    if (!this.initialized) {
      this.init();
    }

    if (this.isSdkAvailable()) {
      try {
        console.log('[Pi SDK] Calling Pi.authenticate() with scopes: [payments, username, wallet_address]');
        let authResult: { accessToken: string; user: { uid: string; username: string; wallet_address?: string } };

        try {
          authResult = await window.Pi!.authenticate(
            ['payments', 'username', 'wallet_address'],
            (payment) => {
              console.log('[Pi SDK] Incomplete payment found:', payment);
              if (onIncompletePaymentFound) onIncompletePaymentFound(payment);
            }
          );
        } catch (firstErr: any) {
          // If wallet_address scope fails or is restricted in developer settings, retry with standard scopes
          console.warn('[Pi SDK] Extended scope authentication failed, retrying with standard [payments, username]:', firstErr);
          authResult = await window.Pi!.authenticate(
            ['payments', 'username'],
            (payment) => {
              if (onIncompletePaymentFound) onIncompletePaymentFound(payment);
            }
          );
        }

        const newUser: PiUser = {
          uid: authResult.user.uid,
          username: authResult.user.username,
          wallet_address: authResult.user.wallet_address || 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS',
          accessToken: authResult.accessToken,
          authSource: 'pi_browser_sdk'
        };

        this.currentUser = newUser;
        localStorage.setItem('ayubaikr_pi_user', JSON.stringify(newUser));

        // Sync with backend server
        api.signInPioneer(newUser).catch((e) => console.warn('[Pi SDK] Backend pioneer sync deferred:', e));

        this.notifyAuthChange();
        return newUser;
      } catch (err: any) {
        console.warn('[Pi SDK] Pi.authenticate() failed or Pioneer cancelled:', err);
        throw err;
      }
    } else {
      // In external browser without Pi Browser native bridge:
      if (this.currentUser) {
        return this.currentUser;
      }

      // Default sandbox pioneer
      const mockTestnetUser: PiUser = {
        uid: `testnet-uid-${Date.now().toString().slice(-4)}`,
        username: 'ayubaikr_tester',
        wallet_address: 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS',
        accessToken: 'pi_testnet_sandbox_token',
        authSource: 'testnet_sandbox'
      };

      this.currentUser = mockTestnetUser;
      localStorage.setItem('ayubaikr_pi_user', JSON.stringify(mockTestnetUser));
      api.signInPioneer(mockTestnetUser).catch((e) => console.warn('[Pi SDK] Backend sync note:', e));

      this.notifyAuthChange();
      return mockTestnetUser;
    }
  }

  public loginAsCustomPioneer(username: string, walletAddress?: string, uid?: string): PiUser {
    const cleanUsername = username.replace(/^@/, '').trim();
    const newUser: PiUser = {
      uid: uid || `pioneer-${Date.now().toString().slice(-6)}`,
      username: cleanUsername,
      wallet_address: walletAddress || 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS',
      accessToken: 'pi_custom_testnet_token',
      authSource: 'testnet_sandbox'
    };

    this.currentUser = newUser;
    localStorage.setItem('ayubaikr_pi_user', JSON.stringify(newUser));
    api.signInPioneer(newUser).catch((e) => console.warn('[Pi SDK] Backend sync note:', e));

    this.notifyAuthChange();
    return newUser;
  }

  public logout(): void {
    this.currentUser = null;
    try {
      localStorage.removeItem('ayubaikr_pi_user');
    } catch {}
    this.notifyAuthChange();
  }

  public getCurrentUser(): PiUser | null {
    return this.currentUser;
  }

  public createPayment(
    paymentData: { amount: number; memo: string; metadata: Record<string, any> },
    callbacks: {
      onReadyForServerApproval: (paymentId: string) => void;
      onReadyForServerCompletion: (paymentId: string, txid: string) => void;
      onCancel: (paymentId: string) => void;
      onError: (error: Error, payment?: any) => void;
    }
  ): void {
    if (!this.initialized) {
      this.init();
    }

    if (this.isSdkAvailable()) {
      console.log('[Pi SDK] Triggering Pi.createPayment:', paymentData);
      window.Pi!.createPayment(paymentData, callbacks);
    } else {
      console.warn('[Pi SDK] SDK not available in window.Pi. Simulating callbacks wrapper for testnet environment');
      callbacks.onError(new Error('Pi Network SDK is running in Desktop Preview Mode. Open this link inside the Pi Browser mobile app for native in-wallet signature!'));
    }
  }
}

export const piSdk = new PiSdkService();