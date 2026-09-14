import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { Banknote, Users, CheckCircle, MapPin, FileText } from "lucide-react";

interface ImpactStats {
  totalRevenue: number;
  volunteerCount: number;
  wardCoverage: number;
  completedProjects: number;
}

interface RevenueLog {
  id: string;
  ward: string;
  amount: number;
  source: string;
  linked_project_id: string | null;
  recorded_at: string;
}

interface TransparencyDocument {
  id: string;
  title: string;
  document_type: string;
  file_url: string;
  published_at: string;
}

export default function Transparency() {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueLog[]>([]);
  const [documents, setDocuments] = useState<TransparencyDocument[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [
      { data: revenueData },
      { data: docsData },
      { count: projectCount },
      { count: completedCount },
      { data: allProjects },
      { count: volunteerCount },
    ] = await Promise.all([
      supabase.from("revenue_logs").select("*").order("recorded_at", { ascending: false }).limit(50),
      supabase.from("transparency_documents").select("*").order("published_at", { ascending: false }).limit(20),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "Completed"),
      supabase.from("projects").select("id, title"),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "volunteer"),
    ]);

    const totalRevenue = (revenueData || []).reduce((sum, r) => sum + Number(r.amount), 0);
    const uniqueWards = new Set((revenueData || []).map((r) => r.ward).filter(Boolean));
    const wardCoverage = uniqueWards.size > 0 ? Math.round((uniqueWards.size / 5) * 100) : 0;

    setStats({
      totalRevenue,
      volunteerCount: volunteerCount || 0,
      wardCoverage,
      completedProjects: completedCount || 0,
    });
    setRevenue(revenueData || []);
    setDocuments(docsData || []);
    setProjects(allProjects || []);
    setLoading(false);
  };

  const getProjectTitle = (id: string | null) => {
    if (!id) return null;
    return projects.find((p) => p.id === id)?.title || null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Revenue & Transparency Hub</h1>
          <p className="text-muted-foreground">Public visibility into revenue, spending, and governance documents.</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">₦{(stats?.totalRevenue || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Digitized revenue</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 gradient-secondary rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.volunteerCount}</div>
                  <div className="text-sm text-muted-foreground">Volunteers</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 gradient-gold rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.wardCoverage}%</div>
                  <div className="text-sm text-muted-foreground">Ward coverage</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.completedProjects}</div>
                  <div className="text-sm text-muted-foreground">Completed projects</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Tax-to-project visualizer</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64" />
              ) : revenue.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No revenue entries yet.</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {revenue.map((entry) => {
                    const projectTitle = getProjectTitle(entry.linked_project_id);
                    return (
                      <div key={entry.id} className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">₦{Number(entry.amount).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">{new Date(entry.recorded_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">{entry.source}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {entry.ward && <Badge variant="outline">{entry.ward}</Badge>}
                          {projectTitle && <Badge variant="default">{projectTitle}</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-64" />
              ) : documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No documents published yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                    >
                      <FileText className="w-5 h-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium truncate">{doc.title}</div>
                        <div className="text-xs text-muted-foreground">{doc.document_type} • {new Date(doc.published_at).toLocaleDateString()}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
