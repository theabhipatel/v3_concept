import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { profile, seo } from "@/lib/content";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const home = seo.pages.home;

export const metadata: Metadata = {
  metadataBase: new URL(profile.site),
  title: { default: home.title, template: seo.titleTemplate },
  description: home.description,
  keywords: seo.keywords,
  authors: [{ name: profile.name, url: profile.site }],
  creator: `${profile.name} (${profile.brand})`,
  publisher: profile.brand,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: seo.siteName,
    url: profile.site,
    title: home.title,
    description: home.description,
  },
  twitter: {
    card: "summary_large_image",
    creator: seo.twitterHandle,
    site: seo.twitterHandle,
    title: home.title,
    description: home.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f8fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c17" },
  ],
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    alternateName: profile.brand,
    url: profile.site,
    image: profile.githubAvatar,
    jobTitle: profile.title,
    worksFor: { "@type": "Organization", name: profile.currentCompany },
    address: {
      "@type": "PostalAddress",
      addressLocality: profile.location.city,
      addressRegion: profile.location.region,
      addressCountry: profile.location.countryCode,
    },
    email: profile.email,
    sameAs: profile.socials.map((s) => s.url),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: seo.siteName,
    url: profile.site,
    description: home.description,
    author: { "@type": "Person", name: profile.name, alternateName: profile.brand },
  },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable} ${bricolage.variable} h-full`}
    >
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
