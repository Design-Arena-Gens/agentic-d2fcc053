import Link from "next/link";
import { fetchIceRollerReport } from "../lib/daraz";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Dhaka",
});

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }
  return currencyFormatter.format(value);
}

function formatRating(value: number | null) {
  if (value === null) {
    return "N/A";
  }
  return value.toFixed(1);
}

function formatReviews(value: number | null) {
  if (value === null) {
    return "N/A";
  }
  return value.toLocaleString();
}

export default async function Page() {
  const report = await fetchIceRollerReport();
  const { cheapest, products } = report;

  const totalListings = products.length;
  const averagePrice =
    totalListings > 0
      ? Number(
          (
            products.reduce((sum, item) => sum + item.price, 0) /
            totalListings
          ).toFixed(2),
        )
      : null;
  const medianPrice =
    totalListings > 0
      ? (() => {
          const middle = Math.floor(totalListings / 2);
          if (totalListings % 2 === 0) {
            return Number(
              ((products[middle - 1].price + products[middle].price) / 2).toFixed(
                2,
              ),
            );
          }
          return products[middle].price;
        })()
      : null;

  const highest = totalListings > 0 ? products[products.length - 1] : null;
  const under200Count = products.filter((item) => item.price <= 200).length;
  const under500Count = products.filter((item) => item.price <= 500).length;

  const observations: string[] = [];
  if (cheapest && medianPrice !== null) {
    const delta = medianPrice - cheapest.price;
    if (delta > 0) {
      observations.push(
        `Cheapest option is ${formatCurrency(cheapest.price)} which undercuts the median listing by ${formatCurrency(
          delta,
        )}.`,
      );
    }
  }
  if (highest && cheapest) {
    observations.push(
      `Price spread from cheapest to most expensive item spans ${formatCurrency(
        highest.price - cheapest.price,
      )}.`,
    );
  }
  if (under200Count) {
    observations.push(`${under200Count} listing(s) stay within the ৳200 budget bracket.`);
  }
  if (under500Count && under500Count !== under200Count) {
    observations.push(`${under500Count} listing(s) are priced below ৳500 overall.`);
  }
  if (!observations.length) {
    observations.push("Unable to derive insights from the current dataset.");
  }

  return (
    <main>
      <header>
        <h1>Daraz Bangladesh Ice Roller Price Report</h1>
        <p>
          Automated scrape of public Daraz BD listings for “ice roller”, ordered by price to
          pinpoint the most affordable option currently available.
        </p>
        <p className="note">Snapshot generated: {dateFormatter.format(new Date(report.fetchedAt))}</p>
      </header>

      <section>
        <h2>Cheapest Available Ice Roller</h2>
        {cheapest ? (
          <div className="stat-grid">
            <article className="stat-card">
              <strong>Listing</strong>
              <span>{cheapest.name}</span>
              <div className="note" style={{ marginTop: "0.5rem" }}>
                <Link href={cheapest.url} target="_blank" rel="noopener noreferrer">
                  View on Daraz
                </Link>
              </div>
            </article>
            <article className="stat-card">
              <strong>Price</strong>
              <span>{formatCurrency(cheapest.price)}</span>
              {cheapest.sponsored && <div className="badge">Sponsored</div>}
            </article>
            <article className="stat-card">
              <strong>Seller</strong>
              <span>{cheapest.seller ?? "Unknown"}</span>
              <div className="note" style={{ marginTop: "0.5rem" }}>
                {cheapest.location ?? "Location not listed"}
              </div>
            </article>
            <article className="stat-card">
              <strong>Performance</strong>
              <span>⭐ {formatRating(cheapest.rating)}</span>
              <div className="note" style={{ marginTop: "0.5rem" }}>
                {cheapest.reviewCount ? `${formatReviews(cheapest.reviewCount)} review(s)` : "No reviews"}
              </div>
            </article>
          </div>
        ) : (
          <p>Could not identify any qualifying ice roller listings in the sampled data.</p>
        )}
      </section>

      <section>
        <h2>Market Metrics</h2>
        <div className="stat-grid">
          <article className="stat-card">
            <strong>Total qualifying listings</strong>
            <span>{totalListings}</span>
          </article>
          <article className="stat-card">
            <strong>Median price</strong>
            <span>{formatCurrency(medianPrice)}</span>
          </article>
          <article className="stat-card">
            <strong>Average price</strong>
            <span>{formatCurrency(averagePrice)}</span>
          </article>
          {highest && (
            <article className="stat-card">
              <strong>Highest price observed</strong>
              <span>{formatCurrency(highest.price)}</span>
            </article>
          )}
        </div>
        <ul>
          {observations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Price-Ordered Listings</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Price (BDT)</th>
                <th>Rating</th>
                <th>Reviews</th>
                <th>Seller</th>
                <th>Location</th>
                <th>Sold</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item, index) => (
                <tr key={`${item.url}-${index}`}>
                  <td>{index + 1}</td>
                  <td>
                    <Link href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.name}
                    </Link>
                    {item.sponsored && <div className="badge">Sponsored</div>}
                  </td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>{formatRating(item.rating)}</td>
                  <td>{formatReviews(item.reviewCount)}</td>
                  <td>{item.seller ?? "Unknown"}</td>
                  <td>{item.location ?? "Unlisted"}</td>
                  <td>{item.sold ?? "N/A"}</td>
                </tr>
              ))}
              {!products.length && (
                <tr>
                  <td colSpan={8}>No matching listings found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {cheapest && cheapest.description.length > 0 && (
        <section>
          <h2>Cheapest Item Highlights</h2>
          <ul>
            {cheapest.description.slice(0, 6).map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="note">
        Data collected directly from the public Daraz BD search endpoint using the “ice roller”
        query with ascending price sorting. Listings may change at any time; re-run the report for
        the latest snapshot.
      </p>
    </main>
  );
}
