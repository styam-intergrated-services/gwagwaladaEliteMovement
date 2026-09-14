import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useToast } from "@/hooks/use-toast";
import { Search, Phone, Tag } from "lucide-react";
import { useSignedUrls } from "@/lib/storage";

const categories = ["All", "Goods", "Services", "Food", "Fashion", "Electronics", "Home & Garden", "Beauty & Health", "Other"];

interface Listing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  is_negotiable: boolean;
  whatsapp_number: string | null;
  images: string[];
  created_at: string;
}

export default function Marketplace() {
  const { user } = useAuth();
  const { isVerifiedTrader, isAdmin, isModerator } = useRole();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cat, setCat] = useState("Goods");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const imageUrls = useSignedUrls(
    "marketplace-images",
    listings.flatMap((l) => l.images || [])
  );

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    setListings(data || []);
    setLoading(false);
  };

  const filtered = listings.filter((l) => {
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase()) || l.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || l.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const uploadedImages: string[] = [];

    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("marketplace-images")
          .upload(path, file);
        if (uploadError) {
          toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
          setSubmitting(false);
          return;
        }
        uploadedImages.push(path);
      }
    }

    const { error } = await supabase.from("marketplace_listings").insert({
      seller_id: user.id,
      title,
      description,
      category: cat as any,
      price: Number(price),
      is_negotiable: negotiable,
      whatsapp_number: whatsapp || null,
      images: uploadedImages,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Listing failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Listing created" });
    setOpen(false);
    setTitle("");
    setDescription("");
    setPrice("");
    setWhatsapp("");
    setNegotiable(false);
    setFiles(null);
    fetchListings();
  };

  const canList = isVerifiedTrader || isAdmin || isModerator;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-6 pt-28 pb-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Marketplace</h1>
            <p className="text-muted-foreground">Buy, sell, and support local traders.</p>
          </div>
          {canList && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary">Create listing</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create listing</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={cat} onValueChange={setCat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.filter((c) => c !== "All").map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price (₦)</Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="negotiable" checked={negotiable} onCheckedChange={(checked) => setNegotiable(checked === true)} />
                    <Label htmlFor="negotiable" className="text-sm cursor-pointer">Price negotiable</Label>
                  </div>
                  <div>
                    <Label>WhatsApp number</Label>
                    <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="e.g. 08012345678" />
                  </div>
                  <div>
                    <Label>Images</Label>
                    <Input type="file" accept="image/*" multiple onChange={(e) => setFiles(e.target.files)} />
                  </div>
                  <Button type="submit" disabled={submitting} className="gradient-primary w-full">
                    {submitting ? "Creating..." : "Create listing"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No listings found. {canList && "Be the first to create one."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((listing) => (
              <Card key={listing.id} className="overflow-hidden">
                <div className="aspect-video bg-muted">
                  {listing.images.length > 0 && imageUrls[listing.images[0]] ? (
                    <img src={imageUrls[listing.images[0]]} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Tag className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{listing.title}</CardTitle>
                    <Badge variant="outline">{listing.category}</Badge>
                  </div>
                  <div className="text-xl font-bold text-primary">₦{Number(listing.price).toLocaleString()}</div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{listing.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {listing.is_negotiable && <Badge variant="secondary">Negotiable</Badge>}
                  </div>
                  {listing.whatsapp_number && (
                    <a
                      href={`https://wa.me/${listing.whatsapp_number.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" className="gap-2">
                        <Phone className="w-4 h-4" />
                        Contact seller
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
