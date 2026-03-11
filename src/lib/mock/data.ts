import type { Branch, MenuItem } from '@/types'

// ─────────────────────────────────────────────
// BRANCHES
// ─────────────────────────────────────────────
export const BRANCHES: Branch[] = [
    {
        id: 'wapda',
        name: 'Wapda Town Branch',
        address: 'E-88, Block E1, Wapda Town Phase 1, Lahore',
        lat: 31.4697,
        lng: 74.2728,
        phone: '0329-1330234',
        whatsapp: '923291330234',
        hours: 'Mon–Sun: 12:00 PM – 1:00 AM',
    },
    {
        id: 'cant',
        name: 'Cantonment Branch',
        address: '22-23, Ground Floor, Tufail Road, near Mall of Lahore, Cantonment',
        lat: 31.5497,
        lng: 74.3436,
        phone: '0300-1330234',
        whatsapp: '923001330234',
        hours: 'Mon–Sun: 12:00 PM – 1:00 AM',
    },
]

// ─────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────
export const CATEGORIES = [
    { id: 'appetizers', label: 'Appetizers', icon: '🍟' },
    { id: 'shawarma', label: 'Shawarma', icon: '🌯' },
    { id: 'lebanese', label: 'Lebanese Specials', icon: '🥙' },
    { id: 'burgers', label: 'Burgers & Sandwiches', icon: '🍔' },
    { id: 'wraps', label: 'Wraps', icon: '🫔' },
    { id: 'bbq', label: 'BBQ Rolls', icon: '🔥' },
    { id: 'bbq-platters', label: 'BBQ Platters', icon: '🍖' },
    { id: 'platters', label: 'Family Platters', icon: '🫕' },
    { id: 'beverages', label: 'Beverages', icon: '🥤' },
    { id: 'dips', label: 'Dips & Sauces', icon: '🫙' },
]

