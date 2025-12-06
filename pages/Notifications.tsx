import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockAPI } from '../services/mockBackend';
import { Notification } from '../types';
import { Bell, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (user) {
      MockAPI.getNotifications(user.id).then(setNotifications);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    await MockAPI.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle className="text-green-500" />;
      case 'ALERT': return <AlertTriangle className="text-red-500" />;
      default: return <Info className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Bell className="text-primary" /> Notifications
      </h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p>No notifications yet.</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div key={notif.id} className={`p-6 flex gap-4 ${notif.read ? 'bg-white' : 'bg-blue-50/50'}`}>
                <div className="mt-1">{getIcon(notif.type)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-bold text-gray-800 ${!notif.read && 'text-blue-700'}`}>{notif.title}</h3>
                    <span className="text-xs text-gray-400">{new Date(notif.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 mt-1">{notif.message}</p>
                </div>
                {!notif.read && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="self-center p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-primary transition-colors"
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;