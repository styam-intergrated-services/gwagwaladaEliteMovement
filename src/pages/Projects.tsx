import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import { MapPin, Calendar, Banknote } from "lucide-react";

const wardOptions = ["All", "Gwagwalada Center", "Paiko", "Ibwa", "Zuba", "Kutunku"];
const statusOptions = ["All", "Planning", "In Progress", "Completed"];
const badgeOptions = ["All", "GEM Grassroots", "Area Council Municipal", "Joint Initiative"];

interface Project {
  id: string;
  title: string;
  description: string;
  ward: string;
  entity_badge: string;
  status: string;
  budget_approved: number;
  budget_spent: number;
  start_date: string | null;
  target_completion_date: string | null;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [ward, setWard] = useState("All");
  const [status, setStatus] = useState("All");
  const [badge, setBadge] = useState("All");

  useEffect(() => {
    fetchProjects();
  }, [ward, status, badge]);

  const fetchProjects = async () => {
    setLoading(true);
    let query = supabase.from("projects").select("*").order("created_at", { ascending: false });

    if (ward !== "All") query = query.eq("ward", ward as any);
    if (status !== "All") query = query.eq("status", status as any);
    if (badge !== "All") query = query.eq("entity_badge", badge as any);

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching projects:", error);
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const getBadgeVariant = (badge: string) => {
    if (badge === "GEM Grassroots") return "default";
    if (badge === "Area Council Municipal") return "secondary";
    return "outline";
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Project Transparency</h1>
            <p className="text-muted-foreground">Track community projects across Gwagwalada.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={ward} onValueChange={setWard}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ward" />
              </SelectTrigger>
              <SelectContent>
                {wardOptions.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={badge} onValueChange={setBadge}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Entity" />
              </SelectTrigger>
              <SelectContent>
                {badgeOptions.map((b) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center">
            <CardTitle className="text-xl mb-2">No projects found</CardTitle>
            <p className="text-muted-foreground">Try changing the filters or check back later.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = project.budget_approved > 0
                ? Math.min(100, Math.round((Number(project.budget_spent) / Number(project.budget_approved)) * 100))
                : 0;

              return (
                <Card key={project.id} className="hover:shadow-soft transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-tight">{project.title}</CardTitle>
                      <Badge variant={getBadgeVariant(project.entity_badge) as any}>{project.entity_badge}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-4 h-4" />
                      {project.ward}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Budget spent</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Banknote className="w-3 h-3" />
                        ₦{Number(project.budget_spent).toLocaleString()} / ₦{Number(project.budget_approved).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={project.status === "Completed" ? "default" : "outline"}>{project.status}</Badge>
                      {project.target_completion_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(project.target_completion_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <Link to={`/projects/${project.id}`}>
                      <Button variant="outline" className="w-full mt-2">View details</Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
