import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your AgriPath account settings, security preferences, and profile information. Update your KYC verification and transaction PIN.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
