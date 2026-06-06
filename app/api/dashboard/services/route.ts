import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Salon } from "@/models/Salon";
import { z } from "zod";

const serviceSchema = z.object({
  salonId: z.string(),
  service: z.object({
    name: z.string(),
    price: z.number(),
    duration: z.number(),
    category: z.string(),
  }),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validated = serviceSchema.parse(body);

    await connectDB();
    
    const salon = await Salon.findById(validated.salonId);
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Add new service
    salon.services.push(validated.service);
    await salon.save();

    return NextResponse.json({ success: true, services: salon.services });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: err.issues }, { status: 400 });
    }
    console.error("Failed to add service:", err);
    return NextResponse.json({ error: "Failed to add service" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { salonId, serviceIndex, service } = body;

    await connectDB();
    
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Update service
    salon.services[serviceIndex] = service;
    await salon.save();

    return NextResponse.json({ success: true, services: salon.services });
  } catch (err) {
    console.error("Failed to update service:", err);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const salonId = searchParams.get("salonId");
    const serviceIndex = searchParams.get("serviceIndex");

    if (!salonId || serviceIndex === null) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    await connectDB();
    
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return NextResponse.json({ error: "Salon not found" }, { status: 404 });
    }

    // Remove service
    salon.services.splice(parseInt(serviceIndex), 1);
    await salon.save();

    return NextResponse.json({ success: true, services: salon.services });
  } catch (err) {
    console.error("Failed to delete service:", err);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}
