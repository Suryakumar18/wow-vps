'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/app/components-main/CartContext';

interface CartDrawerProps {
  theme: 'dark' | 'light';
}

export default function CartDrawer({ theme }: CartDrawerProps) {
  const router = useRouter();
  const { cart, removeFromCart, addToCart, decreaseQuantity, cartCount, isCartOpen, closeCart, setBuyNowItem } = useCart();

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleProceedToCheckout = () => {
    setBuyNowItem(null);
    closeCart();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCart} className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm" />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed top-0 right-0 h-full shadow-2xl flex flex-col z-[210] w-full sm:w-[450px] ${theme === 'light' ? 'bg-white' : 'bg-[#0a0a0a] border-l border-[#222]'}`}
          >
            <div className={`flex items-center justify-between p-5 sm:p-6 border-b flex-shrink-0 ${theme === 'light' ? 'border-gray-200' : 'border-[#222]'}`}>
              <div className="flex items-center gap-3">
                <ShoppingBag className={theme === 'light' ? 'text-amber-600' : 'text-[#D4AF37]'} size={24} />
                <h2 className={`text-xl font-black tracking-widest uppercase ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Your Vault ({cartCount})</h2>
              </div>
              <button onClick={closeCart} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-[#222] text-gray-400 hover:text-white'}`}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
              <div className="h-full flex flex-col absolute inset-0">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-5">
                      <div className={`p-6 rounded-full ${theme === 'light' ? 'bg-amber-50' : 'bg-[#111] border border-[#222]'}`}>
                        <ShoppingBag size={48} className={theme === 'light' ? 'text-amber-300' : 'text-[#D4AF37]/50'} />
                      </div>
                      <div>
                        <h3 className={`font-black text-xl tracking-widest uppercase ${theme === 'light' ? 'text-gray-900' : 'text-[#D4AF37]'}`}>Vault is Empty</h3>
                        <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>Discover our premium collection to add items.</p>
                      </div>
                      <button onClick={closeCart} className={`mt-4 px-8 py-3 font-bold uppercase tracking-widest rounded-md transition-all ${theme === 'light' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black'}`}>
                        Explore Collection
                      </button>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className={`flex gap-4 p-4 rounded-xl border transition-colors ${theme === 'light' ? 'bg-white border-gray-100 hover:border-amber-200 shadow-sm' : 'bg-[#0f0f0f] border-[#222] hover:border-[#D4AF37]/50'}`}>
                        <div className={`w-24 h-24 rounded-lg flex-shrink-0 flex items-center justify-center p-2 ${theme === 'light' ? 'bg-gray-50' : 'bg-[#141414]'}`}>
                          <img src={item.image} alt={item.title} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className={`font-medium text-sm line-clamp-2 ${theme === 'light' ? 'text-gray-900' : 'text-gray-200'}`}>{item.title}</h4>
                              <button onClick={() => removeFromCart(item.id)} className={`p-1.5 rounded transition-colors ${theme === 'light' ? 'text-gray-400 hover:bg-red-50 hover:text-red-500' : 'text-gray-500 hover:bg-[#222] hover:text-red-400'}`}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <p className={`font-black tracking-wide mt-2 ${theme === 'light' ? 'text-amber-600' : 'text-[#D4AF37]'}`}>₹{item.price}</p>
                          </div>
                          <div className="flex items-center mt-3">
                            <div className={`flex items-center rounded-md border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-[#333] bg-[#111]'}`}>
                              <button onClick={() => decreaseQuantity(item.id)} className={`p-2 transition-colors ${theme === 'light' ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}><Minus size={14} /></button>
                              <span className={`w-10 text-center text-sm font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{item.quantity}</span>
                              <button onClick={() => addToCart(item)} disabled={item.quantity >= (item.totalStock || Infinity)} className={`p-2 transition-colors ${item.quantity >= (item.totalStock || Infinity) ? 'opacity-30 cursor-not-allowed' : (theme === 'light' ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#222]')}`}><Plus size={14} /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className={`p-6 border-t flex-shrink-0 ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-[#222] bg-[#0a0a0a]'}`}>
                    <div className="space-y-4 mb-6">
                      <div className={`flex justify-between text-sm font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <span>Subtotal</span><span className={theme === 'light' ? 'text-gray-900' : 'text-white'}>₹{subtotal}</span>
                      </div>
                      <div className={`flex justify-between text-sm font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <span>Shipping</span><span>Calculated at checkout</span>
                      </div>
                      <div className={`flex justify-between items-center border-t pt-4 mt-4 ${theme === 'light' ? 'border-gray-200' : 'border-[#222]'}`}>
                        <span className={`text-sm font-bold uppercase tracking-widest ${theme === 'light' ? 'text-gray-900' : 'text-[#D4AF37]'}`}>Total</span>
                        <span className={`text-2xl font-black ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>₹{subtotal}</span>
                      </div>
                    </div>
                    <button onClick={handleProceedToCheckout} className={`w-full py-4 font-black uppercase tracking-[0.15em] rounded-md transition-all flex items-center justify-center gap-2 group ${theme === 'light' ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md' : 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'}`}>
                      Proceed to Checkout
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
