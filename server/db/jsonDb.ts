/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Vendor, Product, Category, Order, Review, Coupon, ChatMessage } from '../../src/types';
import { hashPassword } from '../utils/auth';
import { db as pgDb } from '../../src/db/index.ts';
import { users, vendors, products, categories, orders, reviews, coupons, messages } from '../../src/db/schema.ts';
import { eq, and } from 'drizzle-orm';

interface Database {
  users: User[];
  vendors: Vendor[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  reviews: Review[];
  coupons: Coupon[];
  messages: ChatMessage[];
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Electronics', slug: 'electronics', icon: 'Cpu' },
  { id: 'cat2', name: 'Books & Stationery', slug: 'books-stationery', icon: 'BookOpen' },
  { id: 'cat3', name: 'Home & Living', slug: 'home-living', icon: 'Home' },
  { id: 'cat4', name: 'Fashion & Apparel', slug: 'fashion-apparel', icon: 'Shirt' },
  { id: 'cat5', name: 'Handmade Crafts', slug: 'handmade-crafts', icon: 'Sparkles' },
  { id: 'cat6', name: 'Beauty', slug: 'beauty', icon: 'Sparkles' },
];

const DEFAULT_COUPONS: Coupon[] = [
  { code: 'WELCOME10', discountPercent: 10, description: '10% off for new shoppers!', active: true, minAmount: 100 },
  { code: 'SUPER30', discountPercent: 30, description: '30% super discount', active: true, minAmount: 500 },
  { code: 'FESTIVE20', discountPercent: 20, description: '20% off on all products', active: true, minAmount: 200 },
];

/**
 * Write-Through SQL Database Controller (with Synced Local Cache)
 */
class SQLDatabase {
  private data: Database;
  private isLoaded: boolean = false;

  constructor() {
    this.data = {
      users: [],
      vendors: [],
      products: [],
      categories: [],
      orders: [],
      reviews: [],
      coupons: [],
      messages: [],
    };
    
    // Asynchronously pull all existing database rows from PostgreSQL Cloud SQL instances on deployment boot
    this.init().then(() => {
      this.isLoaded = true;
      console.log('--- write-through postgres instance cache populated successfully ---');
    }).catch(err => {
      console.error('Failed to initialize postgres write-through layer:', err);
    });
  }

