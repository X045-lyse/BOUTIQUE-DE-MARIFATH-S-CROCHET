
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, Menu, X, Instagram, Facebook, MessageCircle, 
  ArrowRight, Heart, Plus, Edit2, Trash2, Star, Camera, Settings, Lock, Eye, EyeOff, LogOut, Sun, Moon 
} from 'lucide-react';
import { WHATSAPP_NUMBER, BRAND_NAME, ADMIN_PASSWORD } from './constants';
import { Product, CartItem, Review } from './types';
import { supabase } from './supabaseClient';

type DbProduct = Product & { created_at?: string | null };
type DbReview = {
  id: string;
  first_name: string;
  last_name: string;
  comment: string;
  rating: number;
  image?: string | null;
  date: string;
  created_at?: string | null;
};

const mapDbProduct = (row: DbProduct): Product => ({
  id: row.id,
  name: row.name,
  description: row.description,
  price: row.price,
  image: row.image,
  category: row.category as Product['category'],
});

const mapDbReview = (row: DbReview): Review => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  comment: row.comment,
  rating: row.rating,
  image: row.image ?? undefined,
  date: row.date,
});

const App: React.FC = () => {
  const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET;
  // --- THEME STATE ---
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('mc_theme');
    return saved === 'dark';
  });

  // --- STATE ---
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Admin Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
  // Review Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // --- EFFECTS ---
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // --- DATA FETCH ---
  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement produits', error);
      return;
    }

    const mapped = (data as DbProduct[] ?? []).map(mapDbProduct);

    // If images are stored as storage paths (not full URLs), try to generate public URLs
    if (SUPABASE_BUCKET) {
      const transformed = mapped.map(p => {
        if (!p.image) return p;
        const img = String(p.image);
        if (img.startsWith('http') || img.startsWith('data:')) return p;
        try {
          const { data: urlData } = supabase.storage.from(String(SUPABASE_BUCKET)).getPublicUrl(img);
          return { ...p, image: urlData.publicUrl || img };
        } catch (err) {
          console.warn('Could not generate public url for', img, err);
          return p;
        }
      });
      setProducts(transformed);
    } else {
      setProducts(mapped);
    }
  }, []);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur chargement avis', error);
      return;
    }

    setReviews((data as DbReview[] ?? []).map(mapDbReview));
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchReviews();
  }, [fetchProducts, fetchReviews]);

  // --- PERSISTENCE (theme only) ---
  useEffect(() => {
    localStorage.setItem('mc_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // --- ACTIONS ---
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.price * item.quantity), 0), [cart]);

  const checkoutViaWhatsApp = () => {
    const itemsList = cart.map(item => `- ${item.name} (x${item.quantity})`).join('\n');
    const message = encodeURIComponent(
      `Bonjour Marifath !\n\nJe souhaite passer une commande pour :\n${itemsList}\n\nTotal: ${total.toLocaleString()} FCFA\n\nMerci de me confirmer la disponibilité.`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
  };

  // Dev helper: test Supabase connection
  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('products').select('id').limit(1);
      if (error) {
        console.error('Supabase test error', error);
        alert(`Supabase test error: ${error.message}`);
      } else {
        console.log('Supabase test success', data);
        alert('Supabase test success — la connexion fonctionne.');
      }
    } catch (err) {
      console.error('Supabase test exception', err);
      alert(`Exception lors du test Supabase: ${String(err)}`);
    }
  };

  // --- ADMIN ACTIONS ---
  const handleAdminToggle = () => {
    if (isAdmin) {
      setIsAdmin(false);
    } else {
      setIsAuthModalOpen(true);
      setAuthError("");
      setAuthPassword("");
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setIsAuthModalOpen(false);
      setAuthError("");
    } else {
      setAuthError("Mot de passe incorrect");
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: Number(formData.get('price')),
      // Prefer uploaded preview (`image_preview`) over pasted URL (`image`)
      image: (formData.get('image_preview') as string) || (formData.get('image') as string) || "https://images.unsplash.com/photo-1544441893-675973e31d85?auto=format&fit=crop&q=80&w=800",
      category: formData.get('category'),
    };

    // Basic validation
    if (!payload.name || !payload.price) {
      alert('Le nom et le prix sont requis.');
      return;
    }

    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        const { error, status } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) {
          alert(`Échec de la mise à jour du produit: ${error.message}`);
          console.error('Update error', error);
          setIsSavingProduct(false);
          return;
        }
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) {
          alert(`Échec de l'ajout du produit: ${error.message}`);
          console.error('Insert error', error);
          setIsSavingProduct(false);
          return;
        }
      }

      await fetchProducts();
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (err) {
      console.error('Save product exception', err);
      alert('Erreur inattendue lors de l\'enregistrement du produit. Consulte la console.');
    } finally {
      setIsSavingProduct(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert("Impossible de supprimer ce produit.");
      console.error(error);
      return;
    }

    await fetchProducts();
  };

  // --- REVIEW ACTIONS ---
  const handleAddReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      comment: formData.get('comment'),
      rating: Number(formData.get('rating')),
      image: formData.get('image_preview'),
      date: new Date().toISOString().split('T')[0],
    };

    const { error } = await supabase.from('reviews').insert(payload);
    if (error) {
      alert("Impossible d'ajouter l'avis.");
      console.error(error);
      return;
    }

    await fetchReviews();
    setIsReviewModalOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetId: string) => {
    const file = e.target.files?.[0];
    const input = document.getElementById(targetId) as HTMLInputElement | null;
    if (!file) return;

    // If a Supabase bucket is configured, upload the file and store its public URL
    if (SUPABASE_BUCKET) {
      try {
        const safeName = file.name.replace(/\s+/g, '_');
        const filePath = `products/${Date.now()}_${safeName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from(String(SUPABASE_BUCKET)).upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error('Upload error', uploadError);
        } else {
          const { data: urlData } = supabase.storage.from(String(SUPABASE_BUCKET)).getPublicUrl(filePath);
          const publicUrl = urlData?.publicUrl || '';
          if (input) input.value = publicUrl;
          return;
        }
      } catch (err) {
        console.error('Upload exception', err);
      }
    }

    // Fallback: store base64 data URL in the hidden input
    const reader = new FileReader();
    reader.onloadend = () => {
      if (input) input.value = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const categories = ['Tous', 'Hauts', 'Robes', 'Accessoires', 'Ensembles'];
  const filteredProducts = activeCategory === 'Tous' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-[#fdfdfd] text-gray-900'} selection:bg-[#00bcd4]/30`}>
      {/* Navigation */}
      <nav className={`fixed w-full z-40 transition-colors duration-500 border-b shadow-sm ${isDarkMode ? 'bg-[#1a1a1a]/95 border-white/5' : 'bg-white/95 border-gray-100'} backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-600 border border-gray-200 rounded-2xl shadow-sm"><Menu /></button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveCategory('Tous')}>
               <div className="w-10 h-10 bg-[#e91e63] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-pink-200">M</div>
               <span className="text-xl font-bold tracking-tight hidden sm:block">
                 <span className="text-[#e91e63]">Marifath's</span> <span className="text-[#00bcd4]">Crochet</span>
               </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 lg:gap-8 text-[11px] lg:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`transition-all hover:text-[#00bcd4] relative py-1 ${activeCategory === cat ? 'text-[#00bcd4]' : ''}`}
              >
                {cat}
                {activeCategory === cat && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00bcd4] rounded-full"></span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-white/5 text-[#00bcd4] hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button 
              onClick={handleAdminToggle}
              className={`p-2 rounded-full transition-all flex items-center gap-2 ${isAdmin ? 'bg-[#00bcd4] text-black ring-2 ring-[#00bcd4]/50' : 'bg-gray-100 text-gray-600 hover:bg-[#00bcd4]/10 hover:text-[#00bcd4] dark:bg-white/5 dark:text-gray-400 dark:hover:text-[#00bcd4]'}`}
            >
              {isAdmin ? <LogOut className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
              {isAdmin && <span className="text-xs font-bold uppercase hidden sm:inline">Admin</span>}
            </button>
            
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:text-[#e91e63] transition-colors">
              <ShoppingBag className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e91e63] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-pink-200 animate-pulse">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
            {import.meta.env.DEV && (
              <button onClick={testSupabaseConnection} className="ml-2 p-2 text-xs bg-yellow-300 rounded-md">Test Supabase</button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-x-0 top-0 bg-white text-gray-900 rounded-b-[2.5rem] shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#e91e63] rounded-full flex items-center justify-center text-white font-bold text-2xl">M</div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-gray-400">Marifath's</p>
                  <p className="text-xl font-bold text-[#00bcd4]">Crochet</p>
                </div>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-500 hover:text-black">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex flex-col gap-4 text-lg font-semibold">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setIsMenuOpen(false);
                    document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`py-3 rounded-2xl border ${activeCategory === cat ? 'bg-[#00bcd4]/10 border-[#00bcd4] text-[#00bcd4]' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { setIsMenuOpen(false); handleAdminToggle(); }}
                className="w-full bg-[#00bcd4] text-black py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg"
              >
                Portail Admin
              </button>
              <button 
                onClick={() => { setIsMenuOpen(false); setIsCartOpen(true); }}
                className="w-full border border-gray-200 py-4 rounded-2xl font-black uppercase tracking-widest"
              >
                Voir le Panier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-16 sm:pt-20">
        <div className="relative min-h-[70vh] sm:min-h-[80vh] w-full overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=1920" 
            alt="Crochet Hero" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-center px-4">
            <div className="text-center max-w-4xl px-2">
              <h2 className="text-[#00bcd4] text-xs sm:text-sm font-bold uppercase tracking-[0.5em] mb-5 drop-shadow-lg">Atelier & Création</h2>
              <h1 className="text-4xl sm:text-6xl lg:text-8xl text-white font-serif mb-6 sm:mb-8 italic drop-shadow-2xl leading-tight">Créations au Crochet</h1>
              <p className="text-white/90 text-base sm:text-lg lg:text-2xl mb-8 sm:mb-12 font-light max-w-3xl mx-auto leading-relaxed px-1">
                Design et confection de vêtements en crochet, pièces uniques réalisées à la main par Marifath. Découvrez nos techniques, matériaux et finitions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
                <button 
                  onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-[#00bcd4] hover:bg-[#0097a7] text-white px-10 sm:px-12 py-4 sm:py-5 rounded-full font-bold transition-all flex items-center justify-center gap-3 shadow-2xl shadow-cyan-900/50 w-full sm:w-auto"
                >
                  Découvrir la Collection <ArrowRight className="w-6 h-6" />
                </button>
                <button 
                   onClick={() => setIsReviewModalOpen(true)}
                   className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white hover:text-black px-10 sm:px-12 py-4 sm:py-5 rounded-full font-bold transition-all w-full sm:w-auto"
                >
                   Témoignages
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Panel Header */}
      {isAdmin && (
        <div className={`border-y py-8 px-4 relative overflow-hidden transition-colors ${isDarkMode ? 'bg-[#00bcd4]/10 border-[#00bcd4]/30' : 'bg-[#00bcd4]/5 border-[#00bcd4]/10'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00bcd4]/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-black rounded-2xl shadow-lg border border-[#00bcd4]/20">
                <Settings className="text-[#00bcd4] w-8 h-8" />
              </div>
              <div>
                <h2 className={`text-2xl font-bold uppercase tracking-tight ${isDarkMode ? 'text-[#00bcd4]' : 'text-gray-900'}`}>Édition de l'Atelier</h2>
                <p className="text-gray-500 text-sm">Gérez vos créations signées Marifath's Crochet</p>
              </div>
            </div>
            <button 
              onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
              className="bg-[#00bcd4] text-black px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl shadow-cyan-900/20"
            >
              <Plus className="w-5 h-5" /> Nouvelle Création
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 flex-grow">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6 sm:gap-8">
          <div className="space-y-2 sm:space-y-3">
            <span className="text-[#e91e63] font-bold tracking-[0.4em] uppercase text-[10px] sm:text-xs">Collection Atelier</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif italic leading-tight">Designs et Conceptions</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide w-full md:w-auto">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 sm:px-8 py-3 rounded-full whitespace-nowrap text-[11px] sm:text-xs font-bold uppercase tracking-widest transition-all shadow-sm ${
                  activeCategory === cat 
                  ? (isDarkMode ? 'bg-[#00bcd4] text-black' : 'bg-black text-[#00bcd4]') 
                  : (isDarkMode ? 'bg-[#1a1a1a] text-gray-500 border border-white/5' : 'bg-white text-gray-400 border border-gray-100')
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16">
          {filteredProducts.map(product => (
            <div key={product.id} className="group relative">
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-[2.5rem] shadow-2xl border border-transparent dark:border-white/5">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Product Controls */}
                <div className="absolute top-6 right-6 flex flex-col gap-3">
                  <button className="bg-white/90 backdrop-blur-md p-4 rounded-full hover:bg-[#e91e63] hover:text-white transition-all shadow-xl group/heart">
                    <Heart className="w-6 h-6 text-gray-900 group-hover/heart:text-white" />
                  </button>
                  {isAdmin && (
                    <>
                      <button 
                        onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                        className="bg-[#00bcd4] text-white p-4 rounded-full hover:bg-cyan-600 shadow-xl transition-all"
                      >
                        <Edit2 className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => deleteProduct(product.id)}
                        className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 shadow-xl transition-all"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-10 translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out">
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-full bg-[#00bcd4] text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-cyan-900/60 active:scale-95 transition-all"
                  >
                    <ShoppingBag className="w-6 h-6" />
                    Ajouter au Panier
                  </button>
                </div>
              </div>

              <div className="mt-10 text-center sm:text-left px-4">
                <div className="flex items-center justify-between gap-6">
                  <span className="text-[#00bcd4] text-[11px] font-black uppercase tracking-[0.3em]">{product.category}</span>
                  <div className={`h-[1px] flex-grow ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}></div>
                  <span className="text-[#e91e63] font-black text-xs uppercase tracking-tighter italic">Signature Marifath</span>
                </div>
                <h3 className="text-3xl font-serif italic mt-3 tracking-tight">{product.name}</h3>
                <p className={`mt-3 text-base font-light italic leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{product.description}</p>
                <div className="mt-6 flex items-center justify-between">
                   <p className="text-3xl font-black">
                    {product.price.toLocaleString()} <span className="text-sm font-bold text-[#00bcd4] tracking-widest ml-1">FCFA</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Reviews Section */}
      <section className={`py-28 border-y relative overflow-hidden transition-colors ${isDarkMode ? 'bg-[#0d0d0d] border-white/5' : 'bg-[#f0f9fa] border-[#00bcd4]/10'}`}>
        <div className="absolute -left-20 top-0 w-96 h-96 bg-[#00bcd4]/10 rounded-full blur-3xl opacity-30"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-[#00bcd4] font-bold tracking-[0.4em] uppercase text-xs mb-6">Échos de la communauté</h2>
            <h3 className="text-5xl md:text-6xl font-serif italic">Vos Appréciations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {reviews.map(review => (
              <div key={review.id} className={`p-10 rounded-[3rem] shadow-sm border hover:shadow-2xl transition-all relative overflow-hidden group ${isDarkMode ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-gray-100'}`}>
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full transition-colors duration-700 ${isDarkMode ? 'bg-[#00bcd4]/10 group-hover:bg-[#e91e63]/20' : 'bg-[#00bcd4]/5 group-hover:bg-[#e91e63]/10'}`} />
                <div className="flex gap-1 mb-8">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-5 h-5 ${i < review.rating ? 'fill-[#e91e63] text-[#e91e63]' : (isDarkMode ? 'text-gray-800' : 'text-gray-200')}`} />
                  ))}
                </div>
                <p className={`text-lg italic font-light leading-relaxed mb-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>"{review.comment}"</p>
                <div className="flex items-center gap-5">
                  {review.image ? (
                    <img src={review.image} className="w-16 h-16 rounded-full object-cover ring-4 ring-[#00bcd4]/20" alt="Buyer" />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold ${isDarkMode ? 'bg-[#00bcd4]/20 text-[#00bcd4]' : 'bg-[#00bcd4]/10 text-[#e91e63]'}`}>
                      {review.firstName[0]}
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-lg">{review.firstName} {review.lastName}</h4>
                    <p className="text-sm text-gray-500 uppercase tracking-widest">{review.date}</p>
                  </div>
                </div>
              </div>
            ))}
            {/* CTA Add Review */}
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className={`border-2 border-dashed rounded-[3rem] p-10 flex flex-col items-center justify-center gap-6 hover:bg-[#00bcd4]/10 transition-all group shadow-sm ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-[#00bcd4]/30'}`}
            >
              <div className="w-20 h-20 bg-[#00bcd4]/20 rounded-full flex items-center justify-center group-hover:scale-125 transition-transform duration-500">
                <Plus className="w-10 h-10 text-[#00bcd4]" />
              </div>
              <span className="font-bold text-lg uppercase tracking-widest">Partager mon avis</span>
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black text-white pt-32 pb-16 transition-colors">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-32">
            <div className="md:col-span-5 space-y-10">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 bg-[#e91e63] rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-2xl shadow-pink-900/50">M</div>
                 <h4 className="text-4xl font-serif italic">
                   <span className="text-[#e91e63]">Marifath's</span> <span className="text-[#00bcd4]">Crochet</span>
                 </h4>
              </div>
              <p className="text-gray-400 font-light leading-relaxed text-xl max-w-md">
                Chaque maille est une conception, chaque pièce est confectionnée à la main. Découvrez nos vêtements au crochet, pensés et réalisés pour durer.
              </p>
              <div className="flex gap-6">
                <a href="#" className="w-14 h-14 flex items-center justify-center bg-white/5 rounded-full hover:bg-[#00bcd4] hover:text-black transition-all duration-500"><Instagram className="w-7 h-7" /></a>
                <a href="#" className="w-14 h-14 flex items-center justify-center bg-white/5 rounded-full hover:bg-[#00bcd4] hover:text-black transition-all duration-500"><Facebook className="w-7 h-7" /></a>
              </div>
            </div>

            <div className="md:col-span-2">
              <h5 className="text-sm font-black uppercase tracking-[0.4em] mb-10 text-[#00bcd4]">Espaces</h5>
              <ul className="space-y-6 text-gray-500 text-base font-medium">
                {categories.map(cat => (
                  <li key={cat}>
                    <button onClick={() => setActiveCategory(cat)} className="hover:text-white transition-colors duration-300">{cat}</button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-5">
              <h5 className="text-sm font-black uppercase tracking-[0.4em] mb-10 text-[#e91e63]">L'Atelier WhatsApp</h5>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 space-y-8 backdrop-blur-sm">
                <p className="text-gray-300 text-lg italic font-light">
                  "Envie d'une création Marifath's Crochet sur-mesure ? Discutons de votre prochaine pièce fétiche."
                </p>
                <a 
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  className="w-full bg-[#00bcd4] text-black py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-[#0097a7] transition-all shadow-2xl shadow-cyan-900/40"
                >
                  <MessageCircle className="w-6 h-6" />
                  Conversation Directe
                </a>
              </div>
            </div>
          </div>
          <div className="pt-16 border-t border-white/5 flex flex-col md:row items-center justify-between gap-8 text-gray-600 text-xs font-bold uppercase tracking-[0.3em]">
            <p>© {new Date().getFullYear()} {BRAND_NAME}. Marifath's Crochet est un état d'esprit.</p>
            <div className="flex gap-10">
              <button onClick={handleAdminToggle} className="hover:text-[#00bcd4] transition-colors">Portail Admin</button>
              <a href="#" className="hover:text-white transition-colors">Légal</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a 
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        className="fixed bottom-10 right-10 z-40 bg-[#25D366] text-white p-6 rounded-full shadow-2xl hover:scale-110 transition-all duration-500 active:scale-95 group"
      >
        <MessageCircle className="w-10 h-10" />
        <span className="absolute right-full mr-6 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 whitespace-nowrap tracking-[0.2em] font-black">ASSISTANCE MARIFATH</span>
      </a>

      {/* MODAL: ADMIN LOGIN (PASSWORD PROTECTION) */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
          <div className={`w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl animate-scaleUp border ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-100'}`}>
            <div className="p-12 text-center">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 ${isDarkMode ? 'bg-[#00bcd4]/20' : 'bg-[#00bcd4]/10'}`}>
                <Lock className="text-[#00bcd4] w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Espace Créateur</h2>
              <p className="text-gray-400 text-base mb-10 italic">L'accès à l'atelier demande une clé...</p>
              
              <form onSubmit={handleAdminAuth} className="space-y-8">
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Mot de passe"
                    autoFocus
                    className={`w-full border-2 ${authError ? 'border-red-400' : (isDarkMode ? 'bg-[#252525] border-transparent' : 'bg-gray-50 border-gray-50')} rounded-2xl p-5 focus:ring-4 focus:ring-[#00bcd4]/20 focus:border-[#00bcd4] transition-all outline-none pr-14 text-lg`}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                  </button>
                </div>
                {authError && <p className="text-red-500 text-sm font-bold uppercase tracking-widest">{authError}</p>}
                
                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAuthModalOpen(false)}
                    className={`flex-grow py-5 rounded-2xl font-bold transition-all text-sm uppercase tracking-widest ${isDarkMode ? 'bg-[#252525] text-gray-400 hover:bg-[#333]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    Fermer
                  </button>
                  <button 
                    type="submit" 
                    className="flex-grow bg-[#00bcd4] text-black py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-cyan-900/30 hover:scale-105 transition-transform"
                  >
                    Entrer
                  </button>
                </div>
              </form>
            </div>
            <div className={`p-6 text-center border-t ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Atelier Privé Marifath's Crochet</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN PRODUCT CRUD */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl animate-scaleUp relative max-h-[80vh] ${isDarkMode ? 'bg-[#111] text-white' : 'bg-white text-gray-900'}`}>
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="w-[500px] h-[500px] bg-gradient-to-br from-[#00bcd4] via-transparent to-[#e91e63] blur-3xl absolute -top-40 -right-20" />
              <div className="w-[400px] h-[400px] bg-gradient-to-tr from-[#e91e63] via-transparent to-[#00bcd4] blur-[120px] absolute -bottom-40 -left-10" />
            </div>
            <div className="relative">
              <div className={`px-6 sm:px-10 py-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isDarkMode ? 'bg-[#1a1a1a]/70 border-white/10' : 'bg-white border-gray-100'}`}>
                <div>
                  <p className="text-xs uppercase tracking-[0.7em] text-gray-400">Atelier Marifath's Crochet</p>
                  <h2 className="text-2xl sm:text-3xl font-serif italic">{editingProduct ? "Retoucher la création" : "Nouvelle pièce signature"}</h2>
                </div>
                <button onClick={() => setIsProductModalOpen(false)} className="self-start sm:self-auto p-3 rounded-full border border-gray-200/30 hover:border-transparent hover:bg-white/10 transition-colors">
                  <X />
                </button>
              </div>
              <form onSubmit={handleSaveProduct} className="px-6 sm:px-10 py-6 space-y-8 overflow-y-auto max-h-[65vh]">
                <input type="hidden" name="image_preview" id="prod_img_val" defaultValue={editingProduct?.image || ''} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-gray-400">Nom de la création</label>
                    <input
                      name="name"
                      defaultValue={editingProduct?.name}
                      required
                      className={`w-full rounded-2xl p-4 focus:ring-2 focus:ring-[#00bcd4] text-base ${isDarkMode ? 'bg-[#1f1f1f] border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                      placeholder="Ex: Robe Cascade Dakar"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-gray-400">Prix atelier (FCFA)</label>
                    <input
                      name="price"
                      type="number"
                      defaultValue={editingProduct?.price}
                      required
                      className={`w-full rounded-2xl p-4 focus:ring-2 focus:ring-[#00bcd4] text-base ${isDarkMode ? 'bg-[#1f1f1f] border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                      placeholder="Ex: 45000"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-gray-400">Univers</label>
                    <select
                      name="category"
                      defaultValue={editingProduct?.category || 'Hauts'}
                      className={`w-full rounded-2xl p-4 focus:ring-2 focus:ring-[#00bcd4] text-base ${isDarkMode ? 'bg-[#1f1f1f] border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                    >
                      {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-gray-400">Image</label>
                    <div className="space-y-3">
                      <div className={`flex items-center gap-4 p-4 border-2 border-dashed rounded-3xl transition-all ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        <Camera className="text-[#00bcd4] w-7 h-7" />
                        <span className="text-sm text-gray-500">Téléverser depuis votre appareil</span>
                        <input id="prod_img_input" type="file" onChange={(e) => handleImageUpload(e, 'prod_img_val')} accept="image/*" className="sr-only" />
                        <label htmlFor="prod_img_input" className="ml-auto bg-[#00bcd4] text-black px-4 py-2 rounded-xl font-semibold cursor-pointer hover:opacity-90">Choisir une image</label>
                      </div>
                      <input
                        name="image"
                        defaultValue={editingProduct?.image}
                        placeholder="Ou collez un lien d'image"
                        className={`w-full rounded-2xl p-4 text-sm focus:ring-2 focus:ring-[#00bcd4] ${isDarkMode ? 'bg-[#1f1f1f] border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[0.65rem] font-black uppercase tracking-[0.4em] text-gray-400">Description boutique</label>
                  <textarea
                    name="description"
                    defaultValue={editingProduct?.description}
                    required
                    className={`w-full rounded-3xl p-5 focus:ring-2 focus:ring-[#00bcd4] text-base leading-relaxed ${isDarkMode ? 'bg-[#1f1f1f] border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                    rows={4}
                    placeholder="Parlez des matières, du tombé, de l'énergie Marifath's Crochet..."
                  ></textarea>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-1 border border-gray-200/40 py-4 rounded-2xl font-semibold uppercase tracking-[0.3em] hover:bg-gray-50/20 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProduct}
                    className={`flex-1 ${isSavingProduct ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'} bg-gradient-to-r from-[#00bcd4] to-[#0097a7] text-black py-4 rounded-2xl font-black text-sm uppercase tracking-[0.35em] shadow-2xl shadow-cyan-900/30 transition-transform`}
                  >
                    {isSavingProduct ? 'Enregistrement...' : "Enregistrer dans la boutique"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW FORM */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className={`w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl animate-scaleUp max-h-[80vh] ${isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'}`}>
            <div className={`p-10 border-b flex items-center justify-between ${isDarkMode ? 'bg-[#222] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
              <h2 className="text-3xl font-serif italic">Votre Récit Marifath</h2>
              <button onClick={() => setIsReviewModalOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><X /></button>
            </div>
            <form onSubmit={handleAddReview} className="p-10 space-y-8 overflow-y-auto max-h-[65vh]">
              <input type="hidden" name="image_preview" id="rev_img_val" />
              <div className="grid grid-cols-2 gap-6">
                <input name="firstName" required placeholder="Prénom" className={`w-full border-none rounded-2xl p-5 focus:ring-2 focus:ring-[#e91e63] text-lg ${isDarkMode ? 'bg-[#252525]' : 'bg-gray-100'}`} />
                <input name="lastName" required placeholder="Nom" className={`w-full border-none rounded-2xl p-5 focus:ring-2 focus:ring-[#e91e63] text-lg ${isDarkMode ? 'bg-[#252525]' : 'bg-gray-100'}`} />
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 block mb-3 uppercase tracking-[0.3em]">Éclat</label>
                <select name="rating" className={`w-full border-none rounded-2xl p-5 text-lg ${isDarkMode ? 'bg-[#252525]' : 'bg-gray-100'}`}>
                  <option value="5">✨✨✨✨✨ Éblouissant</option>
                  <option value="4">✨✨✨✨ Magnifique</option>
                  <option value="3">✨✨✨ Ravissant</option>
                  <option value="2">✨✨ Satisfaisant</option>
                  <option value="1">✨ Décevant</option>
                </select>
              </div>
              <textarea name="comment" required placeholder="Partagez vos impressions sur la pièce portée..." className={`w-full border-none rounded-2xl p-5 focus:ring-2 focus:ring-[#e91e63] italic text-lg ${isDarkMode ? 'bg-[#252525]' : 'bg-gray-100'}`} rows={4}></textarea>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 block uppercase tracking-[0.3em]">Instantané (Optionnel)</label>
                <div className={`flex items-center gap-5 p-6 border-2 border-dashed rounded-3xl transition-all ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                  <Camera className="text-[#e91e63] w-8 h-8" />
                  <span className="text-sm text-gray-500 font-medium">Capturer la pièce portée</span>
                  <input id="rev_img_input" type="file" onChange={(e) => handleImageUpload(e, 'rev_img_val')} accept="image/*" className="sr-only" />
                  <label htmlFor="rev_img_input" className="ml-auto px-4 py-2 bg-[#e91e63] text-white rounded-xl font-semibold cursor-pointer hover:opacity-90">Ajouter une photo</label>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#e91e63] text-white py-6 rounded-2xl font-black shadow-2xl shadow-pink-900/40 active:scale-95 transition-all uppercase tracking-[0.3em] text-sm">
                Envoyer au Livre d'Or
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {isCartOpen && (
        <>
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50" onClick={() => setIsCartOpen(false)} />
          <div className={`fixed right-0 top-0 bottom-0 w-full max-w-lg z-[55] shadow-2xl flex flex-col animate-slideLeft transition-colors duration-700 ${isDarkMode ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'}`}>
            <div className={`p-10 border-b flex items-center justify-between sticky top-0 z-10 ${isDarkMode ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-4">
                <ShoppingBag className="text-[#00bcd4] w-8 h-8" />
                <h2 className="text-2xl font-black uppercase tracking-[0.2em]">Sélection ({cart.length})</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-10 space-y-12">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                  <ShoppingBag className="w-32 h-32 mb-8 stroke-[0.5] text-[#00bcd4]" />
                  <p className="font-serif italic text-2xl">Votre voyage n'a pas encore commencé...</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-8 group">
                    <div className="w-32 h-44 flex-shrink-0 overflow-hidden rounded-[2rem] bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-white/5 shadow-xl">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="flex-grow py-2">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-xl leading-tight">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-sm text-[#00bcd4] font-black uppercase tracking-widest mb-6">{item.price.toLocaleString()} FCFA</p>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center rounded-2xl p-1 shadow-inner ${isDarkMode ? 'bg-[#252525]' : 'bg-gray-100'}`}>
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-xl transition-all">-</button>
                          <span className="w-12 text-center text-lg font-black">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white/20 rounded-xl transition-all">+</button>
                        </div>
                        <p className="text-xl font-black">{(item.price * item.quantity).toLocaleString()} <span className="text-xs text-[#00bcd4]">FCFA</span></p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className={`p-10 border-t space-y-8 ${isDarkMode ? 'bg-[#0d0d0d] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold uppercase tracking-[0.3em] text-xs">Total de la sélection</span>
                  <span className="text-3xl font-black">{total.toLocaleString()} FCFA</span>
                </div>
                <button 
                  onClick={checkoutViaWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-green-600 text-white py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-2xl shadow-green-900/30 active:scale-95 transition-all text-sm"
                >
                  <MessageCircle className="w-7 h-7" />
                  Valider via WhatsApp
                </button>
                <p className="text-[10px] text-center text-gray-500 uppercase tracking-[0.4em] font-black">L'Atelier Marifath vous répondra sous peu</p>
              </div>
            )}
          </div>
        </>
      )}

      <style>{`
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideLeft {
          animation: slideLeft 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes scaleUp {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default App;
