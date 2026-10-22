import { NextResponse } from "next/server";
import { getAllOrders, getPayouts, getStoreBalances, getUsers } from "@/lib/admin-data";
import { getSession } from "@/lib/data";

type Row = Record<string, string | number | boolean | null>;

function toCsv(rows: Row[]) {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const cell = (value: Row[string]) => {
    const text = value === null ? "" : String(value);
    // Quote everything; neutralise spreadsheet formula injection.
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  return [headers.join(","), ...rows.map(row => headers.map(key => cell(row[key])).join(","))].join("\n");
}

export async function GET(_request: Request, { params }: { params: Promise<{ type: string }> }) {
  const session = await getSession();

  if (!session || session.profile.role !== "admin" || session.profile.suspended) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { type } = await params;
  let rows: Row[];

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

  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="btg-${type}-${date}.csv"`
    }
  });
}