  private async init(): Promise<void> {
    try {
      console.log('Synchronizing PostgreSQL entries...');
      
      // Check if users table is empty to trigger database seeding
      const dbUsersCount = await pgDb.select().from(users);
      if (dbUsersCount.length === 0) {
        await this.seedPostgres();
      }

      // Check if products count is lower than expected and inject premium items
      const currentProductsCount = await pgDb.select().from(products);
      if (currentProductsCount.length < 15) {
        console.log('Fewer than 15 products found. Seeding advanced premium product suite...');
        const supplementalProducts = [
          {
            id: 'prod10',
            title: 'Retro Tube Vacuum Audio Amplifier',
            description: 'Handcrafted warm audiophile amplifier equipped with active vintage biological glass glow vacuum tubes. Housed in fine hand-polished oiled mahogany wood casing with solid knurled metal dials. Restores pure analog richness and physical warmth to digital feeds.',
            price: 649.00,
            originalPrice: 720.00,
            stock: 8,
            category: 'electronics',
            images: [
              'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80'
            ],
            vendorId: 'usr_vendor1',
            vendorName: 'Sterling Tech & Electronics',
            avgRating: 4.9,
            totalReviews: 4,
            createdAt: new Date().toISOString()
          },
          {
            id: 'prod11',
            title: 'Mongolian Cashmere Cozy Knitwear',
            description: 'Woven from exceptionally soft, 100% pure premium raw Mongolian cashmere fibers. Features a classic relaxed crew neckline and beautifully textured mock neck ribbing. Ideal for senior comfort and stylish cross-generational lounging.',
            price: 245.00,
            originalPrice: 280.00,
            stock: 15,
            category: 'fashion-apparel',
            images: [
              'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80'
            ],
            vendorId: 'usr_vendor3',
            vendorName: 'Thorne Couture & Apparel',
            avgRating: 4.8,
            totalReviews: 5,
            createdAt: new Date().toISOString()
          },
          {
            id: 'prod12',
            title: 'Hand-Turned Oak Serving Bowl Set',
            description: 'Individually lathed, hand-shaped oak serving bowls, finished carefully with natural organic olive oils and virgin beeswax. Perfect for organic tablescapes, preserving the natural edge contours of century-old trees.',
            price: 85.00,
            stock: 14,
            category: 'handmade-crafts',
            images: [
              'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop&q=80'
            ],
            vendorId: 'usr_vendor2',
            vendorName: 'The Woodcreek Artisan Workshop',
            avgRating: 4.7,
            totalReviews: 3,
            createdAt: new Date().toISOString()
          },
          {
            id: 'prod13',
            title: 'Self-Sustaining Botanical Dome',
            description: 'A miniature living garden encapsulated in an airtight, hand-blown high-clarity borosilicate glass dome. Crafted with beautiful rich pillow moss, structural slate stones, and specialized terrarium substrate. Self-recycles moisture for minimal care.',
            price: 95.00,
            originalPrice: 110.00,
            stock: 20,
            category: 'handmade-crafts',
            images: [
              'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=800&auto=format&fit=crop&q=80'
            ],
            vendorId: 'usr_vendor2',
            vendorName: 'The Woodcreek Artisan Workshop',
            avgRating: 4.9,
            totalReviews: 6,
            createdAt: new Date().toISOString()
          },
          {
            id: 'prod14',
            title: 'Chrono Shield Peptide Serum',
            description: 'Nourishing facial shield containing concentrated vegan copper tri-peptides, clinical-grade botanical ceramides, and micro-infused multi-tier hyaluronic compounds to lock in deep hydration and promote a radiant skin texture.',
            price: 58.00,
            originalPrice: 65.00,
            stock: 28,
            category: 'beauty',
            images: [
              'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&auto=format&fit=crop&q=80'
            ],
            vendorId: 'usr_vendor3',
            vendorName: 'Thorne Couture & Apparel',
            avgRating: 4.6,
            totalReviews: 4,
            createdAt: new Date().toISOString()
          },
          {
            id: 'prod15',
            title: 'Floating Brass Halo Sconce',
            description: 'Minimal modern linear wall sconce. Featuring a gorgeous brushed solid brass backplate and a hand-blown milk-white glass globe. Radiates a soothing, glowy floating light ring, perfect for architectural reading rooms.',
            price: 135.05,
            stock: 12,
            category: 'home-living',
            images: [
              'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&auto=format&fit=crop&q=80'
            ],
            vendorId: 'usr_vendor2',
            vendorName: 'The Woodcreek Artisan Workshop',
            avgRating: 4.8,
            totalReviews: 2,
            createdAt: new Date().toISOString()
          }
        ];
        for (const p of supplementalProducts) {
          await pgDb.insert(products).values(p as any).onConflictDoNothing();
        }
      }

      // Read real records from PostgreSQL
      const usersList = await pgDb.select().from(users);
      const vendorsList = await pgDb.select().from(vendors);
      const productsList = await pgDb.select().from(products);
      const categoriesList = await pgDb.select().from(categories);
      const ordersList = await pgDb.select().from(orders);
      const reviewsList = await pgDb.select().from(reviews);
      const couponsList = await pgDb.select().from(coupons);
      const messagesList = await pgDb.select().from(messages);

      // Populate local state
      this.data.users = usersList.map(u => ({ ...u, role: u.role as any }));
      this.data.vendors = vendorsList.map(v => ({ ...v, status: v.status as any }));
      this.data.products = productsList.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice || undefined,
        stock: p.stock,
        category: p.category,
        images: p.images as string[],
        vendorId: p.vendorId,
        vendorName: p.vendorName,
        avgRating: p.avgRating,
        totalReviews: p.totalReviews,
        tags: p.tags ? (p.tags as string[]) : undefined,
        createdAt: p.createdAt,
      }));
      this.data.categories = categoriesList;
      this.data.orders = ordersList.map(o => ({
        id: o.id,
        customerId: o.customerId,
        customerName: o.customerName,
        customerEmail: o.customerEmail,
        items: o.items as any[],
        totalAmount: o.totalAmount,
        discountAmount: o.discountAmount || undefined,
        shippingAddress: o.shippingAddress as any,
        paymentMethod: o.paymentMethod,
        paymentStatus: o.paymentStatus as any,
        paymentId: o.paymentId || undefined,
        createdAt: o.createdAt,
      }));
      this.data.reviews = reviewsList.map(r => ({
        ...r,
        verified: r.verified !== null ? r.verified : undefined
      }));
      this.data.coupons = couponsList.map(c => ({
        code: c.code,
        discountPercent: c.discountPercent,
        description: c.description,
        active: c.active,
        minAmount: c.minAmount || undefined,
        type: c.type ? (c.type as any) : undefined,
        discountValue: c.discountValue || undefined,
      }));
      this.data.messages = messagesList;

