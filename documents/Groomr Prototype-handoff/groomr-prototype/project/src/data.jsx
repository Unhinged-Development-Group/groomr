// Shared mock data for the Groomr prototype.

const GROOMERS = [
  {
    id: "wagington",
    name: "Wagington & Co.",
    tagline: "Mobile · Hand-stripping experts",
    location: "Hackney",
    distance: 0.8,
    rating: 4.9,
    reviewCount: 184,
    priceFrom: 38,
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=900&q=70",
    bio: "We're a husband-and-wife team running a fully-mobile grooming van across East London. Eight years in, we know every quirky cocker spaniel coat, every nervous rescue, and every dog who genuinely loves bath time (yes, they exist). Hand-stripping is our specialty.",
    owner: "Lola García",
    yearsActive: 8,
    badges: ["Verified", "Mobile", "Anxious Dogs OK", "Hand-Strip"],
    nextSlot: "Sat 23 May, 10:30am",
    portfolio: [
      "https://images.unsplash.com/photo-1583511655802-41f17ea38f31?auto=format&fit=crop&w=600&q=70",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=70",
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=70",
      "https://images.unsplash.com/photo-1612531822800-cda6cf9c8caa?auto=format&fit=crop&w=600&q=70",
    ],
    services: [
      { name: "Bath & Brush",   duration: "45 min",  price: 38, desc: "Shampoo, conditioner, blow-dry, brush-out, ear & paw clean." },
      { name: "Full Groom",     duration: "90 min",  price: 58, desc: "Bath, full clip or scissor finish, nails, ears, sanitary trim." },
      { name: "Hand-Strip",     duration: "2 hr",    price: 80, desc: "Traditional hand-stripping for terrier and wire-haired breeds." },
      { name: "Nail Clip",      duration: "15 min",  price: 15, desc: "Quick stop-by nail trim and file. No bath." },
    ],
    reviews: [
      { name: "Sarah K.", when: "2 weeks ago", dog: "Murphy · chihuahua", rating: 5,
        text: "Lola is a wizard with anxious dogs. Murphy used to shake the whole way to the old groomers — now he walks straight to the van. Worth every penny." },
      { name: "Daniel R.", when: "1 month ago", dog: "Pippa · cockapoo", rating: 5,
        text: "We've been with Wagington for two years now. Always on time, always brilliant. Pippa comes home looking like a show dog and smelling amazing." },
      { name: "Imogen T.", when: "1 month ago", dog: "Otis · border terrier", rating: 5,
        text: "Best hand-stripping in East London, hands down. Otis's coat has never looked better." },
      { name: "Ben H.", when: "2 months ago", dog: "Roxy · staffy", rating: 4,
        text: "Roxy was nervous her first time but Lola took it slow. Came back a calm, shiny pup. Booking was the easiest part." },
    ],
    map: { x: 32, y: 28 },
  },
  {
    id: "snug",
    name: "The Snug Salon",
    tagline: "Studio · Anxious-dog specialists",
    location: "Bethnal Green",
    distance: 1.4,
    rating: 4.8,
    reviewCount: 132,
    priceFrom: 42,
    image: "https://images.unsplash.com/photo-1583511655802-41f17ea38f31?auto=format&fit=crop&w=900&q=70",
    badges: ["Verified", "Studio", "Puppy First"],
    nextSlot: "Mon 25 May, 9:00am",
    services: [
      { name: "Full Groom",   duration: "2 hr",   price: 65 },
      { name: "Puppy First",  duration: "45 min", price: 42 },
      { name: "Hand-Strip",   duration: "2 hr",   price: 80 },
    ],
    map: { x: 55, y: 42 },
  },
  {
    id: "bark",
    name: "Bark & Bubbles",
    tagline: "Studio · Spa-style finishes",
    location: "Dalston",
    distance: 1.9,
    rating: 4.7,
    reviewCount: 98,
    priceFrom: 35,
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=70",
    badges: ["Verified", "Studio", "Spa Bath"],
    nextSlot: "Sat 23 May, 2:00pm",
    services: [
      { name: "Spa Bath",     duration: "60 min", price: 35 },
      { name: "Full Groom",   duration: "90 min", price: 55 },
      { name: "Teeth Clean",  duration: "20 min", price: 18 },
    ],
    map: { x: 70, y: 60 },
  },
  {
    id: "hounds",
    name: "Hounds & Honey",
    tagline: "Mobile · Senior-dog gentle grooms",
    location: "Stoke Newington",
    distance: 2.3,
    rating: 5.0,
    reviewCount: 76,
    priceFrom: 45,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=70",
    badges: ["Verified", "Mobile", "Senior Care"],
    nextSlot: "Sun 24 May, 11:00am",
    services: [
      { name: "Senior Gentle Groom", duration: "75 min", price: 55 },
      { name: "Full Groom",          duration: "90 min", price: 50 },
      { name: "Nail Clip",           duration: "15 min", price: 18 },
    ],
    map: { x: 25, y: 65 },
  },
  {
    id: "topdog",
    name: "Top Dog Studio",
    tagline: "Studio · Show-cut specialists",
    location: "Islington",
    distance: 2.8,
    rating: 4.9,
    reviewCount: 211,
    priceFrom: 50,
    image: "https://images.unsplash.com/photo-1612531822800-cda6cf9c8caa?auto=format&fit=crop&w=900&q=70",
    badges: ["Verified", "Studio", "Show Cut"],
    nextSlot: "Fri 22 May, 4:30pm",
    services: [
      { name: "Show Cut",   duration: "2.5 hr", price: 95 },
      { name: "Full Groom", duration: "90 min", price: 60 },
      { name: "Hand-Strip", duration: "2 hr",   price: 85 },
    ],
    map: { x: 65, y: 20 },
  },
  {
    id: "pawfection",
    name: "Pawfection",
    tagline: "Studio · All breeds, all coats",
    location: "Hoxton",
    distance: 3.2,
    rating: 4.6,
    reviewCount: 142,
    priceFrom: 32,
    image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=900&q=70",
    badges: ["Verified", "Studio"],
    nextSlot: "Tue 26 May, 10:00am",
    services: [
      { name: "Full Groom",   duration: "90 min", price: 50 },
      { name: "Bath & Brush", duration: "45 min", price: 32 },
      { name: "Nail Clip",    duration: "15 min", price: 12 },
    ],
    map: { x: 45, y: 78 },
  },
];

