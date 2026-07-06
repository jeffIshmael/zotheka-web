export type GiftCard = {
  id: string;
  name: string;
  subtitle: string;
  usdAmount: number;
  accent: string;
  badge?: string;
};

export const GIFT_CARDS: GiftCard[] = [
  {
    id: "netflix-us",
    name: "Netflix",
    subtitle: "USD gift card · redeem at netflix.com/redeem",
    usdAmount: 15,
    accent: "#E50914",
    badge: "Popular",
  },
];
