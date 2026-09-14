import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Users, Camera, Heart, Share2, UserPlus } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Camera,
      title: "Share Moments",
      description: "Capture and share your daily life in Gwagwalada with beautiful photos and videos.",
      gradient: "gradient-primary"
    },
    {
      icon: Users,
      title: "Connect Locally",
      description: "Find friends, neighbors, and community members in Gwagwalada and surrounding areas.",
      gradient: "gradient-secondary"
    },
    {
      icon: MessageCircle,
      title: "Real-time Chat",
      description: "Stay connected with instant messaging, group chats, and community discussions.",
      gradient: "gradient-gold"
    },
    {
      icon: Heart,
      title: "Like & Comment",
      description: "Engage with posts through likes, comments, and reactions to build stronger connections.",
      gradient: "gradient-primary"
    },
    {
      icon: Share2,
      title: "Share Stories",
      description: "Share your experiences, events, and moments that matter to your community.",
      gradient: "gradient-secondary"
    },
    {
      icon: UserPlus,
      title: "Build Network",
      description: "Grow your social circle by connecting with people who share your interests and location.",
      gradient: "gradient-gold"
    }
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="text-gradient"> Connect</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            GEM brings people together with powerful social features designed for building authentic local connections.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="shadow-soft hover:shadow-glow transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm group hover:scale-105">
              <CardContent className="p-8">
                <div className={`w-14 h-14 ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
