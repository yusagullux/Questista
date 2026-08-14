import { noindex } from "@/lib/seo";

export const metadata = noindex;

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}