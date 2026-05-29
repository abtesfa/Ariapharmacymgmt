/**
 * Aria ERP - MySQL API Client
 */

const API_BASE = '/api';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('aria_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('aria_token');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    const errorMessage = error.details ? `${error.error}: ${error.details}` : (error.error || `HTTP error! status: ${response.status}`);
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (credentials: any) => request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
    register: (data: any) => request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    me: () => request('/auth/me'),
    myTransactions: () => request('/me/transactions'),
  },
  inventory: {
    list: () => request('/inventory'),
    create: (data: any) => request('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    categories: () => request('/categories'),
    createCategory: (data: any) => request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    batches: () => request('/batches'),
    createBatch: (data: any) => request('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    suppliers: () => request('/suppliers'),
    createSupplier: (data: any) => request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    orders: () => request('/purchase-orders'),
    createOrder: (data: any) => request('/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateOrderStatus: (id: string, data: any) => request(`/purchase-orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    adjustStock: (data: any) => request('/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    listAdjustments: () => request('/inventory/adjustments'),
    priceHistory: (id: string) => request(`/inventory/${id}/price-history`),
    update: (id: string, data: any) => request(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  },
  employees: {
    list: () => request('/employees'),
    roles: () => request('/employees/roles'),
    create: (data: any) => request('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStatus: (id: string, active: boolean) => request(`/employees/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: active }),
    }),
    updateRole: (id: string, roleId: string) => request(`/employees/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role_id: roleId }),
    }),
    createRole: (data: any) => request('/employees/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  settings: {
    getPharmacy: () => request('/settings/pharmacy'),
    updatePharmacy: (data: any) => request('/settings/pharmacy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateDatabase: (data: any) => request('/settings/database', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  audit: {
    list: () => request('/audit-logs'),
  },
  dashboard: {
    stats: () => request('/dashboard/stats'),
    revenue: () => request('/analytics/revenue'),
    topSelling: () => request('/analytics/top-selling'),
    profitByDrug: () => request('/analytics/profit-by-drug'),
    insuranceReceivables: () => request('/analytics/insurance-receivables'),
    expiryAlerts: () => request('/analytics/expiry-alerts'),
  },
  patients: {
    list: () => request('/patients'),
    get: (id: string) => request(`/patients/${id}`),
    update: (id: string, data: any) => request(`/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    prescriptions: (id: string) => request(`/patients/${id}/prescriptions`),
    create: (data: any) => request('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  clinical: {
    prescribers: () => request('/prescribers'),
    createPrescriber: (data: any) => request('/prescribers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    prescriptions: () => request('/prescriptions'),
    createPrescription: (data: any) => request('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
  transactions: {
    list: () => request('/transactions'),
    create: (data: any) => request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    returns: {
      list: () => request('/sales-returns'),
      create: (data: any) => request('/sales-returns', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    },
    paymentMethods: () => request('/payment-methods'),
  },
  insurance: {
    listClaims: () => request('/insurance/claims'),
  },
};
