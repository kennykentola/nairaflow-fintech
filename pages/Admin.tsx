import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockAPI } from '../services/mockBackend';
import { Loan, LoanStatus, FraudLog, User } from '../types';
import { formatCurrency } from '../constants';
import { Check, X, Eye, ShieldAlert, Users, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'LOANS' | 'FRAUD' | 'USERS'>('LOANS');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, activeTab]);

  const loadData = async () => {
    const [l, f, u] = await Promise.all([
      MockAPI.getAllLoans(),
      MockAPI.getFraudLogs(),
      MockAPI.getAllUsers()
    ]);
    setLoans(l);
    setFraudLogs(f);
    setAllUsers(u);
  };

  const handleLoanAction = async (id: string, status: LoanStatus) => {
    if (confirm(`Are you sure you want to ${status} this loan?`)) {
      await MockAPI.updateLoanStatus(id, status);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <span className="bg-secondary text-white text-xs px-2 py-1 rounded">ADMIN PORTAL</span> 
        Overview
      </h2>

      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Landmark /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Loans</p>
            <h3 className="text-2xl font-bold">{loans.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-full"><ShieldAlert /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Fraud Alerts</p>
            <h3 className="text-2xl font-bold">{fraudLogs.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full"><Users /></div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold">Total Users</p>
            <h3 className="text-2xl font-bold">{allUsers.length}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('LOANS')}
          className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'LOANS' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
        >
          Loan Requests
        </button>
        <button 
          onClick={() => setActiveTab('FRAUD')}
          className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'FRAUD' ? 'border-b-2 border-red-500 text-red-500' : 'text-gray-500'}`}
        >
          Fraud Detection
        </button>
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'USERS' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
        >
          User Management
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {activeTab === 'LOANS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">User</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Amount</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Score</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loans.map(loan => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{loan.userName}</p>
                      <p className="text-xs text-gray-400">{loan.purpose}</p>
                    </td>
                    <td className="p-4 font-bold">{formatCurrency(loan.amount)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${loan.aiScore && loan.aiScore > 700 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {loan.aiScore || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        loan.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        loan.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                        loan.status === 'FLAGGED' ? 'bg-red-500 text-white' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {loan.status === 'PENDING' || loan.status === 'FLAGGED' ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleLoanAction(loan.id, LoanStatus.APPROVED)} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check size={16} /></button>
                          <button onClick={() => handleLoanAction(loan.id, LoanStatus.REJECTED)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><X size={16} /></button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'FRAUD' && (
          <div className="p-4">
            {fraudLogs.length === 0 ? <p className="text-gray-500 text-center py-8">No fraud alerts detected.</p> : (
              <div className="space-y-4">
                {fraudLogs.map(log => (
                  <div key={log.id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg flex justify-between items-start">
                    <div>
                       <h4 className="font-bold text-red-800">{log.activity}</h4>
                       <p className="text-sm text-red-700">{log.details}</p>
                       <p className="text-xs text-red-500 mt-2">User ID: {log.userId} • Time: {new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-1 rounded">{log.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">User</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Email</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">KYC Tier</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold text-gray-800">{u.name} {u.role === 'ADMIN' && '(Admin)'}</td>
                    <td className="p-4 text-gray-500">{u.email}</td>
                    <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">Tier {u.kycLevel}</span></td>
                    <td className="p-4 font-mono">{formatCurrency(u.walletBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;