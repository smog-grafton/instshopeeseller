import Link from "next/link";

export default function SellerTermsPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-900">
      <article className="mx-auto max-w-4xl rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <Link href="/portal/my-account" className="text-sm font-semibold text-red-600 no-underline">Back to seller dashboard</Link>
        <h1 className="mt-4 text-3xl font-bold">Shopee Terms of Service</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600">
          These terms govern buyer accounts, seller accounts, wallet top ups, withdrawals, order processing, frozen orders, receipt confirmation, and support operations on Shopee.
        </p>
        <div className="mt-6 grid gap-5">
          {[
            ["Account registration", "Users must keep account, contact, password, and verification information accurate and secure."],
            ["Seller processing", "Sellers must maintain sufficient wallet balance and process eligible orders within the 24-hour processing window."],
            ["Wallets and payouts", "Top ups, processing reserves, withdrawals, refunds, and seller profit releases are reviewed and recorded through wallet history. Seller profit may be calculated from the processing reserve and capped by platform settings, for example min(processing reserve x target rate, processing reserve x max allowed rate)."],
            ["Frozen orders", "Orders that miss processing deadlines or require risk review may be frozen until Shopee Support unlocks them."],
            ["Marketplace conduct", "False documents, payment bypassing, fraud, harassment, prohibited goods, and system abuse are not allowed."],
          ].map(([title, body]) => (
            <section key={title}>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-7 text-neutral-700">{body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
