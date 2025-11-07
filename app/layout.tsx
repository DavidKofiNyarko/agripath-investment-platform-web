import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { PortfolioProvider } from "@/contexts/PortfolioContext";
import { TransactionsProvider } from "@/contexts/TransactionsContext";
import { ProjectsProvider } from "@/contexts/ProjectsContext";
import { UpdatesProvider } from "@/contexts/UpdatesContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

export const metadata: Metadata = {
  title: {
    default: "AgriPath - Smart Agricultural Investment Platform",
    template: "%s | AgriPath"
  },
  description: "Invest in sustainable agriculture with AgriPath. Access verified farming projects, track your investments, and earn returns while supporting Ghana's agricultural growth.",
  keywords: ["agriculture investment", "farming projects", "sustainable agriculture", "Ghana farming", "agricultural returns", "farm investment platform"],
  authors: [{ name: "AgriPath Team" }],
  creator: "AgriPath",
  publisher: "AgriPath",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://agripath.co",
    siteName: "AgriPath",
    title: "AgriPath - Smart Agricultural Investment Platform",
    description: "Invest in sustainable agriculture with AgriPath. Access verified farming projects, track your investments, and earn returns while supporting Ghana's agricultural growth.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "AgriPath - Agricultural Investment Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AgriPath - Smart Agricultural Investment Platform",
    description: "Invest in sustainable agriculture with AgriPath. Access verified farming projects and earn returns.",
    images: ["/logo.png"],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AgriPath",
    "description": "Smart Agricultural Investment Platform",
    "url": "https://agripath.co",
    "logo": "https://agripath.co/logo.png",
    "sameAs": [
      "https://twitter.com/agripath",
      "https://linkedin.com/company/agripath"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+233-XXX-XXXX",
      "contactType": "customer service",
      "areaServed": "GH",
      "availableLanguage": "English"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="antialiased" style={{ fontFamily: 'var(--font-sans)' }}>
        <UserProvider>
          <ProfileProvider>
            <NotificationProvider>
              <WalletProvider>
                <PortfolioProvider>
                  <TransactionsProvider>
                    <ProjectsProvider>
                      <UpdatesProvider>
                        {children}
                      </UpdatesProvider>
                    </ProjectsProvider>
                  </TransactionsProvider>
                </PortfolioProvider>
              </WalletProvider>
            </NotificationProvider>
          </ProfileProvider>
        </UserProvider>
      </body>
    </html>
  );
}
