import { User, Loan, Transaction, UserRole, LoanStatus, KYCLevel, Notification, SupportMessage, FraudLog } from '../types';

// --- In-Memory Database Simulation ---

const today = new Date();
const threeDaysLater = new Date(today);
threeDaysLater.setDate(today.getDate() + 3);

// Dynamic date for mock loan to always trigger reminder
const mockRequestDate = new Date(threeDaysLater);
mockRequestDate.setMonth(mockRequestDate.getMonth() - 1); // Started 1 month ago

let users: User[] = [
  {
    id: 'u1',
    name: 'Tunde Bakare',
    email: 'user@nairaflow.ng',
    phone: '08012345678',
    role: UserRole.USER,
    kycLevel: KYCLevel.TIER_1,
    walletBalance: 25000,
    bvn: '22334455667',
    avatar: 'https://ui-avatars.com/api/?name=Tunde+Bakare&background=059669&color=fff',
    virtualAccountNumber: '8012345678',
    virtualBankName: 'Providus Bank',
    pin: '1234',
    twoFactorEnabled: false,
    biometricsEnabled: false,
    cardPan: '5399 4123 5678 9010',
    cardCvv: '456',
    cardExpiry: '12/26'
  },
  {
    id: 'admin1',
    name: 'Admin User',
    email: 'admin@nairaflow.ng',
    phone: '09098765432',
    role: UserRole.ADMIN,
    kycLevel: KYCLevel.TIER_3,
    walletBalance: 0,
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=022c22&color=fff',
    virtualAccountNumber: '9098765432',
    virtualBankName: 'Providus Bank',
    pin: '0000',
    twoFactorEnabled: true,
    biometricsEnabled: true,
    cardPan: '4000 1234 5678 9010',
    cardCvv: '123',
    cardExpiry: '09/28'
  }
];

let loans: Loan[] = [
  {
    id: 'l1',
    userId: 'u1',
    userName: 'Tunde Bakare',
    amount: 50000,
    interestRate: 12.5,
    durationMonths: 3,
    monthlyRepayment: 18750,
    totalRepayment: 56250,
    amountPaid: 56250,
    status: LoanStatus.PAID,
    requestDate: '2023-11-15T10:00:00Z',
    purpose: 'Business Expansion',
    aiScore: 720,
    aiReasoning: 'Consistent repayment history observed.'
  },
  {
    id: 'l2',
    userId: 'u1',
    userName: 'Tunde Bakare',
    amount: 100000,
    interestRate: 5,
    durationMonths: 6,
    monthlyRepayment: 17500,
    totalRepayment: 105000,
    amountPaid: 0,
    status: LoanStatus.ACTIVE,
    requestDate: mockRequestDate.toISOString(),
    purpose: 'Rent Payment',
    aiScore: 680,
    aiReasoning: 'Good income to debt ratio.'
  }
];

let transactions: Transaction[] = [
  {
    id: 't1',
    userId: 'u1',
    type: 'DEPOSIT',
    amount: 50000,
    date: '2023-11-14T09:30:00Z',
    status: 'SUCCESS',
    reference: 'REF-112233',
    description: 'Wallet Funding via Paystack'
  },
  {
    id: 't2',
    userId: 'u1',
    type: 'LOAN_DISBURSEMENT',
    amount: 50000,
    date: '2023-11-15T10:05:00Z',
    status: 'SUCCESS',
    reference: 'LOAN-L1-DISB',
    description: 'Loan Disbursement: L1'
  },
  {
    id: 't3',
    userId: 'u1',
    type: 'LOAN_REPAYMENT',
    amount: 56250,
    date: '2024-02-14T14:15:00Z',
    status: 'SUCCESS',
    reference: 'REF-998877',
    description: 'Loan Repayment - Full'
  },
  {
    id: 't4',
    userId: 'u1',
    type: 'TRANSFER',
    amount: 5000,
    date: '2024-02-20T11:00:00Z',
    status: 'SUCCESS',
    reference: 'TRF-00123',
    description: 'Transfer to Emeka Johnson'
  },
  {
    id: 't5',
    userId: 'u1',
    type: 'BILL_PAYMENT',
    amount: 15000,
    date: '2024-02-25T10:00:00Z',
    status: 'SUCCESS',
    reference: 'BILL-DSTV-123',
    description: 'DSTV Premium Subscription'
  }
];

let notifications: Notification[] = [
  {
    id: 'n1',
    userId: 'u1',
    title: 'Loan Paid',
    message: 'Your loan of ₦50,000 has been fully repaid. Your credit score has increased!',
    date: '2024-02-14T14:16:00Z',
    read: true,
    type: 'SUCCESS'
  }
];

