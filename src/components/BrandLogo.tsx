import gemLogo from "@/assets/gem-logo.jpg.asset.json";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
}

/**
 * GEM crest. The artwork ships on a white field, so it sits inside a light
 * plate to stay legible in both light and dark mode.
 */
const BrandLogo = ({ className, imageClassName }: BrandLogoProps) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-lg bg-white p-1 shadow-soft ring-1 ring-border",
      className
    )}
  >
    <img
      src={gemLogo.url}
      alt="GEM — Gwagwalada Elite Movement crest"
      className={cn("h-8 w-auto object-contain", imageClassName)}
      loading="eager"
      decoding="async"
    />
  </span>
);

export default BrandLogo;
