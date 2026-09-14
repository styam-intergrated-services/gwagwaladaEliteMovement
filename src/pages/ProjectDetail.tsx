import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import { ArrowLeft, Camera, CheckCircle, MapPin, Calendar, Banknote, User, Phone } from "lucide-react";
import { useSignedUrls } from "@/lib/storage";

interface Project {
  id: string;
  title: string;
  description: string;
  ward: string;
  entity_badge: string;
  status: string;
  budget_approved: number;
  budget_spent: number;
  contractor_name: string;
  contractor_contact: string;
  start_date: string | null;
  target_completion_date: string | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  target_date: string | null;
  completed_at: string | null;
}

interface ProjectPhoto {
  id: string;
  photo_url: string;
  caption: string;
  submitted_at: string;
  verified: boolean;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isModerator } = useRole();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const photoUrls = useSignedUrls("project-photos", photos.map((p) => p.photo_url));

  useEffect(() => {
    if (!id) return;
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    setLoading(true);
    const [{ data: projectData }, { data: milestonesData }, { data: photosData }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("project_milestones").select("*").eq("project_id", id).order("target_date", { ascending: true }),
      supabase.from("project_photos").select("*").eq("project_id", id).order("submitted_at", { ascending: false }),
    ]);

    setProject(projectData || null);
    setMilestones(milestonesData || []);
    setPhotos(photosData || []);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id || !selectedFile) return;

    setUploading(true);
    const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(fileName, selectedFile);

    if (uploadError) {
      toast({ variant: "destructive", title: "Upload failed", description: uploadError.message });
      setUploading(false);
      return;
    }

    const { error: insertError } = await supabase.from("project_photos").insert({
      project_id: id,
      uploaded_by: user.id,
      photo_url: fileName,
      caption,
    });

    setUploading(false);
    if (insertError) {
      toast({ variant: "destructive", title: "Could not save photo", description: insertError.message });
    } else {
      toast({ title: "Photo submitted", description: "It will appear after moderator verification." });
      setCaption("");
      setSelectedFile(null);
      setUploadOpen(false);
      fetchProject();
    }
  };

  const verifyPhoto = async (photoId: string, verified: boolean) => {
    const { error } = await supabase.from("project_photos").update({ verified }).eq("id", photoId);
    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    } else {
      toast({ title: verified ? "Photo verified" : "Photo unverified" });
      fetchProject();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 pt-28 pb-16">
          <Skeleton className="h-96 rounded-xl" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 pt-28 pb-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Button onClick={() => navigate('/projects')}>Back to projects</Button>
        </main>
      </div>
    );
  }

  const progress = project.budget_approved > 0
    ? Math.min(100, Math.round((Number(project.budget_spent) / Number(project.budget_approved)) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate('/projects')}>
          <ArrowLeft className="w-4 h-4" /> Back to projects
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl">{project.title}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                      <MapPin className="w-4 h-4" /> {project.ward}
                    </div>
                  </div>
                  <Badge variant="default">{project.entity_badge}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground leading-relaxed">{project.description}</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Target completion</div>
                      <div className="font-medium">
                        {project.target_completion_date
                          ? new Date(project.target_completion_date).toLocaleDateString()
                          : "Not set"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                    <Banknote className="w-5 h-5 text-primary" />
                    <div>
                      <div className="text-sm text-muted-foreground">Budget</div>
                      <div className="font-medium">
                        ₦{Number(project.budget_approved).toLocaleString()} approved
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Budget utilization</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    ₦{Number(project.budget_spent).toLocaleString()} spent of ₦{Number(project.budget_approved).toLocaleString()} approved
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Milestone timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {milestones.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No milestones recorded yet.</p>
                ) : (
                  <div className="space-y-6">
                    {milestones.map((m) => (
                      <div key={m.id} className="relative pl-8 border-l-2 border-primary/30">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary" />
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-medium">{m.title}</h4>
                            <p className="text-sm text-muted-foreground">{m.description}</p>
                          </div>
                          {m.completed_at && <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
                        </div>
                        {m.target_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Target: {new Date(m.target_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Contractor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{project.contractor_name || "Not disclosed"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{project.contractor_contact || "Not disclosed"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Eye on the Ground</CardTitle>
                {user && (
                  <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="gap-2">
                        <Camera className="w-4 h-4" /> Submit photo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Submit a site photo</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpload} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="photo">Photo</Label>
                          <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="caption">Caption</Label>
                          <Textarea
                            id="caption"
                            placeholder="What does this photo show?"
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={uploading || !selectedFile}>
                          {uploading ? "Uploading..." : "Submit for verification"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {photos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No photos submitted yet.</p>
                ) : (
                  <div className="grid gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="space-y-2">
                        {photoUrls[photo.photo_url] ? (
                          <img
                            src={photoUrls[photo.photo_url]}
                            alt={photo.caption || "Project photo"}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-48 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                            <Camera className="w-8 h-8" />
                          </div>
                        )}
                        <p className="text-sm">{photo.caption}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant={photo.verified ? "default" : "outline"}>
                            {photo.verified ? "Verified" : "Pending verification"}
                          </Badge>
                          {isModerator && (
                            <Button
                              size="sm"
                              variant={photo.verified ? "outline" : "default"}
                              onClick={() => verifyPhoto(photo.id, !photo.verified)}
                            >
                              {photo.verified ? "Unverify" : "Verify"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
