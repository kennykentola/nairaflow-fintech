import mongoose from 'mongoose';

const { Schema } = mongoose;

// --- User Schema ---
const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true }, // In real app, store bcrypt hash
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  kycLevel: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  walletBalance: { type: Number, default: 0 },
  bvn: { type: String, maxlength: 11 },
  nin: { type: String, maxlength: 11 },
  avatar: { type: String },
  isBlocked: { type: Boolean, default: false },
  virtualAccountNumber: { type: String },
  virtualBankName: { type: String, default: 'Providus Bank' },
  pinHash: { type: String }, // Encrypted PIN
  twoFactorEnabled: { type: Boolean, default: false },
  biometricsEnabled: { type: Boolean, default: false },
  deviceFingerprint: { type: String }, // For security
  // Virtual Card
  cardPan: { type: String },
  cardCvv: { type: String },
  cardExpiry: { type: String }
}, { timestamps: true });

// --- Loan Schema ---
const loanSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String }, // Snapshot for easier queries
  amount: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // Percentage
  durationMonths: { type: Number, required: true },
  monthlyRepayment: { type: Number, required: true },
  totalRepayment: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'PAID', 'FLAGGED'], 
    default: 'PENDING' 
  },
  requestDate: { type: Date, default: Date.now },
  purpose: { type: String, required: true },
  aiScore: { type: Number },
  aiReasoning: { type: String },
}, { timestamps: true });

// --- Transaction Schema ---
const transactionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['DEPOSIT', 'WITHDRAWAL', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'TRANSFER', 'BILL_PAYMENT'], 
    required: true 
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ['SUCCESS', 'FAILED', 'PENDING'], default: 'PENDING' },
  reference: { type: String, required: true, unique: true },
  description: { type: String },
  beneficiary: {
    bank: String,
    accountNumber: String,
    name: String
  },
  metadata: { type: Map, of: String } // Flexible field for bill details etc.
}, { timestamps: true });

// --- Notification Schema ---
const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['INFO', 'ALERT', 'SUCCESS', 'WARNING'], default: 'INFO' },
  date: { type: Date, default: Date.now }
});

// --- Support Message Schema ---
const supportMessageSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  sender: { type: String, enum: ['USER', 'AGENT'], required: true },
  timestamp: { type: Date, default: Date.now }
});

// --- Fraud Log Schema ---
const fraudLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: String, required: true },
  severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  details: { type: String },
  status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' },
  timestamp: { type: Date, default: Date.now }
});

// --- Exports ---
export const User = mongoose.model('User', userSchema);
export const Loan = mongoose.model('Loan', loanSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const Notification = mongoose.model('Notification', notificationSchema);
export const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);
export const FraudLog = mongoose.model('FraudLog', fraudLogSchema);