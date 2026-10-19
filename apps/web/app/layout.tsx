import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "lenis/dist/lenis.css";
import { AbiLoader } from "@/components/abi/abi-loader";
import { VadPrefetch } from "@/components/abi/vad-prefetch";
import { Nudges } from "@/components/abi/nudges";
import { CommandPalette } from "@/components/site/command-palette";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { MotionObserver } from "@/components/site/motion-observer";
import { OrbNav } from "@/components/site/orb-nav";
import { PowerBoot } from "@/components/power/power-boot";
import { SmoothScroll } from "@/components/site/smooth-scroll";
import { ThemeProvider } from "@/components/theme-provider";
import { profile, seo } from "@/lib/content";
import { jsonLd as ld } from "@/lib/seo";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

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
  applicationName: seo.siteName,
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
    { media: "(prefers-color-scheme: light)", color: "#fcf9f4" },
    { media: "(prefers-color-scheme: dark)", color: "#040202" },
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
      className={`${jakarta.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full">
        {/* Calm mode (ABI's "reduce motion") applies before the first paint on every page. */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("abi-calm")==="on")document.documentElement.dataset.calm="on"}catch(e){}` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={ld(jsonLd)}
        />
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only z-[90] rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            Skip to content
          </a>
          <Header />
          <main id="main" className="relative overflow-x-clip">
            {children}
          </main>
          <Footer />
          <OrbNav />
          <CommandPalette />
          <Nudges />
          <AbiLoader />
          <VadPrefetch />
          <SmoothScroll />
          <MotionObserver />
          <PowerBoot />
        </ThemeProvider>
      </body>
    </html>
  );
}
