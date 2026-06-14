/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Star, 
  Heart, 
  ShoppingCart, 
  Percent, 
  Box, 
  Gift, 
  Coins, 
  Trophy, 
  Clock, 
  Flame, 
  User, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight,
  RefreshCw,
  Truck,
  ChevronDown,
  Mail,
  ArrowUpRight,
  Lock
} from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { products, categories, toggleWishlist, wishlist, addToCart, user } = useApp();
  
  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const trendingProducts = products.filter(p => p.stock > 0);

  // Personalized Welcome states
  const [currentTimeGreeting, setCurrentTimeGreeting] = useState('Welcome Back');
  const [lastViewedItems, setLastViewedItems] = useState<any[]>([]);

  // Interactive Gift Recommendation Quiz states
  const [quizRecipient, setQuizRecipient] = useState<'kids' | 'women' | 'men' | 'seniors' | 'friends'>('kids');
  const [quizBudget, setQuizBudget] = useState<number>(150);
  const [quizInterest, setQuizInterest] = useState<'tech' | 'art' | 'comfort' | 'all'>('all');
  const [recommendedGiftList, setRecommendedGiftList] = useState<any[]>([]);
  const [showQuizResult, setShowQuizResult] = useState<boolean>(false);

  // Seasonal banner index
  const [activeSeasonalTab, setActiveSeasonalTab] = useState<'birthday' | 'festival' | 'flash' | 'picks'>('picks');

  // Gamification States
  const [claimedPoints, setClaimedPoints] = useState<number>(200);
  const [isDailyClaimed, setIsDailyClaimed] = useState<boolean>(false);
  const [wheelState, setWheelState] = useState<'idle' | 'spinning' | 'won'>('idle');
  const [wheelDegree, setWheelDegree] = useState<number>(0);
  const [spinRewardCode, setSpinRewardCode] = useState<string>('');
  
  // Mystery Box State
  const [mysteryBoxShake, setMysteryBoxShake] = useState<boolean>(false);
  const [mysteryBoxResult, setMysteryBoxResult] = useState<string | null>(null);

  // New features for highly premium realist landing page
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState<string>('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'subscribed'>('idle');

  // Particle background Canvas effect
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Setup time-of-day greeting & simulated recently viewed items
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setCurrentTimeGreeting('Good morning, explorer ☀️');
    else if (hours < 18) setCurrentTimeGreeting('Good afternoon, master artisan ☕');
    else setCurrentTimeGreeting('Good evening, collector ✨');

    // Populate simulated recently viewed items
    if (products.length > 0) {
      setLastViewedItems(products.slice(0, 3));
    }
  }, [products]);

  // Handle Canvas background floating particles inside Hero section
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; r: number; dx: number; dy: number; alpha: number }[] = [];

    // Initialize particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 3.5 + 1.5,
        dx: (Math.random() - 0.5) * 0.4,
        dy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(129, 140, 248, ${p.alpha})`;
        ctx.fill();

        // Move
        p.x += p.dx;
        p.y += p.dy;

        // Bounce
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Set up auto-sliding carousel index increment
  useEffect(() => {
    const timer = setInterval(() => {
      if (trendingProducts.length > 0) {
        setCarouselIndex((prev) => (prev + 1) % Math.min(6, trendingProducts.length));
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [trendingProducts]);

  // Quiz Recommendation Logic
  const handleRunGiftQuiz = () => {
    setShowQuizResult(false);
    
    // Filter actual products matching recipient archetype and budget constraints
    const matched = products.filter((p) => {
      const matchBudget = p.price <= quizBudget;
      const titleLower = p.title.toLowerCase();
      const catLower = p.category.toLowerCase();

      let matchArchetype = true;
      if (quizRecipient === 'kids') {
        matchArchetype = titleLower.includes('kids') || titleLower.includes('toy') || titleLower.includes('game') || titleLower.includes('child') || titleLower.includes('card') || titleLower.includes('plush');
      } else if (quizRecipient === 'women') {
        matchArchetype = titleLower.includes('women') || titleLower.includes('dress') || titleLower.includes('jewelry') || titleLower.includes('ceramic') || titleLower.includes('ring') || titleLower.includes('soap');
      } else if (quizRecipient === 'men') {
        matchArchetype = titleLower.includes('men') || titleLower.includes('wood') || titleLower.includes('tool') || titleLower.includes('leather') || titleLower.includes('wallet') || titleLower.includes('belt');
      } else if (quizRecipient === 'seniors') {
        matchArchetype = titleLower.includes('knit') || titleLower.includes('warm') || titleLower.includes('comfort') || titleLower.includes('cozy') || titleLower.includes('wool') || titleLower.includes('tea');
      }

      let matchInterest = true;
      if (quizInterest === 'tech') {
        matchInterest = catLower.includes('audio') || catLower.includes('hardware') || titleLower.includes('console') || titleLower.includes('smart') || titleLower.includes('led');
      } else if (quizInterest === 'art') {
        matchInterest = catLower.includes('decor') || catLower.includes('stationery') || titleLower.includes('ceramic') || titleLower.includes('journal') || titleLower.includes('handcrafted');
      } else if (quizInterest === 'comfort') {
        matchInterest = titleLower.includes('cozy') || titleLower.includes('comfort') || titleLower.includes('knit') || titleLower.includes('wool') || titleLower.includes('blanket') || titleLower.includes('tea');
      }

      return matchBudget && (matchArchetype || matchInterest);
    });

    const finalPool = matched.length > 0 ? matched : products.slice(0, 3);
    setRecommendedGiftList(finalPool.slice(0, 3));
    
    // Smooth scroll and show result
    setTimeout(() => {
      setShowQuizResult(true);
    }, 600);
  };

  // Claim Daily Points bonus
  const handleClaimDailyRewards = () => {
    if (isDailyClaimed) return;
    setClaimedPoints((prev) => prev + 150);
    setIsDailyClaimed(true);
  };

  // Play Spin & Win Wheel
  const handleSpinWheelAction = () => {
    if (wheelState === 'spinning') return;
    setWheelState('spinning');
    
    // Spin animation with custom degrees
    const randomTurns = 5 + Math.floor(Math.random() * 5);
    const stopSegment = Math.floor(Math.random() * 8); // 8 sections
    const targetDeg = randomTurns * 360 + stopSegment * 45;
    
    setWheelDegree(targetDeg);

    setTimeout(() => {
      const couponCodes = ['GOLDGIFT15', 'MYSTERY30', 'KIDSBONUS10', 'SENIORSOOTH', 'FREEPASS50', 'SILICON20', 'ARTISAN40', 'COUPON5'];
      setSpinRewardCode(couponCodes[stopSegment]);
      setWheelState('won');
    }, 3000);
  };

  const handleShakeMysteryBox = () => {
    if (mysteryBoxResult) return;
    setMysteryBoxShake(true);
    setTimeout(() => {
      setMysteryBoxShake(false);
      const gifts = ['🎁 Free Artisan Key Organizer coupon: FREEKEYS', '🏮 25% Off Ceramic category: CLAY25', '📚 Free Timber bookmark: WOODMARK', '🎟️ Flat 15% discount on all items: SHIFT15'];
      const randomIdx = Math.floor(Math.random() * gifts.length);
      setMysteryBoxResult(gifts[randomIdx]);
    }, 1500);
  };

  return (
    <div className="space-y-12 pb-16 transition-colors duration-200">
      
      {/* 1. CINEMATIC HERO BANNER SHOWCASE */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-black text-white rounded-[2.5rem] mx-4 sm:mx-6 lg:mx-8 mt-4.5 p-6 sm:p-10 shadow-[0_30px_60px_rgba(99,102,241,0.25)] border border-white/5">
        
        {/* Particle Overlay Canvas */}
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={400} 
          className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none mix-blend-screen"
        />

        {/* Decorative Neon Blurs */}
        <div className="absolute top-0 right-0 h-80 w-80 rounded-full bg-indigo-500/15 blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 h-8 w-80 rounded-full bg-pink-500/10 blur-[120px]" />

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 text-xs font-mono tracking-widest uppercase font-extrabold shadow-inner animate-bounce">
              <Sparkles className="h-4 w-4 text-pink-400" />
              <span>ShopSphere Marketplace • Every Generation Connected</span>
            </div>
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-none">
              Aventures in Shopping for <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-indigo-300 to-yellow-200">Every Generation</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-lg font-medium">
              Explore hand-turned timer journals, smart hardware gadgets, custom accessories, and exquisite home ceramics selected across all generational tastes under a secure multi-vendor escrow.
            </p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
              <button
                onClick={() => onNavigate('products')}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all transform hover:-translate-y-1 shadow-[0_10px_25px_rgba(99,102,241,0.4)] cursor-pointer active:scale-95"
              >
                Explore ShopSphere
                <ArrowRight className="h-4 w-4" />
              </button>
              {!user ? (
                <button
                  onClick={() => onNavigate('login?register=vendor')}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 text-xs hover:border-white/30 transition-all cursor-pointer backdrop-blur-md"
                >
                  Join ShopSphere Guild
                </button>
              ) : user.role === 'vendor' ? (
                <button
                  onClick={() => onNavigate('vendor-dashboard')}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 text-xs hover:border-white/30 transition-all cursor-pointer backdrop-blur-md"
                >
                  Seller Dashboard
                </button>
              ) : user.role === 'admin' ? (
                <button
                  onClick={() => onNavigate('admin-dashboard')}
                  className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold border border-white/10 text-xs hover:border-white/30 transition-all cursor-pointer backdrop-blur-md"
                >
                  Admin Panel
                </button>
              ) : null}
            </div>
            
            {/* Live Interactive statistics counters */}
            <div className="flex hover:scale-103 transition-transform justify-center md:justify-start gap-8 pt-6 border-t border-white/10 max-w-sm">
              <div>
                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-white">400+</p>
                <p className="text-[9px] uppercase font-mono tracking-widest text-neutral-400 mt-1">Unique SKUs</p>
              </div>
              <div>
                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">12★</p>
                <p className="text-[9px] uppercase font-mono tracking-widest text-neutral-400 mt-1">Trusted Vendors</p>
              </div>
              <div>
                <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-white">100%</p>
                <p className="text-[9px] uppercase font-mono tracking-widest text-neutral-400 mt-1">Escrow Safety</p>
              </div>
            </div>

          </div>

          {/* 3D-inspired CSS rotating card mock */}
          <div className="flex justify-center relative perspective-[1200px]">
            <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
            
            <div className="relative max-w-xs w-full bg-white/5 border border-white/15 p-5 rounded-[2rem] backdrop-blur-lg shadow-2xl hover:rotate-y-12 hover:-rotate-x-6 hover:shadow-indigo-500/20 transform transition-all duration-700 hover:scale-105 group">
              <div className="aspect-square relative rounded-[1.5rem] overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                <img 
                  src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=300" 
                  alt="Headphones" 
                  className="w-[85%] h-[85%] object-cover group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 rounded-xl"
                  referrerPolicy="no-referrer"
                />
                
                {/* Float glass badges */}
                <div className="absolute top-3 left-3 bg-black/65 border border-white/10 px-3 py-1 rounded-full text-[8.5px] font-mono font-bold tracking-widest text-yellow-300 backdrop-blur-md uppercase shadow flex items-center gap-1">
                  <span>💎 PREMIUM BOX</span>
                </div>
              </div>
              
              <div className="mt-4 space-y-2.5 text-left text-xs">
                <div className="flex justify-between items-center text-indigo-300">
                  <span className="font-mono tracking-wider font-extrabold uppercase">SILICON &amp; GOLD</span>
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-md text-[10px]">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    <span className="text-white font-mono">4.9</span>
                  </div>
                </div>
                
                <h3 className="font-display font-black text-white text-base leading-tight">Artisan Sound Capsule CONSOLE</h3>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">Dual channel analog amplification console made of hand-cured timber chassis.</p>
                
                <div className="flex justify-between items-center pt-2.5 border-t border-white/10">
                  <span className="text-lg font-black text-emerald-400">$340.00</span>
                  <button 
                    onClick={() => onNavigate('products/prod1')}
                    className="text-[11px] font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 bg-indigo-600/35 hover:bg-indigo-600 px-3.5 py-1.5 rounded-xl border border-indigo-400/30 transition-all cursor-pointer"
                  >
                    Quick-view <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* TRUST BADGES ROW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-neutral-50 dark:bg-neutral-900/60 p-6 rounded-[2rem] border border-neutral-200/50 dark:border-neutral-850">
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl shrink-0">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 font-sans">Express Shipping</h4>
              <p className="text-[10px] text-neutral-400 font-medium">Ships in 48 hours local</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 font-sans">Escrow Protected</h4>
              <p className="text-[10px] text-neutral-400 font-medium">Safe seller payouts</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-605 dark:text-amber-400 rounded-2xl shrink-0">
              <Box className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 font-sans">Artisan Quality</h4>
              <p className="text-[10px] text-neutral-400 font-medium font-sans">Verified hand-picked items</p>
            </div>
          </div>
          <div className="flex items-center gap-3.5 text-left">
            <div className="p-3 bg-pink-50 dark:bg-pink-950/40 text-pink-650 dark:text-pink-400 rounded-2xl shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-100 font-sans">24/7 Help Desk</h4>
              <p className="text-[10px] text-neutral-400 font-medium">Real-time support angels</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PERSONALIZED WELCOME & STATS INBOX HUB */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 p-5 rounded-[2rem] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1 flex items-center gap-4 text-left">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow font-display font-black animate-pulse">
              🏆
            </div>
            <div>
              <h2 className="font-display text-lg font-black tracking-tight text-neutral-900 dark:text-white">
                {currentTimeGreeting}
              </h2>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Dive into a customized shopping journey tailored to your generational background with persistent access channels.
              </p>
            </div>
          </div>

          <div className="flex gap-3 flex-wrap w-full md:w-auto justify-start md:justify-end">
            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-150 dark:border-neutral-850 flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="text-left font-mono">
                <p className="text-[9px] uppercase text-neutral-400">LOYALTY BALANCE</p>
                <p className="text-xs font-black text-neutral-850 dark:text-neutral-100">{claimedPoints} Gold Points</p>
              </div>
            </div>
            
            <button
              onClick={handleClaimDailyRewards}
              disabled={isDailyClaimed}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isDailyClaimed 
                  ? 'bg-neutral-100 dark:bg-neutral-850 text-neutral-400 border border-transparent' 
                  : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 text-neutral-900 shadow-md font-mono'
              }`}
            >
              <span>{isDailyClaimed ? '✓ Daily Points Harvested' : '🎁 Claim +150 Daily Golds'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. AUTO-SLIDING TRENDING PRODUCTS SPECIAL CAROUSEL */}
      {trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-5 gap-2 text-left">
            <div>
              <h2 className="font-display text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2">
                <Flame className="h-5.5 w-5.5 text-pink-500 animate-bounce" />
                Trending Generational Collections
              </h2>
              <p className="text-xs text-neutral-500">
                Peerless item selections recommended most highly by family members of your target age division.
              </p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCarouselIndex((i) => (i - 1 + Math.min(6, trendingProducts.length)) % Math.min(6, trendingProducts.length))}
                className="p-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 rounded-xl transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCarouselIndex((i) => (i + 1) % Math.min(6, trendingProducts.length))}
                className="p-2 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-850 text-neutral-700 dark:text-neutral-300 rounded-xl transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-indigo-50/20 dark:bg-neutral-920 p-5 rounded-[2.5rem] border border-indigo-100/35 dark:border-neutral-850">
            {/* Carousel display box */}
            {(() => {
              const carouselItem = trendingProducts[carouselIndex];
              if (!carouselItem) return null;
              return (
                <>
                  <div className="aspect-square bg-white dark:bg-neutral-950 p-3 rounded-3xl border border-neutral-200 dark:border-neutral-800 relative group overflow-hidden md:col-span-1">
                    <img
                      src={carouselItem.images[0]}
                      alt={carouselItem.title}
                      className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-rose-500 text-white font-mono font-bold text-[9px] px-2.5 py-1 rounded-md shadow-xs">
                      🔥 SPEED SELLER
                    </div>
                  </div>

                  <div className="text-left space-y-4 md:col-span-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono tracking-widest font-extrabold uppercase text-indigo-505 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 rounded-md">
                        {carouselItem.category.toUpperCase()} COLLECTION
                      </span>
                      <h3 className="font-display font-black text-2xl text-neutral-900 dark:text-white hover:text-indigo-650 transition cursor-pointer mt-2" onClick={() => onNavigate(`products/${carouselItem.id}`)}>
                        {carouselItem.title}
                      </h3>
                      <div className="flex items-center gap-1 pb-1">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{carouselItem.avgRating || '4.8★'}</span>
                        <span className="text-neutral-300 text-[10px]">|</span>
                        <span className="text-[10px] uppercase font-bold text-emerald-600 font-mono">Stock level: {carouselItem.stock}</span>
                      </div>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {carouselItem.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-neutral-400 uppercase font-mono">Artisan Catalog Price</p>
                        <p className="text-2xl font-black text-neutral-900 dark:text-white">${carouselItem.price.toFixed(2)}</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            addToCart(carouselItem);
                            alert(`🛒 Successfully added "${carouselItem.title}" to active cart!`);
                          }}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-md shadow-indigo-650/20 active:scale-95"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Add to Shopping Bag
                        </button>
                        <button
                          onClick={() => {
                            addToCart(carouselItem);
                            onNavigate('cart');
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                        >
                          Checkout ⚡
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}

      {/* 4. INTERACTIVE CATEGORY EXPLORER WITH 3D CAP BADGES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center md:text-left space-y-1 mb-6">
          <h2 className="font-display text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
            Generational Aesthetic Explorer
          </h2>
          <p className="text-xs text-neutral-500">
            Select specialized product classes designed specifically to blend premium visual styles with human ergonomics.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((cat, idx) => {
            const emojis = ['🏮', '👔', '🍵', '💻', '🔮', '🧸', '📦', '🖼️'];
            const emoji = emojis[idx % emojis.length];
            return (
              <button
                key={cat.id}
                onClick={() => onNavigate(`products?category=${cat.slug}`)}
                className="group p-5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-indigo-50/30 dark:hover:bg-neutral-850/40 rounded-3xl transform hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 text-left flex flex-col justify-between min-h-[140px] relative overflow-hidden cursor-pointer"
              >
                <div className="absolute right-0 bottom-0 text-7xl opacity-5 pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300 select-none">
                  {emoji}
                </div>
                
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition duration-300">
                  {emoji}
                </div>

                <div>
                  <h3 className="font-black text-neutral-900 dark:text-white text-sm group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition leading-tight">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono uppercase mt-1 tracking-wider">Explore Items →</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. 🎁 SMART GIFT CENTER & MATCHING RECOMMENDATION QUIZ SECTION */}
      <section className="bg-gradient-to-b from-neutral-50 to-indigo-50/20 dark:from-neutral-950 dark:to-neutral-900 border-t border-b border-neutral-200/60 dark:border-neutral-850 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="p-1 px-3 bg-indigo-505/10 text-indigo-650 dark:text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest leading-none inline-flex items-center gap-1.5 shadow">
              <Gift className="h-3.5 w-3.5 animate-bounce text-pink-400" />
              Generational Gift Finder
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
              Aesthetic Generational Gift Finder
            </h2>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Input recipient demographics and budget guidelines to match them instantly with our verified catalog of beautiful handcrafted products.
            </p>
          </div>

          {/* Interactive Quiz Panel */}
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-[2.5rem] shadow-xl max-w-3xl mx-auto text-left gap-6 grid grid-cols-1 md:grid-cols-3">
            
            <div className="space-y-4 md:col-span-2">
              {/* Question 1: Recipient */}
              <div className="space-y-2">
                <p className="text-[9.5px] font-mono font-extrabold uppercase tracking-wide text-indigo-605">1. Who are you shopping for?</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'kids', label: '🧸 Kids' },
                    { key: 'women', label: '🌸 Women' },
                    { key: 'men', label: '⚡ Men' },
                    { key: 'seniors', label: '👵 Seniors' },
                    { key: 'friends', label: '🍿 Friends' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setQuizRecipient(item.key as any)}
                      className={`py-2 text-[10.5px] font-extrabold rounded-xl border transition-all duration-200 cursor-pointer ${
                        quizRecipient === item.key 
                          ? 'bg-indigo-600 border-transparent text-white shadow-md' 
                          : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-450 hover:bg-neutral-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Budget */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[9.5px] font-mono font-extrabold uppercase tracking-wide text-indigo-605">2. Budget Cap Target:</p>
                  <span className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400">${quizBudget} Max</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={400}
                  step={10}
                  value={quizBudget}
                  onChange={(e) => setQuizBudget(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Question 3: Interests */}
              <div className="space-y-2">
                <p className="text-[9.5px] font-mono font-extrabold uppercase tracking-wide text-indigo-605">3. Prime Interest Archetype:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'tech', label: '💻 Tech Console' },
                    { key: 'art', label: '🎨 Handcrafted Art' },
                    { key: 'comfort', label: '☕ Cozy Comfort' },
                    { key: 'all', label: '🌟 All Styles' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setQuizInterest(item.key as any)}
                      className={`py-2 text-[10px] font-extrabold rounded-xl border transition-all duration-200 cursor-pointer ${
                        quizInterest === item.key 
                          ? 'bg-indigo-650 border-transparent text-white hover:text-black shadow-md' 
                          : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-450 hover:bg-neutral-100 hover:text-black dark:hover:text-black'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit launcher */}
              <button
                onClick={handleRunGiftQuiz}
                className="w-full py-3 bg-gradient-to-r from-pink-500 via-indigo-600 to-purple-600 hover:from-pink-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/20"
              >
                <Sparkles className="h-4 w-4 text-yellow-300 animate-spin" />
                Query Gift Recommendation Engine
              </button>
            </div>

            {/* Quiz Outcome Showcase Sidebar */}
            <div className="bg-neutral-50 dark:bg-neutral-950 border border-neutral-150 dark:border-neutral-800 p-4 rounded-2xl flex flex-col justify-between text-left min-h-[220px]">
              {showQuizResult ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] uppercase tracking-widest font-mono bg-emerald-500/20 text-emerald-600 px-2.5 py-1 rounded-md font-black">
                      🎯 Matches Unlocked ({recommendedGiftList.length})
                    </span>
                    <button onClick={() => setShowQuizResult(false)} className="text-[10px] underline hover:text-indigo-505 font-mono">Reset</button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recommendedGiftList.map((gift) => (
                      <div key={gift.id} className="flex gap-2.5 bg-white dark:bg-neutral-900 border p-2 rounded-xl">
                        <img src={gift.images[0]} alt={gift.title} className="w-10 h-10 object-cover rounded-lg border shrink-0" referrerPolicy="no-referrer" />
                        <div className="min-w-0 flex-1 text-xs">
                          <h4 className="font-extrabold truncate text-neutral-900 dark:text-white">{gift.title}</h4>
                          <p className="text-[11px] text-indigo-505 font-mono mt-0.5">${gift.price.toFixed(2)}</p>
                          <button
                            onClick={() => {
                              addToCart(gift);
                              alert(`🎁 Added "${gift.title}" to gift checkout line!`);
                            }}
                            className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-0.5 mt-0.5"
                          >
                            🛒 Quick-add to Cart
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[9px] text-neutral-400 leading-snug italic pt-1 border-t">100% matched by pricing threshold and tag matching matrices.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-full space-y-2">
                  <span className="text-3xl animate-pulse">🔮</span>
                  <h4 className="text-xs font-black uppercase text-neutral-800 dark:text-neutral-200">Pending Input</h4>
                  <p className="text-[10px] text-neutral-400">Fill standard questionnaire parameters and press submit to consult active product matrix matches!</p>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* 6. SEASONAL EXPERIENCES & BANNERS HUB */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-neutral-950 rounded-[2.5rem] border border-white/5 p-6 sm:p-8 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
          {/* Subtle colorful neon spheres */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-405/10 rounded-full blur-3xl pointer-events-none" />

          {/* Text descriptor */}
          <div className="space-y-4 max-w-xl text-center md:text-left relative z-10">
            <span className="px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[9px] font-mono tracking-widest font-extrabold text-pink-400 uppercase">
              🍁 Seasonal Horizon
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black leading-none">
              Discover Festive Collections &amp; Specials
            </h2>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Toggle our curated catalog spec lists below to reveal flat grand-opening coupons, high-volume shipping bundles, and newly uploaded designer arrivals.
            </p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {[
                { key: 'birthday', label: '🍰 Birthday Specials' },
                { key: 'festival', label: '🏮 Festival Curation' },
                { key: 'flash', label: '⚡ Midnight Flash Sales' },
                { key: 'picks', label: '🌟 Master Picks' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSeasonalTab(tab.key as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeSeasonalTab === tab.key 
                      ? 'bg-pink-600 text-white scale-103' 
                      : 'bg-white/5 hover:bg-white/15 text-neutral-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Banners Preview card */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-3xl max-w-xs w-full relative z-10 text-left space-y-4">
            {activeSeasonalTab === 'picks' && (
              <div className="space-y-3">
                <span className="text-[8px] font-mono tracking-wider font-extrabold uppercase bg-yellow-500 text-neutral-900 rounded px-2 py-0.5">PLATINUM LEVEL</span>
                <h4 className="text-sm font-black">Curated Master Picks Catalogue</h4>
                <p className="text-[10.5px] text-neutral-400 leading-relaxed">Custom ANC headphones and leather accessories bundled with 30-day loyalty protection warranty coverage.</p>
                <button onClick={() => onNavigate('products')} className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold font-mono">Launch Picks Collection</button>
              </div>
            )}
            {activeSeasonalTab === 'birthday' && (
              <div className="space-y-3">
                <span className="text-[8px] font-mono tracking-wider font-extrabold uppercase bg-pink-500 text-white rounded px-2 py-0.5">CAKE EXTRAS</span>
                <h4 className="text-sm font-black">Birthday Surprise Deals</h4>
                <p className="text-[10.5px] text-neutral-400 leading-relaxed">Shop for coworkers or dear family members today and receive a surprise golden box gift dispatched completely free.</p>
                <button onClick={() => onNavigate('products')} className="w-full py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold font-mono">Launch Birthday Deals</button>
              </div>
            )}
            {activeSeasonalTab === 'festival' && (
              <div className="space-y-3">
                <span className="text-[8px] font-mono tracking-wider font-extrabold uppercase bg-emerald-500 text-white rounded px-2 py-0.5">LANTERNS SPECIAL</span>
                <h4 className="text-sm font-black">Artisan Handcrafted Festivals</h4>
                <p className="text-[10.5px] text-neutral-400 leading-relaxed">Browse clay ceramics, warm woolen knits, and hand-woven canvas wall hangings on massive limited-time offers.</p>
                <button onClick={() => onNavigate('products')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold font-mono">Browse Festivals</button>
              </div>
            )}
            {activeSeasonalTab === 'flash' && (
              <div className="space-y-3">
                <span className="text-[8px] font-mono tracking-wider font-extrabold uppercase bg-red-500 text-white rounded px-2 py-0.5">MIDNIGHT TIMER</span>
                <h4 className="text-sm font-black">Flat 30% Off Midnight Flash Sales</h4>
                <p className="text-[10.5px] text-neutral-400 leading-relaxed">Enter coupon code <span className="font-bold text-red-400 font-mono">SUPER30</span> at checkout screen to claim extreme promotional discount rates!</p>
                <button onClick={() => onNavigate('products')} className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold font-mono">Unlock Flash Sales</button>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 7. PLAYABLE MULTI-GENERATIONAL GAMIFICATION MATRIX */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* WHEEL OF SURPRISE COUPE: SPIN & WIN */}
          <div className="bg-gradient-to-br from-indigo-950 via-slate-905 to-purple-950 border border-indigo-500/30 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
            
            <div className="space-y-1 text-left relative z-10">
              <span className="p-1 px-2.5 bg-indigo-500/20 text-indigo-300 rounded-md text-[9px] font-mono font-black uppercase tracking-widest leading-none inline-flex items-center gap-1">
                🎡 AMUSEMENT HORIZON
              </span>
              <h3 className="font-display font-black text-xl tracking-tight">Active Spin &amp; Win Rewards Wheel</h3>
              <p className="text-[11px] text-neutral-400">Spin our high-contrast wheel multiplier once daily to unlock high-rate checkout coupons and mystery credentials!</p>
            </div>

            {/* Playable Graphical Wheel */}
            <div className="my-8 flex justify-center items-center relative">
              <div 
                className="w-40 h-40 rounded-full border-4 border-double border-indigo-300/40 relative flex items-center justify-center transition-transform duration-3000 ease-out shadow-[0_0_30px_rgba(99,102,241,0.25)]"
                style={{ 
                  transform: `rotate(${wheelDegree}deg)`,
                  background: 'conic-gradient(#4f46e5 0deg 45deg, #10b981 45deg 90deg, #ec4899 90deg 135deg, #f59e0b 135deg 180deg, #4f46e5 180deg 225deg, #10b981 225deg 270deg, #ec4899 270deg 315deg, #f59e0b 315deg 360deg)' 
                }}
              >
                {/* Sector labels overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] font-black tracking-wider text-white">
                  <span className="hidden">Wheel segments</span>
                </div>
                
                {/* Inner center bulb */}
                <div className="w-10 h-10 rounded-full bg-slate-950 border-2 border-white flex items-center justify-center shadow-lg relative z-10">
                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                </div>
              </div>

              {/* Indicator needle */}
              <div className="absolute top-0 left-1/2 -ml-2 w-4 h-4 bg-yellow-405 border-t-2 border-r-2 border-white rotate-135 pointer-events-none drop-shadow z-20" />
            </div>

            {/* Controller */}
            <div className="relative z-10 space-y-3">
              {wheelState === 'won' ? (
                <div className="bg-emerald-500/20 border border-emerald-400/35 p-3 rounded-2xl text-center space-y-1 animate-fadeIn duration-500">
                  <p className="text-[8.5px] font-mono tracking-widest text-emerald-300 font-extrabold uppercase">🌟 REWARD COMPILATION SUCCESS 🌟</p>
                  <p className="text-base font-black font-mono text-white tracking-widest bg-black/40 p-2 rounded-xl">
                    {spinRewardCode}
                  </p>
                  <p className="text-[9px] text-neutral-400">Copy this key and enjoy discounts at checkout purchase screen!</p>
                  <button onClick={() => setWheelState('idle')} className="text-[9px] underline text-indigo-300 hover:text-white mt-1 cursor-pointer">Spin Again</button>
                </div>
              ) : (
                <button
                  onClick={handleSpinWheelAction}
                  disabled={wheelState === 'spinning'}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md active:scale-95 cursor-pointer"
                >
                  {wheelState === 'spinning' ? '🔮 Tuning Gifting Oracle...' : '🎡 SPIN SURPRISE WHEEL NOW'}
                </button>
              )}
              <p className="text-[9.5px] text-neutral-450 italic">100% real code vouchers provided daily.</p>
            </div>

          </div>

          {/* MYSTERY SHAKE BOX DISCOUNTER */}
          <div className="bg-gradient-to-br from-neutral-900 via-zinc-950 to-stone-900 border border-neutral-800 rounded-[2.5rem] p-6 text-white shadow-2xl flex flex-col justify-between text-left">
            
            <div className="space-y-1">
              <span className="p-1 px-2.5 bg-yellow-450/20 text-yellow-450 rounded-md text-[9px] font-mono font-black uppercase tracking-widest leading-none inline-flex items-center gap-1.5 shadow">
                🎁 SECRET VAULT UNIT
              </span>
              <h3 className="font-display font-black text-xl tracking-tight">Artisan Secret Mystery Box</h3>
              <p className="text-[11px] text-neutral-400">Instantly shake our ancient chest to unlock free supplementary physical items, category cashbacks, or coupon thresholds!</p>
            </div>

            {/* Playable shaking box canvas element */}
            <div className="my-10 flex flex-col items-center justify-center">
              <div 
                onClick={handleShakeMysteryBox}
                className={`text-5xl cursor-pointer select-none transform transition-transform duration-100 ${
                  mysteryBoxShake ? 'animate-bounce animate-pulse rotate-12 scale-110' : 'hover:scale-108'
                }`}
              >
                📦✨
              </div>
              <p className="text-[10px] text-neutral-450 mt-4 leading-none uppercase tracking-widest font-mono">Press Box to Shake and Reveal</p>
            </div>

            <div className="space-y-2.5">
              {mysteryBoxResult ? (
                <div className="bg-yellow-405/15 border border-yellow-400/30 p-3 rounded-2xl text-center space-y-1 animate-pulse">
                  <p className="text-[8.5px] font-mono text-yellow-300 font-extrabold tracking-widest uppercase">✨ VAULT REVEALED SECRET ACCESS ✨</p>
                  <p className="text-xs font-bold text-white">{mysteryBoxResult}</p>
                </div>
              ) : (
                <button
                  onClick={handleShakeMysteryBox}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-extrabold text-xs tracking-wider uppercase rounded-xl transition duration-200 cursor-pointer active:scale-95"
                >
                  ⚡ Press to Shake Chest
                </button>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* 8. CUSTOMER SATISFACTION PORTAL (REVIEWS & RATINGS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="text-center md:text-left space-y-1 mb-8">
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-mono tracking-widest font-extrabold px-3 py-1 rounded-md uppercase">
            🌟 Family Trust Proof
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white mt-1">
            Highly Reviewed by Every Generation
          </h2>
          <p className="text-xs text-neutral-500">
            Read real feedback from verified customers celebrating specialized curated items and prompt multi-vendor shipments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              avatar: "👩‍💼",
              name: "Ambrose Sterling",
              tag: "Digital Architect (Gen X)",
              stars: 5,
              text: "The vintage timber chassis amplifiers are absolutely spectacular! Ordering from ShopSphere was painless; their multi-vendor escrow system guarantees that the product matches expectations perfectly before funds release. Will order again!"
            },
            {
              avatar: "👴",
              name: "Arthur Pendelton",
              tag: "Retired Professor (Boomer)",
              stars: 5,
              text: "I was looking for high-quality, physical books and cozy organic blanket sets. The website was remarkably clean, easy to navigate, and my parcel arrived with a beautiful personal thank-you card. Highly recommend the Seniors-approved lines!"
            },
            {
              avatar: "👩‍🎓",
              name: "Zoe Chen",
              tag: "Tech Student (Gen Z)",
              stars: 5,
              text: "The combination of retro games and high-tech sound capsule consoles makes this my favorite marketplace. I played the daily lucky wheel, unlocked a 20% flat coupon voucher, and bought the console in minutes. Love the responsive animations too!"
            }
          ].map((review, i) => (
            <div key={i} className="bg-white dark:bg-neutral-900 border border-neutral-250/60 dark:border-neutral-850 p-6 rounded-[2rem] shadow-xs flex flex-col justify-between hover:scale-[1.02] transform transition-all duration-300 relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-pink-500 rounded-l-[2rem]" />
              <div className="space-y-4 text-left">
                <div className="flex gap-1 justify-start">
                  {[...Array(review.stars)].map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                  ))}
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
                  "{review.text}"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-neutral-100 dark:border-neutral-850 text-left">
                <div className="text-2xl w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center shrink-0">
                  {review.avatar}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-neutral-850 dark:text-white font-sans">{review.name}</h4>
                  <p className="text-[10px] text-indigo-605 dark:text-indigo-400 font-mono font-bold leading-none mt-1">{review.tag}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 9. INTERACTIVE STORE FAQ ACCORDION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-left">
        <div className="text-center space-y-1 mb-8">
          <span className="text-[10px] bg-pink-50 dark:bg-pink-950/30 text-pink-650 dark:text-pink-400 font-mono tracking-widest font-extrabold px-3 py-1 rounded-md uppercase">
            💡 Common Queries
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white">
            Frequently Asked Shop Questions
          </h2>
          <p className="text-xs text-neutral-500">
            Clear up fast logistics, security escrow parameters, and how we curate generational items.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "What is ShopSphere and how is it tailored for family generations?",
              a: "ShopSphere is a multi-vendor hub curated specifically to break down generational barriers. We select and index safe physical toys for children, smart gadgets for working tech-users, organic skincare ranges, and warm comfort knits for senior relatives, ensuring children, adults, and grandparents can browse in unified aesthetic luxury."
            },
            {
              q: "How does the escrow buyer protection system function?",
              a: "When you place a card or point purchase, funds are held securely in a multi-party ledger. Once the shipment arrives at your delivery coordinates and you confirm satisfaction, the active system disperses cleared payouts directly to the original independent artisan designer."
            },
            {
              q: "How can I redeem my daily claimed gold points?",
              a: "Gold Points can be applied inside your Checkout Page or profile workspace to trigger complimentary gifts or deduct balance amounts. You can harvest +150 points every calendar day by pressing the daily claim tracker in the welcome bar!"
            },
            {
              q: "Are the returns and customer services safe?",
              a: "Yes! Every SKU is covered by our unconditional 30-day return promise. If any item is flawed, simply open standard dispute tickets on the support center dashboard to trigger pre-certified courier collection envelopes totally free."
            }
          ].map((faq, i) => {
            const isExpanded = expandedFaq === i;
            return (
              <div 
                key={i} 
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden transition-all duration-300 shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-850/50 transition cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    {faq.q}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-indigo-650' : ''}`} />
                </button>
                
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? 'max-h-56 opacity-100 border-t border-neutral-100 dark:border-neutral-800' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="p-5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-semibold">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 10. THE LIFESTYLE NEWSLETTER HARVEST */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-6">
        <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-950 border border-white/5 p-8 sm:p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Ambient lighting bulbs */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="space-y-3 text-center md:text-left relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/10 rounded-full text-[9px] font-mono tracking-wider font-extrabold text-indigo-300 uppercase">
              <Mail className="h-3.5 w-3.5" /> Newsletter Dispatch
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">Stay Synced with Family Curation</h3>
            <p className="text-xs text-indigo-200 font-sans leading-relaxed">
              No spam. Get weekly digests of newly joined global artisan designers, family sales, and custom-matching generational codes.
            </p>
          </div>

          <div className="w-full max-w-sm relative z-10 text-left">
            {newsletterStatus === 'subscribed' ? (
              <div className="bg-emerald-500/20 border border-emerald-400/30 p-4 rounded-2xl text-center space-y-1.5 animate-fadeIn">
                <p className="text-xs font-bold text-white">🎉 Welcome to the Generational Registry!</p>
                <p className="text-[11px] text-neutral-300 leading-relaxed">We have registered <span className="font-bold text-emerald-300">{newsletterEmail}</span>. Enter code <span className="p-1 px-1.5 bg-black/40 text-yellow-300 rounded font-bold font-mono tracking-wider">HARVEST10</span> at checkout for custom gifts!</p>
              </div>
            ) : (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newsletterEmail) setNewsletterStatus('subscribed');
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your family email address..."
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 px-4 py-3 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-indigo-300 placeholder-indigo-300 transition-all text-left"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-650 hover:from-pink-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all transform active:scale-95 cursor-pointer shadow-md duration-200"
                >
                  Subscribe
                </button>
              </form>
            )}
            <p className="text-[10px] text-indigo-300 font-mono mt-2.5 leading-none text-center sm:text-left">🔒 Escrow compliance check standard protected.</p>
          </div>

        </div>
      </section>

    </div>
  );
};
