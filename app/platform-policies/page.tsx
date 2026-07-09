import Link from "next/link";

const sections = [
  ["Store Closure Eligibility", "A store may close only after all orders are fulfilled, disputes and claims are resolved, seller obligations are complete, and the account is in good standing.", ["No pending orders awaiting processing or shipment.", "No frozen orders, open disputes, returns, refunds, chargebacks, or claims.", "No unresolved account obligations or active fund holds."]],
  ["Pending Orders", "Pending orders remain the seller's responsibility even when the seller plans to pause or close the shop.", ["Process paid orders within the required period.", "Ship before the deadline and communicate with buyers.", "Unprocessed orders may lead to restrictions, delayed funds, or rejection of closure."]],
  ["Available Balance & Withdrawals", "Shopee may temporarily delay withdrawals to protect buyers when seller obligations remain outstanding.", ["Overdue or frozen orders may block withdrawal.", "Accounts under investigation or with active fund holds cannot withdraw.", "Funds become eligible when payout requirements are met."]],
  ["Vacation Mode — Temporary Store Pause", "Vacation Mode stops new orders while preserving the shop for a later return.", ["Existing orders must still be completed.", "Pending customer inquiries and overdue shipments remain the seller's responsibility.", "Sellers can resume operations after turning Vacation Mode off."]],
  ["Store Suspension", "Suspended sellers remain responsible for orders and transactions created before suspension.", ["Shopee may require pending orders and buyer complaints to be resolved.", "Compliance requirements may need to be met before funds are released."]],
  ["Permanent Store Closure", "Shopee verifies eligibility before approving permanent closure.", ["No active orders, disputes, or seller obligations may remain.", "Closure is generally irreversible.", "Withdraw eligible funds and retain required business records before applying."]],
] as const;

export default function SellerPlatformPoliciesPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-900">
      <article className="mx-auto max-w-4xl rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-9">
        <Link href="/portal/my-account" className="text-sm font-bold text-[#ee4d2d] no-underline">Back to seller dashboard</Link>
        <h1 className="mt-5 text-3xl font-black leading-tight">Shopee Seller Policy – Store Closure & Vacation Mode</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600">These platform rules are enforced through order eligibility, withdrawal reviews, Vacation Mode, store closure review, and admin controls.</p>
        <nav className="mt-6 rounded-lg bg-orange-50 p-4" aria-label="Policy contents">
          <ol className="grid gap-1 text-sm sm:grid-cols-2">{sections.map(([title], index) => <li key={title}><a className="inline-flex min-h-9 items-center text-neutral-700" href={`#policy-${index + 1}`}>{index + 1}. {title}</a></li>)}</ol>
        </nav>
        <div className="mt-8 space-y-8">
          {sections.map(([title, body, bullets], index) => (
            <section id={`policy-${index + 1}`} key={title}>
              <h2 className="text-xl font-black">{index + 1}. {title}</h2>
              <p className="mt-3 text-sm leading-7 text-neutral-700">{body}</p>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-sm leading-7 text-neutral-700">{bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
            </section>
          ))}
        </div>
        <div className="mt-9 rounded-lg border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-900">
          Manage Vacation Mode or request closure from <Link href="/portal/store-settings" className="font-bold text-red-700">Store Status & Closure</Link>.
        </div>
      </article>
    </main>
  );
}
