import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallAppButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showLabel?: boolean;
}

/**
 * Offers "install as app" when the browser reports GEM is installable.
 * Hidden when already installed, or on browsers without the install prompt.
 */
const InstallAppButton = ({
  className,
  variant = "outline",
  size = "sm",
  showLabel = true,
}: InstallAppButtonProps) => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const alreadyInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (alreadyInstalled) {
      setInstalled(true);
      return;
    }

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  if (installed || !promptEvent) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleInstall}
      className={cn("gap-2", className)}
      aria-label="Install GEM as an app"
    >
      <Download className="h-4 w-4" />
      {showLabel && "Install app"}
    </Button>
  );
};

export default InstallAppButton;
