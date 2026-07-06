import { db } from "../src/lib/db";

// Luxury tourism seed data — curated destinations, experiences, hotels, reviews, coupons.

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const destinations = [
  {
    name: "Dubai",
    slug: "dubai",
    country: "United Arab Emirates",
    city: "Dubai",
    region: "Middle East",
    description: "Where futuristic skylines meet golden desert dunes and Arabian heritage.",
    longDescription:
      "Dubai is a city of superlatives — the world's tallest building, the most luxurious hotels, and experiences that blend ultra-modern ambition with deep Arabian tradition. From sunrise hot air balloon rides over the desert to private yacht charters along the marina, Dubai delivers luxury at every turn.",
    image: img("1512453979798-5ea266f8880c"),
    heroImage: img("1518684079-3c830dcef090", 2000),
    popular: true,
    featured: true,
  },
  {
    name: "Maldives",
    slug: "maldives",
    country: "Maldives",
    city: "Malé",
    region: "Indian Ocean",
    description: "Pristine atolls, overwater villas and the bluest lagoons on Earth.",
    longDescription:
      "A scattering of 1,192 coral islands across 26 atolls, the Maldives is the ultimate escape for those seeking serenity above and adventure below the waterline. Overwater villas, bioluminescent beaches and world-class diving define this Indian Ocean paradise.",
    image: img("1514282401047-d79a71a590e8"),
    heroImage: img("1573843981267-be1999ff37cd", 2000),
    popular: true,
    featured: true,
  },
  {
    name: "Santorini",
    slug: "santorini",
    country: "Greece",
    city: "Santorini",
    region: "Mediterranean",
    description: "Whitewashed cliffs, caldera sunsets and Aegean blue domes.",
    longDescription:
      "Carved by a volcanic eruption, Santorini is a crescent of cliffs draped in white and blue, overlooking a flooded caldera. Its sunsets in Oia are legendary, its wine is crisp and Assyrtiko-driven, and its sun-bleached villages feel suspended in time.",
    image: img("1570077188670-e3a8d69ac5ff"),
    heroImage: img("1601581875309-fafbf2d3ed3a", 2000),
    popular: true,
    featured: true,
  },
  {
    name: "Bali",
    slug: "bali",
    country: "Indonesia",
    city: "Denpasar",
    region: "Southeast Asia",
    description: "Emerald rice terraces, sacred temples and island soul.",
    longDescription:
      "Bali is a living postcard — terraced rice paddies cascade down hillsides, incense drifts from family temples, and surf breaks roll onto golden beaches. It's a place where spirituality, art and nature intertwine seamlessly.",
    image: img("1537996194471-e657df975ab4"),
    heroImage: img("1554481923-a6918bd997bc", 2000),
    popular: true,
    featured: false,
  },
  {
    name: "Swiss Alps",
    slug: "swiss-alps",
    country: "Switzerland",
    city: "Interlaken",
    region: "Europe",
    description: "Snow-capped peaks, glacier lakes and storybook villages.",
    longDescription:
      "The Swiss Alps are Europe's majestic rooftop — a playground of cog railways, glacier gondolas and lakes so clear they mirror the peaks. Charming villages like Grindelwald and Zermatt offer cosy chalets beneath towering summits.",
    image: img("1531366936337-7c912a4589a7"),
    heroImage: img("1527685609591-44b0aef2400b", 2000),
    popular: true,
    featured: true,
  },
  {
    name: "Marrakech",
    slug: "marrakech",
    country: "Morocco",
    city: "Marrakech",
    region: "North Africa",
    description: "Spice-scented souks, riads and the roar of the Atlas Mountains.",
    longDescription:
      "Marrakech is a sensory feast — the call to prayer over Jemaa el-Fnaa, the maze of the medina, the cool tiles of a hidden riad. Beyond the city walls, the Atlas Mountains and Agafay desert offer rugged adventure.",
    image: img("1597212618440-806262de4f6b"),
    heroImage: img("1539020140153-e479b8c5fbc9", 2000),
    popular: false,
    featured: false,
  },
  {
    name: "Kyoto",
    slug: "kyoto",
    country: "Japan",
    city: "Kyoto",
    region: "East Asia",
    description: "Ancient temples, geisha districts and seasonal sakura.",
    longDescription:
      "Kyoto is Japan's cultural heart — a thousand torii gates at Fushimi Inari, the bamboo grove of Arashiyama, and tea houses in Gisha. It's a city where centuries-old traditions still shape daily life.",
    image: img("1545569341-9eb8b30979d9"),
    heroImage: img("1493976040374-85c8e12f0c0e", 2000),
    popular: false,
    featured: false,
  },
  {
    name: "Amalfi Coast",
    slug: "amalfi-coast",
    country: "Italy",
    city: "Positano",
    region: "Mediterranean",
    description: "Cliffside pastel villages and lemon-scented la dolce vita.",
    longDescription:
      "The Amalfi Coast is Italy at its most cinematic — Positano's pastel cascade, Ravello's cliff gardens, and limoncello sipped overlooking the Tyrrhenian Sea. Every switchback reveals another postcard view.",
    image: img("1533104816931-20fa692ff6bc"),
    heroImage: img("1503589588054-9e2ab12bc29d", 2000),
    popular: true,
    featured: false,
  },
  {
    name: "Phuket",
    slug: "phuket",
    country: "Thailand",
    city: "Phuket",
    region: "Southeast Asia",
    description: "Turquoise bays, limestone karsts and island-hopping paradise.",
    longDescription:
      "Thailand's largest island is a gateway to the Andaman Sea's most spectacular scenery — Phang Nga Bay's limestone karsts, the Phi Phi islands, and hidden lagoons reachable only by longtail boat.",
    image: img("1589394815804-964ed0be2eb5"),
    heroImage: img("1552465011-b4e21bf6e79a", 2000),
    popular: true,
    featured: false,
  },
  {
    name: "Cape Town",
    slug: "cape-town",
    country: "South Africa",
    city: "Cape Town",
    region: "Southern Africa",
    description: "Table Mountain, vineyards and where two oceans meet.",
    longDescription:
      "Cape Town is a city of staggering natural beauty — Table Mountain's flat summit, the penguins of Boulders Beach, and the Cape Winelands' rolling vineyards. It's where adventure, culture and cuisine converge.",
    image: img("1576485290814-1c72aa4bbb8e"),
    heroImage: img("1568874185730-c4dfca1bc52e", 2000),
    popular: false,
    featured: false,
  },
  {
    name: "Istanbul",
    slug: "istanbul",
    country: "Türkiye",
    city: "Istanbul",
    region: "Eurasia",
    description: "Where East meets West across minarets and bazaars.",
    longDescription:
      "Istanbul straddles two continents, layering Byzantine mosaics beneath Ottoman domes. The Grand Bazaar, the Bosphorus strait and the call to prayer over the Golden Horn make it endlessly enchanting.",
    image: img("1524231757912-21f4fe3a7200"),
    heroImage: img("1541432901042-2d8bd64b4ed9", 2000),
    popular: false,
    featured: false,
  },
  {
    name: "Paris",
    slug: "paris",
    country: "France",
    city: "Paris",
    region: "Europe",
    description: "The eternal city of light, love and haute culture.",
    longDescription:
      "Paris needs no introduction — the Eiffel Tower at twilight, croissants in Le Marais, masterpieces at the Louvre. It's a city that rewards wandering, where every arrondissement has its own romance.",
    image: img("1502602898657-3e91760cbb34"),
    heroImage: img("1499856871958-5b9627545d1a", 2000),
    popular: true,
    featured: false,
  },
];

type ExpSeed = {
  title: string;
  slug: string;
  type: string;
  destinationSlug: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  duration: string;
  durationHours: number;
  rating: number;
  reviewCount: number;
  images: string[];
  highlights: string[];
  itinerary: { time: string; title: string; description: string }[];
  includes: string[];
  excludes: string[];
  groupSize: number;
  meetingPoint: string;
  availability: number;
  bookedCount: number;
  vendorName: string;
  featured: boolean;
  bestseller: boolean;
  tags: string[];
};