// ─────────────────────────────────────────────
// MENU ITEMS — REAL ZIATOON MENU
// ─────────────────────────────────────────────
export const MENU_ITEMS: MenuItem[] = [

    // ── APPETIZERS ──────────────────────────────
    { id: 'a1', name: 'Fries', category: 'appetizers', price: 350, rating: 4.5, prepTime: 8, tags: [], description: 'Crispy golden fries', isAvailable: true },
    { id: 'a2', name: 'Hot Jumbo Fries', category: 'appetizers', price: 450, rating: 4.6, prepTime: 8, tags: [], description: 'Oversized spicy fries with house seasoning', isAvailable: true },
    { id: 'a3', name: 'Combo Fries', category: 'appetizers', price: 500, rating: 4.6, prepTime: 10, tags: [], description: 'Loaded combo fries with dips', isAvailable: true },
    { id: 'a4', name: 'Chicken & Chips', category: 'appetizers', price: 1050, rating: 4.7, prepTime: 15, tags: ['bestseller'], description: 'Crispy fried chicken with golden fries', isAvailable: true },

    // ── SHAWARMA ────────────────────────────────
    { id: 's1', name: 'Shawarma Sarokh', category: 'shawarma', price: 520, rating: 4.7, prepTime: 12, tags: [], description: 'Classic Lebanese-style shawarma wrap with garlic sauce', isAvailable: true },
    { id: 's2', name: 'Shawarma Sagher', category: 'shawarma', price: 620, rating: 4.7, prepTime: 12, tags: [], description: 'Medium shawarma with fresh vegetables and tahini', isAvailable: true },
    { id: 's3', name: 'Zaitoon Special Shawarma', category: 'shawarma', price: 790, rating: 4.9, prepTime: 15, tags: ['bestseller'], description: "Zaitoon's signature shawarma with our secret house sauce", isAvailable: true },
    { id: 's4', name: 'Jumbo Shawarma', category: 'shawarma', price: 900, rating: 4.8, prepTime: 15, tags: ['bestseller'], description: 'Extra-large shawarma wrap — a full meal in itself', isAvailable: true },
    { id: 's5', name: 'Arabic Shawarma', category: 'shawarma', price: 950, rating: 4.8, prepTime: 15, tags: [], description: 'Authentic Arabic-spiced shawarma with hummus and pickles', isAvailable: true },
    { id: 's6', name: 'Sahan Shawarma', category: 'shawarma', price: 1550, rating: 4.8, prepTime: 20, tags: [], description: 'Shawarma served on a platter with rice, salad and garlic sauce', isAvailable: true },
    { id: 's7', name: 'Sahan Shawarma with Hummus', category: 'shawarma', price: 1600, rating: 4.9, prepTime: 20, tags: ['bestseller'], description: 'Shawarma platter upgraded with creamy house hummus', isAvailable: true },
    { id: 's8', name: 'Zaitoon Shawarma (Lebanese Special)', category: 'shawarma', price: 1750, rating: 4.9, prepTime: 20, tags: ['bestseller', 'new'], description: 'Premium Lebanese-style shawarma — the house showstopper', isAvailable: true },

    // ── LEBANESE SPECIALS ───────────────────────
    { id: 'l1', name: 'Chicken Kabab Wrap', category: 'lebanese', price: 720, rating: 4.7, prepTime: 12, tags: [], description: 'Juicy chicken kabab in Lebanese bread with garlic sauce', isAvailable: true },
    { id: 'l2', name: 'Beef Kabab Wrap', category: 'lebanese', price: 790, rating: 4.7, prepTime: 12, tags: [], description: 'Tender beef kabab wrap with fresh herbs', isAvailable: true },
    { id: 'l3', name: 'Lamb Kabab Wrap', category: 'lebanese', price: 890, rating: 4.8, prepTime: 15, tags: [], description: 'Premium lamb kabab wrap — rich and aromatic', isAvailable: true },
    { id: 'l4', name: 'Shish Tawook Wrap', category: 'lebanese', price: 890, rating: 4.8, prepTime: 15, tags: ['bestseller'], description: 'Marinated grilled chicken cubes wrapped in Lebanese bread', isAvailable: true },
    { id: 'l5', name: 'Falafel Sandwich Wrap', category: 'lebanese', price: 590, rating: 4.6, prepTime: 10, tags: [], description: 'Crispy falafel with tahini and fresh salad', isAvailable: true },
    { id: 'l6', name: 'Chicken Kabab Sahan', category: 'lebanese', price: 1650, rating: 4.8, prepTime: 20, tags: [], description: 'Chicken kabab platter with rice and sides', isAvailable: true },
    { id: 'l7', name: 'Beef Kabab Sahan', category: 'lebanese', price: 1700, rating: 4.8, prepTime: 20, tags: [], description: 'Beef kabab platter with Lebanese rice and salad', isAvailable: true },
    { id: 'l8', name: 'Lamb Kabab Sahan', category: 'lebanese', price: 1950, rating: 4.9, prepTime: 25, tags: [], description: 'Premium lamb kabab platter — a true Lebanese feast', isAvailable: true },
    { id: 'l9', name: 'Shish Tawook Sahan', category: 'lebanese', price: 1750, rating: 4.9, prepTime: 20, tags: ['bestseller'], description: 'Grilled chicken platter with rice, salad and garlic sauce', isAvailable: true },
    { id: 'l10', name: 'Falafel Sahan with Hummus', category: 'lebanese', price: 1600, rating: 4.8, prepTime: 20, tags: [], description: 'Falafel platter with creamy hummus and fresh pita', isAvailable: true },

    // ── BURGERS & SANDWICHES ────────────────────
    { id: 'b1', name: 'Chicken Supreme Burger', category: 'burgers', price: 750, rating: 4.7, prepTime: 12, tags: ['bestseller'], description: 'Double-stacked chicken burger with supreme sauce', isAvailable: true },
    { id: 'b2', name: 'Grill Patty Burger', category: 'burgers', price: 600, rating: 4.6, prepTime: 12, tags: [], description: 'Charcoal-grilled beef patty burger with fresh veggies', isAvailable: true },
    { id: 'b3', name: 'Charcoal Burger', category: 'burgers', price: 650, rating: 4.7, prepTime: 12, tags: [], description: 'Charcoal bun burger with smoky charcoal-grilled patty', isAvailable: true },
    { id: 'b4', name: 'Smash Beef Burger', category: 'burgers', price: 950, rating: 4.8, prepTime: 15, tags: ['bestseller', 'new'], description: 'American-style smash beef burger — crispy edges, juicy center', isAvailable: true },
    { id: 'b5', name: 'Zaitoon Special Burger', category: 'burgers', price: 850, rating: 4.9, prepTime: 15, tags: ['bestseller'], description: "Zaitoon's signature burger with special house sauce", isAvailable: true },
    { id: 'b6', name: 'Club Sandwich', category: 'burgers', price: 800, rating: 4.7, prepTime: 12, tags: [], description: 'Triple-layer club sandwich with chicken, cheese and veggies', isAvailable: true },
    { id: 'b7', name: 'Spicy Sandwich', category: 'burgers', price: 800, rating: 4.7, prepTime: 12, tags: [], description: 'Hot & spicy chicken sandwich for heat lovers', isAvailable: true },
    { id: 'b8', name: 'Sandwich with Extra Cheese', category: 'burgers', price: 800, rating: 4.7, prepTime: 12, tags: [], description: 'Classic chicken sandwich loaded with melted cheese', isAvailable: true },
    { id: 'b9', name: 'Malai Sandwich', category: 'burgers', price: 800, rating: 4.6, prepTime: 12, tags: [], description: 'Creamy malai chicken sandwich — mild and delicious', isAvailable: true },

    // ── WRAPS ───────────────────────────────────
    { id: 'w1', name: 'Spicy Special Wrap', category: 'wraps', price: 700, rating: 4.7, prepTime: 12, tags: [], description: 'Fiery spiced chicken wrap with hot sauce', isAvailable: true },
    { id: 'w2', name: 'Crispy Wrap', category: 'wraps', price: 800, rating: 4.7, prepTime: 12, tags: ['bestseller'], description: 'Crispy fried chicken wrap with creamy sauce', isAvailable: true },
    { id: 'w3', name: 'Zaitoon Special Wrap', category: 'wraps', price: 900, rating: 4.8, prepTime: 12, tags: ['bestseller'], description: "Zaitoon's signature wrap — a customer favourite", isAvailable: true },

    // ── BBQ ROLLS (Small / Large) ────────────────
    { id: 'r1', name: 'Chicken Malai Botti', category: 'bbq', price: 425, priceL: 800, rating: 4.9, prepTime: 20, tags: ['bestseller'], description: 'Creamy marinated chicken botti — melt-in-mouth tender', isAvailable: true, hasSizes: true },
    { id: 'r2', name: 'Chitak Botti', category: 'bbq', price: null, priceL: null, rating: 4.7, prepTime: 20, tags: [], description: "Ask staff for today's price", isAvailable: true, hasSizes: true, priceOnRequest: true },
    { id: 'r3', name: 'Haryali Botti', category: 'bbq', price: null, priceL: null, rating: 4.7, prepTime: 20, tags: [], description: 'Green herb-marinated botti — fresh and aromatic', isAvailable: true, hasSizes: true, priceOnRequest: true },
    { id: 'r4', name: 'Red Chicken Tikka', category: 'bbq', price: null, priceL: null, rating: 4.8, prepTime: 20, tags: [], description: 'Classic red-marinated chicken tikka from the charcoal grill', isAvailable: true, hasSizes: true, priceOnRequest: true },
    { id: 'r5', name: 'Peshmi Kabab', category: 'bbq', price: null, priceL: null, rating: 4.7, prepTime: 20, tags: [], description: 'Soft minced meat kabab with a delicate flavour', isAvailable: true, hasSizes: true, priceOnRequest: true },
    { id: 'r6', name: 'Beef Seekh Kabab', category: 'bbq', price: 480, priceL: 900, rating: 4.8, prepTime: 20, tags: [], description: 'Spiced minced beef seekh kabab on charcoal', isAvailable: true, hasSizes: true },
    { id: 'r7', name: 'Mutton Sona Kabab', category: 'bbq', price: 480, priceL: 980, rating: 4.8, prepTime: 20, tags: [], description: 'Premium mutton kabab — golden and irresistible', isAvailable: true, hasSizes: true },
    { id: 'r8', name: 'Beef Bihari Botti', category: 'bbq', price: 550, priceL: 1050, rating: 4.8, prepTime: 20, tags: [], description: 'Bihari-marinated beef botti — slow-cooked and smoky', isAvailable: true, hasSizes: true },
    { id: 'r9', name: 'Zaitoon Special Wrap (BBQ)', category: 'bbq', price: 480, priceL: 900, rating: 4.9, prepTime: 20, tags: ['bestseller'], description: 'BBQ botti wrapped in Lebanese bread with house sauce', isAvailable: true, hasSizes: true },

    // ── FAMILY PLATTERS ─────────────────────────
    { id: 'p1', name: 'Single Platter', category: 'platters', price: 1700, rating: 4.8, prepTime: 30, tags: [], description: 'A satisfying single-person BBQ platter', isAvailable: true },
    { id: 'p2', name: 'Small Mix Platter', category: 'platters', price: 1700, rating: 4.8, prepTime: 30, tags: [], description: 'Mix of BBQ items for 1–2 persons', isAvailable: true },
    { id: 'p3', name: 'Large Mix Platter', category: 'platters', price: 3400, rating: 4.9, prepTime: 35, tags: ['bestseller'], description: 'Generous mixed BBQ platter for 3–4 persons', isAvailable: true },
    { id: 'p4', name: 'Zaitoon Family Platter', category: 'platters', price: 4400, rating: 4.9, prepTime: 40, tags: ['bestseller'], description: 'The ultimate feast — multiple BBQ items for the whole family', isAvailable: true },
    { id: 'p5', name: 'Ruz Bukhari', category: 'platters', price: 7500, rating: 4.9, prepTime: 45, tags: ['new'], description: 'Fragrant Arabic slow-cooked rice with premium meat — serves 4–6', isAvailable: true },

    // ── BBQ PLATTERS (full portions) ────────────
    { id: 'bp1', name: 'Chicken Malai Botti', category: 'bbq-platters', price: 1400, rating: 4.9, prepTime: 25, tags: ['bestseller'], description: 'Full platter of creamy malai chicken botti', isAvailable: true },
    { id: 'bp2', name: 'Chitak Botti', category: 'bbq-platters', price: 1400, rating: 4.7, prepTime: 25, tags: [], description: "Ask staff for today's price", isAvailable: true },
    { id: 'bp3', name: 'Haryali Botti', category: 'bbq-platters', price: 1500, rating: 4.7, prepTime: 25, tags: [], description: 'Herb-marinated green botti platter', isAvailable: true },
    { id: 'bp4', name: 'Red Chicken Tikka', category: 'bbq-platters', price: 1400, rating: 4.8, prepTime: 25, tags: [], description: 'Full platter of charcoal-grilled red chicken tikka', isAvailable: true },
    { id: 'bp5', name: 'Red Chicken Botti', category: 'bbq-platters', price: 1350, rating: 4.7, prepTime: 25, tags: [], description: 'Charcoal-grilled red chicken botti platter', isAvailable: true },
    { id: 'bp6', name: 'Reshmi Kabab', category: 'bbq-platters', price: 1400, rating: 4.8, prepTime: 25, tags: [], description: 'Silky smooth reshmi kabab platter', isAvailable: true },
    { id: 'bp7', name: 'Beef Seekh Kabab', category: 'bbq-platters', price: 1650, rating: 4.8, prepTime: 25, tags: [], description: 'Full platter of spiced beef seekh kabab', isAvailable: true },
    { id: 'bp8', name: 'Mutton Sona Kabab', category: 'bbq-platters', price: 1950, rating: 4.9, prepTime: 30, tags: [], description: 'Premium mutton kabab platter — rich and flavourful', isAvailable: true },
    { id: 'bp9', name: 'Masia Champ', category: 'bbq-platters', price: 2100, rating: 4.9, prepTime: 30, tags: ['bestseller'], description: 'Signature marinated champ — a house speciality', isAvailable: true },
    { id: 'bp10', name: 'Namkeen Champ', category: 'bbq-platters', price: 2250, rating: 4.9, prepTime: 30, tags: [], description: 'Salted and spiced champ cooked to perfection', isAvailable: true },
    { id: 'bp11', name: 'Chicken Bihari Botti (with Bone)', category: 'bbq-platters', price: 1350, rating: 4.7, prepTime: 25, tags: [], description: 'Bihari-marinated chicken botti with bone — extra flavour', isAvailable: true },
    { id: 'bp12', name: 'Chicken Bihari Botti', category: 'bbq-platters', price: 1650, rating: 4.8, prepTime: 25, tags: [], description: 'Boneless Bihari-marinated chicken botti', isAvailable: true },
    { id: 'bp13', name: 'Beef Bihari Botti', category: 'bbq-platters', price: 1650, rating: 4.8, prepTime: 25, tags: [], description: 'Slow-marinated beef botti with Bihari spices', isAvailable: true },

    // ── BEVERAGES ───────────────────────────────
    { id: 'bv1', name: 'Coke', category: 'beverages', price: 100, rating: 4.5, prepTime: 1, tags: [], description: 'Chilled Coke', isAvailable: true },
    { id: 'bv2', name: 'Sprite', category: 'beverages', price: 100, rating: 4.5, prepTime: 1, tags: [], description: 'Chilled Sprite', isAvailable: true },
    { id: 'bv3', name: 'Water', category: 'beverages', price: 80, rating: 4.5, prepTime: 1, tags: [], description: 'Still water', isAvailable: true },
    { id: 'bv4', name: '7in Pack', category: 'beverages', price: 160, rating: 4.5, prepTime: 1, tags: [], description: 'Family drink pack', isAvailable: true },

    // ── DIPS & SAUCES ───────────────────────────
    { id: 'd1', name: 'Hummus (Small)', category: 'dips', price: 70, rating: 4.8, prepTime: 2, tags: [], description: 'Creamy chickpea hummus — small portion', isAvailable: true },
    { id: 'd2', name: 'Hummus (Large)', category: 'dips', price: 700, rating: 4.8, prepTime: 2, tags: [], description: 'Creamy chickpea hummus — large sharing portion', isAvailable: true },
    { id: 'd3', name: 'Kubz (Small)', category: 'dips', price: 500, rating: 4.6, prepTime: 2, tags: [], description: 'Lebanese bread with dip', isAvailable: true },
    { id: 'd4', name: 'House Dip', category: 'dips', price: 100, rating: 4.7, prepTime: 2, tags: [], description: 'Any house dip of your choice — Rs. 100 each. Ask staff for options.', isAvailable: true },
]


// ─────────────────────────────────────────────
// FEATURED ITEMS (homepage fan favourites)
// ─────────────────────────────────────────────
export const FEATURED_IDS = ['s3', 's4', 'r1', 'b4', 'b5', 'bp9', 'p4', 's8']

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
export const RESTAURANT_PHONE = '0329-1330234'
export const RESTAURANT_WHATSAPP = '923291330234'
export const DIPS_NOTE = "All other dips available at Rs. 100 each. Ask staff for today's options."
export const BBQ_ACCOMPANIMENTS = '1 Puri | 2 Chapati | 1 Spicy Chutni | 2 Garlic Sauce'
