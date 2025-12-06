import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockAPI } from '../services/mockBackend';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Lock, Mail, Phone, User, ArrowRight, Loader2 } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form States
  const [email, setEmail] = useState('user@nairaflow.ng');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const user = await MockAPI.login(email);
        login(user);
        navigate('/');
      } else {
        const user = await MockAPI.register(name, email, phone);
        login(user);
        navigate('/kyc'); // New users go to KYC
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 bg-primary text-center">
          <h1 className="text-3xl font-bold text-white mb-2">NairaFlow</h1>
          <p className="text-emerald-100">Secure Nigerian Digital Banking</p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-8 bg-gray-100 p-1 rounded-lg">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-white shadow text-primary' : 'text-gray-500'}`}
              onClick={() => setIsLogin(false)}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="Tunde Bakare"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="08012345678"
                  />
                </div>
              </div>
            )}
            
            {/* Mock Password Field - Visual only since we simulate login by email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  defaultValue="password"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-primary hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  {isLogin ? 'Secure Login' : 'Get Started'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            <p>Protected by Bank-Grade Security 256-bit Encryption.</p>
            <p className="mt-2">Use <span className="text-primary cursor-pointer" onClick={() => setEmail('admin@nairaflow.ng')}>admin@nairaflow.ng</span> for Admin Demo</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