const experiences: ExpSeed[] = [
  // ---- Dubai ----
  {
    title: "Sunrise Hot Air Balloon Over the Desert",
    slug: "dubai-hot-air-balloon-sunrise",
    type: "ADVENTURE",
    destinationSlug: "dubai",
    description: "Drift over golden dunes at dawn with falconry show and gourmet breakfast.",
    longDescription:
      "Begin your day suspended 4,000 feet above the Dubai desert as the sun ignites the dunes in amber and rose. This award-winning experience includes a trained falcon flight at altitude — the only one of its kind in the world — followed by a gourmet breakfast at a heritage desert camp.",
    price: 320,
    originalPrice: 399,
    duration: "4 hours",
    durationHours: 4,
    rating: 4.9,
    reviewCount: 2841,
    images: [img("1546708973-c601f0fb8e75"), img("1503614472-8c93d56e92ce"), img("1547036967-23d11aacaee0")],
    highlights: [
      "1-hour hot air balloon flight at sunrise",
      "World-exclusive in-flight falconry demonstration",
      "Gourmet breakfast at heritage desert camp",
      "Pickup from Dubai hotels in luxury 4x4",
      "Certificate of flight signed by the pilot",
    ],
    itinerary: [
      { time: "04:00", title: "Luxury Pickup", description: "Collection from your Dubai hotel in a private 4x4." },
      { time: "05:15", title: "Pre-flight & Briefing", description: "Watch the balloon inflate at the launch site as dawn approaches." },
      { time: "05:45", title: "Sunrise Flight", description: "Soar over the dunes for one hour, with the falcon release mid-flight." },
      { time: "07:00", title: "Heritage Breakfast", description: "Land and enjoy a gourmet breakfast at a traditional desert camp." },
      { time: "08:00", title: "Return Transfer", description: "Drive back to your hotel." },
    ],
    includes: ["Hotel pickup and drop-off", "Hot air balloon flight", "Falconry show", "Gourmet breakfast", "Flight certificate"],
    excludes: ["Personal expenses", "Gratuities", "Photos and souvenirs"],
    groupSize: 24,
    meetingPoint: "Hotel lobby pickup",
    availability: 20,
    bookedCount: 1842,
    vendorName: "Dubai Balloon Adventures",
    featured: true,
    bestseller: true,
    tags: ["Adventure", "Sunrise", "Family-friendly", "Couples"],
  },
  {
    title: "Private Burj Khalifa 'At The Top' with Fast Track",
    slug: "burj-khalifa-at-the-top-private",
    type: "ATTRACTION",
    destinationSlug: "dubai",
    description: "Skip the lines to the world's tallest observation decks at 124th & 125th floors.",
    longDescription:
      "Ascend the world's tallest building with priority access to the 124th and 125th-floor observation decks. Floor-to-ceiling glass walls offer 360° views across Dubai, the Palm and the Arabian Gulf — best timed for the golden hour before sunset.",
    price: 89,
    originalPrice: 119,
    duration: "1.5 hours",
    durationHours: 1.5,
    rating: 4.7,
    reviewCount: 5621,
    images: [img("1512453979798-5ea266f8880c"), img("1583419320504-036625c3191d"), img("1518684079-3c830dcef090")],
    highlights: [
      "Fast-track entry to levels 124 & 125",
      "360° panoramic views of Dubai",
      "Viewing through high-powered telescopes",
      "Flexible time slots available",
      "Open-air terrace experience",
    ],
    itinerary: [
      { time: "Arrival", title: "Check-in", description: "Present your fast-track ticket at The Dubai Mall lower ground." },
      { time: "+15m", title: "High-speed Elevator", description: "Travel to level 124 in the world's fastest elevator at 10m/s." },
      { time: "+20m", title: "Observation Deck", description: "Explore indoor and open-air terraces at your own pace." },
      { time: "+90m", title: "Descent", description: "Return to ground level at your leisure." },
    ],
    includes: ["Fast-track entry ticket", "Access to levels 124 & 125", "Multimedia guide"],
    excludes: ["Hotel transfers", "Access to level 148 (premium)", "Food and drinks"],
    groupSize: 1,
    meetingPoint: "Dubai Mall, At The Top entrance",
    availability: 50,
    bookedCount: 4231,
    vendorName: "Emaar Entertainment",
    featured: true,
    bestseller: true,
    tags: ["Attraction", "Views", "Fast-track"],
  },
  {
    title: "Luxury Yacht Charter with Dinner — Dubai Marina",
    slug: "dubai-luxury-yacht-dinner",
    type: "CRUISE",
    destinationSlug: "dubai",
    description: "Private yacht cruise past Burj Al Arab & Atlantis with gourmet dining under the stars.",
    longDescription:
      "Step aboard a private luxury yacht and cruise past Dubai's most iconic skyline. Sail by the Burj Al Arab, Atlantis The Palm and the illuminated Marina as a private chef prepares a multi-course dinner. Perfect for celebrations and unforgettable evenings.",
    price: 480,
    originalPrice: 620,
    duration: "3 hours",
    durationHours: 3,
    rating: 4.8,
    reviewCount: 1290,
    images: [img("1568607979400-366bd4ba1b73"), img("1570205006238-2934c1c4b8d2"), img("1582719508461-905c673771fd")],
    highlights: [
      "Private yacht (up to 12 guests)",
      "Sail past Burj Al Arab & Atlantis",
      "Gourmet 3-course dinner by private chef",
      "Welcome drinks & sunset views",
      "Bluetooth sound system onboard",
    ],
    itinerary: [
      { time: "18:00", title: "Boarding", description: "Welcome drinks and safety briefing at Dubai Marina." },
      { time: "18:30", title: "Sunset Sail", description: "Cruise toward the Palm and Burj Al Arab as the sun sets." },
      { time: "19:30", title: "Dinner Served", description: "Three-course dinner prepared fresh onboard." },
      { time: "21:00", title: "Return", description: "Cruise back along the illuminated Marina to dock." },
    ],
    includes: ["Private yacht charter", "3-course dinner", "Welcome drinks", "Crew & captain", "Bottled water & soft drinks"],
    excludes: ["Alcoholic beverages (available extra)", "Hotel transfers", "Gratuities"],
    groupSize: 12,
    meetingPoint: "Dubai Marina Yacht Club",
    availability: 6,
    bookedCount: 412,
    vendorName: "Marine Luxury Charters",
    featured: false,
    bestseller: true,
    tags: ["Luxury", "Couples", "Sunset", "Private"],
  },
  {
    title: "Private Airport Transfer — Luxury Mercedes",
    slug: "dubai-luxury-airport-transfer",
    type: "TRANSFER",
    destinationSlug: "dubai",
    description: "Meet & greet private transfer in a Mercedes S-Class or V-Class with bottled water.",
    longDescription:
      "Arrive in style with a private luxury transfer from Dubai International Airport. A professional chauffeur greets you in arrivals with a nameboard, assists with luggage and drives you to your hotel in a Mercedes S-Class (up to 3 pax) or V-Class (up to 6 pax). Flight tracking ensures punctuality.",
    price: 65,
    duration: "1 hour",
    durationHours: 1,
    rating: 4.9,
    reviewCount: 3210,
    images: [img("1555857718-0e21c5c19f51"), img("1503376780353-7e339ce04c98"), img("1449965408869-eaa3f722e40d")],
    highlights: [
      "Mercedes S-Class or V-Class vehicle",
      "Professional English-speaking chauffeur",
      "Flight tracking & meet-and-greet",
      "Bottled water & phone chargers",
      "Door-to-door service",
    ],
    itinerary: [
      { time: "Arrival", title: "Meet & Greet", description: "Chauffeur waits in arrivals with a nameboard." },
      { time: "+15m", title: "Transfer", description: "Comfortable ride to your destination." },
    ],
    includes: ["Private vehicle", "Professional chauffeur", "Bottled water", "Tolls and parking", "Flight tracking"],
    excludes: ["Excess luggage charges", "Extra stops", "Gratuities"],
    groupSize: 6,
    meetingPoint: "DXB Airport Arrivals",
    availability: 30,
    bookedCount: 2104,
    vendorName: "Elite Chauffeur Services",
    featured: false,
    bestseller: false,
    tags: ["Transfer", "Private", "Airport", "Luxury"],
  },
  {
    title: "Old Dubai Heritage & Souks Walking Tour",
    slug: "dubai-old-town-heritage-tour",
    type: "TOUR",
    destinationSlug: "dubai",
    description: "Cross the creek by abra, explore the spice & gold souks and Al Fahidi Fort.",
    longDescription:
      "Discover the Dubai that existed before the skyscrapers. Ride a traditional abra across the Creek, wander the aromatic spice souk, marvel at the gold souk, and explore the wind-tower houses of Al Fahidi with an expert local guide.",
    price: 45,
    originalPrice: 60,
    duration: "3 hours",
    durationHours: 3,
    rating: 4.7,
    reviewCount: 1894,
    images: [img("1518684079-3c830dcef090"), img("1546412414-e1885259563a"), img("1538417658294-290c046f6d29")],
    highlights: [
      "Abra ride across Dubai Creek",
      "Spice souk & gold souk visit",
      "Al Fahidi historic district",
      "Dubai Museum at Al Fahidi Fort",
      "Traditional Emirati tea & dates",
    ],
    itinerary: [
      { time: "08:30", title: "Meeting Point", description: "Meet your guide at Al Fahidi Metro Station." },
      { time: "09:00", title: "Creek Crossing", description: "Ride a traditional abra across the Creek." },
      { time: "09:30", title: "Souks", description: "Explore the spice and gold souks." },
      { time: "10:30", title: "Heritage Walk", description: "Stroll Al Fahidi's wind-tower houses and visit the museum." },
      { time: "11:30", title: "Tea & Farewell", description: "Enjoy Emirati tea and dates before concluding." },
    ],
    includes: ["Expert local guide", "Abra ride", "Museum entry", "Tea and dates"],
    excludes: ["Hotel transfers", "Personal purchases", "Gratuities"],
    groupSize: 15,
    meetingPoint: "Al Fahidi Metro Station",
    availability: 15,
    bookedCount: 1503,
    vendorName: "Arabian Heritage Tours",
    featured: false,
    bestseller: false,
    tags: ["Culture", "Walking", "History", "Family-friendly"],
  },
  // ---- Maldives ----
  {
    title: "Overwater Villa Escape — 3 Nights All-Inclusive",
    slug: "maldives-overwater-villa-escape",
    type: "TOUR",
    destinationSlug: "maldives",
    description: "3 nights in a private overwater villa with all meals, snorkeling & spa credit.",
    longDescription:
      "Escape to your own overwater villa where the Indian Ocean is your backyard. This all-inclusive package includes luxury accommodation, gourmet dining, daily snorkeling excursions to the house reef, a sunset dolphin cruise, and spa credit. Speedboat or seaplane transfers included.",
    price: 1890,
    originalPrice: 2400,
    duration: "3 nights",
    durationHours: 72,
    rating: 4.9,
    reviewCount: 982,
    images: [img("1514282401047-d79a71a590e8"), img("1573843981267-be1999ff37cd"), img("1582719508461-905c673771fd")],
    highlights: [
      "3 nights in an overwater villa",
      "All meals & selected beverages",
      "Daily snorkeling at house reef",
      "Sunset dolphin cruise",
      "$100 spa credit per person",
      "Speedboat/seaplane transfers",
    ],
    itinerary: [
      { time: "Day 1", title: "Arrival", description: "Speedboat/seaplane transfer, welcome cocktails, settle into your villa." },
      { time: "Day 2", title: "Reef & Spa", description: "Guided snorkeling, afternoon spa, sunset dolphin cruise." },
      { time: "Day 3", title: "Island Hop", description: "Local island visit, sandbank picnic, evening fishing." },
      { time: "Day 4", title: "Departure", description: "Breakfast and transfer back to Malé." },
    ],
    includes: ["3 nights overwater villa", "All meals", "Transfers", "Snorkeling gear", "Sunset cruise", "Spa credit"],
    excludes: ["International flights", "Alcoholic premium beverages", "Diving excursions", "Spa beyond credit"],
    groupSize: 2,
    meetingPoint: "Malé International Airport",
    availability: 8,
    bookedCount: 624,
    vendorName: "Azure Maldives Resorts",
    featured: true,
    bestseller: true,
    tags: ["Luxury", "Couples", "Honeymoon", "All-inclusive", "Beach"],
  },
  {
    title: "Private Sandbank Picnic & Snorkeling Safari",
    slug: "maldives-sandbank-snorkel-safari",
    type: "ACTIVITY",
    destinationSlug: "maldives",
    description: "Speedboat to a deserted sandbank for a private picnic and reef snorkeling.",
    longDescription:
      "Aboard a private speedboat to a pristine, deserted sandbank that emerges from the turquoise lagoon at low tide. Snorkel vibrant coral gardens teeming with marine life, then enjoy a gourmet picnic on your own private sliver of sand.",
    price: 280,
    duration: "5 hours",
    durationHours: 5,
    rating: 4.8,
    reviewCount: 410,
    images: [img("1514282401047-d79a71a590e8"), img("1582719508461-905c673771fd"), img("1540202404-1b927e27fa8b")],
    highlights: [
      "Private speedboat charter",
      "Deserted sandbank exclusive visit",
      "Guided reef snorkeling (2 sites)",
      "Gourmet beach picnic",
      "Chance to spot turtles & rays",
    ],
    itinerary: [
      { time: "09:00", title: "Departure", description: "Board your private speedboat from the resort jetty." },
      { time: "09:45", title: "Snorkel Site 1", description: "Snorkel a vibrant coral garden with your guide." },
      { time: "11:00", title: "Sandbank", description: "Arrive at the deserted sandbank for swimming & photos." },
      { time: "12:00", title: "Picnic Lunch", description: "Gourmet picnic served on the sand." },
      { time: "14:00", title: "Return", description: "One more snorkel stop before returning to resort." },
    ],
    includes: ["Private speedboat", "Guide", "Snorkeling gear", "Picnic lunch", "Bottled water & soft drinks"],
    excludes: ["Wetsuit rental", "Underwater camera", "Gratuities"],
    groupSize: 8,
    meetingPoint: "Resort jetty",
    availability: 4,
    bookedCount: 198,
    vendorName: "Maldives Aquatic Adventures",
    featured: false,
    bestseller: false,
    tags: ["Activity", "Private", "Snorkeling", "Couples"],
  },
  // ---- Santorini ----
  {
    title: "Caldera Sunset Catamaran Cruise with Dinner",
    slug: "santorini-caldera-sunset-cruise",
    type: "CRUISE",
    destinationSlug: "santorini",
    description: "Sail the caldera, swim hot springs & watch Oia's sunset from the water.",
    longDescription:
      "Board a luxury catamaran for an unforgettable evening sailing Santorini's volcanic caldera. Swim in the hot springs, snorkel near the Red Beach, and enjoy a freshly prepared onboard BBQ dinner as you watch the legendary Oia sunset from the deck — far from the crowds.",
    price: 145,
    originalPrice: 180,
    duration: "5 hours",
    durationHours: 5,
    rating: 4.9,
    reviewCount: 2310,
    images: [img("1570077188670-e3a8d69ac5ff"), img("1601581875309-fafbf2d3ed3a"), img("1533104816931-20fa692ff6bc")],
    highlights: [
      "Luxury catamaran cruise",
      "Swim in volcanic hot springs",
      "Snorkel near Red Beach",
      "Fresh BBQ dinner onboard",
      "Oia sunset from the water",
    ],
    itinerary: [
      { time: "14:00", title: "Boarding", description: "Board at Vlychada port with welcome drinks." },
      { time: "15:00", title: "Hot Springs", description: "Sail to the volcano and swim in warm sulfur springs." },
      { time: "16:30", title: "Red Beach", description: "Snorkel and swim near the iconic Red Beach." },
      { time: "18:00", title: "Dinner", description: "BBQ dinner prepared fresh onboard as you sail." },
      { time: "19:30", title: "Sunset", description: "Watch the sun dip behind Oia from the deck." },
      { time: "20:30", title: "Return", description: "Disembark at Vlychada port." },
    ],
    includes: ["Catamaran cruise", "BBQ dinner", "Drinks (wine, beer, soft)", "Snorkeling gear", "Hotel pickup"],
    excludes: ["Towels", "Gratuities", "Souvenir photos"],
    groupSize: 20,
    meetingPoint: "Vlychada Port",
    availability: 18,
    bookedCount: 1720,
    vendorName: "Santorini Sailing Co.",
    featured: true,
    bestseller: true,
    tags: ["Cruise", "Sunset", "Couples", "Swimming"],
  },
  {
    title: "Private Wine Tasting & Village Tour",
    slug: "santorini-wine-tasting-village-tour",
    type: "TOUR",
    destinationSlug: "santorini",
    description: "Visit 3 volcanic wineries, taste 12 wines & explore Pyrgos village.",
    longDescription:
      "Discover Santorini's distinctive volcanic wines on a private tour of three boutique wineries. Taste 12 wines including the renowned Assyrtiko, explore the medieval village of Pyrgos, and learn how vines are woven into basket-shapes to withstand the island winds.",
    price: 130,
    duration: "4 hours",
    durationHours: 4,
    rating: 4.8,
    reviewCount: 745,
    images: [img("1503589588054-9e2ab12bc29d"), img("1553361371-9b22f78e8b1d"), img("1547595628-c61a29f496f0")],
    highlights: [
      "3 boutique winery visits",
      "Tasting of 12 volcanic wines",
      "Expert sommelier guide",
      "Local cheese & meze pairing",
      "Explore Pyrgos village",
    ],
    itinerary: [
      { time: "15:00", title: "Pickup", description: "Hotel pickup in a luxury vehicle." },
      { time: "15:30", title: "Winery 1", description: "Visit a cliffside winery with caldera views." },
      { time: "16:30", title: "Winery 2", description: "Underground cave winery tasting." },
      { time: "17:30", title: "Pyrgos", description: "Wander the medieval village of Pyrgos." },
      { time: "18:30", title: "Winery 3", description: "Sunset tasting at a family estate." },
    ],
    includes: ["Private guide", "Transport", "12 wine tastings", "Cheese & meze", "Hotel pickup & drop-off"],
    excludes: ["Additional wine purchases", "Gratuities"],
    groupSize: 8,
    meetingPoint: "Hotel pickup",
    availability: 8,
    bookedCount: 530,
    vendorName: "Aegean Wine Experiences",
    featured: false,
    bestseller: false,
    tags: ["Wine", "Culture", "Private", "Couples"],
  },
  // ---- Bali ----
  {
    title: "Mount Batur Sunrise Trek & Hot Springs",
    slug: "bali-mount-batur-sunrise-trek",
    type: "ADVENTURE",
    destinationSlug: "bali",
    description: "Pre-dawn hike up an active volcano for sunrise, then soak in natural hot springs.",
    longDescription:
      "Trek under a canopy of stars to the summit of Mount Batur, an active volcano, to witness a sunrise that paints the sky and distant Mount Agung in fiery hues. Cook eggs in volcanic steam, then descend to soak your muscles in the natural Toya Devasya hot springs overlooking Lake Batur.",
    price: 75,
    originalPrice: 95,
    duration: "9 hours",
    durationHours: 9,
    rating: 4.8,
    reviewCount: 1620,
    images: [img("1537996194471-e657df975ab4"), img("1518548419970-58e3b4079ab2"), img("1554481923-a6918bd99797")],
    highlights: [
      "Pre-dawn volcano trek (2 hours)",
      "Sunrise from the summit",
      "Cooked eggs in volcanic steam",
      "Soak in Toya Devasya hot springs",
      "Visit a local coffee plantation",
    ],
    itinerary: [
      { time: "02:00", title: "Pickup", description: "Hotel pickup and drive to the trailhead." },
      { time: "04:00", title: "Trek Begins", description: "Begin the 2-hour guided ascent with headlamps." },
      { time: "06:00", title: "Sunrise", description: "Reach the summit for sunrise and steam-cooked breakfast." },
      { time: "08:00", title: "Descent", description: "Trek back down and drive to the hot springs." },
      { time: "10:00", title: "Hot Springs", description: "Relax in the natural hot springs overlooking the lake." },
      { time: "12:00", title: "Coffee Stop", description: "Visit a plantation for tastings before returning." },
    ],
    includes: ["Hotel pickup", "Licensed trekking guide", "Breakfast", "Hot springs entry", "Coffee tasting"],
    excludes: ["Towels & swimwear", "Gratuities", "Personal hiking gear"],
    groupSize: 12,
    meetingPoint: "Hotel pickup",
    availability: 12,
    bookedCount: 980,
    vendorName: "Bali Trekking Guides",
    featured: true,
    bestseller: true,
    tags: ["Adventure", "Sunrise", "Hiking", "Family-friendly"],
  },
  {
    title: "Ubud Rice Terraces, Temples & Waterfalls Private Tour",
    slug: "bali-ubud-private-tour",
    type: "TOUR",
    destinationSlug: "bali",
    description: "Tegalalang terraces, Tirta Empul holy springs & Tegenungan waterfall.",
    longDescription:
      "Explore the cultural and natural heart of Bali on a private tour. Walk the emerald Tegalalang rice terraces, purify yourself at the sacred Tirta Empul water temple, swim beneath Tegenungan waterfall, and meet the macaques of the Ubud Monkey Forest.",
    price: 55,
    duration: "8 hours",
    durationHours: 8,
    rating: 4.7,
    reviewCount: 2240,
    images: [img("1537996194471-e657df975ab4"), img("1554481923-a6918bd997bc"), img("1518548419970-58e3b4079ab2")],
    highlights: [
      "Tegalalang rice terraces",
      "Tirta Empul holy water temple",
      "Tegenungan waterfall swim",
      "Ubud Monkey Forest",
      "Private air-conditioned vehicle",
    ],
    itinerary: [
      { time: "08:00", title: "Pickup", description: "Hotel pickup in private vehicle." },
      { time: "09:30", title: "Tegalalang", description: "Walk the iconic rice terraces." },
      { time: "11:00", title: "Tirta Empul", description: "Visit the holy springs and purification pools." },
      { time: "13:00", title: "Lunch", description: "Optional lunch overlooking the jungle." },
      { time: "14:30", title: "Waterfall", description: "Swim at Tegenungan waterfall." },
      { time: "16:00", title: "Monkey Forest", description: "Stroll the Ubud Monkey Forest sanctuary." },
    ],
    includes: ["Private driver/guide", "Air-conditioned transport", "Bottled water", "All entrance fees"],
    excludes: ["Lunch", "Sarong rental", "Gratuities"],
    groupSize: 6,
    meetingPoint: "Hotel pickup",
    availability: 10,
    bookedCount: 1640,
    vendorName: "Bali Cultural Tours",
    featured: false,
    bestseller: true,
    tags: ["Culture", "Private", "Nature", "Family-friendly"],
  },
  // ---- Swiss Alps ----
  {
    title: "Jungfrau — Top of Europe Day Trip from Interlaken",
    slug: "jungfrau-top-of-europe",
    type: "TOUR",
    destinationSlug: "swiss-alps",
    description: "Cog railway to 3,454m, ice palace, snow plateau & alpine views.",
    longDescription:
      "Ride the cogwheel railway to Jungfraujoch — the highest railway station in Europe at 3,454m. Explore the Ice Palace carved into the glacier, step onto the snow-covered plateau, and take in views stretching to the Vosges and Black Forest. A once-in-a-lifetime alpine experience.",
    price: 215,
    originalPrice: 245,
    duration: "Full day",
    durationHours: 10,
    rating: 4.8,
    reviewCount: 3120,
    images: [img("1531366936337-7c912a4589a7"), img("1527685609591-44b0aef2400b"), img("1606565104e4-ec5d61eb57b2")],
    highlights: [
      "Cogwheel railway to 3,454m",
      "Ice Palace carved in the glacier",
      "Snow Fun Park (summer)",
      "Sphinx observation terrace",
      "Alpine Sensation exhibit",
    ],
    itinerary: [
      { time: "08:00", title: "Departure", description: "Train from Interlaken Ost." },
      { time: "10:00", title: "Change at Grindelwald", description: "Switch to the Eiger Express cable car." },
      { time: "11:00", title: "Jungfraujoch", description: "Arrive at Top of Europe — explore Ice Palace & terraces." },
      { time: "13:00", title: "Lunch", description: "Optional lunch at the glacier restaurant." },
      { time: "15:00", title: "Descent", description: "Return journey via Lauterbrunnen valley." },
      { time: "18:00", title: "Interlaken", description: "Arrive back in Interlaken." },
    ],
    includes: ["Cogwheel train tickets", "Cable car ride", "Ice Palace entry", "Sphinx terrace access"],
    excludes: ["Lunch", "Hotel transfers", "Winter gear rental"],
    groupSize: 1,
    meetingPoint: "Interlaken Ost Station",
    availability: 40,
    bookedCount: 2410,
    vendorName: "Jungfrau Railway",
    featured: true,
    bestseller: true,
    tags: ["Adventure", "Mountains", "Views", "Family-friendly"],
  },
  {
    title: "Private Glacier Express Scenic Train Journey",
    slug: "glacier-express-private",
    type: "TOUR",
    destinationSlug: "swiss-alps",
    description: "The slowest express train in the world, Zermatt to St. Moritz, first class.",
    longDescription:
      "Travel in first-class panoramic comfort on the legendary Glacier Express, often called the slowest express train in the world. Wind through 91 tunnels and across 291 bridges, gazing at deep gorges, alpine meadows and snowy peaks on the 8-hour journey from Zermatt to St. Moritz.",
    price: 390,
    duration: "8 hours",
    durationHours: 8,
    rating: 4.9,
    reviewCount: 890,
    images: [img("1531366936337-7c912a4589a7"), img("1527685609591-44b0aef2400b"), img("1543946207-39bd91e70ca7")],
    highlights: [
      "First-class panoramic carriage",
      "91 tunnels & 291 bridges",
      "3-course onboard lunch",
      "Landwasser Viaduct crossing",
      "Zermatt to St. Moritz",
    ],
    itinerary: [
      { time: "08:52", title: "Depart Zermatt", description: "Board the Glacier Express first class." },
      { time: "12:00", title: "Lunch", description: "Three-course meal served at your seat." },
      { time: "14:30", title: "Landwasser", description: "Cross the iconic Landwasser Viaduct." },
      { time: "16:38", title: "St. Moritz", description: "Arrive at the glamorous resort town." },
    ],
    includes: ["First-class train ticket", "3-course lunch", "Seat reservation", "Panoramic windows"],
    excludes: ["Hotel transfers", "Drinks", "Overnight stay"],
    groupSize: 1,
    meetingPoint: "Zermatt Station",
    availability: 30,
    bookedCount: 612,
    vendorName: "Swiss Travel System",
    featured: false,
    bestseller: false,
    tags: ["Luxury", "Scenic", "Train", "Couples"],
  },
  // ---- Marrakech ----
  {
    title: "Agafay Desert Sunset, Camel Ride & Berber Dinner",
    slug: "marrakech-agafay-desert-dinner",
    type: "TOUR",
    destinationSlug: "marrakech",
    description: "Camel trek through Agafay, sunset over the Atlas & traditional Berber feast.",
    longDescription:
      "Escape to the stone desert of Agafay for an evening of Moroccan magic. Ride a camel through the arid landscape as the sun sinks behind the Atlas Mountains, then sit down to a candlelit Berber dinner with traditional music beneath the stars.",
    price: 70,
    originalPrice: 90,
    duration: "5 hours",
    durationHours: 5,
    rating: 4.8,
    reviewCount: 1450,
    images: [img("1597212618440-806262de4f6b"), img("1539020140153-e479b8c5fbc9"), img("1547721064-da6cfb341d50")],
    highlights: [
      "Camel ride through Agafay",
      "Atlas Mountains sunset",
      "Traditional Berber dinner",
      "Live Gnawa music",
      "Stargazing in the desert",
    ],
    itinerary: [
      { time: "16:00", title: "Pickup", description: "Hotel pickup and drive to Agafay desert." },
      { time: "17:00", title: "Camel Ride", description: "Trek through the desert for 45 minutes." },
      { time: "18:00", title: "Sunset", description: "Watch the sun set over the Atlas Mountains." },
      { time: "19:00", title: "Dinner", description: "Berber feast with live music under the stars." },
      { time: "21:00", title: "Return", description: "Drive back to Marrakech." },
    ],
    includes: ["Hotel pickup", "Camel ride", "Berber dinner", "Tea & mint", "Music entertainment"],
    excludes: ["Drinks", "Gratuities", "Quad bike add-on"],
    groupSize: 16,
    meetingPoint: "Hotel pickup",
    availability: 16,
    bookedCount: 1090,
    vendorName: "Atlas Desert Expeditions",
    featured: true,
    bestseller: true,
    tags: ["Culture", "Sunset", "Dinner", "Couples"],
  },
  // ---- Kyoto ----
  {
    title: "Kyoto Highlights — Temples, Bamboo & Geisha District",
    slug: "kyoto-highlights-private-tour",
    type: "TOUR",
    destinationSlug: "kyoto",
    description: "Fushimi Inari, Arashiyama bamboo, Kinkaku-ji & Gion geisha district.",
    longDescription:
      "A full-day private tour of Kyoto's most iconic sites. Walk the vermilion torii gates of Fushimi Inari, stand among the towering bamboo of Arashiyama, admire the Golden Pavilion reflected in its pond, and end the day in the lantern-lit geisha district of Gion.",
    price: 140,
    duration: "8 hours",
    durationHours: 8,
    rating: 4.9,
    reviewCount: 1080,
    images: [img("1545569341-9eb8b30979d9"), img("1493976040374-85c8e12f0c0e"), img("1493976040374-85c8e12f0c0e")],
    highlights: [
      "Fushimi Inari 10,000 torii gates",
      "Arashiyama bamboo grove",
      "Kinkaku-ji Golden Pavilion",
      "Gion geisha district walk",
      "Private English-speaking guide",
    ],
    itinerary: [
      { time: "09:00", title: "Pickup", description: "Hotel pickup with private guide." },
      { time: "09:45", title: "Fushimi Inari", description: "Walk the iconic torii tunnel." },
      { time: "11:30", title: "Kinkaku-ji", description: "Visit the Golden Pavilion." },
      { time: "13:00", title: "Lunch", description: "Optional traditional kaiseki lunch." },
      { time: "14:30", title: "Arashiyama", description: "Stroll the bamboo grove and Togetsukyo Bridge." },
      { time: "17:00", title: "Gion", description: "Walk the geisha district at dusk." },
    ],
    includes: ["Private guide", "Transport", "Temple entry fees", "Bottled water"],
    excludes: ["Lunch", "Souvenirs", "Gratuities"],
    groupSize: 6,
    meetingPoint: "Hotel pickup",
    availability: 8,
    bookedCount: 720,
    vendorName: "Kyoto Cultural Guides",
    featured: false,
    bestseller: true,
    tags: ["Culture", "Private", "History", "Family-friendly"],
  },
  // ---- Amalfi ----
  {
    title: "Amalfi Coast Day Cruise — Positano, Amalfi & Ravello",
    slug: "amalfi-coast-day-cruise",
    type: "CRUISE",
    destinationSlug: "amalfi-coast",
    description: "Boat cruise along the coast with stops at Positano, Amalfi & Ravello.",
    longDescription:
      "See the Amalfi Coast the way it was meant to be seen — from the sea. Cruise past dramatic cliffs and pastel villages, with swimming stops and time to explore Positano, Amalfi town, and the clifftop gardens of Ravello. Aperitivo and limoncello included.",
    price: 165,
    originalPrice: 195,
    duration: "7 hours",
    durationHours: 7,
    rating: 4.8,
    reviewCount: 1320,
    images: [img("1533104816931-20fa692ff6bc"), img("1503589588054-9e2ab12bc29d"), img("1552465011-b4e21bf6e79a")],
    highlights: [
      "Cruise past Positano & Amalfi",
      "Swim stops at hidden coves",
      "Free time in Positano & Amalfi",
      "Ravello clifftop gardens",
      "Aperitivo & limoncello onboard",
    ],
    itinerary: [
      { time: "09:00", title: "Departure", description: "Board at Sorrento port." },
      { time: "10:00", title: "Positano", description: "Cruise past & stop for 1.5 hours exploration." },
      { time: "12:00", title: "Swim", description: "Swim stop at a hidden cove with aperitivo." },
      { time: "13:30", title: "Amalfi", description: "Stop in Amalfi town for lunch & visit." },
      { time: "15:30", title: "Ravello", description: "Quick stop & cruise back." },
      { time: "17:00", title: "Return", description: "Back to Sorrento port." },
    ],
    includes: ["Boat cruise", "Guide", "Aperitivo & limoncello", "Bottled water", "Swim stops"],
    excludes: ["Lunch", "Ravello garden entry", "Gratuities"],
    groupSize: 12,
    meetingPoint: "Sorrento Marina",
    availability: 12,
    bookedCount: 890,
    vendorName: "Amalfi Boat Tours",
    featured: true,
    bestseller: true,
    tags: ["Cruise", "Views", "Couples", "Swimming"],
  },
  // ---- Phuket ----
  {
    title: "Phi Phi Islands Speedboat Day Trip",
    slug: "phuket-phi-phi-speedboat",
    type: "ACTIVITY",
    destinationSlug: "phuket",
    description: "Snorkel Maya Bay, Monkey Beach & Bamboo Island by speedboat.",
    longDescription:
      "Explore the world-famous Phi Phi Islands on a speedboat day trip. Snorkel the crystal waters of Maya Bay (made famous by 'The Beach'), meet the monkeys of Monkey Beach, and relax on the powdery sands of Bamboo Island. Buffet lunch on Phi Phi Don included.",
    price: 85,
    originalPrice: 110,
    duration: "8 hours",
    durationHours: 8,
    rating: 4.7,
    reviewCount: 3890,
    images: [img("1589394815804-964ed0be2eb5"), img("1552465011-b4e21bf6e79a"), img("1518548419970-58e3b4079ab2")],
    highlights: [
      "Maya Bay snorkeling",
      "Monkey Beach visit",
      "Bamboo Island relaxation",
      "Buffet lunch on Phi Phi Don",
      "Snorkeling gear provided",
    ],
    itinerary: [
      { time: "08:00", title: "Pickup", description: "Hotel pickup and transfer to the pier." },
      { time: "09:30", title: "Maya Bay", description: "Snorkel and swim at the famous bay." },
      { time: "11:00", title: "Monkey Beach", description: "Visit and feed the monkeys (from boat)." },
      { time: "12:30", title: "Lunch", description: "Buffet lunch on Phi Phi Don island." },
      { time: "14:00", title: "Bamboo Island", description: "Relax on the beach and snorkel." },
      { time: "16:00", title: "Return", description: "Speedboat back to Phuket and hotel drop-off." },
    ],
    includes: ["Speedboat", "Hotel pickup", "Buffet lunch", "Snorkeling gear", "Soft drinks"],
    excludes: ["National park fee", "Towels", "Gratuities"],
    groupSize: 25,
    meetingPoint: "Hotel pickup",
    availability: 25,
    bookedCount: 2940,
    vendorName: "Andaman Sea Tours",
    featured: true,
    bestseller: true,
    tags: ["Activity", "Snorkeling", "Beach", "Family-friendly"],
  },
  // ---- Cape Town ----
  {
    title: "Cape Peninsula & Cape Point Full-Day Tour",
    slug: "cape-town-peninsula-tour",
    type: "TOUR",
    destinationSlug: "cape-town",
    description: "Boulders penguins, Cape Point, Cape of Good Hope & Chapman's Peak drive.",
    longDescription:
      "Discover the spectacular Cape Peninsula on a full-day tour. Drive the dramatic Chapman's Peak, meet the African penguins of Boulders Beach, stand at the southwesternmost point of Africa at Cape Point, and enjoy coastal views along the way.",
    price: 95,
    duration: "9 hours",
    durationHours: 9,
    rating: 4.8,
    reviewCount: 1640,
    images: [img("1576485290814-1c72aa4bbb8e"), img("1568874185730-c4dfca1bc52e"), img("1517398741578-87bec719c79f")],
    highlights: [
      "Chapman's Peak scenic drive",
      "Boulders Beach penguins",
      "Cape Point & Cape of Good Hope",
      "Funicular ride (optional)",
      "Coastal village stops",
    ],
    itinerary: [
      { time: "08:00", title: "Pickup", description: "Hotel pickup in Cape Town." },
      { time: "09:30", title: "Chapman's Peak", description: "Scenic drive & photo stop." },
      { time: "10:30", title: "Boulders Beach", description: "Walk the boardwalk to see penguins." },
      { time: "12:30", title: "Cape Point", description: "Funicular to the lighthouse & views." },
      { time: "14:00", title: "Good Hope", description: "Visit the Cape of Good Hope marker." },
      { time: "16:00", title: "Return", description: "Drive back via Simon's Town." },
    ],
    includes: ["Transport", "Guide", "Boulders entry", "Cape Point reserve entry"],
    excludes: ["Lunch", "Funicular fee", "Gratuities"],
    groupSize: 14,
    meetingPoint: "Hotel pickup",
    availability: 14,
    bookedCount: 1120,
    vendorName: "Cape Explorer Tours",
    featured: false,
    bestseller: true,
    tags: ["Nature", "Views", "Wildlife", "Family-friendly"],
  },
  // ---- Istanbul ----
  {
    title: "Istanbul Old City — Hagia Sophia, Blue Mosque & Bazaar",
    slug: "istanbul-old-city-tour",
    type: "TOUR",
    destinationSlug: "istanbul",
    description: "Hagia Sophia, Blue Mosque, Topkapı Palace & Grand Bazaar with expert guide.",
    longDescription:
      "Step into 1,500 years of history on a guided tour of Istanbul's Sultanahmet district. Marvel at the soaring dome of Hagia Sophia, the blue Iznik tiles of the Blue Mosque, the treasures of Topkapı Palace, and lose yourself in the labyrinth of the Grand Bazaar.",
    price: 85,
    originalPrice: 105,
    duration: "7 hours",
    durationHours: 7,
    rating: 4.8,
    reviewCount: 1980,
    images: [img("1524231757912-21f4fe3a7200"), img("1541432901042-2d8bd64b4ed9"), img("1604941909643-7d51b3a3a3b4")],
    highlights: [
      "Hagia Sophia (skip-the-line)",
      "Blue Mosque visit",
      "Topkapı Palace & harem",
      "Hippodrome of Constantinople",
      "Grand Bazaar orientation",
    ],
    itinerary: [
      { time: "09:00", title: "Hagia Sophia", description: "Skip-the-line entry to the 1,500-year-old marvel." },
      { time: "10:30", title: "Blue Mosque", description: "Visit the famed six-minaret mosque." },
      { time: "11:30", title: "Hippodrome", description: "Walk the ancient chariot-racing square." },
      { time: "12:30", title: "Lunch", description: "Optional Turkish lunch." },
      { time: "14:00", title: "Topkapı", description: "Explore the sultan's palace and treasury." },
      { time: "16:00", title: "Grand Bazaar", description: "Orientation and free time to shop." },
    ],
    includes: ["Expert guide", "Skip-the-line Hagia Sophia", "Topkapı entry", "Headsets"],
    excludes: ["Lunch", "Harem entry", "Personal purchases"],
    groupSize: 15,
    meetingPoint: "Sultanahmet Square",
    availability: 15,
    bookedCount: 1410,
    vendorName: "Istanbul Heritage Guides",
    featured: false,
    bestseller: true,
    tags: ["Culture", "History", "Family-friendly"],
  },
  // ---- Paris ----
  {
    title: "Eiffel Tower Summit Access with Seine River Cruise",
    slug: "paris-eiffel-summit-cruise",
    type: "ATTRACTION",
    destinationSlug: "paris",
    description: "Skip-the-line to the Eiffel Tower summit + 1-hour Seine river cruise.",
    longDescription:
      "Beat the queues with skip-the-line access to the summit of the Eiffel Tower for unmatched views of Paris. Then glide along the Seine on a 1-hour cruise past Notre-Dame, the Louvre and the Musée d'Orsay. Flexible timing lets you catch the Tower's sparkle after dark.",
    price: 75,
    originalPrice: 95,
    duration: "2.5 hours",
    durationHours: 2.5,
    rating: 4.7,
    reviewCount: 4210,
    images: [img("1502602898657-3e91760cbb34"), img("1499856871958-5b9627545d1a"), img("1501739022-8f1eeec3c9c0")],
    highlights: [
      "Skip-the-line Eiffel Tower summit",
      "1-hour Seine river cruise",
      "Panoramic Paris views",
      "Flexible cruise timing",
      "Audio guide on cruise",
    ],
    itinerary: [
      { time: "Arrival", title: "Meeting Point", description: "Meet your host at the Eiffel Tower base." },
      { time: "+15m", title: "Summit Access", description: "Skip the lines and ascend to the top floor." },
      { time: "+90m", title: "Cruise", description: "Board the Seine cruise at your chosen time." },
    ],
    includes: ["Skip-the-line summit ticket", "Seine cruise ticket", "Host escort", "Audio guide"],
    excludes: ["Hotel transfers", "Food & drinks", "Souvenir photos"],
    groupSize: 20,
    meetingPoint: "Eiffel Tower, meeting point 4",
    availability: 40,
    bookedCount: 3620,
    vendorName: "Paris City Vision",
    featured: true,
    bestseller: true,
    tags: ["Attraction", "Views", "Couples", "Fast-track"],
  },
  {
    title: "Louvre Museum — Skip-the-Line Guided Highlights",
    slug: "paris-louvre-guided-tour",
    type: "TOUR",
    destinationSlug: "paris",
    description: "Skip the lines & see the Mona Lisa, Venus de Milo & Winged Victory.",
    longDescription:
      "Make the most of the world's largest museum with a skip-the-line guided tour of its greatest treasures. Your expert guide leads you straight to the Mona Lisa, Venus de Milo and the Winged Victory of Samothrace, sharing stories behind the masterpieces.",
    price: 65,
    duration: "2 hours",
    durationHours: 2,
    rating: 4.7,
    reviewCount: 2980,
    images: [img("1499856871958-5b9627545d1a"), img("1493976040374-85c8e12f0c0e"), img("1502602898657-3e91760cbb34")],
    highlights: [
      "Skip-the-line entry",
      "Expert English-speaking guide",
      "Mona Lisa, Venus de Milo & more",
      "Small group (max 15)",
      "Free time after the tour",
    ],
    itinerary: [
      { time: "Arrival", title: "Meeting Point", description: "Meet beneath the glass pyramid." },
      { time: "+10m", title: "Skip the Line", description: "Enter directly with your guide." },
      { time: "+15m", title: "Highlights", description: "Tour the Denon wing's masterpieces." },
      { time: "+2h", title: "Free Time", description: "Explore the rest of the museum at leisure." },
    ],
    includes: ["Skip-the-line entry", "Guided tour", "Headsets", "Museum entry ticket"],
    excludes: ["Hotel transfers", "Audio guide rental", "Food & drinks"],
    groupSize: 15,
    meetingPoint: "Louvre Pyramid",
    availability: 20,
    bookedCount: 2310,
    vendorName: "Paris Museum Tours",
    featured: false,
    bestseller: false,
    tags: ["Culture", "History", "Fast-track", "Family-friendly"],
  },
];

