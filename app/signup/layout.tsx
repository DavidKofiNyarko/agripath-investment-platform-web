import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Join AgriPath and start investing in sustainable agriculture. Create your account to access verified farming projects and earn competitive returns.",
};

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
