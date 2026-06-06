"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { PageTransition } from "@/components/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  IndianRupee,
  Save,
  X
} from "lucide-react";
import Link from "next/link";

type Service = {
  name: string;
  price: number;
  duration: number;
  category: string;
};

const CATEGORIES = ["Hair", "Skin", "Bridal", "Men's", "Spa", "Aesthetics", "Nail"];

export default function ManageServicesPage() {
  const { user } = useUser();
  const { success: toastSuccess, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<any>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

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

  const handleAddService = async (service: Service) => {
    try {
      const res = await fetch("/api/dashboard/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId: salon._id, service }),
      });
      if (res.ok) {
        toastSuccess("Service added successfully!");
        setShowAddForm(false);
        fetchSalon();
      } else {
        toastError("Failed to add service");
      }
    } catch (err) {
      toastError("An error occurred");
    }
  };

  const handleUpdateService = async (service: Service, index: number) => {
    try {
      const res = await fetch("/api/dashboard/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId: salon._id, serviceIndex: index, service }),
      });
      if (res.ok) {
        toastSuccess("Service updated successfully!");
        setEditingService(null);
        setEditIndex(null);
        fetchSalon();
      } else {
        toastError("Failed to update service");
      }
    } catch (err) {
      toastError("An error occurred");
    }
  };

  const handleDeleteService = async (index: number) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    
    try {
      const res = await fetch(`/api/dashboard/services?salonId=${salon._id}&serviceIndex=${index}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toastSuccess("Service deleted successfully!");
        fetchSalon();
      } else {
        toastError("Failed to delete service");
      }
    } catch (err) {
      toastError("An error occurred");
    }
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-cream-muted hover:text-white transition-colors">
              <ArrowLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="mt-4 font-display text-4xl text-white">Manage Services</h1>
            <p className="mt-2 text-cream-muted">Add, edit, or remove services from your salon</p>
          </div>
          <Button onClick={() => setShowAddForm(true)} className="gap-2 bg-violet-600 hover:bg-violet-700">
            <Plus size={16} /> Add Service
          </Button>
        </div>

        {/* Add Service Form */}
        {showAddForm && (
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-white">Add New Service</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
                <X size={16} />
              </Button>
            </div>
            <ServiceForm
              onSubmit={handleAddService}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Services List */}
        <div className="space-y-4">
          {salon.services?.map((service: Service, index: number) => (
            <div key={index} className="glass-card p-6">
              {editIndex === index && editingService ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg text-white">Edit Service</h3>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingService(null);
                      setEditIndex(null);
                    }}>
                      <X size={16} />
                    </Button>
                  </div>
                  <ServiceForm
                    initialService={editingService}
                    onSubmit={(s) => handleUpdateService(s, index)}
                    onCancel={() => {
                      setEditingService(null);
                      setEditIndex(null);
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-display text-lg text-white">{service.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-cream-muted">
                      <span className="flex items-center gap-1">
                        <IndianRupee size={14} />
                        {service.price}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {service.duration} mins
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs">
                        {service.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingService(service);
                        setEditIndex(index);
                      }}
                      className="gap-2"
                    >
                      <Edit size={14} /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteService(index)}
                      className="gap-2 text-rose-400 hover:text-rose-300 hover:border-rose-500/30"
                    >
                      <Trash2 size={14} /> Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {salon.services?.length === 0 && (
          <div className="glass-card p-12 text-center">
            <p className="text-cream-muted">No services added yet. Click &quot;Add Service&quot; to get started.</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

function ServiceForm({ 
  initialService, 
  onSubmit, 
  onCancel 
}: { 
  initialService?: Service;
  onSubmit: (service: Service) => void;
  onCancel: () => void;
}) {
  const [service, setService] = useState<Service>(
    initialService || {
      name: "",
      price: 0,
      duration: 30,
      category: "Hair",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(service);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
          Service Name
        </label>
        <Input
          value={service.name}
          onChange={(e) => setService({ ...service, name: e.target.value })}
          required
          className="bg-[#1A1C29]/50 border-white/10"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
            Price (₹)
          </label>
          <Input
            type="number"
            value={service.price}
            onChange={(e) => setService({ ...service, price: parseInt(e.target.value) || 0 })}
            required
            className="bg-[#1A1C29]/50 border-white/10"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
            Duration (mins)
          </label>
          <Input
            type="number"
            value={service.duration}
            onChange={(e) => setService({ ...service, duration: parseInt(e.target.value) || 30 })}
            required
            className="bg-[#1A1C29]/50 border-white/10"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-cream-muted mb-2">
            Category
          </label>
          <select
            value={service.category}
            onChange={(e) => setService({ ...service, category: e.target.value })}
            className="w-full rounded-lg border border-white/10 bg-[#1A1C29]/50 px-4 py-2 text-white focus:border-violet-500/30 focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="gap-2 bg-violet-600 hover:bg-violet-700">
          <Save size={16} />
          {initialService ? "Update" : "Add"} Service
        </Button>
      </div>
    </form>
  );
}
