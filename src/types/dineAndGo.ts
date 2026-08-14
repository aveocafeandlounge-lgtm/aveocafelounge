// Payment record type
export type PaymentRecord = {
  id?: string;
  date: string; // ISO date string
  amount: number;
  paymentType: 'full' | 'partial'; // Whether customer paid full outstanding or partial
  notes?: string;
};

// Charge record type (for tracking when charges are added)
export type ChargeRecord = {
  id?: string;
  date: string; // ISO date string
  amount: number;
  notes?: string;
  source?: string; // e.g., 'POS Order', 'Manual', 'Bill Conversion'
};

// Dine-and-Go customer record type
export type DineAndGoCustomer = {
  id?: string; // Firestore doc ID or local ID
  name?: string;
  table?: string;
  company?: string;
  runningTotal?: number;
  lastPaymentDate?: string; // ISO date string
  payments?: PaymentRecord[]; // Payment history
  charges?: ChargeRecord[]; // Charge history
  createdAt?: string; // When customer record was created
};