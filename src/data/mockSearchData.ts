/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SearchItem {
  id: string;
  type: 'product' | 'patient' | 'transaction';
  title: string;
  subtitle: string;
  metadata?: any;
}

export const mockSearchData: SearchItem[] = [
  // Products
  { id: 'p1', type: 'product', title: 'Lumi-Serum V1', subtitle: 'Category: Skincare • In Stock: 42' },
  { id: 'p2', type: 'product', title: 'Opus-Pain Relief', subtitle: 'Category: Medicine • In Stock: 128' },
  { id: 'p3', type: 'product', title: 'Aria Multi-Vitamin', subtitle: 'Category: Wellness • In Stock: 15' },
  { id: 'p4', type: 'product', title: 'Glow-Hydrate 500ml', subtitle: 'Category: Personal Care • In Stock: 56' },
  { id: 'p5', type: 'product', title: 'Amoxicillin 500mg', subtitle: 'Category: Antibiotics • In Stock: 200' },
  
  // Patients
  { id: 'u1', type: 'patient', title: 'Arthur Penhaligon', subtitle: 'ID: #PAT-7721 • Last Visit: 2 days ago' },
  { id: 'u2', type: 'patient', title: 'Diana Cavendish', subtitle: 'ID: #PAT-8812 • Last Visit: 1 week ago' },
  { id: 'u3', type: 'patient', title: 'Sebastian Vane', subtitle: 'ID: #PAT-3345 • Last Visit: Today' },
  { id: 'u4', type: 'patient', title: 'Beatrix Thorne', subtitle: 'ID: #PAT-1190 • Last Visit: 1 month ago' },
  
  // Transactions
  { id: 't1', type: 'transaction', title: 'TX-99021-X', subtitle: 'Amount: $1,250.00 • Status: Completed' },
  { id: 't2', type: 'transaction', title: 'TX-88211-P', subtitle: 'Amount: $45.99 • Status: Pending' },
  { id: 't3', type: 'transaction', title: 'TX-77112-R', subtitle: 'Amount: $230.50 • Status: Refunded' },
  { id: 't4', type: 'transaction', title: 'TX-55432-A', subtitle: 'Amount: $3,420.00 • Status: Flagged' },
];
