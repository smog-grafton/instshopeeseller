import Link from "next/link";

export default function SellerPrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-900">
      <article className="mx-auto max-w-4xl rounded-lg border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
        <Link href="/portal/my-account" className="text-sm font-semibold text-red-600 no-underline">Back to seller dashboard</Link>
        <h1 className="mt-4 text-3xl font-bold">Shopee Privacy Policy</h1>
        <p className="mt-3 text-sm leading-7 text-neutral-600">
          Shopee uses account, wallet, order, merchant verification, payout, device, and support information to operate and protect the marketplace.
        </p>
        <div className="mt-6 grid gap-5">
          {[
            ["Information collected", "We collect account details, store details, identity verification documents, wallet transactions, orders, support messages, and device/session data."],
            ["How data is used", "Information supports onboarding, order processing, wallet reviews, withdrawal checks, support, fraud prevention, and marketplace safety."],
            ["Sharing", "Necessary information may be shared with administrators, payment providers, service partners, and compliance reviewers."],
            ["Retention and security", "Records are retained for operations, accounting, disputes, compliance, and security. Users must keep credentials and verification codes secure."],
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