// Provide reviews fallback for groomers without explicit reviews
GROOMERS.forEach(g => {
  if (!g.reviews) {
    g.reviews = [
      { name: "Anya P.", when: "3 weeks ago", dog: "Bonnie · spaniel", rating: 5,
        text: "Lovely with Bonnie — calm, patient, and the cut was spot on. Will absolutely rebook." },
      { name: "Marcus E.", when: "1 month ago", dog: "Ziggy · poodle cross", rating: 5,
        text: "Booking was instant, payment was painless, and Ziggy came home wagging. What more could you ask?" },
    ];
  }
  if (!g.bio) {
    g.bio = "An independent local groomer dedicated to making every visit calm, careful, and genuinely enjoyable for the dog. Booking is instant — pick your service, pick your slot, done.";
  }
  if (!g.portfolio) {
    g.portfolio = [g.image, g.image, g.image, g.image];
  }
  if (!g.owner) g.owner = "Independent groomer";
  if (!g.yearsActive) g.yearsActive = 5;
});

const DOGS = [
  { id: "marlow",  name: "Marlow",  breed: "Cocker Spaniel",  age: "4 yrs", coat: "Long",   notes: "Loves the dryer.",
    img: "https://images.unsplash.com/photo-1591768793355-74d04bb6608f?auto=format&fit=crop&w=400&q=70",
    lastGroom: "12 Apr",  dueIn: 4 },
  { id: "biscuit", name: "Biscuit", breed: "Border Terrier",  age: "2 yrs", coat: "Wire",   notes: "Bit jumpy with clippers.",
    img: "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&w=400&q=70",
    lastGroom: "02 Mar",  dueIn: 12 },
];

const FILTER_TAGS = ["All", "Mobile", "Studio", "Hand-Strip", "Puppy", "Senior", "Anxious Dogs"];

Object.assign(window, { GROOMERS, DOGS, FILTER_TAGS });
