import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const GA_MEASUREMENT_ID = "G-7HZMM7K4JZ";

export const metadata: Metadata = {
  title: "Zotheka | Pay globally from Malawi",
  description:
    "Zotheka lets Malawians pay for global services with mobile money, and lets freelancers receive USD and withdraw to MWK.",
  openGraph: {
    title: "Zotheka | Pay globally from Malawi",
    description:
      "Mobile money to Netflix, Spotify & more. USD earnings to MWK withdrawals.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
