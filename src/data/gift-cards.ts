export type GiftCard = {
  id: string;
  name: string;
  subtitle: string;
  usdAmount: number;
  accent: string;
  badge?: string;
  logoUrl?: string;
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
  },
  {
    id: "spotify-us",
    name: "Spotify",
    subtitle: "USD gift card · redeem at spotify.com/redeem",
    usdAmount: 10,
    accent: "#1DB954",
  },
  {
    id: "playstation-us",
    name: "PlayStation Store",
    subtitle: "USD gift card · redeem on PSN",
    usdAmount: 25,
    accent: "#003791",
  },
  {
    id: "amazon-us",
    name: "Amazon",
    subtitle: "USD gift card · redeem at amazon.com/redeem",
    usdAmount: 50,
    accent: "#FF9900",
  },
];
