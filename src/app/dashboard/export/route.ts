import { NextResponse, type NextRequest } from "next/server";
import { csvResponse } from "@/lib/csv";
import { getOrders, getSession, getViewedStore } from "@/lib/data";

// A creator's own orders as CSV (admins may pass ?store= for any store).
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session || session.profile.suspended) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const store = await getViewedStore(session, request.nextUrl.searchParams.get("store") ?? undefined);

  if (!store) return new NextResponse("Not found", { status: 404 });

  const orders = await getOrders(store.slug);

  return csvResponse(
    `${store.slug}-orders`,
    orders.map(order => ({
      id: order.id,
      date: order.createdAt,
      product: order.productName,
      sale_price: order.amount,
      platform_share: Math.round((order.amount - order.creatorAmount) * 100) / 100,
      your_share: order.creatorAmount,
      status: order.status
    }))
  );
}
