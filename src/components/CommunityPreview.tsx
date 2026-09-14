
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, ArrowRight } from "lucide-react";

const CommunityPreview = () => {
  const communities = [
    {
      name: "Mindful Entrepreneurs",
      description: "Building businesses with intention and purpose",
      members: 2341,
      posts: 156,
      color: "gradient-primary",
      avatar: "ME"
    },
    {
      name: "Creative Souls",
      description: "Artists, writers, and creators supporting each other's journey",
      members: 1876,
      posts: 203,
      color: "gradient-secondary",
      avatar: "CS"
    },
    {
      name: "Wellness Warriors",
      description: "Holistic health and wellness transformation stories",
      members: 3012,
      posts: 298,
      color: "bg-accent",
      avatar: "WW"
    }
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Join Thriving
            <span className="text-gradient"> Communities</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Connect with like-minded individuals who share your passions and are committed to growth and authentic living.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {communities.map((community, index) => (
            <Card key={index} className="shadow-soft hover:shadow-glow transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm group hover:scale-105">
              <CardHeader className="pb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${community.color} rounded-xl flex items-center justify-center text-white font-bold`}>
                    {community.avatar}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{community.name}</h3>
                    <p className="text-muted-foreground text-sm">{community.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {community.members.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageCircle className="w-4 h-4" />
                    {community.posts}
                  </div>
                </div>
                <Button variant="outline" className="w-full group">
                  Join Community
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" className="gradient-primary text-white px-8 py-6 text-lg">
            Explore All Communities
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;
