import Link from "next/link";
import { CalendarDays, ListChecks, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/today", label: "今日", icon: CalendarDays },
  { href: "/habits", label: "習慣", icon: ListChecks },
  { href: "/stats", label: "統計", icon: BarChart3 },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 pb-24">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-around max-w-3xl mx-auto h-16">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 px-6 py-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
