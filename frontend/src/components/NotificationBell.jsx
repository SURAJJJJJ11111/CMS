import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Clock } from 'lucide-react';
import { notificationAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const clientRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      connectWebSocket();
    }
    return () => disconnectWebSocket();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount()
      ]);
      setNotifications(notifRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const connectWebSocket = () => {
    const socket = new SockJS((import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace('/api', '/ws'));
    const client = new Client({
      webSocketFactory: () => socket,
      debug: function (str) { /* console.log(str) */ },
      onConnect: () => {
        client.subscribe(`/topic/notifications/${user.id}`, (msg) => {
          const newNotif = JSON.parse(msg.body);
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast(newNotif.title, { icon: '🔔' });
        });
      },
    });
    client.activate();
    clientRef.current = client;
  };

  const disconnectWebSocket = () => {
    if (clientRef.current) {
      clientRef.current.deactivate();
    }
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      setIsOpen(false);
    } catch (err) {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 bg-dark-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors relative"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary-600 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-800/80 backdrop-blur">
            <h3 className="text-white font-bold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs text-primary-400 hover:text-primary-300 font-medium">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <Bell size={24} className="text-slate-600" />
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-4 border-b border-dark-700/50 hover:bg-dark-700/50 transition-colors flex gap-3 ${!n.read ? 'bg-primary-900/10' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.read ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-600 text-slate-400'}`}>
                    <Bell size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm font-medium truncate ${!n.read ? 'text-white' : 'text-slate-300'}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <button onClick={(e) => handleMarkAsRead(n.id, e)} className="text-slate-500 hover:text-emerald-400 transition-colors" title="Mark as read">
                          <CheckCircle2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                      <Clock size={10} />
                      {new Date(n.createdAt).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
