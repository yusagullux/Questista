import { noindex } from "@/lib/seo";

export const metadata = noindex;

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}