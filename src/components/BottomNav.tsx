import { Link, useLocation } from "react-router-dom";
import {
  Home,
  LayoutGrid,
  HardHat,
  Store,
  MessageCircle,
  MoreHorizontal,
  ShieldCheck,
  Landmark,
  FileText,
  Users,
  UsersRound,
  User,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const primaryLinks = [
  { path: "/", label: "Feed", icon: Home },
  { path: "/posts", label: "Posts", icon: LayoutGrid },
  { path: "/projects", label: "Projects", icon: HardHat },
  { path: "/marketplace", label: "Market", icon: Store },
  { path: "/messages", label: "Chats", icon: MessageCircle },
];

const moreLinks = [
  { path: "/transparency", label: "Transparency", icon: ShieldCheck },
  { path: "/governance", label: "Governance", icon: Landmark },
  { path: "/services", label: "Services", icon: FileText },
  { path: "/friends", label: "Friends", icon: Users },
  { path: "/groups", label: "Groups", icon: UsersRound },
  { path: "/profile", label: "My Profile", icon: User },
];

const BottomNav = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);
          return (
            <Link
              key={link.path}
              to={link.path}
              aria-label={link.label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                active
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span
                className={`flex h-8 w-10 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-primary/10" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {link.label}
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="More pages"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex h-8 w-10 items-center justify-center rounded-full">
              <MoreHorizontal className="h-5 w-5" />
            </span>
            More
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <SheetHeader>
              <SheetTitle>More</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 py-4">
              {moreLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setOpen(false)}
                    className={`flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-xs transition-colors hover:border-primary/50 hover:text-primary ${
                      isActive(link.path) ? "border-primary text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default BottomNav;
