/** Static seed + fallback when MongoDB is unavailable */

export const SLOT_TIMES = [
  "10:00 AM",
  "11:30 AM",
  "1:00 PM",
  "2:30 PM",
  "4:00 PM",
  "5:30 PM",
  "7:00 PM",
];

function buildSlots(): string[] {
  const slots: string[] = [];
  const today = new Date();
  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const label = date.toISOString().split("T")[0];
    for (const time of SLOT_TIMES) {
      slots.push(`${label}|${time}`);
    }
  }
  return slots;
}

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

export const SEED_SALONS = [
  {
    name: "Glam Studio",
    area: "Indiranagar",
    city: "Bangalore",
    rating: 4.8,
    reviewCount: 342,
    specialty: "Bridal & Premium Makeup",
    description:
      "Indiranagar's couture bridal atelier where celebrity makeup artists craft timeless looks for Karnataka's most discerning brides.",
    services: [
      { name: "Bridal Trial Makeup", price: 8500, duration: 120, category: "Bridal" },
      { name: "HD Party Glam", price: 4500, duration: 90, category: "Bridal" },
      { name: "Luxury Facial Glow", price: 3200, duration: 75, category: "Skin" },
      { name: "Precision Blowout", price: 1800, duration: 45, category: "Hair" },
    ],
    images: [
      unsplash("photo-1560066984-138dadb4c035"),
      unsplash("photo-1522337360788-8b13dee7a37e"),
      unsplash("photo-1516975080664-ed2fc6a32983"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹1,800–₹15,000",
    tags: ["luxury", "bridal", "premium-grooming"],
    sentimentSummary: {
      overall: "Highly Positive",
      score: 0.92,
      topKeywords: ["Flawless Finish", "Hygienic", "Elite Styling", "Bridal Magic"],
      topBookedService: "Bridal Trial Makeup",
      peakHours: [
        { hour: "10", bookings: 12 },
        { hour: "12", bookings: 28 },
        { hour: "14", bookings: 35 },
        { hour: "16", bookings: 42 },
        { hour: "18", bookings: 38 },
      ],
    },
    ownerName: "Priya Menon",
    ownerEmail: "priya@glamstudio.in",
  },
  {
    name: "The Groom Room",
    area: "Koramangala",
    city: "Bangalore",
    rating: 4.6,
    reviewCount: 218,
    specialty: "Men's Grooming & Fades",
    description:
      "Koramangala's premier gentleman's lounge — precision fades, hot towel shaves, and executive grooming for Bangalore's tech elite.",
    services: [
      { name: "Signature Fade", price: 1200, duration: 45, category: "Men's" },
      { name: "Beard Sculpt & Oil", price: 800, duration: 30, category: "Men's" },
      { name: "Executive Haircut", price: 1500, duration: 50, category: "Men's" },
      { name: "Scalp Detox Treatment", price: 2200, duration: 60, category: "Hair" },
    ],
    images: [
      unsplash("photo-1503951914875-452162b0f3f1"),
      unsplash("photo-1622286342621-4bd786c2447c"),
      unsplash("photo-1599351431202-1e0c2b8d0b0e"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹800–₹2,500",
    tags: ["premium-grooming", "mens", "luxury"],
    sentimentSummary: {
      overall: "Highly Positive",
      score: 0.88,
      topKeywords: ["Sharp Fade", "Professional", "Quick Service"],
      topBookedService: "Signature Fade",
      peakHours: [
        { hour: "11", bookings: 22 },
        { hour: "13", bookings: 18 },
        { hour: "17", bookings: 45 },
        { hour: "19", bookings: 30 },
      ],
    },
    ownerName: "Arjun Reddy",
    ownerEmail: "arjun@groomroom.in",
  },
  {
    name: "Luxe Hair Lounge",
    area: "Jayanagar",
    city: "Bangalore",
    rating: 4.7,
    reviewCount: 276,
    specialty: "Hair Restoration & Styling",
    description:
      "Advanced trichology meets luxury styling in Jayanagar — from keratin therapies to restorative scalp rituals.",
    services: [
      { name: "Keratin Smoothing", price: 6500, duration: 180, category: "Hair" },
      { name: "Scalp PRP Session", price: 12000, duration: 90, category: "Aesthetics" },
      { name: "Balayage Color", price: 7500, duration: 150, category: "Hair" },
      { name: "Luxury Haircut", price: 2000, duration: 60, category: "Hair" },
    ],
    images: [
      unsplash("photo-1521590832167-7bcbfaa6381f"),
      unsplash("photo-1633681923016-1962d3648a3a"),
      unsplash("photo-1522336573288-0b6b6b6b6b6b"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹2,000–₹12,000",
    tags: ["luxury", "hair", "skin-clinic"],
    sentimentSummary: {
      overall: "Positive",
      score: 0.85,
      topKeywords: ["Silky Hair", "Expert Colorist", "Worth It"],
      topBookedService: "Keratin Smoothing",
      peakHours: [
        { hour: "10", bookings: 15 },
        { hour: "14", bookings: 32 },
        { hour: "16", bookings: 40 },
      ],
    },
    ownerName: "Meera Iyer",
    ownerEmail: "meera@luxehair.in",
  },
  {
    name: "Bella Beauty Bar",
    area: "HSR Layout",
    city: "Bangalore",
    rating: 4.5,
    reviewCount: 189,
    specialty: "Advanced Skincare & Facials",
    description:
      "HSR's skin science sanctuary — hydrafacials, chemical peels, and bespoke dermis protocols for glowing Bangalore skin.",
    services: [
      { name: "Advanced Hydrafacial", price: 4500, duration: 75, category: "Skin" },
      { name: "Vitamin C Glow Peel", price: 3800, duration: 60, category: "Skin" },
      { name: "Anti-Aging RF Facial", price: 5500, duration: 90, category: "Aesthetics" },
      { name: "Express Cleanup", price: 1500, duration: 45, category: "Skin" },
    ],
    images: [
      unsplash("photo-1570172619644-d3b9eb3b0b0b"),
      unsplash("photo-1616394584738-fc6e612f888b"),
      unsplash("photo-1512290923902-8a9f81dc236f"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹1,500–₹5,500",
    tags: ["skin-clinic", "luxury", "aesthetics"],
    sentimentSummary: {
      overall: "Highly Positive",
      score: 0.9,
      topKeywords: ["Glowing Skin", "Hygienic", "Gentle Hands"],
      topBookedService: "Advanced Hydrafacial",
      peakHours: [
        { hour: "11", bookings: 25 },
        { hour: "15", bookings: 38 },
        { hour: "17", bookings: 28 },
      ],
    },
    ownerName: "Sneha Kapoor",
    ownerEmail: "sneha@bellabeauty.in",
  },
  {
    name: "Royal Bridal Studio",
    area: "MG Road",
    city: "Bangalore",
    rating: 4.9,
    reviewCount: 412,
    specialty: "Luxury Bridal Packages",
    description:
      "MG Road's crown jewel for royal weddings — full bridal packages with pre-wedding skincare and couture hair.",
    services: [
      { name: "Royal Bridal Package", price: 15000, duration: 300, category: "Bridal" },
      { name: "Pre-Wedding Glow Ritual", price: 8000, duration: 120, category: "Bridal" },
      { name: "Sangeet Glam", price: 6000, duration: 90, category: "Bridal" },
      { name: "Bridal Hair Couture", price: 5000, duration: 120, category: "Hair" },
    ],
    images: [
      unsplash("photo-1519741497674-611481863552"),
      unsplash("photo-1487412948497-84dc97e43b0b"),
      unsplash("photo-1522335789203-aabd1fc54bc9"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹5,000–₹15,000",
    tags: ["bridal", "luxury", "premium-grooming"],
    sentimentSummary: {
      overall: "Highly Positive",
      score: 0.96,
      topKeywords: ["Dream Wedding", "Flawless", "Royal Treatment"],
      topBookedService: "Royal Bridal Package",
      peakHours: [
        { hour: "10", bookings: 20 },
        { hour: "12", bookings: 45 },
        { hour: "15", bookings: 50 },
      ],
    },
    ownerName: "Lakshmi Devi",
    ownerEmail: "lakshmi@royalbridal.in",
  },
  {
    name: "Scissors & Style",
    area: "Malleshwaram",
    city: "Bangalore",
    rating: 4.4,
    reviewCount: 156,
    specialty: "Precision Haircuts & Styling",
    description:
      "Malleshwaram's neighborhood favorite for precision cuts and classic South Indian styling with a modern twist.",
    services: [
      { name: "Precision Cut", price: 900, duration: 40, category: "Hair" },
      { name: "Kids Styling", price: 600, duration: 30, category: "Hair" },
      { name: "Hair Spa", price: 1800, duration: 60, category: "Hair" },
      { name: "Threading & Brow", price: 400, duration: 20, category: "Aesthetics" },
    ],
    images: [
      unsplash("photo-1633681923016-1962d3648a3a"),
      unsplash("photo-1521590832167-7bcbfaa6381f"),
      unsplash("photo-1560066984-138dadb4c035"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹400–₹1,800",
    tags: ["hair", "premium-grooming"],
    sentimentSummary: {
      overall: "Positive",
      score: 0.82,
      topKeywords: ["Clean Cut", "Affordable", "Friendly Staff"],
      topBookedService: "Precision Cut",
      peakHours: [
        { hour: "11", bookings: 30 },
        { hour: "18", bookings: 42 },
      ],
    },
    ownerName: "Ravi Kumar",
    ownerEmail: "ravi@scissorsstyle.in",
  },
  {
    name: "Naturelle Spa",
    area: "Sadashivanagar",
    city: "Bangalore",
    rating: 4.6,
    reviewCount: 203,
    specialty: "Holistic Ayurvedic Spa",
    description:
      "Sadashivanagar's Ayurvedic oasis — abhyanga, shirodhara, and holistic detox rituals rooted in ancient wellness.",
    services: [
      { name: "Abhyanga Massage", price: 3500, duration: 90, category: "Spa" },
      { name: "Shirodhara Therapy", price: 4200, duration: 75, category: "Spa" },
      { name: "Herbal Body Wrap", price: 2800, duration: 60, category: "Spa" },
      { name: "Panchakarma Consult", price: 1500, duration: 45, category: "Spa" },
    ],
    images: [
      unsplash("photo-1544161515-4ab6ce6db874"),
      unsplash("photo-1540555700478-4be289fbecef"),
      unsplash("photo-1515377905703-c4788e51af09"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹1,500–₹4,500",
    tags: ["spa", "luxury"],
    sentimentSummary: {
      overall: "Highly Positive",
      score: 0.89,
      topKeywords: ["Relaxing", "Authentic Ayurveda", "Serene"],
      topBookedService: "Abhyanga Massage",
      peakHours: [
        { hour: "10", bookings: 18 },
        { hour: "14", bookings: 35 },
        { hour: "16", bookings: 28 },
      ],
    },
    ownerName: "Dr. Ananya Rao",
    ownerEmail: "ananya@naturellespa.in",
  },
  {
    name: "The Beauty Loft",
    area: "Kalyan Nagar",
    city: "Bangalore",
    rating: 4.5,
    reviewCount: 167,
    specialty: "Custom Nails & Extensions",
    description:
      "Kalyan Nagar's nail art laboratory — gel extensions, chrome finishes, and bespoke nail couture.",
    services: [
      { name: "Gel Extension Set", price: 2500, duration: 90, category: "Aesthetics" },
      { name: "Luxury Manicure", price: 1200, duration: 45, category: "Aesthetics" },
      { name: "Nail Art Premium", price: 1800, duration: 60, category: "Aesthetics" },
      { name: "Pedicure Spa", price: 1500, duration: 50, category: "Aesthetics" },
    ],
    images: [
      unsplash("photo-1604654894610-df63bc536371"),
      unsplash("photo-1632345031431-2397e907a3ee"),
      unsplash("photo-1522337360788-8b13dee7a37e"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹1,200–₹2,500",
    tags: ["aesthetics", "luxury"],
    sentimentSummary: {
      overall: "Positive",
      score: 0.86,
      topKeywords: ["Stunning Nails", "Creative Art", "Long Lasting"],
      topBookedService: "Gel Extension Set",
      peakHours: [
        { hour: "12", bookings: 25 },
        { hour: "15", bookings: 32 },
        { hour: "17", bookings: 30 },
      ],
    },
    ownerName: "Divya Nair",
    ownerEmail: "divya@beautyloft.in",
  },
  {
    name: "Urban Glow Studio",
    area: "Whitefield",
    city: "Bangalore",
    rating: 4.7,
    reviewCount: 234,
    specialty: "Advanced Skin & Hair Care",
    description:
      "Whitefield's tech-corridor wellness hub — laser facials, microneedling, and advanced hair rejuvenation.",
    services: [
      { name: "Microneedling Facial", price: 6000, duration: 75, category: "Aesthetics" },
      { name: "Laser Hair Reduction", price: 4500, duration: 60, category: "Aesthetics" },
      { name: "Olaplex Treatment", price: 3500, duration: 90, category: "Hair" },
      { name: "LED Light Therapy", price: 2800, duration: 45, category: "Skin" },
    ],
    images: [
      unsplash("photo-1616394584738-fc6e612f888b"),
      unsplash("photo-1570172619644-d3b9eb3b0b0b"),
      unsplash("photo-1512290923902-8a9f81dc236f"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹2,800–₹6,000",
    tags: ["skin-clinic", "aesthetics", "luxury"],
    sentimentSummary: {
      overall: "Highly Positive",
      score: 0.91,
      topKeywords: ["Visible Results", "Modern Equipment", "Expert Staff"],
      topBookedService: "Microneedling Facial",
      peakHours: [
        { hour: "11", bookings: 28 },
        { hour: "14", bookings: 40 },
        { hour: "18", bookings: 35 },
      ],
    },
    ownerName: "Karthik Menon",
    ownerEmail: "karthik@urbanglow.in",
  },
  {
    name: "Serenity Salon",
    area: "Electronic City",
    city: "Bangalore",
    rating: 4.8,
    reviewCount: 198,
    specialty: "Full Body Massages & Detox",
    description:
      "Electronic City's escape for deep tissue massages, Swedish relaxation, and weekend detox packages.",
    services: [
      { name: "Deep Tissue Massage", price: 3200, duration: 90, category: "Spa" },
      { name: "Swedish Relaxation", price: 2800, duration: 75, category: "Spa" },
      { name: "Weekend Detox Package", price: 5500, duration: 150, category: "Spa" },
      { name: "Head & Shoulder Relief", price: 1500, duration: 45, category: "Spa" },
    ],
    images: [
      unsplash("photo-1540555700478-4be289fbecef"),
      unsplash("photo-1544161515-4ab6ce6db874"),
      unsplash("photo-1515377905703-c4788e51af09"),
    ],
    openHours: "10:00 AM – 8:00 PM",
    availableSlots: buildSlots(),
    priceRange: "₹1,500–₹5,500",
    tags: ["spa", "luxury", "premium-grooming"],
    sentimentSummary: {
      overall: "Highly Positive",
      score: 0.93,
      topKeywords: ["Blissful", "Skilled Therapists", "Clean Ambience"],
      topBookedService: "Deep Tissue Massage",
      peakHours: [
        { hour: "10", bookings: 20 },
        { hour: "16", bookings: 45 },
        { hour: "19", bookings: 38 },
      ],
    },
    ownerName: "James Thomas",
    ownerEmail: "james@serenitysalon.in",
  },
];

export const SEED_REVIEWS = [
  {
    name: "Ananya S.",
    date: "2026-05-12",
    text: "Absolutely flawless bridal makeup. The team understood my skin tone perfectly.",
    rating: 5,
  },
  {
    name: "Rohit M.",
    date: "2026-05-08",
    text: "Best fade in Koramangala. In and out in 45 minutes — perfect for busy professionals.",
    rating: 5,
  },
  {
    name: "Priya K.",
    date: "2026-04-28",
    text: "Hydrafacial left my skin glowing for weeks. Worth every rupee.",
    rating: 5,
  },
  {
    name: "Vikram D.",
    date: "2026-04-15",
    text: "Serene ambience and skilled therapists. My go-to spa after long work weeks.",
    rating: 5,
  },
  {
    name: "Megha R.",
    date: "2026-04-02",
    text: "Royal bridal package exceeded expectations. MG Road luxury at its finest.",
    rating: 5,
  },
];

export const BEAUTY_AI_FALLBACK = {
  faceShape: {
    shape: "Oval",
    confidence: 0.87,
    description:
      "Balanced proportions with slightly wider cheekbones — ideal for layered cuts and soft framing.",
    recommendedStyles: [
      "Layered lob",
      "Side-swept fringe",
      "Soft waves",
      "Textured crop",
    ],
  },
  skinTone: {
    undertone: "Warm",
    complexion: "Medium with golden undertones",
    treatments: [
      "Vitamin C brightening facial",
      "Gold-infused hydrafacial",
      "Warm-toned bridal makeup",
    ],
  },
  hairTexture: {
    type: "Wavy",
    condition: "Moderate dryness at ends",
    treatments: [
      "Keratin smoothing",
      "Olaplex bond repair",
      "Deep conditioning scalp mask",
    ],
  },
};
