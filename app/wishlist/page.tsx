'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Trash2, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import NavbarHome from '@/app/components-main/NavbarHome';
import { useCart } from '@/app/components-main/CartContext';
import { getWishlist, removeWishlistItem, syncWishlistFromServer } from '@/app/utils/wishlist';

const API_URL = '/api';

export default function WishlistPage() {
  const router = useRouter();
  const { addToCart } = useCart() as any;

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [ids, setIds] = useState<string[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastProduct, setToastProduct] = useState('');

  const isDark  = theme === 'dark';
  const gold    = '#C9A84C';
  const bg      = isDark ? '#070707' : '#FFFFFF';
  const surface = isDark ? '#0D0D0D' : '#FFFFFF';
  const border  = isDark ? '#1C1C1C' : '#EAEAEA';
  const textPri = isDark ? '#F0EAD6' : '#111827';
  const textSec = isDark ? '#9A8E7A' : '#6B7280';

  /* theme sync with the rest of the site */
  useEffect(() => {
    const handler = (e: CustomEvent) => { if (e.detail) setTheme(e.detail as 'dark' | 'light'); };
    window.addEventListener('theme-change', handler as EventListener);
    const cur = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (cur) setTheme(cur);
    return () => window.removeEventListener('theme-change', handler as EventListener);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }));
  };

  /* load wishlist ids + all products, then match them up */
  useEffect(() => {
    const load = async () => {
      try {
        const wishIds = await syncWishlistFromServer();
        setIds(wishIds);
        const res = await fetch(`${API_URL}/admin/products?t=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.products || data.data || [];
        setProducts(arr);
      } catch (err) {
        console.error(err);
        setIds(getWishlist());
      } finally {
        setIsLoading(false);
      }
    };
    load();

    const handler = (e: any) => setIds(e.detail || getWishlist());
    window.addEventListener('wishlistChange', handler);
    return () => window.removeEventListener('wishlistChange', handler);
  }, []);

  const items = products.filter(p => ids.includes(p._id || p.id));

  const handleRemove = (id: string) => setIds(removeWishlistItem(id));

  const handleAddToCart = (product: any) => {
    if (product.totalStock <= 0) return;
    const img = product.images?.length > 0 ? product.images[0] : product.imageUrl;
    addToCart({ ...product, id: product._id || product.id, image: img, totalStock: product.totalStock });
    setToastProduct(product.title);
    setTimeout(() => setToastProduct(''), 3000);
  };

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: bg, color: textPri }}>
      <NavbarHome theme={theme} toggleTheme={toggleTheme} />

      {/* Toast */}
      <AnimatePresence>
        {toastProduct && (
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-8 right-8 z-[300] flex items-center gap-3 px-5 py-3.5 shadow-2xl rounded-xl"
            style={{ background: gold, color: '#000' }}>
            <CheckCircle size={15} strokeWidth={2.5} />
            <div>
              <p className="font-semibold text-xs leading-none mb-0.5 tracking-wide">Added to Cart</p>
              <p className="text-[10px] opacity-70 max-w-[180px] truncate">{toastProduct}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        <div className="flex items-center gap-3 mb-8">
          <Heart size={22} style={{ color: gold }} fill={gold} />
          <h1 className="text-2xl font-bold" style={{ color: textPri }}>My Wishlist</h1>
          {items.length > 0 && (
            <span className="text-sm" style={{ color: textSec }}>({items.length} item{items.length !== 1 ? 's' : ''})</span>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin mb-4" style={{ color: gold }} />
            <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: textSec }}>Loading Wishlist</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Heart size={40} className="mb-4 opacity-20" style={{ color: textSec }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: textPri }}>Your wishlist is empty</h3>
            <p className="text-sm mb-8" style={{ color: textSec }}>Tap the heart on any product to save it here.</p>
            <Link href="/category/collectors"
              className="inline-flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-[0.25em] uppercase rounded-md transition-opacity hover:opacity-85"
              style={{ background: `linear-gradient(135deg, ${gold}, #E2BE6A)`, color: '#000' }}>
              Start Shopping <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {items.map((product) => {
              const productId = product._id || product.id;
              const img = product.images?.length > 0 ? product.images[0] : product.imageUrl;
              const isOutOfStock = product.totalStock <= 0;
              return (
                <motion.div key={productId} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col rounded-xl overflow-hidden cursor-pointer group"
                  style={{ background: surface, border: `1px solid ${border}` }}
                  onClick={() => router.push(`/product/${productId}`)}>
                  <div className="relative overflow-hidden" style={{ aspectRatio: '1/1', background: isDark ? '#111' : '#F9F9F9' }}>
                    <img src={img} alt={product.title} className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`} />
                    <button onClick={(e) => { e.stopPropagation(); handleRemove(productId); }}
                      className="absolute top-2.5 right-2.5 z-10 w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-md transition-all hover:scale-110"
                      style={{ background: isDark ? 'rgba(13,13,13,0.6)' : 'rgba(255,255,255,0.85)', border: `1px solid ${border}` }}
                      aria-label="Remove from wishlist">
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                  <div className="px-3 pt-3 pb-2.5 flex flex-col gap-1 flex-1">
                    <span className="text-[9px] font-bold tracking-[0.3em] uppercase" style={{ color: isDark ? gold : '#B8860B' }}>{product.brand}</span>
                    <h3 className="text-[12px] font-medium leading-snug line-clamp-2" style={{ color: textPri }}>{product.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[15px] font-semibold" style={{ color: textPri }}>₹{product.price?.toLocaleString()}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-[11px] line-through" style={{ color: textSec }}>₹{product.originalPrice?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                    disabled={isOutOfStock}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[9px] font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ borderTop: `1px solid ${border}`, background: isOutOfStock ? 'transparent' : `linear-gradient(135deg, ${gold}, #E2BE6A)`, color: isOutOfStock ? textSec : '#000' }}>
                    <ShoppingCart size={11} />
                    {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
