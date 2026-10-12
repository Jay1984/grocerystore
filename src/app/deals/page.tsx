import { getDeals } from "@/lib/data";
import { formatBHD, savingsPercentage } from "@/lib/price";
import { RETAILERS } from "@/lib/seed-data";
import { FavoriteButton } from "@/components/favorite-button";

export default function DealsPage() {
  const deals = getDeals();

  const onSale = deals.filter((d) =>
    d.product.prices.some((p) => p.originalPrice !== null)
  );
  const priceDiffs = deals.filter(
    (d) => d.savings !== null && d.savings >= 5
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-[30px] font-bold leading-[1.2] text-[var(--color-text-primary)] mb-2">
        Best Deals
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Current promotions and biggest price differences between retailers
      </p>

      {onSale.length > 0 && (
        <section className="mb-10">
          <h2 className="text-[20px] font-semibold leading-[1.3] text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[13px] font-semibold text-red-700">
              SALE
            </span>
            On Sale Now
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {onSale.map((item) => {
              const salePrice = item.product.prices.find(
                (p) => p.originalPrice !== null
              );
              const discount = salePrice
                ? savingsPercentage(
                    salePrice.originalPrice!,
                    salePrice.price
                  )
                : 0;
              const retailerName =
                RETAILERS.find((r) => r.id === salePrice?.retailer)?.name ??
                salePrice?.retailer;
              return (
                <div
                  key={item.product.id}
                  className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                        {item.product.name}
                      </p>
                      <p className="text-[13px] text-[var(--color-text-secondary)]">
                        {item.product.brand} &middot; {item.product.size}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <FavoriteButton
                        productId={item.product.id}
                        productTitle={item.product.name}
                        brand={item.product.brand}
                        size={item.product.size}
                        category={item.product.category}
                      />
                      <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-bold text-red-700">
                        {discount.toFixed(0)}% OFF
                      </span>
                    </div>
                  </div>
                  {salePrice && (
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-[20px] font-bold text-[var(--color-text-primary)] tabular-nums">
                        {formatBHD(salePrice.price)}
                      </span>
                      <span className="text-sm text-[var(--color-text-secondary)] line-through tabular-nums">
                        {formatBHD(salePrice.originalPrice!)}
                      </span>
                      <span className="text-[13px] text-[var(--color-text-secondary)]">
                        at {retailerName}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[20px] font-semibold leading-[1.3] text-[var(--color-text-primary)] mb-4">
          Biggest Price Differences
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {priceDiffs
            .sort((a, b) => (b.savings ?? 0) - (a.savings ?? 0))
            .map((item) => (
              <div
                key={item.product.id}
                className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-[var(--color-text-primary)]">
                      {item.product.name}
                    </p>
                    <p className="text-[13px] text-[var(--color-text-secondary)]">
                      {item.product.brand} &middot; {item.product.size}
                    </p>
                  </div>
                  <FavoriteButton
                    productId={item.product.id}
                    productTitle={item.product.name}
                    brand={item.product.brand}
                    size={item.product.size}
                    category={item.product.category}
                    className="shrink-0"
                  />
                </div>
                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: `repeat(${item.retailers.length}, minmax(0, 1fr))` }}
                >
                  {item.retailers.map((r) => (
                    <div
                      key={r.retailerId}
                      className={`rounded-lg p-2 text-center ${
                        item.cheapestRetailerId === r.retailerId
                          ? "bg-[var(--color-teal-light)] ring-1 ring-[var(--color-teal-accent)]/30"
                          : "bg-[var(--color-teal-light)]"
                      }`}
                    >
                      <p className="text-[13px] text-[var(--color-text-secondary)] truncate">{r.retailerName}</p>
                      <p className="font-bold text-sm tabular-nums">
                        {r.price ? formatBHD(r.price) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-[var(--color-teal-accent)] font-semibold text-center">
                  Save {item.savings?.toFixed(1)}% at{" "}
                  {item.cheapestRetailerName}
                </p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
