
export interface GalleryAsset {
  id: string;
  title: string;
  category: 'smartphones' | 'cases' | 'chargers' | 'audio' | 'power_banks' | 'screen_protectors' | 'parts';
  url: string;
  tags: string[];
}

export const CURATED_GALLERY: GalleryAsset[] = [
  // Smartphones
  {
    id: 'gal-phone-1',
    title: 'iPhone 16 Pro Max - Desert Titanium Front & Back',
    category: 'smartphones',
    url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=900&q=80',
    tags: ['iphone', 'apple', 'titanium', 'flagship']
  },
  {
    id: 'gal-phone-2',
    title: 'iPhone 16 Pro Titanium Side Bezel & Camera Bump',
    category: 'smartphones',
    url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80',
    tags: ['iphone', 'side', 'camera', 'macro']
  },
  {
    id: 'gal-phone-3',
    title: 'Samsung Galaxy S25 Ultra Silver Shadow',
    category: 'smartphones',
    url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80',
    tags: ['samsung', 'galaxy', 'ultra', 'android']
  },
  {
    id: 'gal-phone-4',
    title: 'Samsung Galaxy Flat OLED Display with S-Pen',
    category: 'smartphones',
    url: 'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=900&q=80',
    tags: ['samsung', 'spen', 'display', 'screen']
  },
  {
    id: 'gal-phone-5',
    title: 'Google Pixel 9 Pro Obsidian Visor Camera',
    category: 'smartphones',
    url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80',
    tags: ['pixel', 'google', 'tensor', 'camera']
  },
  {
    id: 'gal-phone-6',
    title: 'Smartphone Matte Glass Back & Minimal Frame',
    category: 'smartphones',
    url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    tags: ['smartphone', 'clean', 'oled', 'minimal']
  },
  {
    id: 'gal-phone-7',
    title: 'Smartphone Display Running Modern Mobile Apps',
    category: 'smartphones',
    url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=900&q=80',
    tags: ['screen', 'apps', 'display', 'ios']
  },
  {
    id: 'gal-phone-8',
    title: 'Flagship Smartphone Retail Packaging & Box Set',
    category: 'smartphones',
    url: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?auto=format&fit=crop&w=900&q=80',
    tags: ['unboxing', 'packaging', 'accessories']
  },

  // Cases & Protection
  {
    id: 'gal-case-1',
    title: '1500D Aramid Kevlar Carbon Fiber Case',
    category: 'cases',
    url: 'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=900&q=80',
    tags: ['case', 'carbon', 'fiber', 'kevlar', 'magsafe']
  },
  {
    id: 'gal-case-2',
    title: 'Magnetic Qi2 Alignment Ring Interior Case View',
    category: 'cases',
    url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=900&q=80',
    tags: ['case', 'magnetic', 'qi2', 'interior']
  },
  {
    id: 'gal-case-3',
    title: 'Shockproof Rugged Armor Case with Kickstand',
    category: 'cases',
    url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?auto=format&fit=crop&w=900&q=80',
    tags: ['rugged', 'case', 'protection', 'kickstand']
  },
  {
    id: 'gal-case-4',
    title: 'Premium Saddle Brown Genuine Leather Case',
    category: 'cases',
    url: 'https://images.unsplash.com/photo-1603539276537-8822557d3448?auto=format&fit=crop&w=900&q=80',
    tags: ['leather', 'luxury', 'case', 'brown']
  },

  // Chargers & Power
  {
    id: 'gal-charger-1',
    title: 'ayubaikr Pro 100W GaN 4-Port Fast Desktop Charger',
    category: 'chargers',
    url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80',
    tags: ['charger', 'gan', '100w', 'fast', 'usbc']
  },
  {
    id: 'gal-charger-2',
    title: 'Compact GaN Wall Plug with Foldable Prongs',
    category: 'chargers',
    url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=900&q=80',
    tags: ['compact', 'plug', 'travel', 'fast']
  },
  {
    id: 'gal-charger-3',
    title: '3-in-1 Magnetic Wireless Charging Stand for Phone & Watch',
    category: 'chargers',
    url: 'https://images.unsplash.com/photo-1622445262464-84b14e3295b3?auto=format&fit=crop&w=900&q=80',
    tags: ['wireless', 'magsafe', 'stand', 'station']
  },
  {
    id: 'gal-charger-4',
    title: '240W E-Marker Braided USB-C to USB-C Fast Cable',
    category: 'chargers',
    url: 'https://images.unsplash.com/photo-1609592426508-410a08e1fd7b?auto=format&fit=crop&w=900&q=80',
    tags: ['cable', 'braided', 'usbc', 'power']
  },

  // Audio & Earbuds
  {
    id: 'gal-audio-1',
    title: 'ayubaikr SoundBeats Pro ANC Wireless Earbuds Matte Black',
    category: 'audio',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80',
    tags: ['earbuds', 'anc', 'wireless', 'audio', 'ldac']
  },
  {
    id: 'gal-audio-2',
    title: 'Ergonomic In-Ear Silicone Tips & Driver Close-up',
    category: 'audio',
    url: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?auto=format&fit=crop&w=900&q=80',
    tags: ['earbuds', 'macro', 'tips', 'sound']
  },
  {
    id: 'gal-audio-3',
    title: 'Wireless Earbuds in Open Charging Case with LED',
    category: 'audio',
    url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=900&q=80',
    tags: ['case', 'led', 'bluetooth', 'audio']
  },

  // Power Banks
  {
    id: 'gal-power-1',
    title: 'Titanium 25,000mAh 145W High-Output Laptop & Phone Power Bank',
    category: 'power_banks',
    url: 'https://images.unsplash.com/photo-1609592426508-410a08e1fd7b?auto=format&fit=crop&w=900&q=80',
    tags: ['powerbank', 'battery', '25000mah', 'laptop']
  },
  {
    id: 'gal-power-2',
    title: 'Slim Magnetic 10,000mAh Snap-On Wireless Power Bank',
    category: 'power_banks',
    url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=900&q=80',
    tags: ['magnetic', 'portable', 'magsafe', 'power']
  },

  // Screen Protectors & Parts
  {
    id: 'gal-screen-1',
    title: 'Diamond 9H Sapphire Tempered Glass Screen Protector Kit',
    category: 'screen_protectors',
    url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?auto=format&fit=crop&w=900&q=80',
    tags: ['glass', 'tempered', 'screen', 'protector']
  },
  {
    id: 'gal-parts-1',
    title: 'Original OEM OLED Super Retina Display Replacement Assembly',
    category: 'parts',
    url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=900&q=80',
    tags: ['screen', 'replacement', 'oled', 'repair']
  }
];