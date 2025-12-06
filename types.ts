export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  PAID = 'PAID',
  FLAGGED = 'FLAGGED' // Fraud check
}

export enum KYCLevel {
  TIER_0 = 0, // Email only
  TIER_1 = 1, // BVN Verified
  TIER_2 = 2, // ID + Selfie
  TIER_3 = 3  // Full Verified
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  kycLevel: KYCLevel;
  walletBalance: number;
  bvn?: string;
  nin?: string;
  avatar?: string;
  isBlocked?: boolean;
  virtualAccountNumber?: string;
  virtualBankName?: string;
  pin?: string; // Simulated PIN for validation
  twoFactorEnabled?: boolean;
  biometricsEnabled?: boolean;
  // Virtual Card Details
  cardPan?: string;
  cardCvv?: string;
  cardExpiry?: string;
}

export interface Loan {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  interestRate: number; // Percentage
  durationMonths: number;
  monthlyRepayment: number;
  totalRepayment: number;
  amountPaid: number; // Amount repaid so far
  status: LoanStatus;
  requestDate: string;
  aiScore?: number;
  aiReasoning?: string;
  purpose: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT' | 'TRANSFER' | 'BILL_PAYMENT';
  amount: number;
  date: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  reference: string;
  description: string;
}

export interface CreditScoreResponse {
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  maxLoanAmount: number;
  reasoning: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'INFO' | 'ALERT' | 'SUCCESS' | 'WARNING';
}

export interface SupportMessage {
  id: string;
  userId: string;
  text: string;
  sender: 'USER' | 'AGENT';
  timestamp: string;
}

export interface FraudLog {
  id: string;
  userId: string;
  activity: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  details: string;
  status: 'OPEN' | 'RESOLVED';
}