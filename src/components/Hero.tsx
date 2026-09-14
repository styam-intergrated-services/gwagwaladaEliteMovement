import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";

const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 gradient-hero opacity-10" />

      {/* Floating elements */}
      <div className="absolute top-20 left-20 animate-float">
        <div className="w-16 h-16 gradient-primary rounded-full opacity-20 blur-xl" />
      </div>
      <div className="absolute top-40 right-32 animate-float" style={{ animationDelay: '1s' }}>
        <div className="w-12 h-12 gradient-secondary rounded-full opacity-20 blur-xl" />
      </div>
      <div className="absolute bottom-32 left-32 animate-float" style={{ animationDelay: '2s' }}>
        <div className="w-20 h-20 bg-accent/20 rounded-full blur-xl" />
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-8">
            <MapPin className="w-4 h-4" />
            Welcome to GEM
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <BrandLogo className="p-2 rounded-2xl" imageClassName="h-24 w-auto" />
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Gwagwalada Elite
            <br />
            <span className="text-gradient">Movement</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            Join the social network of the Gwagwalada Elite Movement. Share moments, build friendships, and grow your community — empowering youth, building legacy.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/auth">
              <Button size="lg" className="gradient-primary text-primary-foreground px-8 py-6 text-lg shadow-glow hover:shadow-soft transition-all duration-300 group">
                Join GEM
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/posts">
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg border-2 hover:bg-muted transition-all duration-300">
                Explore Posts
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">5K+</div>
                <div className="text-muted-foreground">Active Members</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 gradient-secondary rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">25K+</div>
                <div className="text-muted-foreground">Posts Shared</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <div className="text-2xl font-bold">Gwagwalada</div>
                <div className="text-muted-foreground">& Beyond</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
