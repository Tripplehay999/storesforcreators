import Link from "next/link";
import { money, shortDate, TIME_ZONE } from "@/lib/format";
import type { Order } from "@/lib/types";
import Icon from "./Icon";

export function PageHeader({
  title,
  description,
  children
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}

/** Shown when an admin opens a creator's hub from the admin panel. */
export function AdminBanner({ storeName, back }: { storeName: string; back: string }) {
  return (
    <div className="banner">
      <Icon name="shield" size={16} />
      <span>You&apos;re viewing <strong>{storeName}</strong> as an admin.</span>
      <Link href={back}>Back to admin</Link>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint
}: {
  label: string;
  value: string;
  /** Percent change vs the previous period; null when there's nothing to compare. */
  delta?: number | null;
  hint?: React.ReactNode;
}) {
  const direction = delta == null || Math.abs(delta) < 0.5 ? "flat" : delta > 0 ? "up" : "down";

  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-foot">
        {delta !== undefined && (
          <span className={`delta delta-${direction}`}>
            {delta === null ? "—" : (
              <>
                {direction !== "flat" && <Icon name={direction} size={13} />}
                {Math.abs(delta) >= 1000 ? ">999" : Math.abs(delta).toFixed(0)}%
              </>
            )}
          </span>
        )}
        {hint && <span>{hint}</span>}
      </span>
    </div>
  );
}

export function StatusBadge({ status }: { status: Order["status"] }) {
  return status === "completed"
    ? <span className="badge badge-pos">Completed</span>
    : <span className="badge badge-muted">Refunded</span>;
}

function placedAt(value: string) {
  return new Date(value).toLocaleString("en-US", { timeZone: TIME_ZONE, dateStyle: "medium", timeStyle: "short" });
}

/** Orders as table rows on desktop and stacked rows on phones; each opens to show the full breakdown. */
export function OrderRows({ orders }: { orders: Order[] }) {
  return (
    <div className="orders" role="table" aria-label="Orders">
      <div className="orders-head" role="row">
        <span role="columnheader">Product</span>
        <span role="columnheader">Date</span>
        <span role="columnheader">Status</span>
        <span role="columnheader" className="num">Sale</span>
        <span role="columnheader" className="num">Your share</span>
      </div>

      {orders.map(order => (
        <details className="order" key={order.id} role="row">
          <summary>
            <span className="order-product" role="cell">{order.productName}</span>
            <span className="order-date" role="cell">{shortDate(order.createdAt, true)}</span>
            <span className="order-status" role="cell"><StatusBadge status={order.status} /></span>
            <span className="num order-sale" role="cell">{money(order.amount, 2)}</span>
            <span className={`num order-share${order.status === "refunded" ? " is-void" : ""}`} role="cell">
              {money(order.creatorAmount, 2)}
            </span>
          </summary>

          <dl className="order-detail">
            <div><dt>Sale price</dt><dd>{money(order.amount, 2)}</dd></div>
            <div><dt>Platform share</dt><dd>−{money(order.amount - order.creatorAmount, 2)}</dd></div>
            <div><dt>Your share</dt><dd><strong>{money(order.creatorAmount, 2)}</strong></dd></div>
            <div><dt>Placed</dt><dd>{placedAt(order.createdAt)}</dd></div>
            <div className="wide"><dt>Order ID</dt><dd className="mono">{order.id}</dd></div>
            {order.status === "refunded" && (
              <div className="wide"><dt>Note</dt><dd>Refunded orders don&apos;t count toward your balance.</dd></div>
            )}
          </dl>
        </details>
      ))}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  );
}
