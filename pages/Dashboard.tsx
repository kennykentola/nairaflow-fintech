import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../constants';
import { MockAPI } from '../services/mockBackend';
import { Loan, Transaction } from '../types';
import { Wallet, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeLoan, setActiveLoan] = useState<Loan | null>(null);
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        // Run scheduled jobs simulation
        await MockAPI.triggerLoanReminders();

        const loans = await MockAPI.getUserLoans(user.id);
        const active = loans.find(l => l.status === 'ACTIVE' || l.status === 'PENDING');
        setActiveLoan(active || null);

        const txns = await MockAPI.getTransactions(user.id);
        setRecentTxns(txns.slice(0, 5)); // Show last 5
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  if (loading) return <div className="flex h-full items-center justify-center text-primary"><span className="animate-pulse">Loading Dashboard...</span></div>;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Hello, {user?.name.split(' ')[0]} 👋</h2>
          <p className="text-gray-500">Welcome back to NairaFlow.</p>
        </div>
        <div className="hidden md:block">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${user?.kycLevel === 3 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                KYC Level: Tier {user?.kycLevel}
            </span>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance */}
        <div className="bg-secondary text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-200 text-sm font-medium mb-1">Total Balance</p>
            <h3 className="text-3xl font-bold">{formatCurrency(user?.walletBalance || 0)}</h3>
            <div className="mt-6 flex gap-3">
              <Link to="/wallet" className="bg-primary hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Add Money
              </Link>
              <Link to="/wallet" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Transfer
              </Link>
            </div>
          </div>
          <Wallet className="absolute right-4 bottom-4 text-emerald-800 w-24 h-24 opacity-20" />
        </div>

        {/* Loan Status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
          <p className="text-gray-500 text-sm font-medium mb-1">Active Loan</p>
          {activeLoan ? (
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(activeLoan.totalRepayment)}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold 
                  ${activeLoan.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {activeLoan.status}
                </span>
                <span className="text-xs text-gray-400">Due in {activeLoan.durationMonths} months</span>
              </div>
              <Link to="/loans" className="mt-4 block text-primary text-sm font-medium hover:underline">View Details</Link>
            </div>
          ) : (
             <div>
                <h3 className="text-2xl font-bold text-gray-800">₦0.00</h3>
                <p className="text-sm text-gray-400 mt-1">No active loans.</p>
                <Link to="/loans" className="mt-4 inline-block bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium">Apply Now</Link>
             </div>
          )}
           <TrendingUp className="absolute right-4 top-4 text-gray-200 w-6 h-6" />
        </div>

        {/* Credit/Limit Score (Mocked) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium mb-1">Credit Limit</p>
          <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(user?.kycLevel && user.kycLevel > 1 ? 500000 : 50000)}</h3>
          <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
            <div className="bg-accent h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Increase your limit by upgrading KYC Tier.</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Recent Transactions</h3>
          <Link to="/wallet" className="text-sm text-primary hover:underline">View All</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentTxns.length > 0 ? recentTxns.map((txn) => (
            <div key={txn.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center 
                  ${txn.type === 'DEPOSIT' || txn.type === 'LOAN_DISBURSEMENT' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {txn.type === 'DEPOSIT' || txn.type === 'LOAN_DISBURSEMENT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{txn.description}</p>
                  <p className="text-xs text-gray-400">{new Date(txn.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${txn.type === 'DEPOSIT' || txn.type === 'LOAN_DISBURSEMENT' ? 'text-green-600' : 'text-gray-800'}`}>
                  {txn.type === 'DEPOSIT' || txn.type === 'LOAN_DISBURSEMENT' ? '+' : '-'}{formatCurrency(txn.amount)}
                </p>
                <p className={`text-xs capitalize ${txn.status === 'SUCCESS' ? 'text-green-500' : 'text-yellow-500'}`}>{txn.status}</p>
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No recent transactions found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;