const hotels = [
  {
    name: "Atlantis The Royal",
    slug: "atlantis-the-royal-dubai",
    destinationSlug: "dubai",
    description: "An architectural icon of ultra-luxury on Palm Jumeirah.",
    longDescription:
      "Atlantis The Royal redefines luxury with sky pools, celebrity-chef restaurants and panoramic views of the Arabian Gulf and Dubai skyline. Each suite is a sanctuary of contemporary design with floor-to-ceiling windows.",
    starRating: 5,
    pricePerNight: 850,
    originalPrice: 1100,
    images: [img("1582719508461-905c673771fd"), img("1568607979400-366bd4ba1b73"), img("1564501049412-61c2a3083791")],
    amenities: ["Private beach", "Infinite pools", "Spa & wellness", "Michelin dining", "Sky pool", "Kids club", "Gym", "Concierge"],
    roomTypes: [
      { name: "Sky Pool Suite", description: "Suite with a private infinity pool on the balcony.", maxGuests: 3, priceModifier: 0 },
      { name: "Panoramic Suite", description: "Floor-to-ceiling views of the Gulf and skyline.", maxGuests: 3, priceModifier: -250 },
      { name: "Signature Penthouse", description: "Three-bedroom penthouse with butler service.", maxGuests: 6, priceModifier: 2400 },
    ],
    rating: 4.9,
    reviewCount: 1820,
    address: "Palm Jumeirah, Dubai",
    featured: true,
  },
  {
    name: "Burj Al Arab Jumeirah",
    slug: "burj-al-arab-dubai",
    destinationSlug: "dubai",
    description: "The world's most luxurious all-suite hotel, shaped like a sail.",
    longDescription:
      "Standing on its own island, the Burj Al Arab is the epitome of opulence — every suite spans two floors, with a dedicated butler, 24k gold accents and a private helipad. A symbol of Dubai's ambition.",
    starRating: 5,
    pricePerNight: 1500,
    originalPrice: 1900,
    images: [img("1518684079-3c830dcef090"), img("1582719508461-905c673771fd"), img("1568607979400-366bd4ba1b73")],
    amenities: ["Private butler", "Helipad", "Private beach", "9 restaurants", "Spa", "Rolls-Royce transfer", "Infinity pools", "Kids club"],
    roomTypes: [
      { name: "Deluxe One-Bedroom Suite", description: "Two-floor suite, 170 sqm, panoramic Gulf views.", maxGuests: 2, priceModifier: 0 },
      { name: "Panoramic Suite", description: "Higher floor with 270° views.", maxGuests: 2, priceModifier: 600 },
      { name: "Royal Two-Bedroom Suite", description: "265 sqm with separate living & dining.", maxGuests: 4, priceModifier: 1800 },
    ],
    rating: 4.9,
    reviewCount: 2310,
    address: "Jumeirah Beach Road, Dubai",
    featured: true,
  },
  {
    name: "Armani Hotel Dubai",
    slug: "armani-hotel-dubai",
    destinationSlug: "dubai",
    description: "Giorgio Armani's curated haven inside the Burj Khalifa.",
    longDescription:
      "Located within the Burj Khalifa, the Armani Hotel reflects Giorgio Armani's personal aesthetic of understated elegance. Every detail — from the fabric to the fragrance — has been chosen by the designer himself.",
    starRating: 5,
    pricePerNight: 720,
    originalPrice: 900,
    images: [img("1583419320504-036625c3191d"), img("1518684079-3c830dcef090"), img("1564501049412-61c2a3083791")],
    amenities: ["In Burj Khalifa", "Armani Spa", "Designer suites", "Fine dining", "Concierge", "Direct mall access", "Gym", "Business center"],
    roomTypes: [
      { name: "Armani Deluxe Room", description: "45 sqm minimalist luxury with city views.", maxGuests: 2, priceModifier: 0 },
      { name: "Armani Executive Suite", description: "75 sqm with living area and skyline views.", maxGuests: 3, priceModifier: 400 },
      { name: "Armani Ambassador Suite", description: "165 sqm with dining and study.", maxGuests: 4, priceModifier: 1200 },
    ],
    rating: 4.8,
    reviewCount: 1340,
    address: "Burj Khalifa, Downtown Dubai",
    featured: false,
  },
  {
    name: "Soneva Fushi",
    slug: "soneva-fushi-maldives",
    destinationSlug: "maldives",
    description: "Barefoot luxury in vast beach & overwater villas with retractable roofs.",
    longDescription:
      "Soneva Fushi pioneered the barefoot-luxury concept. Sprawling villas with private pools, retractable roofs over the beds for stargazing, an observatory, and an open-air cinema make this a true castaway paradise.",
    starRating: 5,
    pricePerNight: 2100,
    originalPrice: 2600,
    images: [img("1573843981267-be1999ff37cd"), img("1514282401047-d79a71a590e8"), img("1582719508461-905c673771fd")],
    amenities: ["Overwater villas", "Private pools", "Observatory", "Open-air cinema", "Spa", "Diving center", "Kids club", "Eco-friendly"],
    roomTypes: [
      { name: "Crusoe Villa", description: "Beach villa with private pool & garden.", maxGuests: 4, priceModifier: 0 },
      { name: "Family Villa Suite", description: "Two-bedroom with waterslide & pool.", maxGuests: 6, priceModifier: 1200 },
      { name: "Sunrise Water Retreat", description: "Overwater villa with retractable roof.", maxGuests: 2, priceModifier: 1800 },
    ],
    rating: 5.0,
    reviewCount: 540,
    address: "Baa Atoll, Maldives",
    featured: true,
  },
  {
    name: "Conrad Maldives Rangali Island",
    slug: "conrad-maldives-rangali",
    destinationSlug: "maldives",
    description: "Iconic underwater suite resort with the world's first undersea restaurant.",
    longDescription:
      "Spanning two islands connected by a bridge, Conrad Maldives is famed for its underwater restaurant Ithaa, twin-island experiences and overwater villas on the house reef. An award-winning diving destination.",
    starRating: 5,
    pricePerNight: 1650,
    originalPrice: 2000,
    images: [img("1582719508461-905c673771fd"), img("1514282401047-d79a71a590e8"), img("1540202404-1b927e27fa8b")],
    amenities: ["Underwater restaurant", "Overwater villas", "House reef diving", "Spa over water", "Two islands", "Kids club", "Tennis", "Multiple pools"],
    roomTypes: [
      { name: "Beach Villa with Pool", description: "Beachfront with private plunge pool.", maxGuests: 3, priceModifier: 0 },
      { name: "Overwater Villa", description: "Over the lagoon with direct sea access.", maxGuests: 3, priceModifier: 500 },
      { name: "Muraka Residence", description: "Two-level with underwater bedroom.", maxGuests: 4, priceModifier: 8000 },
    ],
    rating: 4.9,
    reviewCount: 980,
    address: "Rangali Island, Maldives",
    featured: false,
  },
  {
    name: "Canaves Oia Epitome",
    slug: "canaves-oia-santorini",
    destinationSlug: "santorini",
    description: "Cliffside suites with private plunge pools overlooking the caldera.",
    longDescription:
      "Perched on the cliffs of Oia, Canaves Oia Epitome offers serene suites and villas, each with a private plunge pool and uninterrupted caldera views. Sunset dinners and infinity pools make it an Oia favorite.",
    starRating: 5,
    pricePerNight: 980,
    originalPrice: 1250,
    images: [img("1570077188670-e3a8d69ac5ff"), img("1601581875309-fafbf2d3ed3a"), img("1533104816931-20fa692ff6bc")],
    amenities: ["Caldera views", "Private plunge pools", "Infinity pool", "Fine dining", "Spa", "Yoga", "Concierge", "Sunset terrace"],
    roomTypes: [
      { name: "Sunrise Caldera Suite", description: "Suite with private plunge pool & caldera view.", maxGuests: 2, priceModifier: 0 },
      { name: "Epitome Pool Villa", description: "Villa with larger pool and sea view.", maxGuests: 4, priceModifier: 700 },
      { name: "Honeymoon Villa", description: "Cave-style with private spa tub.", maxGuests: 2, priceModifier: 500 },
    ],
    rating: 4.9,
    reviewCount: 720,
    address: "Oia, Santorini",
    featured: true,
  },
  {
    name: "Katikies Kirrani",
    slug: "katikies-santorini",
    destinationSlug: "santorini",
    description: "Whitewashed clifftop luxury with iconic infinity pool in Oia.",
    longDescription:
      "The original boutique luxury hotel of Santorini, Katikies cascades down the cliff in tiers of white, with the most photographed infinity pool on the island. Candlelit dinners face the caldera sunset.",
    starRating: 5,
    pricePerNight: 760,
    originalPrice: 980,
    images: [img("1601581875309-fafbf2d3ed3a"), img("1570077188670-e3a8d69ac5ff"), img("1533104816931-20fa692ff6bc")],
    amenities: ["Infinity pool", "Caldera views", "Spa", "Champagne bar", "Fine dining", "Butler", "Library", "Sunset terrace"],
    roomTypes: [
      { name: "Junior Suite", description: "Cave suite with caldera view.", maxGuests: 2, priceModifier: 0 },
      { name: "Pool Suite", description: "Suite with private plunge pool.", maxGuests: 3, priceModifier: 350 },
      { name: "Katikies Villa", description: "Two-bedroom villa with pool & butler.", maxGuests: 4, priceModifier: 1400 },
    ],
    rating: 4.8,
    reviewCount: 610,
    address: "Oia, Santorini",
    featured: false,
  },
  {
    name: "Capella Ubud",
    slug: "capella-ubud-bali",
    destinationSlug: "bali",
    description: "Bill Bensley-designed tented camp in the rainforest of Ubud.",
    longDescription:
      "A whimsical, ultra-luxury tented camp nestled in the Balinese rainforest, designed by Bill Bensley. Each billowing tent has a private saltwater pool and a dedicated butler. A surreal blend of safari romance and tropical decadence.",
    starRating: 5,
    pricePerNight: 1180,
    originalPrice: 1400,
    images: [img("1537996194471-e657df975ab4"), img("1554481923-a6918bd99797"), img("1518548419970-58e3b4079ab2")],
    amenities: ["Tented villas", "Private pools", "Butler service", "Rainforest spa", "River dining", "Yoga", "Library", "Treks"],
    roomTypes: [
      { name: "Rainforest Tent", description: "Tent with private pool & terrace.", maxGuests: 2, priceModifier: 0 },
      { name: "Riverside Tent", description: "Larger tent by the river with deck.", maxGuests: 3, priceModifier: 400 },
      { name: "Keliki Tent", description: "Two-bedroom tent with butler & spa.", maxGuests: 4, priceModifier: 1100 },
    ],
    rating: 4.9,
    reviewCount: 410,
    address: "Keliki, Ubud, Bali",
    featured: true,
  },
  {
    name: "Bulgari Resort Bali",
    slug: "bulgari-resort-bali",
    destinationSlug: "bali",
    description: "Italian glamour clifftop above the Indian Ocean in Uluwatu.",
    longDescription:
      "Bulgari Resort Bali blends Italian elegance with Balinese artistry on a 150-metre clifftop. Villas with private pools, ocean-view pavilions, and a clifftop spa make this one of Bali's most exclusive stays.",
    starRating: 5,
    pricePerNight: 1050,
    originalPrice: 1300,
    images: [img("1554481923-a6918bd99797"), img("1537996194471-e657df975ab4"), img("1552465011-b4e21bf6e79a")],
    amenities: ["Clifftop villas", "Private pools", "Ocean-view spa", "Italian dining", "Incline elevator to beach", "Beach club", "Tennis", "Butler"],
    roomTypes: [
      { name: "Ocean View Villa", description: "Villa with private pool & ocean view.", maxGuests: 2, priceModifier: 0 },
      { name: "Bulgari Villa", description: "Two-bedroom villa with butler.", maxGuests: 4, priceModifier: 1300 },
      { name: "Penthouse", description: "Top-floor suite with plunge pool.", maxGuests: 3, priceModifier: 600 },
    ],
    rating: 4.9,
    reviewCount: 530,
    address: "Uluwatu, Bali",
    featured: false,
  },
  {
    name: "Victoria Jungfrau Grand Hotel",
    slug: "victoria-jungfrau-interlaken",
    destinationSlug: "swiss-alps",
    description: "Belle Époque grand hotel between two lakes in Interlaken.",
    longDescription:
      "A historic grand hotel of old-world elegance, the Victoria Jungfrau has hosted royalty since 1865. With sweeping Alpine views, a world-class spa, and Michelin dining, it's the classic Swiss luxury experience.",
    starRating: 5,
    pricePerNight: 620,
    originalPrice: 780,
    images: [img("1531366936337-7c912a4589a7"), img("1527685609591-44b0aef2400b"), img("1606565104e4-ec5d61eb57b2")],
    amenities: ["Alpine views", "Spa & pools", "Michelin dining", "Tennis", "Lake access", "Cigar lounge", "Kids club", "Concierge"],
    roomTypes: [
      { name: "Deluxe Room", description: "Elegant room with garden or mountain view.", maxGuests: 2, priceModifier: 0 },
      { name: "Junior Suite", description: "Suite with separate sitting area.", maxGuests: 3, priceModifier: 250 },
      { name: "Alpine Suite", description: "Large suite with Jungfrau views.", maxGuests: 4, priceModifier: 700 },
    ],
    rating: 4.8,
    reviewCount: 890,
    address: "Interlaken, Switzerland",
    featured: false,
  },
  {
    name: "La Mamounia",
    slug: "la-mamounia-marrakech",
    destinationSlug: "marrakech",
    description: "A legendary palace hotel with gardens once described by Churchill.",
    longDescription:
      "La Mamounia is Marrakech's most storied hotel — a melange of Art Deco and Moroccan craftsmanship set in 20 acres of gardens. Winston Churchill called it 'the most lovely spot in the whole world.'",
    starRating: 5,
    pricePerNight: 720,
    originalPrice: 900,
    images: [img("1597212618440-806262de4f6b"), img("1539020140153-e479b8c5fbc9"), img("1546412414-e1885259563a")],
    amenities: ["20-acre gardens", "Spa", "Heated pools", "4 restaurants", "Casino", "Tennis", "Cooking school", "Butler"],
    roomTypes: [
      { name: "Superior Room", description: "Moroccan décor with garden view.", maxGuests: 2, priceModifier: 0 },
      { name: "Deluxe Room", description: "Larger room with balcony.", maxGuests: 3, priceModifier: 200 },
      { name: "Riad Suite", description: "Private riad with plunge pool.", maxGuests: 4, priceModifier: 1500 },
    ],
    rating: 4.9,
    reviewCount: 1240,
    address: "Avenue Bab Jdid, Marrakech",
    featured: true,
  },
  {
    name: "Hoshinoya Tokyo",
    slug: "hoshinoya-tokyo",
    destinationSlug: "kyoto",
    description: "A tower ryokan bringing traditional Japanese hospitality to Tokyo.",
    longDescription:
      "Hoshinoya Tokyo is a rare ryokan in the heart of the city — a tower of wood and washi paper where guests wear yukata, soak in a rooftop onsen, and dine on kaiseki cuisine. A serene counterpoint to Tokyo's buzz.",
    starRating: 5,
    pricePerNight: 880,
    originalPrice: 1100,
    images: [img("1545569341-9eb8b30979d9"), img("1493976040374-85c8e12f0c0e"), img("1540202404-1b927e27fa8b")],
    amenities: ["Rooftop onsen", "Kaiseki dining", "Tea ceremony", "Yukata", "River views", "Spa", "Library", "Butler"],
    roomTypes: [
      { name: "Sky Floor Suite", description: "Top-floor suite with skyline views.", maxGuests: 2, priceModifier: 0 },
      { name: "Water Floor Suite", description: "Suite with a Japanese cypress bath.", maxGuests: 3, priceModifier: 200 },
      { name: "Hoshi Suite", description: "Two-room suite for families.", maxGuests: 4, priceModifier: 600 },
    ],
    rating: 4.9,
    reviewCount: 480,
    address: "Otemachi, Tokyo",
    featured: false,
  },
  {
    name: "Le Sirenuse",
    slug: "le-sirenuse-positano",
    destinationSlug: "amalfi-coast",
    description: "A pastel-hued family-run palace in the heart of Positano.",
    longDescription:
      "Once a private summer home, Le Sirenuse is now one of Italy's most beloved hotels — a tumble of terracotta and majolica on the Positano cliffs, with a Michelin-starred kitchen and hand-painted tiles throughout.",
    starRating: 5,
    pricePerNight: 980,
    originalPrice: 1250,
    images: [img("1533104816931-20fa692ff6bc"), img("1503589588054-9e2ab12bc29d"), img("1552465011-b4e21bf6e79a")],
    amenities: ["Sea views", "Michelin dining", "Pool", "Spa", "Champagne bar", "Boat shuttle", "Cooking class", "Concierge"],
    roomTypes: [
      { name: "Junior Suite", description: "Sea-view suite with terrace.", maxGuests: 2, priceModifier: 0 },
      { name: "Deluxe Suite", description: "Larger suite with balcony & tub.", maxGuests: 3, priceModifier: 400 },
      { name: "Sirenuse Suite", description: "Top suite with panoramic terrace.", maxGuests: 4, priceModifier: 1100 },
    ],
    rating: 4.9,
    reviewCount: 760,
    address: "Via Cristoforo Colombo, Positano",
    featured: true,
  },
  {
    name: "Soneva Kiri",
    slug: "soneva-kiri-thailand",
    destinationSlug: "phuket",
    description: "Eco-luxury villas on a private island off Thailand's coast.",
    longDescription:
      "Soneva Kiri offers vast beachfront and cliffside pool villas on the unspoiled island of Koh Kood. With an observatory, chocolate room and a treetop dining pod, it's barefoot luxury at its most imaginative.",
    starRating: 5,
    pricePerNight: 1280,
    originalPrice: 1600,
    images: [img("1589394815804-964ed0be2eb5"), img("1552465011-b4e21bf6e79a"), img("1554481923-a6918bd99797")],
    amenities: ["Private island", "Pool villas", "Observatory", "Treetop dining", "Spa", "Chocolate room", "Diving", "Kids club"],
    roomTypes: [
      { name: "Beach Pool Villa", description: "Beachfront villa with pool.", maxGuests: 4, priceModifier: 0 },
      { name: "Cliff Pool Villa", description: "Clifftop villa with sea view & slide.", maxGuests: 4, priceModifier: 500 },
      { name: "Two-Bedroom Villa", description: "Family villa with two pools.", maxGuests: 6, priceModifier: 1400 },
    ],
    rating: 4.9,
    reviewCount: 390,
    address: "Koh Kood, Thailand",
    featured: false,
  },
  {
    name: "The Silo Hotel",
    slug: "the-silo-hotel-cape-town",
    destinationSlug: "cape-town",
    description: "A grain-silo turned luxury hotel above the V&A Waterfront.",
    longDescription:
      "The Silo transforms a historic grain silo into a work of architectural art, with pillowed glass windows framing Table Bay. It crowns the Zeitz MOCAA museum and boasts one of Cape Town's finest rooftop pools.",
    starRating: 5,
    pricePerNight: 690,
    originalPrice: 850,
    images: [img("1576485290814-1c72aa4bbb8e"), img("1568874185730-c4dfca1bc52e"), img("1517398741578-87bec719c79f")],
    amenities: ["Rooftop pool", "Art museum", "Spa", "Fine dining", "Bay views", "Gym", "Library", "Concierge"],
    roomTypes: [
      { name: "Deluxe Room", description: "Spacious room with bay views.", maxGuests: 2, priceModifier: 0 },
      { name: "Silhouette Suite", description: "Corner suite with 5m glass windows.", maxGuests: 3, priceModifier: 350 },
      { name: "Royal Suite", description: "Two-bedroom suite with butler.", maxGuests: 4, priceModifier: 1300 },
    ],
    rating: 4.9,
    reviewCount: 620,
    address: "V&A Waterfront, Cape Town",
    featured: true,
  },
  {
    name: "Pera Palace Hotel",
    slug: "pera-palace-istanbul",
    destinationSlug: "istanbul",
    description: "Orient Express-era grand hotel where Atatürk once stayed.",
    longDescription:
      "Built in 1892 for Orient Express passengers, the Pera Palace exudes Belle Époque glamour. Crystal chandeliers, the Kubbeli Saloon and the room where Atatürk stayed make it a living museum of Istanbul history.",
    starRating: 5,
    pricePerNight: 420,
    originalPrice: 520,
    images: [img("1524231757912-21f4fe3a7200"), img("1541432901042-2d8bd64b4ed9"), img("1604941909643-7d51b3a3a3b4")],
    amenities: ["Historic", "Orient Express bar", "Spa", "Pool", "Fine dining", "Museum room", "Bosphorus access", "Concierge"],
    roomTypes: [
      { name: "Deluxe Room", description: "Classic elegance with city view.", maxGuests: 2, priceModifier: 0 },
      { name: "Pera Suite", description: "Suite with separate living area.", maxGuests: 3, priceModifier: 200 },
      { name: "Atatürk Suite", description: "Historic suite with artifacts.", maxGuests: 4, priceModifier: 800 },
    ],
    rating: 4.8,
    reviewCount: 980,
    address: "Tepebaşı, Istanbul",
    featured: false,
  },
  {
    name: "Le Bristol Paris",
    slug: "le-bristol-paris",
    destinationSlug: "paris",
    description: "A palace hotel of timeless elegance on Rue du Faubourg Saint-Honoré.",
    longDescription:
      "Le Bristol Paris is the epitome of French art de vivre — a 1925 palace with a triple-Michelin-starred restaurant, a serene garden, and the city's most covetable rooftop pool. Impeccable service defines every moment.",
    starRating: 5,
    pricePerNight: 1100,
    originalPrice: 1380,
    images: [img("1502602898657-3e91760cbb34"), img("1499856871958-5b9627545d1a"), img("1501739022-8f1eeec3c9c0")],
    amenities: ["3-Michelin dining", "Garden", "Rooftop pool", "Spa", "Cat resident (Fa-raon)", "Butler", "Antique décor", "Concierge"],
    roomTypes: [
      { name: "Classic Room", description: "Parisian elegance with garden or city view.", maxGuests: 2, priceModifier: 0 },
      { name: "Deluxe Suite", description: "Suite with separate lounge.", maxGuests: 3, priceModifier: 600 },
      { name: "Panoramic Suite", description: "Top-floor suite with Eiffel Tower view.", maxGuests: 4, priceModifier: 1500 },
    ],
    rating: 4.9,
    reviewCount: 1320,
    address: "112 Rue du Faubourg Saint-Honoré, Paris",
    featured: true,
  },
];

