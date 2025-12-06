import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockAPI } from '../services/mockBackend';
import { formatCurrency } from '../constants';
import { Smartphone, Wifi, Zap, Tv, Loader2, CheckCircle, Search, ChevronRight } from 'lucide-react';

type BillCategory = 'AIRTIME' | 'DATA' | 'ELECTRICITY' | 'TV';

const PROVIDERS = {
  TELCO: [
    { id: 'MTN', name: 'MTN', color: 'bg-yellow-400' },
    { id: 'GLO', name: 'Glo', color: 'bg-green-600 text-white' },
    { id: 'AIRTEL', name: 'Airtel', color: 'bg-red-600 text-white' },
    { id: '9MOBILE', name: '9mobile', color: 'bg-green-900 text-white' },
  ],
  DISCO: [
    { id: 'IKEDC', name: 'Ikeja Electric' },
    { id: 'EKEDC', name: 'Eko Electric' },
    { id: 'AEDC', name: 'Abuja Electric' },
    { id: 'IBEDC', name: 'Ibadan Electric' },
  ],
  TV: [
    { id: 'DSTV', name: 'DSTV' },
    { id: 'GOTV', name: 'GOtv' },
    { id: 'STARTIMES', name: 'StarTimes' },
  ]
};

const DATA_PLANS = {
  MTN: [
    { id: 'm1', name: '100MB Daily', price: 100 },
    { id: 'm2', name: '1GB Weekly', price: 500 },
    { id: 'm3', name: '2.5GB Monthly', price: 1200 },
    { id: 'm4', name: '10GB Monthly', price: 3500 },
  ],
  GLO: [
    { id: 'g1', name: '200MB Daily', price: 100 },
    { id: 'g2', name: '2GB Monthly', price: 1000 },
    { id: 'g3', name: '12GB Monthly', price: 3000 },
  ],
  AIRTEL: [
    { id: 'a1', name: '1GB Daily', price: 300 },
    { id: 'a2', name: '5GB Monthly', price: 1500 },
  ],
  '9MOBILE': [
    { id: '9m1', name: '500MB Daily', price: 200 },
    { id: '9m2', name: '3GB Monthly', price: 1500 },
  ]
};

const TV_PACKAGES = {
  DSTV: [
    { id: 'd1', name: 'DSTV Padi', price: 2500 },
    { id: 'd2', name: 'DSTV Yanga', price: 4200 },
    { id: 'd3', name: 'DSTV Confam', price: 7400 },
    { id: 'd4', name: 'DSTV Compact', price: 12500 },
  ],
  GOTV: [
    { id: 'gt1', name: 'GOtv Smallie', price: 1300 },
    { id: 'gt2', name: 'GOtv Jinja', price: 2700 },
    { id: 'gt3', name: 'GOtv Jolli', price: 3950 },
  ],
  STARTIMES: [
    { id: 's1', name: 'Nova', price: 1200 },
    { id: 's2', name: 'Basic', price: 2600 },
    { id: 's3', name: 'Classic', price: 3800 },
  ]
};

