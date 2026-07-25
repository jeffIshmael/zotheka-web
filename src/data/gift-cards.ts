export type GiftCard = {
  id: string;
  name: string;
  subtitle: string;
  usdAmount: number;
  accent: string;
  badge?: string;
  logoUrl?: string;
  isOutOfStock?: boolean;
};

export const GIFT_CARDS: GiftCard[] = [
  {
    id: "netflix-us",
    name: "Netflix",
    subtitle: "USD gift card · redeem at netflix.com/redeem",
    usdAmount: 15,
    accent: "#E50914",
    badge: "Popular",
    logoUrl: "/images/netflix-black.jpg",
    isOutOfStock: true,
  },
  {
    id: "spotify-us",
    name: "Spotify",
    subtitle: "USD gift card · redeem at spotify.com/redeem",
    usdAmount: 10,
    accent: "#1DB954",
    isOutOfStock: true,
  },
  {
    id: "google-play-us",
    name: "Google Play",
    subtitle: "USD gift card · redeem at play.google.com/redeem",
    usdAmount: 10,
    accent: "#3bccff",
    isOutOfStock: true,
  },
  {
    id: "playstation-us",
    name: "PlayStation Store",
    subtitle: "USD gift card · redeem on PSN",
    usdAmount: 25,
    accent: "#003791",
    isOutOfStock: true,
  },
  {
    id: "amazon-us",
    name: "Amazon",
    subtitle: "USD gift card · redeem at amazon.com/redeem",
    usdAmount: 50,
    accent: "#FF9900",
    isOutOfStock: true,
  },
];
