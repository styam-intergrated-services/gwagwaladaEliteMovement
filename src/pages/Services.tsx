import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Megaphone, HandHeart, ShieldCheck } from "lucide-react";

const wards = ["Gwagwalada Center", "Paiko", "Ibwa", "Zuba", "Kutunku"];

export default function Services() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requestType, setRequestType] = useState("Resident Assistance");
  const [ward, setWard] = useState("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("service_requests").insert({
      requester_id: user && !isAnonymous ? user.id : null,
      request_type: requestType as any,
      ward: (ward || null) as any,
      description,
      contact_info: isAnonymous ? "" : contactInfo,
      is_anonymous: isAnonymous,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Request submitted", description: "We will review and get back to you." });
    setDescription("");
    setContactInfo("");
    setWard("");
    setIsAnonymous(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Community Services</h1>
          <p className="text-muted-foreground">Request help, volunteer, or report a concern.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center shrink-0">
                  <HandHeart className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Resident Assistance</div>
                  <p className="text-sm text-muted-foreground">Get help with community issues or local services.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 gradient-secondary rounded-full flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Volunteer Onboarding</div>
                  <p className="text-sm text-muted-foreground">Join a project team and contribute your skills.</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-10 h-10 gradient-gold rounded-full flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <div className="font-semibold">Grievance Report</div>
                  <p className="text-sm text-muted-foreground">Report concerns anonymously if you prefer.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Submit a request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Request type</Label>
                  <Select value={requestType} onValueChange={setRequestType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Resident Assistance">Resident Assistance</SelectItem>
                      <SelectItem value="Volunteer Onboarding">Volunteer Onboarding</SelectItem>
                      <SelectItem value="Grievance Report">Grievance Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Ward (optional)</Label>
                  <Select value={ward} onValueChange={setWard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your request or concern"
                    rows={5}
                    required
                  />
                </div>

                {!isAnonymous && (
                  <div>
                    <Label>Contact info</Label>
                    <Input
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      placeholder="Phone or email"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                  />
                  <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                    Submit anonymously
                  </Label>
                </div>

                <Button type="submit" disabled={submitting} className="gradient-primary">
                  {submitting ? "Submitting..." : "Submit request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
