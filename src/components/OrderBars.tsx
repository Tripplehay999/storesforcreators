export default function OrderBars({ labels, orders }: { labels: string[]; orders: number[] }) {
  const maximum = Math.max(...orders, 1);

  return (
    <div className="dash-bars" style={{ gridTemplateColumns: `repeat(${orders.length}, 1fr)` }}>
      {orders.map((value, index) => (
        <div className="dash-bar-item" key={labels[index]}>
          <strong>{value}</strong>
          <div className="dash-bar-track">
            <b
              style={{ height: `${Math.max(8, value / maximum * 100)}%` }}
              title={`${value} orders`}
            />
          </div>
          <span>{labels[index]}</span>
        </div>
      ))}
    </div>
  );
}
