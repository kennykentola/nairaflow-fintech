import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MockAPI } from '../services/mockBackend';
import { SupportMessage } from '../types';
import { Send, User as UserIcon, Headset, Loader2 } from 'lucide-react';

const Support = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000); // Polling for mock new messages
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (user) {
      const msgs = await MockAPI.getSupportMessages(user.id);
      setMessages(msgs);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const text = input;
    setInput('');
    setSending(true);
    
    // Optimistic UI update
    const tempMsg: SupportMessage = {
      id: 'temp', userId: user.id, text, sender: 'USER', timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    await MockAPI.sendSupportMessage(user.id, text);
    setSending(false);
    loadMessages();
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <Headset className="text-primary" /> Customer Support
      </h2>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="bg-primary/5 p-4 border-b border-primary/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Headset size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">NairaFlow Live Agent</h3>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg, idx) => {
            const isUser = msg.sender === 'USER';
            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 ${isUser ? 'bg-primary text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'}`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${isUser ? 'text-emerald-100' : 'text-gray-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-gray-50"
            />
            <button 
              type="submit" 
              disabled={sending || !input.trim()}
              className="bg-primary hover:bg-emerald-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
            >
              {sending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Support;