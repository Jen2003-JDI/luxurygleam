// ─── Product Seed Data ───────────────────────────────────────────
// 'seller' will be set dynamically to the admin user's ObjectId in the seeder.
// Images use publicly accessible placeholder URLs (safe for demo use).

const PLACEHOLDER_BASE = 'https://via.placeholder.com';

const makeImage = (label) => ({
  url: `${PLACEHOLDER_BASE}/600x600/1a0e02/C9A84C?text=${encodeURIComponent(label)}`,
  publicId: `luxury-gleam/seed/${label.toLowerCase().replace(/\s/g, '-')}`,
});

const products = [
  // ── RINGS ──────────────────────────────────────────────────────
  {
    name: '18K Gold Diamond Solitaire Ring',
    description:
      'A timeless classic — this solitaire ring features a brilliant-cut 1-carat diamond set in solid 18K yellow gold. The six-prong setting maximises light reflection, giving your diamond maximum brilliance. Perfect for engagements and anniversaries. Each ring comes in a luxury Luxury Gleam gift box.',
    price: 85000,
    discountPrice: 75000,
    category: 'Rings',
    material: '18K Yellow Gold',
    gemstone: 'Diamond',
    stock: 15,
    isFeatured: true,
    tags: ['diamond', 'engagement', 'gold', 'solitaire', 'bestseller'],
    images: [makeImage('Diamond Ring'), makeImage('Diamond Ring 2')],
  },
  {
    name: 'Rose Gold Ruby Halo Ring',
    description:
      'Exquisite 14K rose gold ring featuring a vivid pigeon-blood ruby centre stone surrounded by a sparkling halo of VS1 diamonds. The warm rose gold perfectly complements the deep red of the ruby, making this piece as striking on the hand as it is in the box.',
    price: 62000,
    discountPrice: 0,
    category: 'Rings',
    material: '14K Rose Gold',
    gemstone: 'Ruby',
    stock: 10,
    isFeatured: true,
    tags: ['ruby', 'halo', 'rose gold', 'anniversary'],
    images: [makeImage('Ruby Ring')],
  },
  {
    name: 'Sterling Silver Infinity Band',
    description:
      'Contemporary sterling silver infinity band with a polished finish. Symbolising eternal love, this modern design is ideal for stacking with other rings. Hypoallergenic and tarnish-resistant coating ensures long-lasting beauty.',
    price: 3500,
    discountPrice: 2800,
    category: 'Rings',
    material: 'Sterling Silver',
    gemstone: '',
    stock: 50,
    isFeatured: false,
    tags: ['silver', 'infinity', 'stackable', 'minimalist'],
    images: [makeImage('Silver Ring')],
  },

  // ── NECKLACES ──────────────────────────────────────────────────
  {
    name: '18K Gold Diamond Tennis Necklace',
    description:
      'Luxurious 18-inch tennis necklace featuring 3 carats of round brilliant diamonds channel-set in 18K white gold. The secure box clasp with safety lock ensures your precious piece stays securely in place. A showstopper for formal events and black-tie galas.',
    price: 145000,
    discountPrice: 130000,
    category: 'Necklaces',
    material: '18K White Gold',
    gemstone: 'Diamond',
    stock: 5,
    isFeatured: true,
    tags: ['tennis', 'diamond', 'white gold', 'luxury', 'formal'],
    images: [makeImage('Tennis Necklace'), makeImage('Tennis Necklace 2')],
  },
  {
    name: 'Pearl Strand Necklace',
    description:
      'Classic 16-inch strand of AAA-grade Akoya cultured pearls, 7–7.5mm, with a 14K gold barrel clasp. Pearls are hand-knotted on natural silk thread for security and drape. Includes pearl care kit and certificate of authenticity.',
    price: 28000,
    discountPrice: 0,
    category: 'Necklaces',
    material: '14K Gold Clasp',
    gemstone: 'Pearl',
    stock: 20,
    isFeatured: false,
    tags: ['pearl', 'classic', 'strand', 'formal', 'elegant'],
    images: [makeImage('Pearl Necklace')],
  },
  {
    name: 'Gold Layered Charm Necklace',
    description:
      'Delicate 14K gold-filled layered necklace with three strands at 14", 16", and 18". Each strand features a different minimalist charm — a star, crescent moon, and infinity symbol — for a celestial-inspired everyday look.',
    price: 8500,
    discountPrice: 7200,
    category: 'Necklaces',
    material: '14K Gold-Filled',
    gemstone: '',
    stock: 35,
    isFeatured: false,
    tags: ['layered', 'charm', 'celestial', 'everyday'],
    images: [makeImage('Charm Necklace')],
  },

  // ── BRACELETS ──────────────────────────────────────────────────
  {
    name: 'Diamond Bangle Bracelet',
    description:
      'Elegant rigid bangle crafted in 18K yellow gold, pavé-set with 1.5 carats of brilliant-cut diamonds around the entire circumference. The seamless design and hidden hinge make this both a fashion statement and an engineering marvel.',
    price: 95000,
    discountPrice: 85000,
    category: 'Bracelets',
    material: '18K Yellow Gold',
    gemstone: 'Diamond',
    stock: 8,
    isFeatured: true,
    tags: ['bangle', 'diamond', 'pave', 'luxury'],
    images: [makeImage('Diamond Bangle'), makeImage('Diamond Bangle 2')],
  },
  {
    name: 'Gold Cuban Link Bracelet',
    description:
      '8mm solid 10K yellow gold Cuban link bracelet, 8 inches in length with a box-lock clasp. Heavy at 28 grams, this bold piece is a statement in masculine luxury jewelry. Each link is individually polished for a flawless mirror finish.',
    price: 42000,
    discountPrice: 0,
    category: 'Bracelets',
    material: '10K Yellow Gold',
    gemstone: '',
    stock: 18,
    isFeatured: false,
    tags: ['cuban link', 'gold', 'men', 'bold'],
    images: [makeImage('Cuban Link Bracelet')],
  },
  {
    name: 'Rose Gold Charm Bracelet',
    description:
      'Whimsical 14K rose gold charm bracelet featuring 7 pre-attached charms: heart, star, lock, key, butterfly, flower, and moon. The lobster claw clasp makes it easy to wear. Additional charms can be purchased separately.',
    price: 15500,
    discountPrice: 12000,
    category: 'Bracelets',
    material: '14K Rose Gold',
    gemstone: '',
    stock: 25,
    isFeatured: false,
    tags: ['charm', 'rose gold', 'gift', 'whimsical'],
    images: [makeImage('Charm Bracelet')],
  },

  // ── EARRINGS ───────────────────────────────────────────────────
  {
    name: 'Diamond Stud Earrings',
    description:
      'Brilliant round-cut diamond stud earrings, 0.5 carats total weight, G color, VS2 clarity, set in 18K white gold with secure screw backs. These versatile studs transition effortlessly from boardroom to black-tie. Comes with GIA certification.',
    price: 38000,
    discountPrice: 32000,
    category: 'Earrings',
    material: '18K White Gold',
    gemstone: 'Diamond',
    stock: 22,
    isFeatured: true,
    tags: ['studs', 'diamond', 'GIA', 'classic', 'white gold'],
    images: [makeImage('Diamond Studs'), makeImage('Diamond Studs 2')],
  },
  {
    name: 'Sapphire Drop Earrings',
    description:
      'Stunning drop earrings featuring oval-cut Ceylon sapphires (2ct TW) suspended from diamond-set tops in 14K white gold. The vivid royal blue sapphires are complemented by 0.3ct of accent diamonds. Lever back closures for security.',
    price: 55000,
    discountPrice: 0,
    category: 'Earrings',
    material: '14K White Gold',
    gemstone: 'Sapphire',
    stock: 12,
    isFeatured: false,
    tags: ['sapphire', 'drop', 'blue', 'elegant'],
    images: [makeImage('Sapphire Earrings')],
  },
  {
    name: 'Gold Hoop Earrings',
    description:
      'Classic 30mm polished 14K yellow gold hoop earrings with a click-top closure. The lightweight hollow construction makes them comfortable for all-day wear. A wardrobe essential that elevates any outfit from casual to chic.',
    price: 9800,
    discountPrice: 8500,
    category: 'Earrings',
    material: '14K Yellow Gold',
    gemstone: '',
    stock: 40,
    isFeatured: false,
    tags: ['hoops', 'gold', 'classic', 'everyday'],
    images: [makeImage('Gold Hoops')],
  },

  // ── WATCHES ────────────────────────────────────────────────────
  {
    name: 'Swiss Automatic Gold Watch',
    description:
      'Precision Swiss automatic movement encased in an 18K yellow gold 38mm case with a white mother-of-pearl dial. The date function, sapphire crystal glass, and water resistance to 50m make this a functional masterpiece. Crocodile leather strap included.',
    price: 320000,
    discountPrice: 295000,
    category: 'Watches',
    material: '18K Yellow Gold',
    gemstone: 'Mother of Pearl',
    stock: 3,
    isFeatured: true,
    tags: ['swiss', 'automatic', 'gold', 'luxury watch', 'limited'],
    images: [makeImage('Gold Watch'), makeImage('Gold Watch 2')],
  },
  {
    name: 'Diamond Bezel Women\'s Watch',
    description:
      '32mm stainless steel case with 0.8ct diamond-set bezel. Quartz movement with a champagne sunburst dial and stick hour markers. The bracelet features alternating polished and brushed links. A glamorous timepiece for the modern woman.',
    price: 78000,
    discountPrice: 68000,
    category: 'Watches',
    material: 'Stainless Steel',
    gemstone: 'Diamond',
    stock: 7,
    isFeatured: true,
    tags: ['diamond bezel', 'women watch', 'glamorous'],
    images: [makeImage('Diamond Watch')],
  },

  // ── SETS ───────────────────────────────────────────────────────
  {
    name: 'Bridal Diamond Jewelry Set',
    description:
      'Complete 4-piece bridal set in 18K white gold featuring matching necklace, earrings, bracelet, and ring — all pavé-set with 3 carats of round brilliant diamonds. The coordinating design creates a cohesive look for the most important day. Presented in a signature Luxury Gleam bridal box.',
    price: 220000,
    discountPrice: 195000,
    category: 'Sets',
    material: '18K White Gold',
    gemstone: 'Diamond',
    stock: 4,
    isFeatured: true,
    tags: ['bridal', 'set', 'wedding', 'diamond', 'complete'],
    images: [makeImage('Bridal Set'), makeImage('Bridal Set 2')],
  },
  {
    name: 'Pearl Jewelry Gift Set',
    description:
      'Elegant 3-piece freshwater pearl set including a 16" strand necklace, stud earrings (8mm), and a tennis bracelet. All pieces feature 8–9mm AAA freshwater pearls with a sterling silver clasp finished in rhodium. Ideal as a graduation, birthday, or Mother\'s Day gift.',
    price: 18500,
    discountPrice: 15000,
    category: 'Sets',
    material: 'Sterling Silver',
    gemstone: 'Pearl',
    stock: 15,
    isFeatured: false,
    tags: ['pearl', 'set', 'gift', 'freshwater', 'anniversary'],
    images: [makeImage('Pearl Set')],
  },

  // ── ANKLETS ────────────────────────────────────────────────────
  {
    name: '14K Gold Anklet with Charms',
    description:
      'Dainty 10-inch 14K yellow gold anklet with dangling charms — a starfish, anchor, and seahorse — for a beach-inspired look. The spring ring clasp includes a 2-inch extender chain. Delicate enough for daily wear, beautiful enough for vacations.',
    price: 7500,
    discountPrice: 6200,
    category: 'Anklets',
    material: '14K Yellow Gold',
    gemstone: '',
    stock: 30,
    isFeatured: false,
    tags: ['anklet', 'gold', 'beach', 'charm', 'summer'],
    images: [makeImage('Gold Anklet')],
  },

  // ── BROOCHES ──────────────────────────────────────────────────
  {
    name: 'Vintage Floral Diamond Brooch',
    description:
      'An art-deco inspired floral brooch crafted in platinum, set with 1.2 carats of old European-cut diamonds in a daisy motif. The c-clasp is spring-loaded for security. This heirloom-quality piece is a collector\'s item, equally at home on a lapel, scarf, or hat.',
    price: 48000,
    discountPrice: 0,
    category: 'Brooches',
    material: 'Platinum',
    gemstone: 'Diamond',
    stock: 6,
    isFeatured: false,
    tags: ['brooch', 'vintage', 'art deco', 'platinum', 'collector'],
    images: [makeImage('Diamond Brooch')],
  },
];

module.exports = products;