      console.log(`Cloud SQL Cache primed:
        - Categories: ${this.data.categories.length}
        - Coupons: ${this.data.coupons.length}
        - Users: ${this.data.users.length}
        - Vendors: ${this.data.vendors.length}
        - Products: ${this.data.products.length}
        - Orders: ${this.data.orders.length}
        - Reviews: ${this.data.reviews.length}
        - Messages: ${this.data.messages.length}
      `);
    } catch (err) {
      console.error('Error synchronizing cache rows from PostgreSQL:', err);
    }
  }

  private async seedPostgres(): Promise<void> {
    console.log('--- PostgreSQL DB Seed Initiated ---');

    // 1. Categories
    for (const cat of DEFAULT_CATEGORIES) {
      await pgDb.insert(categories).values(cat).onConflictDoNothing();
    }

    // 2. Coupons
    for (const c of DEFAULT_COUPONS) {
      await pgDb.insert(coupons).values(c).onConflictDoNothing();
    }

    // 3. Admin User
    const adminUser: User = {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@marketplace.com',
      password: hashPassword('password123'),
      role: 'admin',
      address: 'Marketplace Headquarters, Sector 62',
      phone: '+1 999-000-1111',
      createdAt: new Date().toISOString(),
    };
    await pgDb.insert(users).values(adminUser).onConflictDoNothing();

    // 4. Vendors
    const vendor1User: User = {
      id: 'usr_vendor1',
      name: 'Alexander Sterling',
      email: 'vendor1@marketplace.com',
      password: hashPassword('password123'),
      role: 'vendor',
      phone: '+1 415-555-0199',
      address: '562 Pine St, San Francisco, CA',
      createdAt: new Date().toISOString(),
    };
    await pgDb.insert(users).values(vendor1User).onConflictDoNothing();

    const vendor1Profile: Vendor = {
      id: 'usr_vendor1',
      userId: 'usr_vendor1',
      storeName: 'Sterling Tech & Electronics',
      description: 'Your premium gateway to curated consumer electronics, smart home automation modules, and bespoke audio gadgets.',
      logoUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=60',
      status: 'approved',
      phone: '+1 415-555-0199',
      address: '562 Pine St, San Francisco, CA',
      bankAccount: 'US-STERLING-CHASE-0941',
      totalEarnings: 2750.50,
      createdAt: new Date().toISOString(),
    };
    await pgDb.insert(vendors).values(vendor1Profile).onConflictDoNothing();

    const vendor2User: User = {
      id: 'usr_vendor2',
      name: 'Evelyn Woodcreek',
      email: 'vendor2@marketplace.com',
      password: hashPassword('password123'),
      role: 'vendor',
      phone: '+1 503-555-2200',
      address: '148 Oak Avenue, Portland, OR',
      createdAt: new Date().toISOString(),
    };
    await pgDb.insert(users).values(vendor2User).onConflictDoNothing();

    const vendor2Profile: Vendor = {
      id: 'usr_vendor2',
      userId: 'usr_vendor2',
      storeName: 'The Woodcreek Artisan Workshop',
      description: 'Handcrafted stationery, elegant leather journals, and rustic timber home accessories made with sustainably sourced materials.',
      logoUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=150&auto=format&fit=crop&q=60',
      status: 'approved',
      phone: '+1 503-555-2200',
      address: '148 Oak Avenue, Portland, OR',
      bankAccount: 'US-WOODCREEK-WELLSFRG-8812',
      totalEarnings: 1240.00,
      createdAt: new Date().toISOString(),
    };
    await pgDb.insert(vendors).values(vendor2Profile).onConflictDoNothing();

    const vendor3User: User = {
      id: 'usr_vendor3',
      name: 'Zara Thorne',
      email: 'vendor3@marketplace.com',
      password: hashPassword('password123'),
      role: 'vendor',
      phone: '+1 212-555-4422',
      address: '42 Broome St, New York, NY',
      createdAt: new Date().toISOString(),
    };
    await pgDb.insert(users).values(vendor3User).onConflictDoNothing();

    const vendor3Profile: Vendor = {
      id: 'usr_vendor3',
      userId: 'usr_vendor3',
      storeName: 'Thorne Couture & Apparel',
      description: 'Exclusive slow-fashion streetwear, minimal silhouettes, and handcrafted urban accessories.',
      logoUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150&auto=format&fit=crop&q=60',
      status: 'pending',
      phone: '+1 212-555-4422',
      address: '42 Broome St, New York, NY',
      bankAccount: 'US-THORNE-CITI-3091',
      totalEarnings: 0,
      createdAt: new Date().toISOString(),
    };
    await pgDb.insert(vendors).values(vendor3Profile).onConflictDoNothing();

    // 5. Customer Users
    const customerUser: User = {
      id: 'usr_customer',
      name: 'Jane Miller',
      email: 'customer@marketplace.com',
      password: hashPassword('password123'),
      role: 'customer',
      phone: '+1 312-555-0144',
      address: '88 Michigan Ave, Chicago, IL',
      createdAt: new Date().toISOString(),
    };
    await pgDb.insert(users).values(customerUser).onConflictDoNothing();

    // 6. Products
    const initialProducts = [
      {
        id: 'prod1',
        title: 'Bespoke ANC Wireless Headphones',
        description: 'Sublime acoustics with high-fidelity active hybrid noise cancellation. Encased in beautiful brushed aluminum housing and authentic soft leather ear cushions designed for tireless, immersive listening. Equipped with Bluetooth 5.2, 40 hours of continuous playing time, and rapid USB-C dual-stage charging.',
        price: 299.99,
        originalPrice: 349.99,
        stock: 24,
        category: 'electronics',
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80'
        ],
        vendorId: 'usr_vendor1',
        vendorName: 'Sterling Tech & Electronics',
        avgRating: 4.8,
        totalReviews: 5,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prod2',
        title: 'Minimalist Mechanical Keyboard',
        description: 'Constructed on a sturdy CNC-machined walnut timber chassis with tactile linear silent switches. Boasts customizable ice-blue keycaps with warm underglow lighting, hot-swappable key switches, and solid brass accent plate detail. Designed for typing enthusiasts and modern desktop environments.',
        price: 189.00,
        originalPrice: 199.00,
        stock: 12,
        category: 'electronics',
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80'
        ],
        vendorId: 'usr_vendor1',
        vendorName: 'Sterling Tech & Electronics',
        avgRating: 4.5,
        totalReviews: 2,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prod3',
        title: 'Amber Glow Smart Ambient Beacon',
        description: 'An elegant, applet-controlled smart glass lantern that outputs comforting bio-effective Amber lighting. Connects smoothly to home assist devices via simple REST API integrations. Recharges on a wireless induction copper tray.',
        price: 89.50,
        originalPrice: 110.00,
        stock: 50,
        category: 'electronics',
        images: [
          'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80'
        ],
        vendorId: 'usr_vendor1',
        vendorName: 'Sterling Tech & Electronics',
        avgRating: 4.2,
        totalReviews: 1,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prod4',
        title: 'Premium Full-Grain Leather Journal',
        description: 'Lovingly hand-bound journals made from vegetable-dyed rustic cowhide, stuffed with 240 plain deckle-edge archival linen pages (120gsm). Resists bleed-through perfectly for executive fountain pens and artist charcoal sketched masterpieces. Securely enclosed with a rich leather strap closure.',
        price: 48.00,
        originalPrice: 55.00,
        stock: 18,
        category: 'books-stationery',
        images: [
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&auto=format&fit=crop&q=80'
        ],
        vendorId: 'usr_vendor2',
        vendorName: 'The Woodcreek Artisan Workshop',
        avgRating: 4.9,
        totalReviews: 6,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prod5',
        title: 'Hand-Carved Black Walnut Desk Stand',
        description: 'Sleek structural monitor and technology stand designed for ergonomics. Hand-carved from a single solid block of black walnut harvested from sustainable timber fields. Hand-finished with premium hard-wax oils to protect wood grain natural beauty.',
        price: 115.00,
        stock: 10,
        category: 'home-living',
        images: [
          'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80'
        ],
        vendorId: 'usr_vendor2',
        vendorName: 'The Woodcreek Artisan Workshop',
        avgRating: 4.7,
        totalReviews: 3,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prod6',
        title: 'Archival Solid Brass Fountain Pen',
        description: 'Heavyweight raw brass barrel writes smoothly, forming a gorgeous custom copper patina with direct hand usage. Features an elegant fine German iridium-tipped nib for exceptionally fine, fluid lines. Refillable with standard global screw ink converters.',
        price: 75.00,
        originalPrice: 85.00,
        stock: 25,
        category: 'books-stationery',
        images: [
          'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80'
        ],
        vendorId: 'usr_vendor2',
        vendorName: 'The Woodcreek Artisan Workshop',
        avgRating: 4.6,
        totalReviews: 4,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prod7',
        title: 'Undertone Minimal Canvas Tote Bag',
        description: 'An architectural everyday tote bag manufactured from 100% heavy duty rain-protected raw black linen. Equipped with dynamic interior canvas modular laptop slot dividers and sturdy black leather shoulder strap handles.',
        price: 64.00,
        stock: 30,
        category: 'fashion-apparel',
        images: [
          'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
        ],
        vendorId: 'usr_vendor3',
        vendorName: 'Thorne Couture & Apparel',
        avgRating: 0,
        totalReviews: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prod8',
        title: 'Rose Quartz Revitalizing Facial Roller',
        description: 'Crafted from hand-carved, authentic rose quartz crystal. Relieves facial muscle tension, reduces puffiness, and supports lymphatic drainage when rolled over cleansed skin. Equipped with dual-ended smooth stone rollers and noise-free silicone gaskets.',
        price: 28.00,
        originalPrice: 34.00,
        stock: 45,
        category: 'beauty',
        images: [
          'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80'
        ],
        vendorId: 'usr_vendor3',
        vendorName: 'Thorne Couture & Apparel',
        avgRating: 4.7,
        totalReviews: 3,
        createdAt: new Date().toISOString()
      },
      {
        id: 'prod9',
        title: 'Pure Botanical Infused Face Elixir',
        description: 'An ultra-nourishing active facial oil infused with Damascus rose extracts, cold-pressed jojoba, and Vitamin E. Naturally hydrates and delivers a radiant, luminous glow. Easily absorbed without heavy grease or residue, leaving a delicate scent profile.',
        price: 42.00,
        originalPrice: 48.00,
        stock: 35,
        category: 'beauty',
        images: [
          'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=800&auto=format&fit=crop&q=80'
        ],
        vendorId: 'usr_vendor3',
        vendorName: 'Thorne Couture & Apparel',
        avgRating: 4.9,
        totalReviews: 7,
        createdAt: new Date().toISOString()
      }
    ];
    for (const p of initialProducts) {
      await pgDb.insert(products).values(p as any).onConflictDoNothing();
    }

    // 7. Reviews
    const initialReviews = [
      {
        id: 'rev1',
        productId: 'prod1',
        userId: 'usr_customer',
        userName: 'Jane Miller',
        rating: 5,
        comment: 'These are hands-down the best headphones I have ever bought! Audio fidelity is outstanding, and the walnut stands compliment my workspace beautiful.',
        createdAt: new Date().toISOString(),
        verified: true
      },
      {
        id: 'rev2',
        productId: 'prod4',
        userId: 'usr_customer',
        userName: 'Jane Miller',
        rating: 5,
        comment: 'The scent of real leather is superb. Bound perfectly, thick papers handle ink flawlessly.',
        createdAt: new Date().toISOString(),
        verified: true
      },
      {
        id: 'rev3',
        productId: 'prod6',
        userId: 'usr_customer',
        userName: 'Jane Miller',
        rating: 4,
        comment: 'Lovely weight and balance. It forms an antique patina quickly. A real classic to own!',
        createdAt: new Date().toISOString(),
        verified: true
      }
    ];
    for (const r of initialReviews) {
      await pgDb.insert(reviews).values(r).onConflictDoNothing();
    }

    // 8. Orders
    const initialOrders = [
      {
        id: 'ord_1001',
        customerId: 'usr_customer',
        customerName: 'Jane Miller',
        customerEmail: 'customer@marketplace.com',
        items: [
          {
            productId: 'prod1',
            title: 'Bespoke ANC Wireless Headphones',
            price: 299.99,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
            vendorId: 'usr_vendor1',
            status: 'delivered'
          },
          {
            productId: 'prod4',
            title: 'Premium Full-Grain Leather Journal',
            price: 48.00,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
            vendorId: 'usr_vendor2',
            status: 'shipped'
          }
        ],
        totalAmount: 347.99,
        discountAmount: 0,
        shippingAddress: {
          fullName: 'Jane Miller',
          phone: '+1 312-555-0144',
          addressLine1: '88 Michigan Ave',
          city: 'Chicago',
          state: 'IL',
          postalCode: '60611',
          country: 'United States'
        },
        paymentMethod: 'Credit Card',
        paymentStatus: 'paid',
        paymentId: 'pay_rzp_mock_94101',
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
      }
    ];
    for (const o of initialOrders) {
      await pgDb.insert(orders).values(o as any).onConflictDoNothing();
    }

    console.log('--- PostgreSQL DB Seed Completed Successfully ---');
  }

  // Database read actions
  public getUsers(): User[] { return this.data.users; }
  public getVendors(): Vendor[] { return this.data.vendors; }
  public getProducts(): Product[] { return this.data.products; }
  public getCategories(): Category[] { return this.data.categories; }
  public getOrders(): Order[] { return this.data.orders; }
  public getReviews(): Review[] { return this.data.reviews; }
  public getCoupons(): Coupon[] { return this.data.coupons; }
  public getMessages(): ChatMessage[] { return this.data.messages; }

  // Database write actions
  public addUser(user: User): void {
    this.data.users.push(user);
    pgDb.insert(users).values(user).onConflictDoNothing().catch(err => {
      console.error('PostgreSQL insert user error:', err);
    });
  }

  public addVendor(vendor: Vendor): void {
    this.data.vendors.push(vendor);
    pgDb.insert(vendors).values({
      ...vendor,
      status: vendor.status as string,
    }).onConflictDoNothing().catch(err => {
      console.error('PostgreSQL insert vendor error:', err);
    });
  }

  public addProduct(product: Product): void {
    this.data.products.push(product);
    pgDb.insert(products).values({
      ...product,
      tags: product.tags || null,
    }).catch(err => {
      console.error('PostgreSQL insert product error:', err);
    });
  }

  public addOrder(order: Order): void {
    this.data.orders.push(order);
    pgDb.insert(orders).values(order).catch(err => {
      console.error('PostgreSQL insert order error:', err);
    });
  }

  public addReview(review: Review): void {
    this.data.reviews.push(review);
    pgDb.insert(reviews).values(review).catch(err => {
      console.error('PostgreSQL insert review error:', err);
    });
    
    // Recalculate average rating
    const productReviews = this.data.reviews.filter(r => r.productId === review.productId);
    const sum = productReviews.reduce((acc, curr) => acc + curr.rating, 0);
    const avg = parseFloat((sum / productReviews.length).toFixed(1));

    const pIdx = this.data.products.findIndex(p => p.id === review.productId);
    if (pIdx !== -1) {
      this.data.products[pIdx].avgRating = avg;
      this.data.products[pIdx].totalReviews = productReviews.length;
      
      pgDb.update(products).set({
        avgRating: avg,
        totalReviews: productReviews.length,
      }).where(eq(products.id, review.productId)).catch(err => {
        console.error('PostgreSQL update product rating error:', err);
      });
    }
  }

  public addCoupon(coupon: Coupon): void {
    this.data.coupons.push(coupon);
    pgDb.insert(coupons).values({
      ...coupon,
      type: coupon.type || null,
    }).onConflictDoNothing().catch(err => {
      console.error('PostgreSQL insert coupon error:', err);
    });
  }

  public deleteCoupon(code: string): boolean {
    const originalLength = this.data.coupons.length;
    this.data.coupons = this.data.coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
    if (this.data.coupons.length !== originalLength) {
      pgDb.delete(coupons).where(eq(coupons.code, code.toUpperCase())).catch(err => {
        console.error('PostgreSQL delete coupon error:', err);
      });
      return true;
    }
    return false;
  }

  public addMessage(msg: ChatMessage): void {
    this.data.messages.push(msg);
    pgDb.insert(messages).values(msg).catch(err => {
      console.error('PostgreSQL insert message error:', err);
    });
  }

  public updateProduct(productId: string, updates: Partial<Product>): boolean {
    const idx = this.data.products.findIndex(p => p.id === productId);
    if (idx !== -1) {
      this.data.products[idx] = { ...this.data.products[idx], ...updates };
      pgDb.update(products).set({
        ...updates,
        tags: updates.tags !== undefined ? updates.tags : undefined,
      }).where(eq(products.id, productId)).catch(err => {
        console.error('PostgreSQL update product error:', err);
      });
      return true;
    }
    return false;
  }

  public deleteProduct(productId: string): boolean {
    const originalLength = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== productId);
    if (this.data.products.length !== originalLength) {
      pgDb.delete(products).where(eq(products.id, productId)).catch(err => {
        console.error('PostgreSQL delete product error:', err);
      });
      return true;
    }
    return false;
  }

  public updateVendorStatus(vendorId: string, status: 'approved' | 'rejected' | 'pending'): boolean {
    const idx = this.data.vendors.findIndex(v => v.id === vendorId);
    if (idx !== -1) {
      this.data.vendors[idx].status = status;
      pgDb.update(vendors).set({ status }).where(eq(vendors.id, vendorId)).catch(err => {
        console.error('PostgreSQL update vendor status error:', err);
      });
      return true;
    }
    return false;
  }

  public updateVendorEarnings(vendorId: string, amount: number): boolean {
    const idx = this.data.vendors.findIndex(v => v.id === vendorId);
    if (idx !== -1) {
      this.data.vendors[idx].totalEarnings += amount;
      pgDb.update(vendors).set({
        totalEarnings: this.data.vendors[idx].totalEarnings,
      }).where(eq(vendors.id, vendorId)).catch(err => {
        console.error('PostgreSQL update vendor earnings error:', err);
      });
      return true;
    }
    return false;
  }

  public updateOrderStatus(orderId: string, vendorId: string, productId: string, status: string): boolean {
    const idx = this.data.orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      const order = this.data.orders[idx];
      let itemUpdated = false;
      
      order.items = order.items.map(item => {
        if (item.productId === productId && item.vendorId === vendorId) {
          item.status = status as any;
          itemUpdated = true;
        }
        return item;
      });

      pgDb.update(orders).set({
        items: order.items,
      }).where(eq(orders.id, orderId)).catch(err => {
        console.error('PostgreSQL update order items status error:', err);
      });
      return itemUpdated;
    }
    return false;
  }

  public rateOrder(orderId: string, rating: number, comment: string): boolean {
    const idx = this.data.orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      const order = this.data.orders[idx];
      order.items = order.items.map(item => ({
        ...item,
        isRated: true,
        itemRating: rating,
        itemFeedback: comment
      }));
      (order as any).isRated = true;

      pgDb.update(orders).set({
        items: order.items,
      }).where(eq(orders.id, orderId)).catch(err => {
        console.error('PostgreSQL update order rate status error:', err);
      });
      return true;
    }
    return false;
  }

  public updateUser(userId: string, updates: Partial<User>): boolean {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      pgDb.update(users).set(updates).where(eq(users.id, userId)).catch(err => {
        console.error('PostgreSQL update user error:', err);
      });
      return true;
    }
    return false;
  }

  public updateVendorProfile(vendorId: string, updates: Partial<Vendor>): boolean {
    const idx = this.data.vendors.findIndex(v => v.id === vendorId);
    if (idx !== -1) {
      this.data.vendors[idx] = { ...this.data.vendors[idx], ...updates };
      pgDb.update(vendors).set(updates).where(eq(vendors.id, vendorId)).catch(err => {
        console.error('PostgreSQL update vendor profile error:', err);
      });
      return true;
    }
    return false;
  }

  public saveCollection(collection: string): void {
    if (collection === 'orders') {
      for (const order of this.data.orders) {
        pgDb.insert(orders).values(order).onConflictDoUpdate({
          target: orders.id,
          set: {
            items: order.items,
            totalAmount: order.totalAmount,
            discountAmount: order.discountAmount || null,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            paymentId: order.paymentId || null,
          }
        }).catch(err => {
          console.error('PostgreSQL saveCollection orders error:', err);
        });
      }
    } else if (collection === 'coupons') {
      for (const coupon of this.data.coupons) {
        pgDb.insert(coupons).values({
          ...coupon,
          type: coupon.type || null,
        }).onConflictDoUpdate({
          target: coupons.code,
          set: {
            discountPercent: coupon.discountPercent,
            description: coupon.description,
            active: coupon.active,
            minAmount: coupon.minAmount || null,
            type: coupon.type || null,
            discountValue: coupon.discountValue || null,
          }
        }).catch(err => {
          console.error('PostgreSQL saveCollection coupons error:', err);
        });
      }
    } else if (collection === 'users') {
      for (const u of this.data.users) {
        pgDb.insert(users).values(u).onConflictDoUpdate({
          target: users.id,
          set: {
            name: u.name,
            email: u.email,
            password: u.password || null,
            role: u.role,
            avatar: u.avatar || null,
            phone: u.phone || null,
            address: u.address || null,
          }
        }).catch(err => {
          console.error('PostgreSQL saveCollection users error:', err);
        });
      }
    } else if (collection === 'vendors') {
      for (const v of this.data.vendors) {
        pgDb.insert(vendors).values({
          ...v,
          status: v.status as string,
        }).onConflictDoUpdate({
          target: vendors.id,
          set: {
            storeName: v.storeName,
            description: v.description,
            logoUrl: v.logoUrl || null,
            status: v.status,
            phone: v.phone,
            address: v.address,
            bankAccount: v.bankAccount,
            totalEarnings: v.totalEarnings,
          }
        }).catch(err => {
          console.error('PostgreSQL saveCollection vendors error:', err);
        });
      }
    } else if (collection === 'products') {
      for (const product of this.data.products) {
        pgDb.insert(products).values({
          ...product,
          tags: product.tags || null,
        }).onConflictDoUpdate({
          target: products.id,
          set: {
            title: product.title,
            description: product.description,
            price: product.price,
            originalPrice: product.originalPrice || null,
            stock: product.stock,
            category: product.category,
            images: product.images,
            vendorId: product.vendorId,
            vendorName: product.vendorName,
            avgRating: product.avgRating,
            totalReviews: product.totalReviews,
            tags: product.tags || null,
          }
        }).catch(err => {
          console.error('PostgreSQL saveCollection products error:', err);
        });
      }
    }
  }
}

export const db = new SQLDatabase();
