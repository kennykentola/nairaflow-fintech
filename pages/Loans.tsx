
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyzeLoanRisk } from '../services/geminiService';
import { MockAPI } from '../services/mockBackend';
import { Loan, LoanStatus, KYCLevel } from '../types';
import { formatCurrency, LOAN_PURPOSES } from '../constants';
import { Calculator, AlertTriangle, CheckCircle, Loader2, CreditCard, Lock, ArrowLeft, History, PieChart, Info, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Loans = () => {
  const { user, refreshUser } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  
  // Calculator & Application State
  const [amount, setAmount] = useState(25000);
  const [duration, setDuration] = useState(3);
  const [income, setIncome] = useState(100000);
  const [employment, setEmployment] = useState('Employed');
  const [purpose, setPurpose] = useState(LOAN_PURPOSES[0]);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [viewState, setViewState] = useState<'LIST' | 'CALCULATOR' | 'APPLY'>('LIST');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadLoans();
  }, [user]);

  const loadLoans = () => {
    if (user) MockAPI.getUserLoans(user.id).then(setLoans);
  };

  // KYC Limit Logic
  const getKycLimit = (level: KYCLevel) => {
    switch (level) {
      case KYCLevel.TIER_0: return 0;
      case KYCLevel.TIER_1: return 50000;
      case KYCLevel.TIER_2: return 200000;
      case KYCLevel.TIER_3: return 5000000;
      default: return 0;
    }
  };
  
  const userLimit = user ? getKycLimit(user.kycLevel) : 0;

  // Ensure amount doesn't exceed limit on initial render or tier change
  useEffect(() => {
    if (userLimit > 0 && amount > userLimit) setAmount(userLimit);
  }, [userLimit]);

  const interestRate = 0.05; // 5% flat monthly
  const monthlyRepayment = (amount + (amount * interestRate * duration)) / duration;
  const totalRepayment = monthlyRepayment * duration;
  const totalInterest = totalRepayment - amount;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeLoanRisk(amount, duration, income, employment, purpose);
      setAiResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitLoan = async () => {
    if (!user) return;
    try {
      await MockAPI.applyForLoan({
        userId: user.id,
        amount,
        durationMonths: duration,
        interestRate: 5,
        monthlyRepayment,
        totalRepayment,
        aiScore: aiResult?.score || 0,
        aiReasoning: aiResult?.reasoning || "Manual review required",
        purpose
      });
      alert("Loan Application Submitted Successfully!");
      setViewState('LIST');
      setAiResult(null);
      loadLoans();
    } catch (error: any) {
      alert(error.message || "Error applying for loan");
    }
  };

  const handleRepay = async (loan: Loan) => {
    if (!user) return;
    
    // Determine payment amount (Installment or remaining balance if less)
    const remaining = loan.totalRepayment - loan.amountPaid;
    const paymentAmount = Math.min(loan.monthlyRepayment, remaining);

    if (user.walletBalance < paymentAmount) {
      alert("Insufficient wallet balance. Please fund your wallet first.");
      return;
    }

    if (!confirm(`Repay ${formatCurrency(paymentAmount)} from your wallet?`)) return;

    setProcessingId(loan.id);
    try {
      const { walletBalance } = await MockAPI.repayLoan(user.id, loan.id, paymentAmount);
      refreshUser({ ...user, walletBalance }); // Update global wallet state
      loadLoans(); // Refresh loan list
    } catch (error: any) {
      alert(error.message || "Repayment failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            {viewState === 'LIST' ? <History className="text-primary"/> : <Calculator className="text-primary"/>}
            {viewState === 'LIST' ? 'My Loans' : viewState === 'APPLY' ? 'Loan Application' : 'Loan Calculator'}
        </h2>
        
        {viewState !== 'APPLY' && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewState('LIST')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewState === 'LIST' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                >
                   My Loans
                </button>
                <button 
                  onClick={() => setViewState('CALCULATOR')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewState === 'CALCULATOR' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
                >
                   Calculator
                </button>
             </div>
        )}
        
        {viewState === 'APPLY' && (
             <button 
               onClick={() => setViewState('CALCULATOR')}
               className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
             >
                <ArrowLeft size={16} /> Back to Calculator
             </button>
        )}
      </div>

      {viewState === 'LIST' && (
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
              <div className="inline-block p-4 bg-emerald-50 rounded-full mb-4">
                <Calculator className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No Loans History</h3>
              <p className="text-gray-500 mb-6">You have not applied for any loans yet.</p>
              <button onClick={() => setViewState('CALCULATOR')} className="bg-primary text-white px-6 py-3 rounded-lg font-bold">
                Calculate & Apply
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {loans.map(loan => {
                 const remaining = loan.totalRepayment - loan.amountPaid;
                 const nextInstallment = Math.min(loan.monthlyRepayment, remaining);
                 const progress = Math.min(Math.round((loan.amountPaid / loan.totalRepayment) * 100), 100);

                 return (
                <div key={loan.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">#{loan.id.toUpperCase()}</span>
                      <span className={`px-2 py-0.5 text-xs rounded font-bold 
                        ${loan.status === 'APPROVED' || loan.status === 'ACTIVE' || loan.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                          loan.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {loan.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">{formatCurrency(loan.amount)}</h3>
                    <p className="text-sm text-gray-500">Repayment: {formatCurrency(loan.monthlyRepayment)} / month</p>
                    <p className="text-xs text-gray-400 mt-1">{loan.purpose}</p>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-2 min-w-[240px] w-full md:w-auto">
                    <div>
                      <p className="text-sm text-gray-500">Total Due</p>
                      <p className="text-lg font-bold text-gray-800">{formatCurrency(loan.totalRepayment)}</p>
                    </div>

                    {loan.status === 'ACTIVE' && (
                      <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100">
                         <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>Paid: {formatCurrency(loan.amountPaid)}</span>
                            <span>{progress}%</span>
                         </div>
                         <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                            <div 
                              className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${progress}%` }}
                            ></div>
                         </div>
                         
                         <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 mt-2">
                             <div className="text-left">
                                 <p className="text-[10px] text-gray-500 uppercase font-bold leading-tight">Next Installment</p>
                                 <p className="text-sm font-bold text-gray-800">{formatCurrency(nextInstallment)}</p>
                             </div>
                             <button 
                                onClick={() => handleRepay(loan)}
                                disabled={processingId === loan.id}
                                className="bg-primary hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1 shadow-sm transition-colors"
                             >
                                {processingId === loan.id ? <Loader2 className="animate-spin w-3 h-3" /> : (
                                    <>Repay Now <CreditCard size={12} /></>
                                )}
                             </button>
                         </div>
                      </div>
                    )}
                    
                    {loan.status === 'PAID' && (
                        <div className="flex items-center gap-1 text-green-600 font-bold text-sm mt-2 bg-green-50 px-3 py-1 rounded-full">
                            <CheckCircle size={16} /> Fully Repaid
                        </div>
                    )}
                  </div>
                </div>
              );
              })}
              
              <div className="mt-4 text-center">
                 <button onClick={() => setViewState('CALCULATOR')} className="text-primary font-bold hover:underline">
                    Need another loan? Go to Calculator
                 </button>
              </div>
            </div>
          )}
        </div>
      )}

      {viewState === 'CALCULATOR' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary/10 p-2 rounded-lg text-primary"><Calculator /></div>
                    <h3 className="text-lg font-bold">Estimate your loan</h3>
                </div>

                {/* KYC Limit Banner */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <Info className="text-blue-500 w-5 h-5" />
                        <div>
                            <p className="text-xs text-blue-500 font-bold uppercase">Your KYC Limit (Tier {user?.kycLevel})</p>
                            <p className="text-lg font-bold text-blue-800">{formatCurrency(userLimit)}</p>
                        </div>
                    </div>
                    {user?.kycLevel && user.kycLevel < 3 && (
                        <Link to="/kyc" className="text-xs bg-white text-blue-700 border border-blue-200 px-3 py-1 rounded-lg font-bold hover:bg-blue-50">
                            Increase
                        </Link>
                    )}
                </div>

                {userLimit > 0 ? (
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">Amount to borrow</label>
                                <span className="text-sm font-bold text-primary">{formatCurrency(amount)}</span>
                            </div>
                            <input 
                                type="range" min="5000" max={userLimit} step="1000" 
                                value={amount} onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>₦5,000</span>
                                <span>{formatCurrency(userLimit)}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Repayment Period</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 6, 12].map(m => (
                                <button 
                                    key={m}
                                    onClick={() => setDuration(m)}
                                    className={`py-2 rounded-lg text-sm font-bold border transition-all ${duration === m ? 'bg-secondary text-white border-secondary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}
                                >
                                    {m} Mo
                                </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                             <button 
                                onClick={() => setViewState('APPLY')}
                                className="w-full bg-primary hover:bg-emerald-700 text-white py-3 rounded-xl font-bold shadow-lg transition-colors flex justify-center items-center gap-2"
                             >
                                Apply for this Loan <ArrowLeft className="rotate-180" size={18} />
                             </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm text-center">
                        <AlertTriangle className="mx-auto mb-2 w-8 h-8 opacity-50"/>
                        Please complete basic KYC to unlock loan features.
                        <Link to="/kyc" className="block mt-2 font-bold underline">Go to KYC</Link>
                    </div>
                )}
             </div>

             {/* Results Panel */}
             <div className="space-y-6">
                <div className="bg-secondary text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
                   <div className="relative z-10">
                       <p className="text-emerald-200 text-sm font-medium mb-1">Estimated Monthly Payment</p>
                       <h2 className="text-4xl font-bold mb-6">{formatCurrency(monthlyRepayment)}</h2>
                       
                       <div className="space-y-3 text-sm">
                           <div className="flex justify-between border-b border-emerald-800/30 pb-2">
                               <span className="text-emerald-100">Principal Amount</span>
                               <span className="font-medium">{formatCurrency(amount)}</span>
                           </div>
                           <div className="flex justify-between border-b border-emerald-800/30 pb-2">
                               <span className="text-emerald-100">Interest ({interestRate * 100}%)</span>
                               <span className="font-medium">{formatCurrency(totalInterest)}</span>
                           </div>
                           <div className="flex justify-between border-b border-emerald-800/30 pb-2">
                               <span className="text-emerald-100">Duration</span>
                               <span className="font-medium">{duration} Months</span>
                           </div>
                           <div className="flex justify-between pt-2">
                               <span className="text-emerald-100 font-bold">Total Repayment</span>
                               <span className="font-bold text-accent text-lg">{formatCurrency(totalRepayment)}</span>
                           </div>
                       </div>
                   </div>
                   <PieChart className="absolute right-[-20px] bottom-[-20px] text-emerald-900 w-48 h-48 opacity-50" />
                </div>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-xs text-gray-500">
                    <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Info size={14}/> Important Info</h4>
                    <p>Interest rates are calculated flat monthly. Final approval is subject to AI credit scoring and manual review where necessary. Late repayment may attract penalties.</p>
                </div>
             </div>
          </div>
      )}

      {viewState === 'APPLY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right duration-300">
          {/* Form Side */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <div>
                 <h3 className="text-xl font-bold text-gray-800 mb-1">Loan Application</h3>
                 <p className="text-gray-500 text-sm">Review your details and submit for AI analysis.</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center border border-gray-200">
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Requested Amount</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(amount)}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 uppercase font-bold text-right">Duration</p>
                    <p className="text-lg font-bold text-gray-800 text-right">{duration} Months</p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Income</label>
                    <input type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-full border p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Employment Status</label>
                    <select value={employment} onChange={(e) => setEmployment(e.target.value)} className="w-full border p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-primary bg-white">
                        <option>Employed</option>
                        <option>Self-Employed</option>
                        <option>Unemployed</option>
                        <option>Student</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="w-full border p-3 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-primary bg-white">
                        {LOAN_PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full py-4 bg-secondary text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-gray-900 transition-colors shadow-lg"
            >
                {isAnalyzing ? <><Loader2 className="animate-spin" /> Analyzing Eligibility...</> : 'Check Eligibility'}
            </button>
          </div>

          {/* Result Side */}
          <div className="space-y-6">
            {aiResult ? (
              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-primary/20 animate-fade-in relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Shield size={100} />
                 </div>
                 
                 <h3 className="text-lg font-bold flex items-center gap-2 mb-6 relative z-10">
                   AI Risk Assessment
                   <span className={`text-xs px-2 py-1 rounded text-white ${aiResult.riskLevel === 'LOW' ? 'bg-green-500' : aiResult.riskLevel === 'MEDIUM' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                     {aiResult.riskLevel} RISK
                   </span>
                 </h3>
                 
                 <div className="mb-6 relative z-10">
                   <p className="text-sm text-gray-500">Credit Score</p>
                   <p className="text-4xl font-extrabold text-gray-800">{aiResult.score} <span className="text-sm font-normal text-gray-400">/ 850</span></p>
                 </div>

                 <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg mb-6 border-l-4 border-primary relative z-10">
                   "<span className="italic">{aiResult.reasoning}</span>"
                 </p>

                 {aiResult.riskLevel === 'HIGH' ? (
                   <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg relative z-10">
                     <AlertTriangle size={20} />
                     <p className="text-sm font-bold">Loan Application likely to be rejected.</p>
                   </div>
                 ) : (
                   <button 
                    onClick={handleSubmitLoan}
                    className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg relative z-10 flex justify-center items-center gap-2"
                   >
                     Submit Application <CheckCircle size={18} />
                   </button>
                 )}
              </div>
            ) : (
                <div className="h-full bg-gray-50 p-8 rounded-2xl border border-dashed border-gray-200 text-center text-gray-400 flex flex-col items-center justify-center">
                    <Lock className="w-16 h-16 mb-4 opacity-20" />
                    <h4 className="font-bold text-gray-500">Analysis Pending</h4>
                    <p className="text-sm mt-2 max-w-xs">Complete the form and click "Check Eligibility" to see your AI-generated credit score and risk assessment.</p>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
