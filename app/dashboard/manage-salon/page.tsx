"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { 
  Save, 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Phone, 
  Mail,
  Image as ImageIcon,
  Plus,
  X
} from "lucide-react";
import Link from "next/link";

export default function ManageSalonPage() {
  const { user } = useUser();
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salon, setSalon] = useState<any>(null);

  useEffect(() => {
    fetchSalon();
  }, []);

  const fetchSalon = async () => {
    try {
      const res = await fetch("/api/dashboard/salons");
      const data = await res.json();
      if (data.salons && data.salons.length > 0) {
        setSalon(data.salons[0]);
      }
    } catch (err) {
      console.error("Failed to fetch salon:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/salons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salon),
      });
      if (res.ok) {
        toastSuccess("Salon details updated successfully!");
      } else {
        toastError("Failed to update salon details");
      }
    } catch (err) {
      toastError("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleImageAdd = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      setSalon({ ...salon, images: [...(salon.images || []), url] });
    }
  };

  const handleImageRemove = (index: number) => {
    setSalon({
      ...salon,
      images: salon.images.filter((_: any, i: number) => i !== index)
    });
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-4xl px-4 py-10">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </PageTransition>
    );
  }

  if (!salon) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-4xl px-4 py-10 text-center">
          <p className="text-cream-muted">No salon found. Please contact support.</p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-cream-muted hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="mt-4 font-display text-4xl text-white">Manage Salon</h1>
          <p className="mt-2 text-cream-muted">Update your salon details and information</p>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="glass-card p-6 space-y-6">
            <h2 className="font-display text-xl text-white">Basic Information</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
                  Salon Name
                </label>
                <Input
                  value={salon.name}
                  onChange={(e) => setSalon({ ...salon, name: e.target.value })}
                  className="bg-[#1A1C29]/50 border-white/10"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
                  Area
                </label>
                <Input
                  value={salon.area}
                  onChange={(e) => setSalon({ ...salon, area: e.target.value })}
                  className="bg-[#1A1C29]/50 border-white/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
                Specialty
              </label>
              <Input
                value={salon.specialty}
                onChange={(e) => setSalon({ ...salon, specialty: e.target.value })}
                className="bg-[#1A1C29]/50 border-white/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
                Description
              </label>
              <textarea
                value={salon.description}
                onChange={(e) => setSalon({ ...salon, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-[#1A1C29]/50 px-4 py-3 text-white focus:border-violet-500/30 focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
                  Price Range
                </label>
                <Input
                  value={salon.priceRange}
                  onChange={(e) => setSalon({ ...salon, priceRange: e.target.value })}
                  placeholder="₹500–₹5,000"
                  className="bg-[#1A1C29]/50 border-white/10"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
                  Open Hours
                </label>
                <Input
                  value={salon.openHours}
                  onChange={(e) => setSalon({ ...salon, openHours: e.target.value })}
                  placeholder="10:00 AM – 8:00 PM"
                  className="bg-[#1A1C29]/50 border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="glass-card p-6 space-y-6">
            <h2 className="font-display text-xl text-white">Contact Information</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
                  Owner Name
                </label>
                <Input
                  value={salon.ownerName}
                  onChange={(e) => setSalon({ ...salon, ownerName: e.target.value })}
                  className="bg-[#1A1C29]/50 border-white/10"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
                  Owner Email
                </label>
                <Input
                  value={salon.ownerEmail}
                  onChange={(e) => setSalon({ ...salon, ownerEmail: e.target.value })}
                  type="email"
                  className="bg-[#1A1C29]/50 border-white/10"
                />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="glass-card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-white">Gallery Images</h2>
              <Button size="sm" variant="outline" onClick={handleImageAdd} className="gap-2">
                <Plus size={16} /> Add Image
              </Button>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-3">
              {salon.images?.map((img: string, i: number) => (
                <div key={i} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden border border-white/10 bg-[#1A1C29]/50">
                    <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={() => handleImageRemove(i)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="glass-card p-6 space-y-6">
            <h2 className="font-display text-xl text-white">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {salon.tags?.map((tag: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