let supportMessages: SupportMessage[] = [
  {
    id: 'm1',
    userId: 'u1',
    text: 'Welcome to NairaFlow Support. How can we help you today?',
    sender: 'AGENT',
    timestamp: new Date().toISOString()
  }
];

let fraudLogs: FraudLog[] = [];

// --- Helper Functions ---

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const createNotification = (userId: string, title: string, message: string, type: Notification['type']) => {
  notifications.unshift({
    id: `n${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    title,
    message,
    date: new Date().toISOString(),
    read: false,
    type
  });
};

const getKycLimit = (level: KYCLevel) => {
    switch (level) {
      case KYCLevel.TIER_0: return 0;
      case KYCLevel.TIER_1: return 50000;
      case KYCLevel.TIER_2: return 200000;
      case KYCLevel.TIER_3: return 5000000;
      default: return 0;
    }
};

const generateCardDetails = () => {
    const pan = `5399 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
    const cvv = Math.floor(100 + Math.random() * 899).toString();
    const month = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');
    const year = (new Date().getFullYear() + 3).toString().slice(-2);
    return { pan, cvv, expiry: `${month}/${year}` };
};

// --- API Methods ---

export const MockAPI = {
  // Auth
  login: async (email: string): Promise<User> => {
    await delay(800);
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('User not found');
    if (user.isBlocked) throw new Error('Account blocked due to suspicious activity.');
    
    // Trigger scheduled checks on login
    await MockAPI.triggerLoanReminders();
    
    return user;
  },

  register: async (name: string, email: string, phone: string): Promise<User> => {
    await delay(1000);
    if (users.find(u => u.email === email)) throw new Error('Email already exists');
    
    // Generate virtual account from phone
    const virtualAccountNumber = phone.length > 10 ? phone.substring(phone.length - 10) : '9' + phone;
    const card = generateCardDetails();

    const newUser: User = {
      id: `u${users.length + 1}`,
      name,
      email,
      phone,
      role: UserRole.USER,
      kycLevel: KYCLevel.TIER_0,
      walletBalance: 0,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      virtualAccountNumber,
      virtualBankName: 'Providus Bank',
      pin: '1234', // Default PIN for new users
      twoFactorEnabled: false,
      biometricsEnabled: false,
      cardPan: card.pan,
      cardCvv: card.cvv,
      cardExpiry: card.expiry
    };
    users.push(newUser);
    createNotification(newUser.id, 'Welcome to NairaFlow!', 'Complete your KYC to unlock higher loan limits.', 'INFO');
    return newUser;
  },

  // Wallet
  getWalletBalance: async (userId: string) => {
    await delay(300);
    const user = users.find(u => u.id === userId);
    return user ? user.walletBalance : 0;
  },

  fundWallet: async (userId: string, amount: number, method: string = 'Card') => {
    // Simulate delay
    // Note: Delay is handled in UI for visual effect, but we simulate processing here too
    await delay(500); 
    const user = users.find(u => u.id === userId);
    if (user) {
      user.walletBalance += amount;
      transactions.unshift({
        id: `t${Date.now()}`,
        userId,
        type: 'DEPOSIT',
        amount,
        date: new Date().toISOString(),
        status: 'SUCCESS',
        reference: `PAY-${Date.now()}`,
        description: `Wallet Funding via ${method}`
      });
      createNotification(userId, 'Wallet Funded', `Your wallet has been credited with ₦${amount.toLocaleString()} via ${method}.`, 'SUCCESS');
    }
    return user?.walletBalance;
  },

  payBill: async (userId: string, amount: number, category: string, provider: string, recipient: string) => {
      await delay(2000);
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      if (user.walletBalance < amount) throw new Error("Insufficient funds");

      user.walletBalance -= amount;
      transactions.unshift({
        id: `t${Date.now()}`,
        userId,
        type: 'BILL_PAYMENT',
        amount,
        date: new Date().toISOString(),
        status: 'SUCCESS',
        reference: `BILL-${Date.now()}`,
        description: `${provider} ${category} - ${recipient}`
      });
      
      return user.walletBalance;
  },

  transferFunds: async (userId: string, amount: number, recipient: string) => {
    await delay(1500);
    const user = users.find(u => u.id === userId);
    if (!user || user.walletBalance < amount) throw new Error("Insufficient funds");

    user.walletBalance -= amount;
    transactions.unshift({
      id: `t${Date.now()}`,
      userId,
      type: 'TRANSFER',
      amount,
      date: new Date().toISOString(),
      status: 'SUCCESS',
      reference: `TRF-${Date.now()}`,
      description: `Transfer to ${recipient}`
    });
    return user.walletBalance;
  },

  withdrawFunds: async (userId: string, amount: number, bankName: string, accountNumber: string, narration: string) => {
    await delay(2000);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error("User not found");
    if (user.walletBalance < amount) throw new Error("Insufficient wallet balance");

    user.walletBalance -= amount;
    transactions.unshift({
        id: `t${Date.now()}`,
        userId,
        type: 'WITHDRAWAL',
        amount,
        date: new Date().toISOString(),
        status: 'SUCCESS',
        reference: `WTH-${Date.now().toString().slice(-6)}`,
        description: `Transfer to ${bankName} - ${accountNumber} ${narration ? `(${narration})` : ''}`
    });

    createNotification(userId, 'Debit Alert', `Debit of ₦${amount.toLocaleString()} for transfer to ${bankName} successful.`, 'INFO');
    
    return user.walletBalance;
  },

  // Loans with Fraud Check
  applyForLoan: async (loanData: Omit<Loan, 'id' | 'status' | 'requestDate' | 'userName' | 'amountPaid'>) => {
    await delay(2000); 
    const user = users.find(u => u.id === loanData.userId);
    
    if (!user) throw new Error("User not found");

    // KYC Limit Check
    const limit = getKycLimit(user.kycLevel);
    if (loanData.amount > limit) {
        throw new Error(`Loan amount exceeds your KYC Tier ${user.kycLevel} limit of ₦${limit.toLocaleString()}. Please upgrade.`);
    }

    // Simple Fraud Check Rule
    let status: LoanStatus = LoanStatus.PENDING;
    if (loanData.amount > 1000000 && user?.kycLevel! < 3) {
      status = LoanStatus.FLAGGED;
      fraudLogs.unshift({
        id: `f${Date.now()}`,
        userId: user?.id!,
        activity: 'High Value Loan Request',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        details: `User requested ₦${loanData.amount} with low KYC Tier.`,
        status: 'OPEN'
      });
    }

    const newLoan: Loan = {
      ...loanData,
      id: `l${Date.now()}`,
      userName: user?.name || 'Unknown',
      status: status,
      amountPaid: 0,
      requestDate: new Date().toISOString()
    };
    loans.unshift(newLoan);
    return newLoan;
  },

  getUserLoans: async (userId: string) => {
    await delay(500);
    return loans.filter(l => l.userId === userId);
  },

  getAllLoans: async () => {
    await delay(600);
    return loans;
  },

  updateLoanStatus: async (loanId: string, status: LoanStatus) => {
    await delay(800);
    const loan = loans.find(l => l.id === loanId);
    if (loan) {
      loan.status = status;
      // If approved, credit wallet
      if (status === LoanStatus.ACTIVE) {
        const user = users.find(u => u.id === loan.userId);
        if (user) {
          user.walletBalance += loan.amount;
          transactions.unshift({
            id: `t${Date.now()}`,
            userId: user.id,
            type: 'LOAN_DISBURSEMENT',
            amount: loan.amount,
            date: new Date().toISOString(),
            status: 'SUCCESS',
            reference: `LOAN-${loan.id}`,
            description: `Loan Disbursement: ${loan.id}`
          });
          createNotification(user.id, 'Loan Approved', `Your loan of ₦${loan.amount} has been disbursed to your wallet.`, 'SUCCESS');
        }
      } else if (status === LoanStatus.REJECTED) {
         createNotification(loan.userId, 'Loan Rejected', `Your loan request for ₦${loan.amount} was rejected.`, 'ALERT');
      }
    }
    return loan;
  },

  repayLoan: async (userId: string, loanId: string, amount: number) => {
    await delay(1500);
    const user = users.find(u => u.id === userId);
    const loan = loans.find(l => l.id === loanId);

    if (!user || !loan) throw new Error("Loan or User not found");
    if (loan.status !== LoanStatus.ACTIVE) throw new Error("Loan is not active");
    
    // Check balance
    if (user.walletBalance < amount) throw new Error("Insufficient wallet balance");

    // Deduct
    user.walletBalance -= amount;
    
    // Update Loan
    loan.amountPaid = (loan.amountPaid || 0) + amount;
    
    // Check completion (allowing small float margin)
    const remaining = loan.totalRepayment - loan.amountPaid;
    let isPaid = false;
    if (remaining <= 50) { 
        loan.status = LoanStatus.PAID;
        loan.amountPaid = loan.totalRepayment;
        isPaid = true;
    }

    // Transaction
    transactions.unshift({
        id: `t${Date.now()}`,
        userId,
        type: 'LOAN_REPAYMENT',
        amount,
        date: new Date().toISOString(),
        status: 'SUCCESS',
        reference: `REPAY-${loan.id}-${Date.now().toString().slice(-4)}`,
        description: `Loan Repayment (${loan.purpose})`
    });

    if (isPaid) {
         createNotification(userId, 'Loan Fully Repaid', `Congratulations! Your loan of ₦${loan.amount.toLocaleString()} has been fully repaid.`, 'SUCCESS');
    } else {
         createNotification(userId, 'Loan Repayment Received', `We received your repayment of ₦${amount.toLocaleString()}. Outstanding: ₦${(loan.totalRepayment - loan.amountPaid).toLocaleString()}`, 'INFO');
    }

    return { loan, walletBalance: user.walletBalance };
  },

  // Transactions
  getTransactions: async (userId: string) => {
    await delay(400);
    return transactions.filter(t => t.userId === userId);
  },

  // KYC
  updateKYC: async (userId: string, data: Partial<User>) => {
    await delay(1200);
    const user = users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, data);
      if (data.bvn && user.kycLevel < KYCLevel.TIER_1) user.kycLevel = KYCLevel.TIER_1;
      if (data.nin && user.kycLevel < KYCLevel.TIER_2) user.kycLevel = KYCLevel.TIER_2;
    }
    return user;
  },

  // Profile & Settings
  updateAvatar: async (userId: string, base64Image: string) => {
      await delay(1000);
      const user = users.find(u => u.id === userId);
      if (user) {
          user.avatar = base64Image;
      }
      return user;
  },

  changePin: async (userId: string, oldPin: string, newPin: string) => {
      await delay(1000);
      const user = users.find(u => u.id === userId);
      if (!user) throw new Error("User not found");
      if (user.pin !== oldPin) throw new Error("Current PIN is incorrect");
      
      user.pin = newPin;
      createNotification(userId, 'Security Alert', 'Your transaction PIN was changed successfully.', 'SUCCESS');
      return user;
  },

  updateSettings: async (userId: string, settings: { twoFactorEnabled?: boolean, biometricsEnabled?: boolean }) => {
      await delay(500);
      const user = users.find(u => u.id === userId);
      if (user) {
          if (settings.twoFactorEnabled !== undefined) user.twoFactorEnabled = settings.twoFactorEnabled;
          if (settings.biometricsEnabled !== undefined) user.biometricsEnabled = settings.biometricsEnabled;
      }
      return user;
  },

  // Notifications
  getNotifications: async (userId: string) => {
    await delay(300);
    return notifications.filter(n => n.userId === userId);
  },
  
  getUnreadNotificationCount: async (userId: string) => {
      // No delay for badge to feel snappy
      return notifications.filter(n => n.userId === userId && !n.read).length;
  },

  markNotificationRead: async (notifId: string) => {
    const n = notifications.find(n => n.id === notifId);
    if (n) n.read = true;
  },

  // System - Scheduled Jobs Simulation
  triggerLoanReminders: async () => {
    const now = new Date();
    
    loans.forEach(loan => {
      if (loan.status === LoanStatus.ACTIVE) {
        const reqDate = new Date(loan.requestDate);
        const dayOfMonth = reqDate.getDate();
        
        // Construct next payment date in current month
        let nextDueDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
        
        // If that date has passed in the current month, the due date is next month
        if (nextDueDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        }

        // Calculate difference in days
        const diffTime = nextDueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Trigger if due in 3 days or less (and not in the past)
        if (diffDays <= 3 && diffDays >= 0) {
            const title = 'Upcoming Loan Repayment';
            // Prevent duplicate unread notifications for the same event
            const alreadyNotified = notifications.some(n => 
                n.userId === loan.userId && 
                n.title === title && 
                !n.read &&
                new Date(n.date).toDateString() === now.toDateString() // Only one per day
            );

            if (!alreadyNotified) {
                createNotification(
                    loan.userId,
                    title,
                    `Reminder: Your loan repayment of ₦${loan.monthlyRepayment.toLocaleString()} is due in ${diffDays === 0 ? 'today' : diffDays + ' days'} (${nextDueDate.toLocaleDateString()}). Please ensure your wallet is funded.`,
                    'WARNING'
                );
            }
        }
      }
    });
  },

  // Support
  getSupportMessages: async (userId: string) => {
    await delay(300);
    return supportMessages.filter(m => m.userId === userId);
  },

  sendSupportMessage: async (userId: string, text: string) => {
    await delay(500);
    const msg: SupportMessage = {
      id: `m${Date.now()}`,
      userId,
      text,
      sender: 'USER',
      timestamp: new Date().toISOString()
    };
    supportMessages.push(msg);

    // Auto-reply bot
    setTimeout(() => {
      supportMessages.push({
        id: `m${Date.now() + 1}`,
        userId,
        text: "Thank you for contacting NairaFlow support. An agent will review your query shortly.",
        sender: 'AGENT',
        timestamp: new Date().toISOString()
      });
    }, 2000);

    return msg;
  },

  // Admin Fraud
  getFraudLogs: async () => {
    await delay(500);
    return fraudLogs;
  },

  getAllUsers: async () => {
      await delay(500);
      return users;
  }
};