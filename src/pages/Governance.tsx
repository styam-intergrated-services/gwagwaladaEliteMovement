import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import { User, Award, Quote } from "lucide-react";
import { useSignedUrls } from "@/lib/storage";

interface Leader {
  id: string;
  name: string;
  role_title: string;
  photo_url: string | null;
  bio: string | null;
  display_order: number;
}

export default function Governance() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const photoUrls = useSignedUrls("leadership-photos", leaders.map((l) => l.photo_url || ""));

  useEffect(() => {
    fetchLeaders();
  }, []);

  const fetchLeaders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leadership")
      .select("*")
      .order("display_order", { ascending: true });
    setLeaders(data || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Leadership & Governance</h1>
          <p className="text-muted-foreground">Meet the people working for transparency and youth empowerment.</p>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Leadership Showcase
          </h2>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
            </div>
          ) : leaders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                Leadership profiles will appear here soon.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaders.map((leader) => (
                <Card key={leader.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {leader.photo_url && photoUrls[leader.photo_url] ? (
                      <img src={photoUrls[leader.photo_url]} alt={leader.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-20 h-20 text-muted-foreground" />
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{leader.name}</CardTitle>
                    <div className="text-sm text-primary font-medium">{leader.role_title}</div>
                  </CardHeader>
                  {leader.bio && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{leader.bio}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Quote className="w-5 h-5 text-primary" />
            Governance Principles
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-lg font-bold mb-2">Transparency</div>
                <p className="text-sm text-muted-foreground">Every project, revenue entry, and document is published for public review.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-lg font-bold mb-2">Digitisation</div>
                <p className="text-sm text-muted-foreground">Community processes move online so progress is trackable in real time.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-lg font-bold mb-2">Accountability</div>
                <p className="text-sm text-muted-foreground">Residents can report concerns, follow up, and hold leadership accountable.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