const reviewTemplates = [
  { rating: 5, title: "Absolutely unforgettable", comment: "From start to finish this exceeded every expectation. Our guide was knowledgeable, the experience was seamless, and the memories will last a lifetime. Worth every penny." },
  { rating: 5, title: "Pure magic", comment: "We booked this for our anniversary and it could not have been more perfect. The attention to detail, the views, the service — all world class. Already planning to return." },
  { rating: 5, title: "Best decision of our trip", comment: "So glad we booked this. Everything ran like clockwork and the experience itself was breathtaking. Highly recommend to anyone visiting." },
  { rating: 4, title: "Wonderful with minor hiccups", comment: "Overall a fantastic experience. Slight delay at pickup but the actual tour more than made up for it. Would still book again in a heartbeat." },
  { rating: 5, title: "Worth every cent", comment: "Premium price but premium experience. The small group size made it feel intimate and our guide tailored everything to our interests. Five stars." },
  { rating: 5, title: "A dream come true", comment: "I've traveled extensively and this ranks among the best experiences I've ever had. The staff went above and beyond. Book without hesitation." },
];

const reviewers = [
  "Sophie Laurent", "James Whitfield", "Aiko Tanaka", "Marco Rossi", "Elena Petrova",
  "David Chen", "Priya Sharma", "Oliver Bennett", "Yuki Sato", "Camille Dubois",
  "Rashid Al-Mansouri", "Anna Kowalski", "Liam O'Connor", "Mei Lin", "Carlos Mendez",
  "Hannah Schmidt", "Fatima Al-Zahra", "Lucas Müller", "Isabella Costa", "Noah Anderson",
];

