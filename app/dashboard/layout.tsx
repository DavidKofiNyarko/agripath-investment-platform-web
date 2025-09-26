import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage your agricultural investments with AgriPath dashboard. View your portfolio, track returns, and discover new farming projects to invest in.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