const Bills = () => {
  const { user, refreshUser } = useAuth();
  const [activeCategory, setActiveCategory] = useState<BillCategory>('AIRTIME');
  
  // Form States
  const [provider, setProvider] = useState('');
  const [customerId, setCustomerId] = useState(''); // Phone, Meter, IUC
  const [amount, setAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  
  // UX States
  const [validating, setValidating] = useState(false);
  const [customerName, setCustomerName] = useState(''); // Mocked verified name
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reset form when category changes
  const changeCategory = (cat: BillCategory) => {
    setActiveCategory(cat);
    setProvider('');
    setCustomerId('');
    setAmount('');
    setSelectedPlan(null);
    setCustomerName('');
    setSuccess(false);
  };

  const handleValidateCustomer = async () => {
    if (!customerId || !provider) return;
    setValidating(true);
    // Simulate API call to resolve customer name
    setTimeout(() => {
        const names = ['Emeka Okafor', 'Fatima Musa', 'Tunde Bakare', 'Chioma Adebayo'];
        setCustomerName(names[Math.floor(Math.random() * names.length)]);
        setValidating(false);
    }, 1500);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const payAmount = activeCategory === 'DATA' || activeCategory === 'TV' ? selectedPlan?.price : Number(amount);
    
    if (!payAmount) return;
    if (user.walletBalance < payAmount) {
        alert('Insufficient wallet balance');
        return;
    }

    if (!confirm(`Confirm payment of ${formatCurrency(payAmount)} for ${activeCategory}?`)) return;

    setProcessing(true);
    try {
        const newBalance = await MockAPI.payBill(
            user.id, 
            payAmount, 
            activeCategory, 
            provider, 
            customerId
        );
        refreshUser({ ...user, walletBalance: newBalance });
        setSuccess(true);
    } catch (error: any) {
        alert(error.message);
    } finally {
        setProcessing(false);
    }
  };

  if (success) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-2xl p-8 text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                  <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
              <p className="text-gray-500 mb-8">Your transaction has been processed successfully.</p>
              
              <div className="bg-gray-50 p-6 rounded-xl w-full max-w-sm mb-6 border border-gray-100">
                  <div className="flex justify-between mb-3 text-sm">
                      <span className="text-gray-500">Service</span>
                      <span className="font-bold text-gray-800">{activeCategory}</span>
                  </div>
                  <div className="flex justify-between mb-3 text-sm">
                      <span className="text-gray-500">Provider</span>
                      <span className="font-bold text-gray-800">{provider}</span>
                  </div>
                  <div className="flex justify-between mb-3 text-sm">
                      <span className="text-gray-500">Recipient</span>
                      <span className="font-bold text-gray-800">{customerId}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                      <span className="text-gray-500 font-bold">Amount Paid</span>
                      <span className="font-bold text-primary text-lg">{formatCurrency(activeCategory === 'DATA' || activeCategory === 'TV' ? selectedPlan?.price : Number(amount))}</span>
                  </div>
              </div>

              <button 
                onClick={() => { setSuccess(false); changeCategory('AIRTIME'); }}
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
              >
                  Make Another Payment
              </button>
          </div>
      );
  }

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">Bills & Utilities</h2>

       {/* Category Tabs */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => changeCategory('AIRTIME')}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${activeCategory === 'AIRTIME' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-white hover:bg-gray-50 text-gray-500'}`}
          >
             <Smartphone size={24} />
             <span className="font-bold text-sm">Airtime</span>
          </button>
          <button 
            onClick={() => changeCategory('DATA')}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${activeCategory === 'DATA' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-white hover:bg-gray-50 text-gray-500'}`}
          >
             <Wifi size={24} />
             <span className="font-bold text-sm">Data Bundle</span>
          </button>
          <button 
            onClick={() => changeCategory('ELECTRICITY')}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${activeCategory === 'ELECTRICITY' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-white hover:bg-gray-50 text-gray-500'}`}
          >
             <Zap size={24} />
             <span className="font-bold text-sm">Electricity</span>
          </button>
          <button 
            onClick={() => changeCategory('TV')}
            className={`p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${activeCategory === 'TV' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-white hover:bg-gray-50 text-gray-500'}`}
          >
             <Tv size={24} />
             <span className="font-bold text-sm">Cable TV</span>
          </button>
       </div>

       <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
          <form onSubmit={handlePay} className="space-y-6">
             
             {/* Provider Selection */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Provider</label>
                <div className="grid grid-cols-4 gap-3">
                   {(activeCategory === 'AIRTIME' || activeCategory === 'DATA' ? PROVIDERS.TELCO : activeCategory === 'ELECTRICITY' ? PROVIDERS.DISCO : PROVIDERS.TV).map(p => (
                       <button
                         key={p.id}
                         type="button"
                         onClick={() => { setProvider(p.id); setCustomerName(''); setSelectedPlan(null); }}
                         className={`p-2 rounded-lg text-xs font-bold border-2 transition-all h-16 flex items-center justify-center text-center ${provider === p.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100 hover:border-gray-300'}`}
                       >
                         {p.name}
                       </button>
                   ))}
                </div>
             </div>

             {/* Customer ID / Number */}
             {provider && (
                 <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                        {activeCategory === 'ELECTRICITY' ? 'Meter Number' : activeCategory === 'TV' ? 'Smart Card / IUC Number' : 'Phone Number'}
                     </label>
                     <div className="flex gap-2">
                         <input 
                           type="tel" 
                           value={customerId}
                           onChange={(e) => { setCustomerId(e.target.value); setCustomerName(''); }}
                           className="flex-1 border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary font-mono"
                           placeholder="Enter number"
                           required
                         />
                         {(activeCategory === 'ELECTRICITY' || activeCategory === 'TV') && (
                             <button 
                               type="button"
                               onClick={handleValidateCustomer}
                               disabled={validating || !customerId}
                               className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-lg font-medium text-sm flex items-center gap-2"
                             >
                                 {validating ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                             </button>
                         )}
                     </div>
                     
                     {/* Validation Result */}
                     {customerName && (
                         <div className="mt-2 bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
                             <CheckCircle size={16} />
                             <span className="font-bold">{customerName}</span>
                         </div>
                     )}
                 </div>
             )}

             {/* Data/TV Plans */}
             {provider && (activeCategory === 'DATA' || activeCategory === 'TV') && (
                 <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                     <label className="block text-sm font-medium text-gray-700 mb-2">Select Package</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {/* @ts-ignore */}
                         {((activeCategory === 'DATA' ? DATA_PLANS[provider] : TV_PACKAGES[provider]) || []).map((plan: any) => (
                             <button
                                key={plan.id}
                                type="button"
                                onClick={() => setSelectedPlan(plan)}
                                className={`p-3 rounded-lg border text-left transition-all ${selectedPlan?.id === plan.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'}`}
                             >
                                 <div className="font-bold text-gray-800">{plan.name}</div>
                                 <div className="text-primary font-bold">{formatCurrency(plan.price)}</div>
                             </button>
                         ))}
                     </div>
                 </div>
             )}

             {/* Amount (for Airtime/Power) */}
             {provider && (activeCategory === 'AIRTIME' || activeCategory === 'ELECTRICITY') && (
                 <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                     <input 
                       type="number"
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-primary text-lg font-bold"
                       placeholder="0.00"
                       required
                       min="50"
                     />
                 </div>
             )}

             {/* Submit Button */}
             <button 
               type="submit"
               disabled={!provider || !customerId || (!amount && !selectedPlan) || processing}
               className="w-full bg-primary hover:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 mt-8"
             >
                 {processing ? <Loader2 className="animate-spin" /> : 'Pay Now'}
                 {!processing && <ChevronRight size={20} />}
             </button>

          </form>
       </div>
    </div>
  );
};

export default Bills;