import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navigation from "@/components/Navigation";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ServiceRequest {
  id: string;
  requester_id: string | null;
  request_type: string;
  ward: string | null;
  description: string;
  contact_info: string | null;
  is_anonymous: boolean;
  status: string;
  submitted_at: string;
}

export default function AdminServices() {
  const { isAdmin, isModerator, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roleLoading) return;
    if (!isAdmin && !isModerator) {
      navigate("/services");
      return;
    }
    fetchRequests();
  }, [isAdmin, isModerator, roleLoading]);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("service_requests")
      .select("*")
      .order("submitted_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("service_requests")
      .update({ status: status as any })
      .eq("id", id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Status updated" });
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 pt-28 pb-16">
          <Skeleton className="h-8 w-64 mb-8" />
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 mb-4" />)}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <h1 className="text-3xl font-bold mb-8">Service Request Admin</h1>

        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 mb-4" />)
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No service requests yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <Card key={req.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div>
                      <div className="font-semibold">{req.request_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {req.is_anonymous ? "Anonymous" : req.requester_id ? "Registered user" : "Public user"} • {new Date(req.submitted_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant={req.status === "Resolved" ? "default" : req.status === "In Review" ? "secondary" : "outline"}>
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-sm mb-4">{req.description}</p>
                  {req.ward && <div className="text-sm text-muted-foreground mb-2">Ward: {req.ward}</div>}
                  {req.contact_info && <div className="text-sm text-muted-foreground mb-4">Contact: {req.contact_info}</div>}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Update status:</span>
                    <Select value={req.status} onValueChange={(value) => updateStatus(req.id, value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="In Review">In Review</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
