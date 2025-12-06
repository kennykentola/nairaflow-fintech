import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { KYCLevel } from '../types';
import { CheckCircle, Shield, Camera, FileText, User, X, ChevronRight, Lock, Settings, Edit2, Upload, Smartphone, Fingerprint, Key } from 'lucide-react';
import { MockAPI } from '../services/mockBackend';

const KYC = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'VERIFICATION' | 'SETTINGS'>('VERIFICATION');
  
  // Upgrade Modal State
  const [showSuccess, setShowSuccess] = useState(false);
  const [upgradedTier, setUpgradedTier] = useState<any>(null);
  
  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Settings State
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const levels = [
    { level: 1, title: 'Tier 1 (Basic)', req: 'BVN', limit: '₦50,000', icon: User, done: (user?.kycLevel || 0) >= 1 },
    { level: 2, title: 'Tier 2 (Standard)', req: 'NIN + ID', limit: '₦200,000', icon: FileText, done: (user?.kycLevel || 0) >= 2 },
    { level: 3, title: 'Tier 3 (Enhanced)', req: 'Selfie + Utility', limit: '₦5,000,000', icon: Camera, done: (user?.kycLevel || 0) >= 3 },
  ];

  const handleUpgrade = async (lvl: any) => {
    if (!user) return;
    const field = lvl.req.split(' ')[0].toLowerCase(); // e.g., 'bvn'
    
    // Simulate input capture
    const val = prompt(`Enter your ${lvl.req}:`, field === 'bvn' ? "22233344455" : "12345678901");
    
    if (val) {
        try {
            await MockAPI.updateKYC(user.id, { [field]: val });
            
            // Calculate new level logic locally for UI optimism
            let newLevel = user.kycLevel;
            if (lvl.level > newLevel) newLevel = lvl.level;

            refreshUser({ ...user, [field]: val, kycLevel: newLevel });
            
            setUpgradedTier(lvl);
            setShowSuccess(true);
        } catch (error) {
            alert("Verification Failed. Please try again.");
        }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      setUploadingImage(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
          try {
              const base64 = reader.result as string;
              await MockAPI.updateAvatar(user.id, base64);
              refreshUser({ ...user, avatar: base64 });
          } catch (error) {
              alert("Failed to update profile picture");
          } finally {
              setUploadingImage(false);
          }
      };
      reader.readAsDataURL(file);
  };

  const handleChangePin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      if (newPin !== confirmPin) {
          alert("New PINs do not match");
          return;
      }
      if (newPin.length !== 4) {
          alert("PIN must be 4 digits");
          return;
      }

      setPinLoading(true);
      try {
          const updatedUser = await MockAPI.changePin(user.id, currentPin, newPin);
          refreshUser(updatedUser);
          alert("PIN changed successfully");
          setCurrentPin('');
          setNewPin('');
          setConfirmPin('');
      } catch (error: any) {
          alert(error.message);
      } finally {
          setPinLoading(false);
      }
  };

  const toggleSetting = async (key: 'twoFactorEnabled' | 'biometricsEnabled') => {
      if (!user) return;
      setSettingsLoading(true);
      try {
          const newState = !user[key];
          const updatedUser = await MockAPI.updateSettings(user.id, { [key]: newState });
          refreshUser({ ...user, [key]: newState }); // Optimistic UI
      } catch (error) {
          console.error(error);
          alert("Failed to update settings");
      } finally {
          setSettingsLoading(false);
      }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Profile Header */}
      <div className="bg-secondary text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-24 h-24 rounded-full border-4 border-emerald-500 overflow-hidden relative">
                     <img src={user?.avatar || "https://ui-avatars.com/api/?name=User"} alt="Avatar" className="w-full h-full object-cover" />
                     {uploadingImage && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="animate-spin w-6 h-6 border-2 border-white rounded-full border-t-transparent"></div></div>}
                     <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera size={24} className="text-white" />
                     </div>
                 </div>
                 <div className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full border-2 border-secondary">
                     <Edit2 size={12} />
                 </div>
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                 />
            </div>
            
            <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold">{user?.name}</h2>
                <p className="text-emerald-200">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-medium">
                    <Shield size={12} className="text-accent"/>
                    <span>KYC Tier {user?.kycLevel}</span>
                </div>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('VERIFICATION')}
            className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'VERIFICATION' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
             <Shield size={16} /> Verification Status
          </button>
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'SETTINGS' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
             <Settings size={16} /> Security & Settings
          </button>
      </div>

      {/* Content */}
      {activeTab === 'VERIFICATION' && (
        <div className="grid gap-4 animate-in slide-in-from-left duration-300">
            {levels.map((lvl) => (
            <div key={lvl.level} className={`p-6 rounded-xl border-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 ${lvl.done ? 'border-green-100 bg-green-50' : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'}`}>
                <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${lvl.done ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <lvl.icon size={24} />
                </div>
                <div>
                    <h3 className={`font-bold text-lg ${lvl.done ? 'text-green-800' : 'text-gray-800'}`}>{lvl.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">Req: {lvl.req}</span>
                    </div>
                    <p className="text-xs text-primary font-bold mt-2 flex items-center gap-1">
                        <Shield size={12} /> Limit Unlocked: {lvl.limit}
                    </p>
                </div>
                </div>
                
                {lvl.done ? (
                <div className="flex items-center gap-2 text-green-600 font-bold bg-white px-4 py-2 rounded-lg border border-green-100 shadow-sm">
                    <CheckCircle size={20} className="fill-green-100" />
                    <span>Verified</span>
                </div>
                ) : (
                <button 
                    onClick={() => handleUpgrade(lvl)}
                    disabled={user?.kycLevel !== lvl.level - 1}
                    className={`px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                        user?.kycLevel === lvl.level - 1 
                        ? 'bg-primary text-white hover:bg-emerald-700 shadow-lg shadow-primary/20 hover:shadow-xl' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    {user?.kycLevel === lvl.level - 1 ? (
                        <>Upgrade Now <ChevronRight size={16}/></>
                    ) : (
                        <><Lock size={14}/> Locked</>
                    )}
                </button>
                )}
            </div>
            ))}
        </div>
      )}

      {activeTab === 'SETTINGS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right duration-300">
              
              {/* Change PIN */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                      <Key className="text-primary" size={20} /> Change Transaction PIN
                  </h3>
                  <form onSubmit={handleChangePin} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Current PIN</label>
                          <input 
                            type="password" 
                            maxLength={4}
                            value={currentPin}
                            onChange={(e) => setCurrentPin(e.target.value)}
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                            placeholder="****"
                            required
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">New PIN</label>
                          <input 
                            type="password" 
                            maxLength={4}
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value)}
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                            placeholder="****"
                            required
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New PIN</label>
                          <input 
                            type="password" 
                            maxLength={4}
                            value={confirmPin}
                            onChange={(e) => setConfirmPin(e.target.value)}
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-primary font-mono tracking-widest"
                            placeholder="****"
                            required
                          />
                      </div>
                      <button 
                        type="submit" 
                        disabled={pinLoading}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50"
                      >
                          {pinLoading ? 'Updating...' : 'Update PIN'}
                      </button>
                  </form>
              </div>

              {/* Security Preferences */}
              <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
                          <Shield className="text-primary" size={20} /> Security Preferences
                      </h3>
                      
                      <div className="space-y-6">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Smartphone size={20} /></div>
                                  <div>
                                      <p className="font-bold text-gray-800">Two-Factor Authentication</p>
                                      <p className="text-xs text-gray-500">Require code for login</p>
                                  </div>
                              </div>
                              <button 
                                onClick={() => toggleSetting('twoFactorEnabled')}
                                disabled={settingsLoading}
                                className={`w-12 h-6 rounded-full transition-colors relative ${user?.twoFactorEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                              >
                                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${user?.twoFactorEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <div className="bg-purple-50 p-2 rounded-lg text-purple-600"><Fingerprint size={20} /></div>
                                  <div>
                                      <p className="font-bold text-gray-800">Biometric Login</p>
                                      <p className="text-xs text-gray-500">Use FaceID / Fingerprint</p>
                                  </div>
                              </div>
                              <button 
                                onClick={() => toggleSetting('biometricsEnabled')}
                                disabled={settingsLoading}
                                className={`w-12 h-6 rounded-full transition-colors relative ${user?.biometricsEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                              >
                                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${user?.biometricsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                              </button>
                          </div>
                      </div>
                  </div>
                  
                  <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                       <h4 className="font-bold text-red-800 mb-2">Account Danger Zone</h4>
                       <p className="text-xs text-red-600 mb-4">Deleting your account is permanent. All wallet balance must be withdrawn first.</p>
                       <button className="text-xs bg-white text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold hover:bg-red-100">
                           Delete Account
                       </button>
                  </div>
              </div>
          </div>
      )}

      {/* Success Modal Overlay */}
      {showSuccess && upgradedTier && (
          <div className="fixed inset-0 bg-secondary/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent"></div>
                  <div className="mx-auto w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle size={40} className="text-green-600 fill-white" />
                      </div>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Successful!</h2>
                  <p className="text-gray-500 mb-8">Your account has been upgraded.</p>
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-8 transform transition-transform hover:scale-105">
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">New Tier Status</p>
                      <p className="text-lg font-bold text-gray-800 flex items-center justify-center gap-2 mb-4">
                          <Shield className="text-primary fill-primary/10" size={18} /> {upgradedTier.title}
                      </p>
                      <div className="border-t border-gray-200 border-dashed my-3"></div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">New Loan Limit</p>
                      <p className="text-3xl font-black text-primary">{upgradedTier.limit}</p>
                  </div>
                  <button 
                      onClick={() => setShowSuccess(false)}
                      className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-2"
                  >
                      Continue Banking <ChevronRight size={20} />
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default KYC;