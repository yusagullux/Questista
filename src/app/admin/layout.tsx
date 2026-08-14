import { noindex } from "@/lib/seo";

export const metadata = noindex;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}