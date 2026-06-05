import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Booking } from "@/models/Booking";
import { Salon } from "@/models/Salon";
import { completeText } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    
    // Find salons owned by this user (mock ownership check for demo)
    // In a real app, you'd check a Salon.ownerId field
    const salons = await Salon.find({ ownerEmail: "ankitask46@gmail.com" }); // Demo owner
    const salonIds = salons.map(s => s._id);

    const bookings = await Booking.find({ salonId: { $in: salonIds } });

    // Aggregate Metrics
    const totalRevenue = bookings
      .filter(b => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + (b.service?.price || 0), 0);
    
    const totalBookings = bookings.length;
    
    const cancelledCount = bookings.filter(b => b.status === "cancelled").length;
    const cancellationRate = totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0;

    // Top Services
    const serviceMap: Record<string, { count: number, revenue: number }> = {};
    bookings.forEach(b => {
      const name = b.service?.name || "Other";
      if (!serviceMap[name]) serviceMap[name] = { count: 0, revenue: 0 };
      serviceMap[name].count++;
      if (b.status !== "cancelled") serviceMap[name].revenue += (b.service?.price || 0);
    });

    const topServices = Object.entries(serviceMap)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Customer Retention
    const userBookingCounts: Record<string, number> = {};
    bookings.forEach(b => {
      userBookingCounts[b.userId] = (userBookingCounts[b.userId] || 0) + 1;
    });
    const repeatCustomers = Object.values(userBookingCounts).filter(count => count > 1).length;
    const totalCustomers = Object.keys(userBookingCounts).length;
    const retentionRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;

    // AI Insights
    let aiInsights = ["Peak demand on weekends", "Hydrafacials are trending"];
    try {
      const insightPrompt = `Analyze this salon booking summary: Total Bookings: ${totalBookings}, Revenue: ₹${totalRevenue}, Cancellation Rate: ${cancellationRate.toFixed(1)}%, Top Service: ${topServices[0]?.name}. Generate 2 brief, plain-English trend observations for the owner.`;
      const text = await completeText({ system: "You are a business analyst.", user: insightPrompt, maxTokens: 100 });
      aiInsights = text.split('\n').filter(l => l.trim().length > 5).slice(0, 2);
    } catch (e) { /* fallback */ }

    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalBookings,
        cancellationRate,
        retentionRate,
        conversionRate: 14.2, // Mock profile views conversion
      },
      topServices,
      aiInsights,
      recentBookings: bookings.slice(-5).reverse()
    });

  } catch (err) {
    console.error("Dashboard stats error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
