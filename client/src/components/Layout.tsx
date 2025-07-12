import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Bell, Search, Menu, X, User, LogOut, Settings, LogIn, Check, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsAPI } from '../lib/api';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch notifications (only for non-guest users)
  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsAPI.getAll().then(res => res.data),
    enabled: isAuthenticated && user?.role !== 'guest',
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Safely handle notifications data
  const notifications = Array.isArray(notificationsData?.notifications) 
    ? notificationsData.notifications 
    : [];

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/questions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark as read
      await notificationsAPI.markAsRead(notification._id);
      
      // Navigate to the notification link if it exists
      if (notification.link) {
        navigate(notification.link);
      }
      
      // Close notification dropdown
      setIsNotificationOpen(false);
      
      // Refetch notifications
      refetchNotifications();
      
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      refetchNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsAPI.delete(notificationId);
      refetchNotifications();
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'answer':
        return '💬';
      case 'upvote':
        return '👍';
      case 'accept':
        return '✅';
      case 'mention':
        return '@';
      default:
        return '🔔';
    }
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/questions', label: 'Questions' },
    ...(isAuthenticated && user?.role !== 'guest' ? [{ href: '/ask', label: 'Ask Question' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-stackit-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-stackit-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-stackit rounded-xl flex items-center justify-center shadow-stackit group-hover:shadow-stackit-hover transition-all duration-300 transform group-hover:scale-105">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-2xl font-bold text-gradient">StackIt</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-10 md:flex md:space-x-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === item.href
                        ? 'nav-link-active'
                        : 'nav-link'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full input-stackit"
                  />
                </div>
              </form>
            </div>

            {/* Right side - Auth & Notifications */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              {isAuthenticated && user?.role !== 'guest' && (
                <div className="relative" ref={notificationRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative vote-button"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="notification-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>

                  {/* Notifications Dropdown */}
                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-stackit-100 z-50 animate-fade-in">
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                          <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="vote-button text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark all read
                              </Button>
                            )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsNotificationOpen(false)}
                            className="vote-button"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          </div>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {notifications.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No notifications</p>
                          ) : (
                            notifications.map((notification: any) => (
                              <div
                                key={notification._id}
                                className={`p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                                  notification.isRead ? 'bg-gray-50 hover:bg-gray-100' : 'bg-stackit-50 hover:bg-stackit-100'
                                }`}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                                <p className="text-sm text-gray-900">{notification.message}</p>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {formatNotificationTime(notification.createdAt)}
                                    </p>
                                  </div>
                                  <button
                                    onClick={(e) => handleDeleteNotification(notification._id, e)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center space-x-2 vote-button"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-6 h-6 rounded-full border-2 border-stackit-200"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-stackit flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="hidden md:block font-medium">{user?.username}</span>
                  </Button>

                  {/* User Dropdown */}
                  {isMobileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stackit-100 z-50 animate-fade-in">
                      <div className="py-1">
                        {user?.role !== 'guest' && (
                          <Link
                            to="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-stackit-50 hover:text-stackit-600 transition-colors duration-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            Profile
                          </Link>
                        )}
                        {user?.role !== 'guest' && (
                          <Link
                            to="/settings"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-stackit-50 hover:text-stackit-600 transition-colors duration-200"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </Link>
                        )}
                        {user?.role === 'guest' && (
                          <button
                            onClick={() => {
                              logout();
                              navigate('/login');
                              setIsMobileMenuOpen(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Switch to Main Account
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="nav-link">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="btn-stackit">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="vote-button"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden animate-slide-in">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                      location.pathname === item.href
                        ? 'nav-link-active'
                        : 'nav-link'
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="px-3 py-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full input-stackit"
                    />
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 