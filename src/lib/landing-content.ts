export type RedditAttestation = {
  url: string;
  title: string;
  topic: "forex" | "payments" | "banking" | "remittance";
};

/** Real r/Malawi posts linked from reddittweets.md */
export const REDDIT_ATTESTATIONS: RedditAttestation[] = [
  {
    url: "https://www.reddit.com/r/Malawi/comments/1uexxpc/forex_exchange/",
    title: "Forex Exchange",
    topic: "forex",
  },
  {
    url: "https://www.reddit.com/r/Malawi/comments/1rq0qf3/bringing_dollars_into_malawi/",
    title: "Bringing Dollars into Malawi",
    topic: "remittance",
  },
  {
    url: "https://www.reddit.com/r/Malawi/comments/1ukfeg2/experience_with_nbm_on_forex_application/",
    title: "Experience with NBM on forex application",
    topic: "banking",
  },
 
  // {
  //   url: "https://www.reddit.com/r/Malawi/s/wLujzBR3Gq",
  //   title: "r/Malawi discussion on forex access",
  //   topic: "forex",
  // },
  // {
  //   url: "https://www.reddit.com/r/Malawi/s/GgC0my1CnW",
  //   title: "r/Malawi discussion on dollar shortage",
  //   topic: "forex",
  // },
  // {
  //   url: "https://www.reddit.com/r/Malawi/s/086qUJu245",
  //   title: "r/Malawi discussion on paying for global services",
  //   topic: "payments",
  // },
  // {
  //   url: "https://www.reddit.com/r/Malawi/s/VQ2l6FPVC1",
  //   title: "r/Malawi discussion on international payments",
  //   topic: "payments",
  // },
  // {
  //   url: "https://www.reddit.com/r/Malawi/s/aNLJnXgImc",
  //   title: "r/Malawi discussion on foreign currency",
  //   topic: "forex",
  // },
  // {
  //   url: "https://www.reddit.com/r/Malawi/s/4omgCIiKBG",
  //   title: "r/Malawi discussion on foreign currency",
  //   topic: "payments",
  // }
];

export const PROBLEM_POINTS = [
  {
    title: "Can't pay for global services",
    body: "Netflix, Spotify, Steam, and app stores expect a foreign card or USD. Most Malawians only have Malawian Kwacha on mobile money.",
  },
  {
    title: "Forex is scarce and expensive",
    body: "Official rates sit near MK 1,700 per dollar while the parallel market can exceed MK 4,000, if you can find dollars at all.",
  },
  {
    title: "Hard to receive USD earnings",
    body: "Freelancers and remote workers paid on Fiverr, Upwork, PayPal, or Deel have no simple way to land those dollars in Malawi.",
  },
  {
    title: "Converting to Kwacha is slow",
    body: "Even when USD arrives, turning it into usable MWK through banks can take weeks, with uncertain rates and outcomes.",
  },
];

/** The two distinct things Zotheka does */
export const TWO_PILLARS = [
  {
    id: "spend",
    label: "For consumers",
    title: "Buy global services with Malawian Kwacha",
    summary:
      "Pay for Netflix, Spotify, Steam, and more using the money you already have: MWK via Airtel Money or TNM Mpamba.",
    steps: [
      "Choose a gift card for the service you want",
      "Pay in MWK from your mobile money number",
      "Receive your code instantly, then redeem and start streaming, gaming, or shopping",
    ],
    examples: ["Netflix", "Spotify", "Google Play", "Amazon", "Steam"],
  },
  {
    id: "earn",
    label: "For freelancers & remote workers",
    title: "Receive US dollars, withdraw Malawian Kwacha",
    summary:
      "Get paid in USD from platforms like Fiverr, Upwork, PayPal, or Deel into your Zotheka wallet, then cash out to MWK on mobile money.",
    steps: [
      "Add your Zotheka USD deposit details to Fiverr, Upwork, or your client",
      "USD lands in your Zotheka balance when the platform pays out",
      "Withdraw to Airtel Money or TNM Mpamba at a clear MWK rate",
    ],
    examples: ["Fiverr", "Upwork", "PayPal", "Deel", "Client invoices"],
  },
] as const;

export const ABOUT_SECTIONS = [
  {
    heading: "What is Zotheka?",
    body:
      "Zotheka is a Malawi-focused payments app with two jobs: help you spend Malawian Kwacha on global digital services, and help you receive US dollars from abroad and convert them to Kwacha you can actually use.",
  },
  {
    heading: "Spend: global services, local money",
    body:
      "Most international platforms want a foreign card or USD. Zotheka lets you pay in MWK through mobile money and receive gift cards for Netflix, Spotify, Google Play, and more, priced in Kwacha and delivered in minutes.",
  },
  {
    heading: "Earn: USD in, Kwacha out",
    body:
      "If you freelance on Fiverr, contract on Upwork, or get paid via PayPal, you need somewhere to receive those dollars. Zotheka gives you USD deposit details, holds your balance in the app, and lets you withdraw to Airtel Money or TNM Mpamba when you need MWK.",
  },
  {
    heading: "One wallet, two directions",
    body:
      "Consumers and freelancers use the same Zotheka account. Behind the scenes, value moves through trusted payment rails and stablecoin settlement on Base, but you never have to buy or manage crypto yourself.",
  },
  {
    heading: "Built for Malawi",
    body:
      "Zotheka is designed around how Malawians actually move money: mobile money in, mobile money out, transparent rates, and support for the services people already use every day.",
  },
  {
    heading: "Get in touch",
    body: "Questions about orders, withdrawals, or your account? Email support@zotheka.com.",
  },
];