const coupons = [
  { code: "WELCOME10", description: "10% off your first booking", discountType: "PERCENT", discountValue: 10, minSpend: 0, maxDiscount: 100, usageLimit: 10000, active: true },
  { code: "LUXE25", description: "$25 off bookings over $200", discountType: "FIXED", discountValue: 25, minSpend: 200, maxDiscount: null, usageLimit: 5000, active: true },
  { code: "HONEYMOON15", description: "15% off for couples escapes", discountType: "PERCENT", discountValue: 15, minSpend: 300, maxDiscount: 250, usageLimit: 2000, active: true },
  { code: "FAMILY50", description: "$50 off family experiences over $400", discountType: "FIXED", discountValue: 50, minSpend: 400, maxDiscount: null, usageLimit: 3000, active: true },
  { code: "EARLYBIRD20", description: "20% off when you book 30+ days ahead", discountType: "PERCENT", discountValue: 20, minSpend: 150, maxDiscount: 300, usageLimit: 4000, active: true },
];

async function main() {
  console.log("🌱 Seeding Wanderlust database...");

  // Clean
  await db.wishlist.deleteMany();
  await db.review.deleteMany();
  await db.booking.deleteMany();
  await db.experience.deleteMany();
  await db.hotel.deleteMany();
  await db.destination.deleteMany();
  await db.coupon.deleteMany();

  // Destinations
  const destMap = new Map<string, string>();
  for (const d of destinations) {
    const created = await db.destination.create({ data: d });
    destMap.set(d.slug, created.id);
    console.log(`  ✓ Destination: ${d.name}`);
  }

  // Experiences
  let expCount = 0;
  for (const e of experiences) {
    const destId = destMap.get(e.destinationSlug);
    if (!destId) continue;
    const { destinationSlug, ...data } = e;
    // Infer cancellation type: attractions (park tickets) & transfers = STRICT (no refund),
    // cruises & activities = MODERATE (48h), tours & adventures = FLEXIBLE (24h).
    const cancellationType =
      data.type === "ATTRACTION" || data.type === "TRANSFER" ? "STRICT"
      : data.type === "CRUISE" || data.type === "ACTIVITY" ? "MODERATE"
      : "FLEXIBLE";
    const cancellationPolicy =
      cancellationType === "STRICT"
        ? "Non-refundable. This experience cannot be cancelled, amended or refunded."
        : cancellationType === "MODERATE"
        ? "Free cancellation up to 48 hours before the experience. Within 48 hours, non-refundable."
        : "Free cancellation up to 24 hours before the experience. Within 24 hours, non-refundable.";
    await db.experience.create({
      data: {
        ...data,
        destinationId: destId,
        cancellationType,
        cancellationPolicy,
        images: JSON.stringify(data.images),
        highlights: JSON.stringify(data.highlights),
        itinerary: JSON.stringify(data.itinerary),
        includes: JSON.stringify(data.includes),
        excludes: JSON.stringify(data.excludes),
        tags: JSON.stringify(data.tags),
      },
    });
    expCount++;
  }
  console.log(`  ✓ ${expCount} experiences seeded`);

  // Hotels
  let hotelCount = 0;
  for (const h of hotels) {
    const destId = destMap.get(h.destinationSlug);
    if (!destId) continue;
    const { destinationSlug, ...data } = h;
    await db.hotel.create({
      data: {
        ...data,
        destinationId: destId,
        images: JSON.stringify(data.images),
        amenities: JSON.stringify(data.amenities),
        roomTypes: JSON.stringify(data.roomTypes),
      },
    });
    hotelCount++;
  }
  console.log(`  ✓ ${hotelCount} hotels seeded`);

  // Reviews — distribute across experiences and hotels
  const allExperiences = await db.experience.findMany();
  const allHotels = await db.hotel.findMany();
  let reviewCount = 0;
  for (let i = 0; i < 42; i++) {
    const tpl = reviewTemplates[i % reviewTemplates.length];
    const reviewer = reviewers[i % reviewers.length];
    const target = i % 3 === 0 ? "hotel" : "experience";
    if (target === "hotel" && allHotels.length) {
      const hotel = allHotels[i % allHotels.length];
      await db.review.create({
        data: {
          hotelId: hotel.id,
          authorName: reviewer,
          rating: tpl.rating,
          title: tpl.title,
          comment: tpl.comment,
          travelDate: "2024",
          helpful: Math.floor(Math.random() * 50),
        },
      });
    } else if (allExperiences.length) {
      const exp = allExperiences[i % allExperiences.length];
      await db.review.create({
        data: {
          experienceId: exp.id,
          authorName: reviewer,
          rating: tpl.rating,
          title: tpl.title,
          comment: tpl.comment,
          travelDate: "2024",
          helpful: Math.floor(Math.random() * 50),
        },
      });
    }
    reviewCount++;
  }
  console.log(`  ✓ ${reviewCount} reviews seeded`);

  // Update review counts & ratings
  for (const exp of allExperiences) {
    const reviews = await db.review.findMany({ where: { experienceId: exp.id } });
    if (reviews.length) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await db.experience.update({ where: { id: exp.id }, data: { reviewCount: exp.reviewCount + reviews.length, rating: Math.round(((avg + exp.rating) / 2) * 10) / 10 } });
    }
  }
  for (const hotel of allHotels) {
    const reviews = await db.review.findMany({ where: { hotelId: hotel.id } });
    if (reviews.length) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await db.hotel.update({ where: { id: hotel.id }, data: { reviewCount: hotel.reviewCount + reviews.length, rating: Math.round(((avg + hotel.rating) / 2) * 10) / 10 } });
    }
  }

  // Coupons
  for (const c of coupons) {
    await db.coupon.create({
      data: {
        ...c,
        validTo: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
        maxDiscount: c.maxDiscount,
      },
    });
  }
  console.log(`  ✓ ${coupons.length} coupons seeded`);

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
