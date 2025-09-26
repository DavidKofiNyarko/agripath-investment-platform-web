import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your AgriPath account to access your agricultural investment dashboard and manage your farming projects.",
};

export default function SignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
