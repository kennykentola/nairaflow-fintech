import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockAPI } from '../services/mockBackend';
import { Transaction, Loan, LoanStatus } from '../types';
import { formatCurrency } from '../constants';
import { CreditCard, Plus, Send, History, Loader2, AlertTriangle, Filter, Calendar, TrendingUp, ChevronRight, CheckCircle, Copy, Building, Zap, ArrowRight, User, ShieldCheck, ScanFace, Fingerprint, Lock, Delete, Search, X, ToggleLeft, ToggleRight, XCircle, Eye, EyeOff, Wifi } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Wallet = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  
  // Settings
  const [useBiometrics, setUseBiometrics] = useState(false);
  const [showCardDetails, setShowCardDetails] = useState(false);

  // Funding Modal States
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundAmount, setFundAmount] = useState('');
  const [fundMethod, setFundMethod] = useState<'CARD' | 'TRANSFER' | 'USSD'>('CARD');
  const [fundStatus, setFundStatus] = useState<'IDLE' | 'VERIFYING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [fundError, setFundError] = useState('');
  
  // Withdrawal/Transfer Modal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawStep, setWithdrawStep] = useState<'FORM' | 'CONFIRM' | 'VERIFY'>('FORM');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [destBank, setDestBank] = useState('');
  const [destAccount, setDestAccount] = useState('');
  const [destName, setDestName] = useState('');
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [narration, setNarration] = useState('');
  
  // Security / Verification States
  const [verificationMethod, setVerificationMethod] = useState<'PIN' | 'FACE' | 'FINGERPRINT'>('PIN');
  const [pin, setPin] = useState('');
  
  // Face ID Logic
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanStatus, setScanStatus] = useState<'INIT' | 'SCANNING' | 'VERIFIED' | 'FAILED'>('INIT');
  
  const [processing, setProcessing] = useState(false);
  
  // Filter States
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (user) {
      MockAPI.getTransactions(user.id).then(setTransactions);
      MockAPI.getUserLoans(user.id).then(loans => {
        const active = loans.find(l => l.status === LoanStatus.ACTIVE);
        setActiveLoan(active || null);
      });
    }
  }, [user, processing]); // Reload on processing change

  // --- Biometric Logic ---
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (withdrawStep === 'VERIFY' && verificationMethod === 'FACE') {
      const startCamera = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setScanStatus('SCANNING');
          
          // Simulate Scanning process
          setTimeout(() => {
            setScanStatus('VERIFIED');
            setTimeout(() => {
                processTransfer();
            }, 1000);
          }, 3000);

        } catch (err) {
          console.error("Camera error:", err);
          alert("Camera access failed. Switching to PIN.");
          setVerificationMethod('PIN');
        }
      };
      startCamera();
    } else if (withdrawStep === 'VERIFY' && verificationMethod === 'FINGERPRINT') {
        setScanStatus('INIT');
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [withdrawStep, verificationMethod]);

  const handleFingerprintScan = () => {
      setScanStatus('SCANNING');
      setTimeout(() => {
          setScanStatus('VERIFIED');
          setTimeout(() => {
              processTransfer();
          }, 2000);
      }, 1500);
  };


  const handleFundWallet = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setProcessing(true);
    setFundStatus('VERIFYING');
    setFundError('');
    
    // Simulate Payment Verification Process
    const delayTime = fundMethod === 'TRANSFER' ? 4000 : 2000;
    
    try {
        await new Promise(resolve => setTimeout(resolve, delayTime));
        await MockAPI.fundWallet(user.id, Number(fundAmount), fundMethod === 'CARD' ? 'Card' : fundMethod === 'USSD' ? 'USSD' : 'Bank Transfer');
        
        const newBal = await MockAPI.getWalletBalance(user.id);
        refreshUser({ ...user, walletBalance: newBal });
        
        setFundStatus('SUCCESS');
    } catch (error: any) {
        setFundError(error.message || "Transaction failed");
        setFundStatus('FAILED');
    } finally {
        setProcessing(false);
    }
  };

  const closeFundModal = () => {
      if (processing) return;
      setShowFundModal(false);
      setFundStatus('IDLE');
      setFundAmount('');
      setFundMethod('CARD');
      setFundError('');
  };

  const handleAccountLookup = () => {
      if (destAccount.length >= 10 && destBank) {
          setIsResolvingAccount(true);
          // Mock resolution
          setTimeout(() => {
              const names = ["Emeka Adebayo", "Chioma Okonjo", "Tunde Williams", "Femi Otedola"];
              setDestName(names[Math.floor(Math.random() * names.length)]);
              setIsResolvingAccount(false);
          }, 1000);
      } else {
          setDestName('');
      }
  };

  useEffect(() => {
      handleAccountLookup();
  }, [destAccount, destBank]);

  const initiateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (Number(withdrawAmount) > user.walletBalance) {
        alert('Insufficient balance');
        return;
    }
    
    // Auto-select security method based on amount and settings
    if (Number(withdrawAmount) > 50000) {
        setVerificationMethod('FACE');
    } else if (useBiometrics) {
        setVerificationMethod('FINGERPRINT');
    } else {
        setVerificationMethod('PIN');
    }
    
    setWithdrawStep('CONFIRM');
  };

  const handleConfirmClick = () => {
      setWithdrawStep('VERIFY');
      setPin('');
      setScanStatus('INIT');
  };

  const handlePinInput = (num: string) => {
      if (pin.length < 4) {
          const newPin = pin + num;
          setPin(newPin);
          if (newPin.length === 4) {
              // Auto submit on 4 digits
              setTimeout(() => {
                 if (newPin === '1234') { // Mock PIN
                     processTransfer();
                 } else {
                     alert("Incorrect PIN (Default is 1234)");
                     setPin('');
                 }
              }, 300);
          }
      }
  };

  const processTransfer = async () => {
      if (!user) return;
      setProcessing(true);
      try {
          const newBal = await MockAPI.withdrawFunds(user.id, Number(withdrawAmount), destBank, destAccount, narration);
          refreshUser({ ...user, walletBalance: newBal });
          setShowWithdrawModal(false);
          setWithdrawStep('FORM');
          setWithdrawAmount('');
          setDestAccount('');
          setDestBank('');
          setDestName('');
          setNarration('');
          setScanStatus('INIT');
          setVerificationMethod('PIN');
          setPin('');
          alert("Transfer successful!");
      } catch (error: any) {
          alert(error.message);
          setWithdrawStep('FORM');
      } finally {
          setProcessing(false);
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const nextPayment = activeLoan ? Math.min(activeLoan.monthlyRepayment, activeLoan.totalRepayment - (activeLoan.amountPaid || 0)) : 0;
  // Calculate logic for insufficient balance
  const isInsufficient = activeLoan && user && user.walletBalance < nextPayment;

  // Calculate Next Due Date (Same day of the month as requestDate)
  const getNextDueDate = (dateStr: string) => {
      const start = new Date(dateStr);
      const now = new Date();
      let due = new Date(now.getFullYear(), now.getMonth(), start.getDate());
      
      if (due < new Date(now.setHours(0,0,0,0))) {
          due.setMonth(due.getMonth() + 1);
      }
      return due;
  };

  const getDaysUntilDue = (dueDate: Date) => {
      const now = new Date();
      now.setHours(0,0,0,0);
      const diffTime = dueDate.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nextDueDate = activeLoan ? getNextDueDate(activeLoan.requestDate) : new Date();
  const daysDue = activeLoan ? getDaysUntilDue(nextDueDate) : 0;

  const handleRepay = async () => {
    if (!user || !activeLoan) return;

    // Determine exact payment amount needed
    const remaining = activeLoan.totalRepayment - (activeLoan.amountPaid || 0);
    const paymentAmount = Math.min(activeLoan.monthlyRepayment, remaining);

    if (user.walletBalance < paymentAmount) {
      // Logic for pre-filling fund amount
      setFundAmount(paymentAmount.toString());
      setFundMethod('CARD');
      setShowFundModal(true);
      return;
    }

    if (confirm(`Confirm repayment of ${formatCurrency(paymentAmount)}?`)) {
      setProcessing(true);
      try {
        const { walletBalance, loan } = await MockAPI.repayLoan(user.id, activeLoan.id, paymentAmount);
        refreshUser({ ...user, walletBalance });
        setActiveLoan(loan);
        alert("Loan repayment successful!");
      } catch (error: any) {
        alert(error.message || "Repayment failed");
      } finally {
        setProcessing(false);
      }
    }
  };

  // Helper for quick date ranges
  const setDateRange = (months: number | 'ALL') => {
      if (months === 'ALL') {
          setStartDate('');
          setEndDate('');
          return;
      }
      const end = new Date();
      const start = new Date();
      if (months === 0.5) { // 2 weeks approx or last 30 days
        start.setDate(start.getDate() - 30);
      } else {
        start.setMonth(start.getMonth() - months);
      }
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
  };

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    // Type Filter
    let typeMatch = true;
    if (filter !== 'ALL') {
         if (filter === 'DEPOSIT') typeMatch = t.type === 'DEPOSIT';
         else if (filter === 'WITHDRAWAL') typeMatch = t.type === 'WITHDRAWAL' || t.type === 'TRANSFER';
         else if (filter === 'BILL_PAYMENT') typeMatch = t.type === 'BILL_PAYMENT';
         else if (filter === 'LOAN_REPAYMENT') typeMatch = t.type === 'LOAN_REPAYMENT';
         else if (filter === 'LOAN_DISBURSEMENT') typeMatch = t.type === 'LOAN_DISBURSEMENT';
    }

    // Date Filter
    let dateMatch = true;
    const txnDate = new Date(t.date);
    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (txnDate < start) dateMatch = false;
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23,59,59,999);
        if (txnDate > end) dateMatch = false;
    }

    // Search Filter
    let searchMatch = true;
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        searchMatch = t.description.toLowerCase().includes(query) || 
                      t.reference.toLowerCase().includes(query) || 
                      formatCurrency(t.amount).includes(query);
    }

    return typeMatch && dateMatch && searchMatch;
  });

  const getCount = (filterType: string) => {
    // Only counts based on type, ignores current date/search to show total availability per type
    if (filterType === 'ALL') return transactions.length;
    return transactions.filter(t => {
        if (filterType === 'DEPOSIT') return t.type === 'DEPOSIT';
        if (filterType === 'WITHDRAWAL') return t.type === 'WITHDRAWAL' || t.type === 'TRANSFER';
        if (filterType === 'BILL_PAYMENT') return t.type === 'BILL_PAYMENT';
        if (filterType === 'LOAN_REPAYMENT') return t.type === 'LOAN_REPAYMENT';
        if (filterType === 'LOAN_DISBURSEMENT') return t.type === 'LOAN_DISBURSEMENT';
        return false;
    }).length;
  };

  const filterOptions = [
    { id: 'ALL', label: 'All' },
    { id: 'DEPOSIT', label: 'Deposits' },
    { id: 'WITHDRAWAL', label: 'Withdrawals' },
    { id: 'LOAN_REPAYMENT', label: 'Loan Repayments' },
    { id: 'LOAN_DISBURSEMENT', label: 'Loan Disbursements' },
    { id: 'BILL_PAYMENT', label: 'Bills' },
  ];

  // Derived Virtual Account Details
  const virtualAccount = user?.virtualAccountNumber || user?.phone.substring(1) || '9900112233'; 
  const virtualBank = user?.virtualBankName || 'Providus Bank';
  const accountName = user?.name || 'NairaFlow User';

  const NIGERIAN_BANKS = ["GTBank", "Zenith Bank", "First Bank", "UBA", "Access Bank", "Kuda Bank", "OPay", "PalmPay"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Wallet</h2>
        <span className="text-sm text-gray-500">{new Date().toDateString()}</span>
      </div>

      {/* Insufficient Funds Warning Banner */}
      {isInsufficient && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-full text-red-600">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-red-800">Insufficient Balance for Loan Repayment</h4>
              <p className="text-sm text-red-600">
                Your upcoming loan installment is {formatCurrency(nextPayment)}. 
                Please fund your wallet to ensure timely repayment.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setFundAmount(nextPayment.toString());
              setFundMethod('CARD');
              setShowFundModal(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold whitespace-nowrap shadow-md transition-colors"
          >
            Fund Wallet
          </button>
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Wallet Balance Card */}
        <div className="bg-gradient-to-r from-secondary to-gray-800 text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <p className="text-gray-400 mb-1">Available Balance</p>
                    <h1 className="text-3xl font-bold">{formatCurrency(user?.walletBalance || 0)}</h1>
                </div>
                
                {/* Biometric Toggle */}
                <button 
                  onClick={() => setUseBiometrics(!useBiometrics)}
                  className="flex items-center gap-2 bg-black/20 hover:bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10 transition-colors"
                  title="Toggle Biometric Security"
                >
                   {useBiometrics ? <ToggleRight className="text-primary" /> : <ToggleLeft className="text-gray-400" />}
                   <span className="text-xs font-bold">{useBiometrics ? 'Biometrics On' : 'Biometrics Off'}</span>
                </button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
               <button 
                 onClick={() => { setFundMethod('CARD'); setFundAmount(''); setShowFundModal(true); }}
                 className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-emerald-600 px-3 py-3 rounded-xl transition-all font-bold text-sm"
               >
                 <Plus size={16} /> Add Money
               </button>
               <button 
                 onClick={() => { setShowWithdrawModal(true); setWithdrawAmount(''); setWithdrawStep('FORM'); setVerificationMethod(useBiometrics ? 'FINGERPRINT' : 'PIN'); }}
                 className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-3 rounded-xl transition-all font-medium text-sm"
               >
                 <Send size={16} /> Transfer
               </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-6 font-mono relative z-10">ACCT: {virtualAccount} | {virtualBank}</p>
        </div>

        {/* Virtual Card */}
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden border border-white/10 flex flex-col justify-between h-full min-h-[240px]">
           {/* Decoration */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
           
           <div className="relative z-10 flex justify-between items-start">
               <div>
                   <h3 className="font-bold italic text-lg tracking-wider">NairaFlow</h3>
                   <p className="text-[10px] text-gray-300 uppercase tracking-widest">Virtual Card</p>
               </div>
               <Wifi className="rotate-90 text-white/50" />
           </div>

           <div className="relative z-10 my-4 flex items-center gap-3">
               <div className="w-10 h-8 bg-yellow-400/80 rounded-md"></div>
               <span className="text-xs text-gray-400">Contactless</span>
           </div>

           <div className="relative z-10 space-y-4">
               <div className="flex items-center justify-between">
                   <p className="font-mono text-xl tracking-widest text-shadow">
                       {showCardDetails ? user?.cardPan || '5399 0000 0000 0000' : '•••• •••• •••• ' + (user?.cardPan?.slice(-4) || '0000')}
                   </p>
                   <button onClick={() => setShowCardDetails(!showCardDetails)} className="text-white/50 hover:text-white transition-colors">
                       {showCardDetails ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
               </div>
               
               <div className="flex justify-between items-end">
                   <div>
                       <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Card Holder</p>
                       <p className="font-bold text-sm tracking-wide truncate max-w-[120px]">{user?.name.toUpperCase()}</p>
                   </div>
                   <div className="flex gap-4">
                       <div>
                           <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">Expires</p>
                           <p className="font-mono text-sm">{user?.cardExpiry || '12/25'}</p>
                       </div>
                       <div>
                           <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-0.5">CVV</p>
                           <p className="font-mono text-sm">{showCardDetails ? user?.cardCvv || '123' : '•••'}</p>
                       </div>
                   </div>
               </div>
           </div>
        </div>

        {/* Active Loan Status Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
           <div>
              <div className="flex justify-between items-start mb-4">
                 <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary"/> Loan Status
                 </h3>
                 {activeLoan && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        daysDue < 0 ? 'bg-red-100 text-red-700' : 
                        daysDue <= 3 ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-green-100 text-green-700'
                    }`}>
                        {daysDue < 0 ? 'OVERDUE' : activeLoan.status}
                    </span>
                 )}
              </div>

              {activeLoan ? (
                <div className="space-y-4">
                   <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                       <div>
                          <p className="text-xs text-gray-400 mb-1">Next Installment</p>
                          <p className="text-2xl font-bold text-gray-800">{formatCurrency(nextPayment)}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">Total Due</p>
                          <p className="text-sm font-bold text-gray-500">{formatCurrency(activeLoan.totalRepayment - (activeLoan.amountPaid || 0))}</p>
                       </div>
                   </div>

                   {/* Prominent Smart Repay/Fund Button */}
                   <button 
                        onClick={() => {
                          if (isInsufficient) {
                            setFundAmount(nextPayment.toString());
                            setFundMethod('CARD');
                            setShowFundModal(true);
                          } else {
                            handleRepay();
                          }
                        }}
                        disabled={processing}
                        className={`w-full py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2 ${
                            isInsufficient 
                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                            : 'bg-primary hover:bg-emerald-700 text-white'
                        } disabled:opacity-50`}
                      >
                        {processing ? (
                            <Loader2 className="animate-spin w-5 h-5" />
                        ) : isInsufficient ? (
                            <>
                                <Plus size={20} /> Fund Wallet to Repay
                            </>
                        ) : (
                            <>
                                <CheckCircle size={20} /> Repay Loan Now
                            </>
                        )}
                    </button>
                   
                   <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                         <span>Progress</span>
                         <span>{Math.round(((activeLoan.amountPaid || 0) / activeLoan.totalRepayment) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                         <div 
                           className="bg-primary h-2 rounded-full transition-all duration-500" 
                           style={{ width: `${((activeLoan.amountPaid || 0) / activeLoan.totalRepayment) * 100}%` }}
                         ></div>
                      </div>
                   </div>

                   <div className={`flex items-center justify-between text-xs p-3 rounded-lg ${
                       daysDue <= 3 ? 'bg-yellow-50 text-yellow-800 border border-yellow-100' : 'bg-gray-50 text-gray-600'
                   }`}>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>Due: {nextDueDate.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <span className="font-bold">
                        {daysDue === 0 ? 'Today' : daysDue < 0 ? `${Math.abs(daysDue)} days ago` : `in ${daysDue} days`}
                      </span>
                   </div>

                   <Link to="/loans" className="flex items-center justify-center gap-1 w-full bg-gray-50 hover:bg-gray-100 text-primary py-2.5 rounded-lg text-sm font-bold transition-colors">
                      View Loan Details <ChevronRight size={16} />
                   </Link>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                   <div className="bg-gray-100 p-3 rounded-full"><TrendingUp size={24} /></div>
                   <p className="text-sm text-gray-500">No active loans</p>
                   <Link to="/loans" className="text-xs text-primary font-bold">Apply for a loan</Link>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-50 space-y-4">
           
           {/* Header & Search */}
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-2">
                <History className="text-gray-400" />
                <h3 className="font-bold text-gray-800">Transaction History</h3>
              </div>
              
              <div className="w-full md:w-auto flex flex-col md:flex-row gap-3">
                  {/* Search Bar */}
                  <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-full md:w-64"
                        placeholder="Search name, ref, amount..."
                      />
                  </div>
              </div>
           </div>

           {/* Date Filters */}
           <div className="flex flex-col md:flex-row items-center gap-3 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100">
               <span className="text-gray-500 font-bold text-xs uppercase">Filter Date:</span>
               
               {/* Quick Ranges */}
               <div className="flex items-center gap-2">
                   <button onClick={() => setDateRange(0.5)} className="px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors">30 Days</button>
                   <button onClick={() => setDateRange(3)} className="px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors">3 Months</button>
                   <button onClick={() => setDateRange(6)} className="px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors">6 Months</button>
                   <button onClick={() => setDateRange(12)} className="px-3 py-1 bg-white border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-100 transition-colors">1 Year</button>
               </div>

               <div className="h-4 w-px bg-gray-300 mx-1 hidden md:block"></div>

               {/* Custom Range */}
               <div className="flex items-center gap-2 w-full md:w-auto">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs outline-none"
                  />
                  <ArrowRight size={12} className="text-gray-400" />
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs outline-none"
                  />
               </div>

               {(startDate || endDate) && (
                  <button onClick={() => setDateRange('ALL')} className="text-red-500 hover:text-red-700">
                      <X size={16} />
                  </button>
               )}
           </div>
           
           {/* Category Filters */}
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {filterOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                    filter === opt.id 
                    ? 'bg-secondary text-white shadow-md' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                  <span className={`text-[10px] ml-1 px-1.5 py-0.5 rounded-full ${
                      filter === opt.id ? 'bg-white/20' : 'bg-gray-200 text-gray-600'
                  }`}>
                      {getCount(opt.id)}
                  </span>
                </button>
              ))}
           </div>
        </div>

        <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
          {filteredTransactions.length > 0 ? filteredTransactions.map(txn => (
            <div key={txn.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-100 text-lg`}>
                    {txn.type === 'DEPOSIT' && '📥'}
                    {txn.type === 'TRANSFER' && '📤'}
                    {txn.type === 'WITHDRAWAL' && '📤'}
                    {txn.type === 'BILL_PAYMENT' && '🧾'}
                    {txn.type === 'LOAN_DISBURSEMENT' && '💰'}
                    {txn.type === 'LOAN_REPAYMENT' && '💸'}
                 </div>
                 <div>
                    <p className="font-medium text-gray-800">{txn.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{new Date(txn.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{txn.reference}</span>
                      <span className={`px-1.5 py-0.5 rounded-md ${txn.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                         {txn.status}
                      </span>
                    </div>
                 </div>
              </div>
              <div className={`font-bold ${txn.type === 'DEPOSIT' || txn.type === 'LOAN_DISBURSEMENT' ? 'text-green-600' : 'text-gray-800'}`}>
                {txn.type === 'DEPOSIT' || txn.type === 'LOAN_DISBURSEMENT' ? '+' : '-'}{formatCurrency(txn.amount)}
              </div>
            </div>
          )) : (
            <div className="p-12 text-center text-gray-400">
              <Filter className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>No transactions found matching criteria.</p>
              {(searchQuery || startDate) && (
                  <button onClick={() => { setSearchQuery(''); setDateRange('ALL'); setFilter('ALL'); }} className="text-primary text-sm font-bold mt-2 hover:underline">
                      Clear Filters
                  </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fund Modal */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-xl font-bold">Fund Wallet</h3>
               <button onClick={closeFundModal} className="text-gray-400 hover:text-gray-600 font-bold">X</button>
            </div>
            
            {fundStatus === 'SUCCESS' ? (
                <div className="p-8 flex flex-col items-center justify-center text-center animate-in zoom-in">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6 animate-bounce">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Funding Successful!</h2>
                    <p className="text-gray-500 mb-6">
                        You have successfully funded your wallet with <br/>
                        <span className="text-2xl font-bold text-primary block mt-2">{formatCurrency(Number(fundAmount))}</span>
                    </p>
                    <button 
                        onClick={closeFundModal}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            ) : fundStatus === 'FAILED' ? (
                 <div className="p-8 flex flex-col items-center justify-center text-center animate-in zoom-in">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6 animate-pulse">
                        <XCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Transaction Failed</h2>
                    <p className="text-gray-500 mb-6">
                        {fundError || 'We could not verify your transfer. Please try again or contact support.'}
                    </p>
                    <button 
                        onClick={() => { setFundStatus('IDLE'); setFundError(''); }}
                        className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : fundStatus === 'VERIFYING' ? (
                <div className="p-12 flex flex-col items-center justify-center text-center animate-in fade-in">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Verifying Transaction</h3>
                    <p className="text-gray-500">
                        {fundMethod === 'TRANSFER' 
                            ? 'Checking bank network for your transfer...' 
                            : 'Processing secure payment...'}
                    </p>
                </div>
            ) : (
                <>
                {/* Funding Method Tabs */}
                <div className="flex border-b border-gray-100">
                <button 
                    onClick={() => setFundMethod('CARD')} 
                    className={`flex-1 py-3 text-sm font-medium ${fundMethod === 'CARD' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Card Payment
                </button>
                <button 
                    onClick={() => setFundMethod('TRANSFER')} 
                    className={`flex-1 py-3 text-sm font-medium ${fundMethod === 'TRANSFER' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    Bank Transfer
                </button>
                <button 
                    onClick={() => setFundMethod('USSD')} 
                    className={`flex-1 py-3 text-sm font-medium ${fundMethod === 'USSD' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    USSD
                </button>
                </div>
                
                <div className="p-6">
                {fundMethod === 'CARD' && (
                    <form onSubmit={handleFundWallet} className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3 border border-blue-100">
                        <CreditCard className="text-blue-500" />
                        <div>
                        <p className="text-xs font-bold text-gray-700">Card Payment</p>
                        <p className="text-xs text-gray-500">Secured by Paystack</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                        <input 
                        type="number" 
                        value={fundAmount}
                        onChange={e => setFundAmount(e.target.value)}
                        className="w-full border rounded-lg p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-primary"
                        placeholder="5000"
                        required
                        min="100"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={processing}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {processing ? <Loader2 className="animate-spin" /> : `Pay ${fundAmount ? formatCurrency(Number(fundAmount)) : ''}`}
                    </button>
                    </form>
                )}

                {fundMethod === 'TRANSFER' && (
                    <div className="space-y-6">
                    <div className="text-center bg-gray-50 p-4 rounded-lg border border-gray-200 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Transfer to your dedicated virtual account</p>
                        
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <Building className="w-5 h-5 text-gray-400" />
                            <p className="text-lg font-bold text-gray-800">{virtualBank}</p>
                        </div>
                        
                        <div className="flex items-center justify-center gap-3 bg-white border-2 border-dashed border-primary/20 rounded-xl p-4 mb-4 shadow-sm group hover:border-primary/40 transition-colors">
                            <span className="text-3xl font-mono font-bold tracking-widest text-primary">{virtualAccount}</span>
                            <button
                                onClick={() => copyToClipboard(virtualAccount)}
                                className="bg-primary hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-md"
                                title="Copy Account Number"
                            >
                                <Copy size={16}/> Copy
                            </button>
                        </div>
                        
                        <p className="text-xs text-gray-500 uppercase font-medium">Account Name: <span className="text-gray-900">{accountName}</span></p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Sent (₦)</label>
                        <input 
                            type="number" 
                            value={fundAmount}
                            onChange={e => setFundAmount(e.target.value)}
                            className="w-full border rounded-lg p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-primary"
                            placeholder="e.g. 5000"
                        />
                        <p className="text-xs text-gray-400 mt-1">Please enter the exact amount you transferred to verify.</p>
                    </div>

                    <button 
                        onClick={handleFundWallet}
                        disabled={processing || !fundAmount}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        Verify Transfer
                    </button>
                    </div>
                )}

                {fundMethod === 'USSD' && (
                    <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Select your Bank</label>
                        <select className="w-full p-3 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary">
                            <option>GTBank (*737#)</option>
                            <option>Zenith Bank (*966#)</option>
                            <option>UBA (*919#)</option>
                            <option>First Bank (*894#)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                        <input 
                            type="number" 
                            value={fundAmount}
                            onChange={e => setFundAmount(e.target.value)}
                            className="w-full border rounded-lg p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-primary"
                            placeholder="1000"
                        />
                    </div>

                    {fundAmount && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-center">
                            <p className="text-xs text-yellow-800 mb-1 font-bold">Dial this code to pay:</p>
                            <p className="text-xl font-mono font-bold text-gray-800 tracking-wider">*737*2*{fundAmount}*9988#</p>
                            <button onClick={() => copyToClipboard(`*737*2*${fundAmount}*9988#`)} className="text-xs text-primary mt-2 font-medium flex items-center justify-center gap-1">
                                <Copy size={12}/> Copy Code
                            </button>
                        </div>
                    )}

                    <button 
                        onClick={handleFundWallet}
                        disabled={processing || !fundAmount}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-emerald-600 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        I have completed the payment
                    </button>
                    </div>
                )}
                </div>
                </>
            )}
          </div>
        </div>
      )}

      {/* Withdrawal / Transfer Modal */}
      {showWithdrawModal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h3 className="text-xl font-bold">Transfer Money</h3>
                      <button onClick={() => { setShowWithdrawModal(false); setWithdrawStep('FORM'); }} className="text-gray-400 hover:text-gray-600 font-bold">X</button>
                  </div>
                  
                  {withdrawStep === 'FORM' && (
                      <form onSubmit={initiateWithdrawal} className="p-6 space-y-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank</label>
                              <select 
                                value={destBank} 
                                onChange={(e) => setDestBank(e.target.value)} 
                                className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-primary bg-white"
                                required
                              >
                                  <option value="">Select a Bank</option>
                                  {NIGERIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                              <div className="relative">
                                <input 
                                    type="number" 
                                    value={destAccount}
                                    onChange={(e) => setDestAccount(e.target.value)}
                                    className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="0123456789"
                                    required
                                />
                                {isResolvingAccount && <div className="absolute right-3 top-3"><Loader2 className="animate-spin text-gray-400 w-5 h-5" /></div>}
                              </div>
                              {destName && <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1"><CheckCircle size={12}/> {destName}</p>}
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                              <input 
                                type="number" 
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full border rounded-lg p-3 text-lg font-bold outline-none focus:ring-2 focus:ring-primary"
                                placeholder="5000"
                                required
                              />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Narration (Optional)</label>
                              <input 
                                type="text" 
                                value={narration}
                                onChange={(e) => setNarration(e.target.value)}
                                className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary"
                                placeholder="e.g. For Dinner"
                              />
                          </div>
                          
                          <button 
                            type="submit" 
                            disabled={!destBank || !destAccount || !withdrawAmount || isResolvingAccount}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-emerald-600 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                          >
                            Continue <ArrowRight size={18} />
                          </button>
                      </form>
                  )}

                  {withdrawStep === 'CONFIRM' && (
                      <div className="p-6 space-y-6">
                           <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                               <p className="text-gray-500 text-xs uppercase font-bold mb-1">You are sending</p>
                               <h2 className="text-3xl font-bold text-gray-800 mb-4">{formatCurrency(Number(withdrawAmount))}</h2>
                               <div className="flex justify-center items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded-lg border border-gray-200 inline-flex mx-auto">
                                   <User size={16} /> 
                                   <span className="font-bold">{destName}</span>
                               </div>
                               <p className="text-xs text-gray-400 mt-2">{destBank} • {destAccount}</p>
                           </div>

                           <div className="space-y-4">
                                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <ShieldCheck className="text-blue-500" />
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">Security Check</p>
                                        <p className="text-xs text-gray-500">
                                            {Number(withdrawAmount) > 50000 
                                            ? 'Face ID required for amounts > 50k' 
                                            : `Verify using ${verificationMethod === 'PIN' ? 'PIN' : 'Biometrics'}`}
                                        </p>
                                    </div>
                                </div>
                                
                                {Number(withdrawAmount) <= 50000 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                          onClick={() => setVerificationMethod('PIN')}
                                          className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${verificationMethod === 'PIN' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            <Lock size={14} /> Use PIN
                                        </button>
                                        <button 
                                          onClick={() => setVerificationMethod(useBiometrics ? 'FINGERPRINT' : 'FACE')}
                                          className={`p-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all ${verificationMethod !== 'PIN' ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 text-gray-500'}`}
                                        >
                                            {useBiometrics ? <Fingerprint size={14}/> : <ScanFace size={14}/>} Biometrics
                                        </button>
                                    </div>
                                )}
                           </div>
                           
                           <div className="space-y-3">
                               <button 
                                    onClick={handleConfirmClick}
                                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-colors"
                               >
                                   Confirm Transaction
                               </button>
                               <button 
                                    onClick={() => { setWithdrawStep('FORM'); }}
                                    className="w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                               >
                                   Cancel
                               </button>
                           </div>

                           {/* 
                              // BACKEND INTEGRATION:
                              // 1. Send POST request to /api/wallet/withdraw
                              // 2. Payload: { userId, amount, destBank, destAccount, narration }
                              // 3. Backend should:
                              //    - Verify balance > amount
                              //    - Debit user wallet
                              //    - Log transaction type: 'WITHDRAWAL'
                              //    - Return new balance
                           */}
                      </div>
                  )}

                  {withdrawStep === 'VERIFY' && (
                      <div className="p-8 text-center">
                          <h3 className="text-xl font-bold mb-6">Verify Identity</h3>
                          
                          {verificationMethod === 'PIN' && (
                              <div className="space-y-6">
                                  <p className="text-gray-500 text-sm">Enter your 4-digit Transaction PIN</p>
                                  <div className="flex justify-center gap-4 mb-8">
                                      {[0, 1, 2, 3].map(i => (
                                          <div key={i} className={`w-4 h-4 rounded-full ${pin.length > i ? 'bg-primary' : 'bg-gray-200'}`}></div>
                                      ))}
                                  </div>
                                  <div className="grid grid-cols-3 gap-4 max-w-[240px] mx-auto">
                                      {[1,2,3,4,5,6,7,8,9].map(n => (
                                          <button key={n} onClick={() => handlePinInput(n.toString())} className="w-16 h-16 rounded-full bg-gray-50 hover:bg-gray-100 font-bold text-xl text-gray-700">{n}</button>
                                      ))}
                                      <div className="w-16 h-16"></div>
                                      <button onClick={() => handlePinInput('0')} className="w-16 h-16 rounded-full bg-gray-50 hover:bg-gray-100 font-bold text-xl text-gray-700">0</button>
                                      <button onClick={() => setPin(prev => prev.slice(0, -1))} className="w-16 h-16 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-700"><Delete size={20}/></button>
                                  </div>
                              </div>
                          )}

                          {verificationMethod === 'FACE' && (
                              <div className="flex flex-col items-center">
                                  <div className="w-48 h-48 bg-gray-900 rounded-full overflow-hidden relative border-4 border-primary mb-6">
                                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
                                      {scanStatus === 'SCANNING' && (
                                          <div className="absolute inset-0 bg-primary/20 animate-pulse border-4 border-primary/50 rounded-full"></div>
                                      )}
                                      <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-40 h-1 bg-primary/50 absolute top-10 animate-scan"></div>
                                      </div>
                                  </div>
                                  <p className="text-gray-500 font-medium">
                                      {scanStatus === 'INIT' ? 'Starting Camera...' : 
                                       scanStatus === 'SCANNING' ? 'Scanning Face...' :
                                       scanStatus === 'VERIFIED' ? 'Identity Verified!' : 'Failed'}
                                  </p>
                              </div>
                          )}

                          {verificationMethod === 'FINGERPRINT' && (
                             <div className="flex flex-col items-center py-8">
                                 <div 
                                    className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 cursor-pointer ${scanStatus === 'SCANNING' ? 'bg-primary/20 scale-110' : scanStatus === 'VERIFIED' ? 'bg-green-100' : 'bg-gray-100 hover:bg-gray-200'}`}
                                    onClick={handleFingerprintScan}
                                 >
                                    <Fingerprint 
                                        size={48} 
                                        className={`transition-colors duration-500 ${scanStatus === 'VERIFIED' ? 'text-green-600' : scanStatus === 'SCANNING' ? 'text-primary animate-pulse' : 'text-gray-400'}`} 
                                    />
                                 </div>
                                 <p className="text-gray-500 font-medium mb-2">
                                     {scanStatus === 'INIT' ? 'Tap icon to simulate scan' : 
                                      scanStatus === 'SCANNING' ? 'Verifying...' :
                                      scanStatus === 'VERIFIED' ? 'Fingerprint Recognized!' : ''}
                                 </p>
                                 <p className="text-xs text-gray-400">Touch ID Simulation</p>
                             </div>
                          )}

                          {processing && (
                              <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-20">
                                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                  <p className="font-bold text-gray-800">Processing Transfer...</p>
                              </div>
                          )}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Wallet;