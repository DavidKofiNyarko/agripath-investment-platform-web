import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Portfolio",
  description: "Track your agricultural investment portfolio with AgriPath. Monitor returns, view project performance, and manage your farming investments in one place.",
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
