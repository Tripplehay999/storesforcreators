import { NextResponse } from "next/server";
import { getAllOrders, getPayouts, getStoreBalances, getUsers } from "@/lib/admin-data";
import { csvResponse, type CsvRow } from "@/lib/csv";
import { getSession } from "@/lib/data";

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await getSession();

  if (!session || session.profile.role !== "admin" || session.profile.suspended) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { type } = await params;
  let rows: CsvRow[];

  if (type === "users") {
    const [users, balances] = await Promise.all([getUsers(), getStoreBalances()]);
    const balanceOf = new Map(balances.map(item => [item.slug, item]));

    rows = users.map(user => {
      const balance = user.store ? balanceOf.get(user.store.slug) : undefined;

      return {
        id: user.id,
        name: user.fullName,
        email: user.email,
        social: user.socialHandle,
        role: user.role,
        suspended: user.suspended,
        joined: user.createdAt,
        store: user.store?.slug ?? "",
        revenue_share: balance?.revenueShare ?? "",
        earned: balance?.earned ?? 0,
        paid_out: balance?.paidOut ?? 0,
        balance: balance?.balance ?? 0
      };
    });
  } else if (type === "orders") {
    rows = (await getAllOrders({ limit: 10000 })).map(order => ({
      id: order.id,
      date: order.createdAt,
      store: order.storeSlug,
      product: order.productName,
      customer_email: order.customerEmail,
      amount: order.amount,
      creator_amount: order.creatorAmount,
      status: order.status
    }));
  } else if (type === "payouts") {
    rows = (await getPayouts()).map(payout => ({
      id: payout.id,
      created: payout.createdAt,
      paid: payout.paidAt,
      store: payout.storeSlug,
      amount: payout.amount,
      status: payout.status,
      method: payout.method,
      reference: payout.reference,
      note: payout.note
    }));
  } else {
    return new NextResponse("Not found", { status: 404 });
  }

  return csvResponse(type, rows);
}
