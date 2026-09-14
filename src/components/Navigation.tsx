import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import BrandLogo from "@/components/BrandLogo";
import InstallAppButton from "@/components/InstallAppButton";

const Navigation = () => {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Feed' },
    { path: '/posts', label: 'Posts' },
    { path: '/projects', label: 'Projects' },
    { path: '/transparency', label: 'Transparency' },
    { path: '/governance', label: 'Governance' },
    { path: '/services', label: 'Services' },
    { path: '/marketplace', label: 'Marketplace' },
    { path: '/friends', label: 'Friends' },
    { path: '/groups', label: 'Groups' },
    { path: '/messages', label: 'Messages' },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center" aria-label="GEM home">
            <BrandLogo imageClassName="h-9 w-auto" />
          </Link>

          {/* Desktop links */}
          <div className="hidden xl:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm transition-colors ${
                  isActive(link.path)
                    ? 'text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <InstallAppButton />
            <Button
              variant="ghost"
              size="sm"
              aria-label="Toggle dark mode"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {user ? (
              <>
                <NotificationsDropdown />
                <Link to="/profile">
                  <Avatar className="w-8 h-8 border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link to="/auth" className="hidden sm:block">
                  <Button size="sm" className="gradient-primary text-primary-foreground">
                    Join Now
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      </nav>
      <BottomNav />
    </>
  );
};

export default Navigation;
