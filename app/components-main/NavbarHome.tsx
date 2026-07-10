'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, X, Search, Heart, Sun, Moon, User, LogOut, CheckCircle, AlertCircle, Package, MapPin } from 'lucide-react';
import { useCart } from '@/app/components-main/CartContext';
import CartDrawer from '@/app/components-main/CartDrawer';

interface NavbarProps { theme: 'dark' | 'light'; toggleTheme: () => void; }
interface UserData { name?: string; fullname?: string; email?: string; role?: string; isAdmin?: boolean; }

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Shop', path: '/category/collectors' },
  { name: 'Our Services', path: '/services' },
  { name: 'About Us', path: '/about' },
  { name: 'Testimonials', path: '/testimonials' },
];

const isLinkActive = (pathname: string, path: string) =>
  path === '/category/collectors' ? pathname.startsWith('/category') : pathname === path;

const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-4 right-4 z-[200] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium">{message}</span>
    </motion.div>
  );
};

const ConfirmationModal = ({ isOpen, onClose, onConfirm, theme }: { isOpen: boolean; onClose: () => void; onConfirm: () => void; theme: 'dark' | 'light' }) => {
  if (!isOpen) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className={`w-full max-w-md rounded-lg shadow-xl ${theme === 'light' ? 'bg-white' : 'bg-gray-900'}`} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Confirm Logout</h3>
          <p className={`mb-6 ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Are you sure you want to logout?</p>
          <div className="flex gap-3">
            <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium">Logout</button>
            <button onClick={onClose} className={`flex-1 px-4 py-2 rounded-lg font-medium ${theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-white/10 text-white'}`}>Cancel</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function NavbarHome({ theme, toggleTheme }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const pathname = usePathname();
  const { cartCount, openCart, closeCart } = useCart();

  useEffect(() => {
    checkLoginStatus();
    const handler = () => checkLoginStatus();
    window.addEventListener('storage', handler);
    window.addEventListener('authChange', handler);
    return () => { window.removeEventListener('storage', handler); window.removeEventListener('authChange', handler); };
  }, []);

  const checkLoginStatus = () => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try { setUserData(JSON.parse(storedUser)); setIsLoggedIn(true); }
      catch { setIsLoggedIn(false); setUserData(null); }
    } else { setIsLoggedIn(false); setUserData(null); }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false); setUserData(null);
    setIsProfileMenuOpen(false); setIsMobileMenuOpen(false); setShowLogoutConfirm(false);
    window.dispatchEvent(new CustomEvent('authChange'));
    setToast({ message: 'Logout successful!', type: 'success' });
  };

  const handleScroll = useCallback(() => setIsScrolled(window.scrollY > 20), []);
  useEffect(() => { window.addEventListener('scroll', handleScroll, { passive: true }); return () => window.removeEventListener('scroll', handleScroll); }, [handleScroll]);
  useEffect(() => { setIsMobileMenuOpen(false); setIsProfileMenuOpen(false); closeCart?.(); }, [pathname]);

  const bg = theme === 'light' ? (isScrolled ? 'bg-white/90 border-gray-200 shadow-sm' : 'bg-white/95 border-transparent') : (isScrolled ? 'bg-black/90 border-white/10 shadow-sm' : 'bg-black/95 border-transparent');
  const linkColor = theme === 'light' ? 'text-gray-800 hover:text-[#D4AF37]' : 'text-gray-300 hover:text-white';
  const logoColor = theme === 'light' ? 'text-gray-900' : 'text-white';
  const getUserInitials = () => { const n = userData?.fullname || userData?.name || ''; return n ? n.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2) : 'U'; };
  const displayName = userData?.fullname || userData?.name || 'User';

  return (
    <>
      <AnimatePresence>
        {showLogoutConfirm && <ConfirmationModal isOpen={showLogoutConfirm} onClose={() => setShowLogoutConfirm(false)} onConfirm={handleLogout} theme={theme} />}
      </AnimatePresence>
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>
      <CartDrawer theme={theme} />

      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 border-b backdrop-blur-md ${bg} ${isScrolled ? 'py-3' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 items-center w-full">
            <div className="flex justify-start">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`lg:hidden p-2 -ml-2 rounded-md ${linkColor}`}>{isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}</button>
              <Link href="/" className="hidden lg:flex items-center gap-2">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#D4AF37]"><img src="http://200.97.164.140/uploads/brands/wow-logo.svg" alt="WOW Lifestyle Thuriur" className="w-full h-full object-cover" /></div>
                <span className={`text-xl font-bold tracking-wider whitespace-nowrap ${logoColor}`}>WOW <span className="text-[#D4AF37]">LIFESTYLE</span></span>
              </Link>
            </div>

            <div className="flex justify-center items-center">
              <Link href="/" className="lg:hidden flex items-center justify-center">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[#D4AF37]"><img src="http://200.97.164.140/uploads/brands/wow-logo.svg" alt="Logo" className="w-full h-full object-cover" /></div>
              </Link>
              <div className="hidden lg:flex items-center space-x-8">
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.path} className={`text-sm font-medium transition-colors whitespace-nowrap ${isLinkActive(pathname, link.path) ? 'text-[#D4AF37]' : linkColor}`}>{link.name}</Link>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 sm:space-x-5">
              <button onClick={toggleTheme} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'bg-gray-100 hover:bg-gray-200 text-gray-800' : 'bg-gray-800 hover:bg-gray-700 text-yellow-400'}`}>
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className={`hidden sm:block ${linkColor}`}><Search size={18} /></button>
              <Link href="/wishlist" className={`hidden sm:block ${pathname === '/wishlist' ? 'text-[#D4AF37]' : linkColor}`} aria-label="Wishlist"><Heart size={18} /></Link>

              {isLoggedIn ? (
                <div className="relative">
                  <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className={`flex items-center gap-2 px-1.5 py-1.5 sm:px-2 sm:py-1 rounded-full transition-all border ${theme === 'light' ? 'border-gray-200 hover:border-[#D4AF37] bg-gray-100' : 'border-white/20 hover:border-[#D4AF37] bg-white/10'}`}>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold bg-[#D4AF37] text-black">{getUserInitials()}</div>
                    <span className={`hidden md:block text-sm font-medium max-w-[100px] truncate ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{displayName}</span>
                  </button>
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-white/10'}`}>
                        <div className={`px-4 py-3 border-b ${theme === 'light' ? 'border-gray-100' : 'border-white/10'}`}>
                          <p className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{displayName}</p>
                          <p className={`text-xs truncate ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'}`}>{userData?.email || ''}</p>
                        </div>
                        {(userData?.role === 'admin' || userData?.isAdmin) && (
                          <Link href="/admin/dashboard" className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${theme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-white/10'}`} onClick={() => setIsProfileMenuOpen(false)}>
                            <User size={16} /><span>Admin Dashboard</span>
                          </Link>
                        )}
                        <Link href="/orders" className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${theme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-white/10'}`} onClick={() => setIsProfileMenuOpen(false)}><Package size={16} /><span>Orders</span></Link>
                        <Link href="/wishlist" className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${theme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-white/10'}`} onClick={() => setIsProfileMenuOpen(false)}><Heart size={16} /><span>Wishlist</span></Link>
                        <Link href="/account/addresses" className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${theme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-white/10'}`} onClick={() => setIsProfileMenuOpen(false)}><MapPin size={16} /><span>Saved Addresses</span></Link>
                        <button onClick={() => { setShowLogoutConfirm(true); setIsProfileMenuOpen(false); }} className={`flex items-center gap-3 w-full text-left px-4 py-2 text-sm transition-colors ${theme === 'light' ? 'text-red-600 hover:bg-red-50' : 'text-red-400 hover:bg-red-500/10'}`}><LogOut size={16} /><span>Logout</span></button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login" className={`hidden sm:block px-5 py-2 rounded-full text-sm font-semibold transition-all border ${theme === 'light' ? 'border-gray-300 text-gray-800 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-white' : 'border-white/20 text-white hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black'}`}>Login</Link>
              )}

              <div className="relative cursor-pointer hover:scale-105 pl-1" onClick={() => openCart?.('cart')}>
                <ShoppingBag size={20} className={linkColor} />
                {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-[#D4AF37] text-white text-[10px] w-4 h-4 font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className={`lg:hidden overflow-hidden border-t ${theme === 'light' ? 'bg-white border-gray-100' : 'bg-black border-white/10'}`}>
              <div className="px-4 py-6 space-y-2">
                {isLoggedIn && (
                  <div className={`px-4 py-3 mb-4 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-white/10'}`}>
                    <p className={`text-sm font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{displayName}</p>
                    <p className={`text-xs truncate ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>{userData?.email || ''}</p>
                  </div>
                )}
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.path} className={`block px-4 py-3 text-lg font-semibold rounded-lg transition-all ${isLinkActive(pathname, link.path) ? 'text-[#D4AF37] bg-[#D4AF37]/10' : theme === 'light' ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-200 hover:bg-white/10'}`} onClick={() => setIsMobileMenuOpen(false)}>{link.name}</Link>
                ))}
                {isLoggedIn && (userData?.role === 'admin' || userData?.isAdmin) && (
                  <Link href="/admin/dashboard" className={`block px-4 py-3 text-lg font-semibold rounded-lg ${theme === 'light' ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-200 hover:bg-white/10'}`} onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</Link>
                )}
                {isLoggedIn && (
                  <Link href="/orders" className={`block px-4 py-3 text-lg font-semibold rounded-lg ${pathname === '/orders' ? 'text-[#D4AF37] bg-[#D4AF37]/10' : theme === 'light' ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-200 hover:bg-white/10'}`} onClick={() => setIsMobileMenuOpen(false)}>My Orders</Link>
                )}
                <Link href="/wishlist" className={`block px-4 py-3 text-lg font-semibold rounded-lg ${pathname === '/wishlist' ? 'text-[#D4AF37] bg-[#D4AF37]/10' : theme === 'light' ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-200 hover:bg-white/10'}`} onClick={() => setIsMobileMenuOpen(false)}>Wishlist</Link>
                {isLoggedIn && (
                  <Link href="/account/addresses" className={`block px-4 py-3 text-lg font-semibold rounded-lg ${pathname === '/account/addresses' ? 'text-[#D4AF37] bg-[#D4AF37]/10' : theme === 'light' ? 'text-gray-800 hover:bg-gray-100' : 'text-gray-200 hover:bg-white/10'}`} onClick={() => setIsMobileMenuOpen(false)}>Saved Addresses</Link>
                )}
                <div className="pt-4 mt-4 border-t border-gray-100/10 flex items-center gap-6 px-4">
                  <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)}><Heart size={22} className={linkColor} /></Link>
                  <Search size={22} className={`${linkColor} sm:hidden`} />
                </div>
                <div className="px-4 pb-2 pt-4">
                  {isLoggedIn ? (
                    <button onClick={() => { setShowLogoutConfirm(true); setIsMobileMenuOpen(false); }} className="block w-full text-center py-3 rounded-lg font-bold bg-red-500 text-white hover:bg-red-600">Logout</button>
                  ) : (
                    <Link href="/login" className={`block w-full text-center py-3 rounded-lg font-bold ${theme === 'light' ? 'bg-gray-100 text-gray-900 hover:bg-[#D4AF37] hover:text-white' : 'bg-white/10 text-white hover:bg-[#D4AF37] hover:text-black'}`} onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
