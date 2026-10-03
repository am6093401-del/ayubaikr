
import type { Product, Vendor } from '../types.ts';

export const INITIAL_VENDORS: Vendor[] = [
  {
    id: 'vendor-ayubaikr-official',
    name: 'ayubaikr Official Store',
    email: 'official@ayubaikr.com',
    phone: '+234 803 111 2233',
    walletAddress: 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS',
    status: 'active',
    rating: 4.95,
    salesCount: 420,
    totalPiEarned: 124.5,
    joinedDate: '2024-01-15',
    commissionRatePercent: 2.5
  },
  {
    id: 'vendor-apex-devices',
    name: 'Apex Mobile & Flagship Hub',
    email: 'apex@devices.net',
    phone: '+234 812 555 7788',
    walletAddress: 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS',
    status: 'active',
    rating: 4.88,
    salesCount: 280,
    totalPiEarned: 89.2,
    joinedDate: '2024-03-10',
    commissionRatePercent: 4.0
  },
  {
    id: 'vendor-silicon-shield',
    name: 'Silicon Shield Accessories Ltd',
    email: 'support@siliconshield.io',
    phone: '+234 701 999 4433',
    walletAddress: 'GBNEKRVMSLPSBUR63GYFM6GRHWKFJMOUQRK25BZUMKEVOJSLZMTLBACS',
    status: 'active',
    rating: 4.92,
    salesCount: 650,
    totalPiEarned: 35.8,
    joinedDate: '2024-02-01',
    commissionRatePercent: 5.0
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-iphone-16-pro-max',
    name: 'Apple iPhone 16 Pro Max 256GB - Desert Titanium',
    brand: 'Apple',
    category: 'smartphones',
    pricePi: 3.25,
    fiatEquivalentUsd: 1199,
    stock: 14,
    description: 'A18 Pro chip with 6-core GPU, 48MP Fusion Camera with 5x telephoto, Grade 5 Titanium design with textured matte glass back, and advanced Camera Control button.',
    images: [
      {
        id: 'img-ip1',
        url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80',
        altText: 'Desert Titanium iPhone 16 Pro Max front and back view',
        isPrimary: true
      },
      {
        id: 'img-ip2',
        url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80',
        altText: 'iPhone 16 Pro Max side bezel and camera lens cluster',
        isPrimary: false
      },
      {
        id: 'img-ip3',
        url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=900&q=80',
        altText: 'iPhone 16 Pro Max display screen running iOS',
        isPrimary: false
      },
      {
        id: 'img-ip4',
        url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=900&q=80',
        altText: 'iPhone 16 Pro Max in retail box with accessories',
        isPrimary: false
      }
    ],
    specs: [
      { name: 'Display', value: '6.9-inch Super Retina XDR OLED 120Hz ProMotion' },
      { name: 'Processor', value: 'Apple A18 Pro (3nm 2nd Gen)' },
      { name: 'RAM & Storage', value: '8GB RAM + 256GB NVMe' },
      { name: 'Rear Camera', value: '48MP Main + 48MP Ultra-wide + 12MP 5x Periscope' },
      { name: 'Battery', value: '4,685 mAh (Up to 33 hrs video playback)' },
      { name: 'OS', value: 'iOS 18 with Apple Intelligence' }
    ],
    vendorId: 'vendor-ayubaikr-official',
    vendorName: 'ayubaikr Official Store',
    condition: 'Brand New',
    warranty: '1 Year Apple International Warranty',
    rating: 4.9,
    reviewCount: 38,
    featured: true,
    createdAt: '2025-01-10'
  },
  {
    id: 'prod-samsung-s25-ultra',
    name: 'Samsung Galaxy S25 Ultra 512GB - Titanium Silver Shadow',
    brand: 'Samsung',
    category: 'smartphones',
    pricePi: 3.10,
    fiatEquivalentUsd: 1299,
    stock: 10,
    description: 'Galaxy AI with Snapdragon 8 Elite for Galaxy, built-in S-Pen, 200MP Quad Telephoto imaging system with anti-reflective Gorilla Armor glass.',
    images: [
      {
        id: 'img-s25-1',
        url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80',
        altText: 'Galaxy S25 Ultra Titanium Silver rear camera housing',
        isPrimary: true
      },
      {
        id: 'img-s25-2',
        url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80',
        altText: 'Galaxy S25 Ultra Dynamic AMOLED 2X flat display with S-Pen',
        isPrimary: false
      },
      {
        id: 'img-s25-3',
        url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=900&q=80',
        altText: 'Galaxy S25 Ultra frame edge with USB-C and S-Pen slot',
        isPrimary: false
      }
    ],
    specs: [
      { name: 'Display', value: '6.8-inch Dynamic LTPO AMOLED 2X, 1-120Hz, 3000 nits' },
      { name: 'Processor', value: 'Snapdragon 8 Elite for Galaxy (3nm)' },
      { name: 'RAM & Storage', value: '12GB LPDDR5X + 512GB UFS 4.0' },
      { name: 'Rear Camera', value: '200MP + 50MP 5x Periscope + 50MP Ultrawide + 10MP 3x' },
      { name: 'Battery', value: '5,000 mAh (45W wired, 15W wireless)' },
      { name: 'OS', value: 'One UI 7 on Android 15' }
    ],
    vendorId: 'vendor-apex-devices',
    vendorName: 'Apex Mobile & Flagship Hub',
    condition: 'Brand New',
    warranty: '2 Years Official Samsung Care Warranty',
    rating: 4.8,
    reviewCount: 29,
    featured: true,
    createdAt: '2025-01-18'
  },
  {
    id: 'prod-pixel-9-pro',
    name: 'Google Pixel 9 Pro 128GB - Obsidian Porcelain',
    brand: 'Google',
    category: 'smartphones',
    pricePi: 2.45,
    fiatEquivalentUsd: 999,
    stock: 8,
    description: 'Engineered by Google with Tensor G4 chip, 16GB RAM for on-device Gemini, pro camera visor system, and 7 years of Pixel Drops & OS updates.',
    images: [
      {
        id: 'img-px-1',
        url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
        altText: 'Google Pixel 9 Pro rear camera bar',
        isPrimary: true
      },
      {
        id: 'img-px-2',
        url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
        altText: 'Google Pixel display and rounded matte aluminum frame',
        isPrimary: false
      }
    ],
    specs: [
      { name: 'Display', value: '6.3-inch Super Actua LTPO OLED (1-120Hz)' },
      { name: 'Processor', value: 'Google Tensor G4 with Titan M2' },
      { name: 'RAM & Storage', value: '16GB RAM + 128GB UFS 3.1' },
      { name: 'Camera', value: '50MP Main + 48MP Ultrawide + 48MP 5x Telephoto' },
      { name: 'Battery', value: '4,700 mAh (30W Fast Charging)' }
    ],
    vendorId: 'vendor-ayubaikr-official',
    vendorName: 'ayubaikr Official Store',
    condition: 'Brand New',
    warranty: '1 Year Manufacturer Warranty',
    rating: 4.7,
    reviewCount: 19,
    featured: false,
    createdAt: '2025-02-01'
  },
  {
    id: 'prod-gan-100w-charger',
    name: 'ayubaikr Pro 100W GaN 4-Port Fast Desktop Charger',
    brand: 'ayubaikr Pro',
    category: 'chargers',
    pricePi: 0.15,
    fiatEquivalentUsd: 59,
    stock: 85,
    description: 'Ultra-compact Gallium Nitride (GaN III) power adapter with 3x USB-C PD 3.0 (up to 100W) and 1x USB-A QC 4+. Intelligent power distribution powers laptops, tablets, and phones simultaneously.',
    images: [
      {
        id: 'img-ch1',
        url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80',
        altText: 'GaN 100W charger standing upright showing all 4 ports',
        isPrimary: true
      },
      {
        id: 'img-ch2',
        url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=900&q=80',
        altText: 'GaN charger compact palm-sized comparison',
        isPrimary: false
      }
    ],
    specs: [
      { name: 'Total Output', value: '100W Max' },
      { name: 'Ports', value: '3x USB-C + 1x USB-A' },
      { name: 'Protocols', value: 'PD 3.0, PPS (45W Samsung Super Fast), QC 4+, AFC' },
      { name: 'Technology', value: 'GaN III Semiconductor with ThermalGuard protection' }
    ],
    vendorId: 'vendor-silicon-shield',
    vendorName: 'Silicon Shield Accessories Ltd',
    condition: 'Brand New',
    warranty: '2 Years Replacement Warranty',
    rating: 4.95,
    reviewCount: 112,
    featured: true,
    createdAt: '2025-01-20'
  },
  {
    id: 'prod-magsafe-carbon-case',
    name: 'Aramid 1500D Carbon Fiber Magnetic Phone Case (iPhone / Samsung)',
    brand: 'Silicon Shield',
    category: 'cases',
    pricePi: 0.08,
    fiatEquivalentUsd: 35,
    stock: 120,
    description: 'Military-grade 1500D genuine aramid aerospace fiber case. Weighs only 14 grams, ultra-thin 0.65mm profile, 38-magnet array for rock-solid MagSafe / Qi2 wireless charging attachment.',
    images: [
      {
        id: 'img-cs1',
        url: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=80',
        altText: 'Aramid Carbon Fiber phone case texture and camera lip',
        isPrimary: true
      },
      {
        id: 'img-cs2',
        url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=900&q=80',
        altText: 'Magnetic alignment ring inside the case',
        isPrimary: false
      }
    ],
    specs: [
      { name: 'Material', value: '100% Genuine 1500D Aramid Fiber' },
      { name: 'Thickness', value: '0.65mm Featherlight' },
      { name: 'Magnetics', value: 'N52 Neodymium MagSafe Array' },
      { name: 'Drop Protection', value: 'Raised 1.2mm camera bezel & 0.8mm screen lip' }
    ],
    vendorId: 'vendor-silicon-shield',
    vendorName: 'Silicon Shield Accessories Ltd',
    condition: 'Brand New',
    warranty: 'Lifetime Craftsmanship Guarantee',
    rating: 4.9,
    reviewCount: 88,
    featured: true,
    createdAt: '2025-02-05'
  },
  {
    id: 'prod-anc-pro-earbuds',
    name: 'ayubaikr SoundBeats Pro ANC Wireless Earbuds (LDAC 48kHz)',
    brand: 'ayubaikr Audio',
    category: 'audio',
    pricePi: 0.22,
    fiatEquivalentUsd: 79,
    stock: 45,
    description: 'Hybrid Active Noise Cancellation (-45dB) with 11mm dynamic dual-magnet biocellulose drivers. Hi-Res Wireless Audio with LDAC, 6-mic AI wind reduction, and 36-hour battery case.',
    images: [
      {
        id: 'img-eb1',
        url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
        altText: 'Wireless ANC earbuds in matte case with LED status',
        isPrimary: true
      },
      {
        id: 'img-eb2',
        url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=900&q=80',
        altText: 'Close up of the ergonomic silicone tips and touch sensors',
        isPrimary: false
      }
    ],
    specs: [
      { name: 'Noise Cancellation', value: 'Hybrid ANC -45dB with Transparency mode' },
      { name: 'Audio Codecs', value: 'LDAC, AAC, SBC (Hi-Res Audio Certified)' },
      { name: 'Battery Life', value: '8.5 hrs (buds) + 27.5 hrs (charging case)' },
      { name: 'Water Resistance', value: 'IP55 Sweat and Splash Proof' }
    ],
    vendorId: 'vendor-ayubaikr-official',
    vendorName: 'ayubaikr Official Store',
    condition: 'Brand New',
    warranty: '1 Year Direct Replacement Warranty',
    rating: 4.85,
    reviewCount: 64,
    featured: false,
    createdAt: '2025-01-25'
  },
  {
    id: 'prod-25000-powerbank',
    name: 'Titanium 25,000mAh 145W High-Output Laptop & Phone Power Bank',
    brand: 'Apex Power',
    category: 'power_banks',
    pricePi: 0.28,
    fiatEquivalentUsd: 95,
    stock: 30,
    description: 'Heavy-duty 25,000mAh airline-safe battery pack with digital TFT color display showing wattage, remaining time, and battery health. Dual 100W + 45W simultaneous output.',
    images: [
      {
        id: 'img-pb1',
        url: 'https://images.unsplash.com/photo-1609592426508-410a08e1fd7b?auto=format&fit=crop&w=900&q=80',
        altText: 'High capacity power bank with TFT display screen',
        isPrimary: true
      },
      {
        id: 'img-pb2',
        url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=900&q=80',
        altText: 'Power bank connected to phone and laptop',
        isPrimary: false
      }
    ],
    specs: [
      { name: 'Capacity', value: '25,000mAh / 92.5Wh (Airline TSA Approved)' },
      { name: 'Max Power', value: '145W Combined Output (100W single port)' },
      { name: 'Display', value: 'Real-time TFT screen displaying voltage/amps' },
      { name: 'Recharge Time', value: '65W Fast Input (Full in 1.8 hours)' }
    ],
    vendorId: 'vendor-apex-devices',
    vendorName: 'Apex Mobile & Flagship Hub',
    condition: 'Brand New',
    warranty: '18 Months Warranty',
    rating: 4.9,
    reviewCount: 42,
    featured: false,
    createdAt: '2025-02-12'
  },
  {
    id: 'prod-screen-protector-pack',
    name: 'Diamond 9H Sapphire Tempered Glass Screen Protector (2-Pack)',
    brand: 'Silicon Shield',
    category: 'screen_protectors',
    pricePi: 0.04,
    fiatEquivalentUsd: 18,
    stock: 250,
    description: 'Double-tempered 9H hardness glass with electroplated oleophobic coating for silky smooth touch and zero fingerprint smudges. Includes dust-free auto-alignment installation frame.',
    images: [
      {
        id: 'img-sp1',
        url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=900&q=80',
        altText: 'Tempered glass protector packaging with alignment kit',
        isPrimary: true
      },
      {
        id: 'img-sp2',
        url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
        altText: 'Glass clarity on high resolution OLED phone screen',
        isPrimary: false
      }
    ],
    specs: [
      { name: 'Hardness', value: '9H+ Mohs Scale 7 Scratch Resistance' },
      { name: 'Coating', value: 'AF Electroplated Oleophobic (anti-oil & fingerprints)' },
      { name: 'Kit Includes', value: '2x Glass, Auto-Align Tray, 2x Cleaning Kits' }
    ],
    vendorId: 'vendor-silicon-shield',
    vendorName: 'Silicon Shield Accessories Ltd',
    condition: 'Brand New',
    warranty: 'Lifetime Crack Replacement Warranty',
    rating: 4.8,
    reviewCount: 156,
    featured: false,
    createdAt: '2025-01-05'
  }
];