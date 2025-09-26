import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Investments",
  description: "Explore verified agricultural investment opportunities in Ghana. Choose from crop farming, livestock, and fishery projects with competitive returns and transparent tracking.",
};

export default function InvestmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
