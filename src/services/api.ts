
import { Product, Vendor, Order, PiBackendConfig, PiPaymentVerificationRecord } from '../types';

export const api = {
  // Pi Configuration
  async getPiConfig(): Promise<PiBackendConfig> {
    const res = await fetch('/api/pi/config');
    if (!res.ok) throw new Error('Failed to fetch Pi config');
    return res.json();
  },

  async setPiKey(apiKey: string, appId?: string, outgoingWalletConfigured?: boolean): Promise<{ success: boolean; message: string; hasApiKey: boolean }> {
    const res = await fetch('/api/pi/config/set-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, appId, outgoingWalletConfigured })
    });
    if (!res.ok) throw new Error('Failed to update backend Pi config');
    return res.json();
  },

  // Products
  async getProducts(params?: { category?: string; search?: string; vendorId?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.vendorId) query.set('vendorId', params.vendorId);
    const res = await fetch(`/api/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  async createProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) {
      const text = await res.text();
      let errMsg = 'Failed to create product';
      try {
        const parsed = JSON.parse(text);
        if (parsed.error) errMsg = parsed.error;
      } catch {
        if (text) errMsg = text;
      }
      throw new Error(errMsg);
    }
    return res.json();
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },

  // Vendors
  async getVendors(): Promise<Vendor[]> {
    const res = await fetch('/api/vendors');
    if (!res.ok) throw new Error('Failed to fetch vendors');
    return res.json();
  },

  async createVendor(vendor: Partial<Vendor>): Promise<Vendor> {
    const res = await fetch('/api/vendors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendor)
    });
    if (!res.ok) throw new Error('Failed to create vendor');
    return res.json();
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  async createOrder(order: Partial<Order>): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },

  // Pi Payment Verification Flows
  async createA2UPayment(params: { amount: number; recipientWallet: string; pioneerUid?: string }): Promise<any> {
    const res = await fetch('/api/pi/a2u/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  async approveU2APayment(params: { paymentId: string; orderId?: string }): Promise<any> {
    const res = await fetch('/api/pi/u2a/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  async completeU2APayment(params: { paymentId: string; txid: string; orderId?: string }): Promise<any> {
    const res = await fetch('/api/pi/u2a/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  },

  async getPiDiagnostics(): Promise<any> {
    const res = await fetch('/api/pi/diagnostics');
    if (!res.ok) throw new Error('Failed to fetch diagnostics');
    return res.json();
  },

  async getHorizonAccount(wallet: string): Promise<any> {
    const res = await fetch(`/api/pi/horizon/account/${encodeURIComponent(wallet)}`);
    if (!res.ok) throw new Error('Failed to fetch Horizon account');
    return res.json();
  },

  async getHorizonTx(txid: string): Promise<any> {
    const res = await fetch(`/api/pi/horizon/tx/${encodeURIComponent(txid)}`);
    return res.json();
  },

  async signInPioneer(pioneerData: { uid?: string; username: string; wallet_address?: string; accessToken?: string }): Promise<any> {
    const res = await fetch('/api/pi/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pioneerData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to authenticate Pioneer');
    }
    return res.json();
  },

  async getPioneers(): Promise<any[]> {
    const res = await fetch('/api/pi/pioneers');
    if (!res.ok) return [];
    return res.json();
  }
};