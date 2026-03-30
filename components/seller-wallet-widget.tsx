import Link from "next/link";

export type SellerWalletWidgetProps = {
  /** Raw balance from API */
  balance?: number | string | null;
  availableBalance?: number | string | null;
  pendingBalance?: number | string | null;
  currency?: string | null;
  loading?: boolean;
  fundingNeeded?: number | string | null;
  /** Defaults to My Balance page (includes top-up flow). */
  topUpHref?: string;
};

function formatBalanceParts(
  balance: number | string | null | undefined,
  currency: string | null | undefined
): { code: string; amount: string } {
  const code = (currency || "USD").toUpperCase();
  const num = Number(balance ?? 0);
  const amount = Number.isNaN(num) ? "0.00" : num.toFixed(2);
  return { code, amount };
}

function formatAmount(balance: number | string | null | undefined): string {
  const num = Number(balance ?? 0);

  return Number.isNaN(num) ? "0.00" : num.toFixed(2);
}

/**
 * Prominent seller wallet summary for dashboard (balance + Top Up).
 * Matches portal cards: white surface, gray border, rounded corners.
 */
export function SellerWalletWidget({
  balance,
  availableBalance,
  pendingBalance,
  currency,
  loading,
  fundingNeeded,
  topUpHref = "/portal/finance/my-balance",
}: SellerWalletWidgetProps) {
  const { code, amount } = formatBalanceParts(balance, currency);
  const available = formatAmount(availableBalance ?? balance);
  const pending = formatAmount(pendingBalance);
  const funding = Number(fundingNeeded ?? 0);
  const availableNumber = Number(availableBalance ?? balance ?? 0);
  const shortfall = Math.max(funding - (Number.isNaN(availableNumber) ? 0 : availableNumber), 0);
  const fundingCovered = funding <= 0 || shortfall <= 0;
  const fundingDisplay = `${code} ${funding.toFixed(2)}`;
  const shortfallDisplay = `${code} ${shortfall.toFixed(2)}`;

  return (
    <div
      className="w-full shrink-0 border border-neutral-200 bg-[linear-gradient(180deg,#fffdfb_0%,#ffffff_52%,#fff7f1_100%)] shadow-[0_1px_0_rgba(15,23,42,0.04)] lg:min-w-[21rem] xl:min-w-[23rem]"
      role="region"
      aria-label="Seller wallet"
    >
      <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Wallet Position
            </div>
            {loading ? (
              <div className="mt-2 h-9 w-40 animate-pulse bg-neutral-100" aria-hidden />
            ) : (
              <>
                <div className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="text-[2rem] font-semibold leading-none tabular-nums text-neutral-900">
                    {amount}
                  </span>
                  <span className="pb-1 text-sm font-medium uppercase tracking-wide text-neutral-500">
                    {code}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-neutral-600">
                  Use available funds for shipping reserves, new product funding, and withdrawals.
                </p>
              </>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[8.75rem]">
            <Link
              href={topUpHref}
              className="inline-flex items-center justify-center border border-[#e14f22] bg-[#ee4d2d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#e14f22] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ee4d2d]"
            >
              Top Up
            </Link>
            <Link
              href={topUpHref}
              className="inline-flex items-center justify-center border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              Open Ledger
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-neutral-200 sm:grid-cols-3">
        {[
          { label: "Total", value: amount },
          { label: "Available", value: available },
          { label: "Pending", value: pending },
        ].map((item) => (
          <div key={item.label} className="bg-white px-4 py-3 sm:px-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              {item.label}
            </div>
            {loading ? (
              <div className="mt-2 h-6 w-24 animate-pulse bg-neutral-100" aria-hidden />
            ) : (
              <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-900">{item.value}</div>
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 sm:px-5">
        {loading ? (
          <div className="h-10 animate-pulse bg-neutral-100" aria-hidden />
        ) : (
          <div className={`border px-3 py-3 ${fundingCovered ? "border-emerald-200 bg-emerald-50/70" : "border-amber-200 bg-amber-50/80"}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
                  Shipping Readiness
                </div>
                <div className="mt-1 text-sm font-medium text-neutral-900">
                  {fundingCovered
                    ? "Current wallet can cover the orders waiting to ship."
                    : "Top up more funds before you confirm shipping."}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">
                  {fundingCovered ? "Funding Needed" : "Top-Up Gap"}
                </div>
                <div className={`mt-1 text-base font-semibold tabular-nums ${fundingCovered ? "text-emerald-700" : "text-amber-700"}`}>
                  {fundingCovered ? fundingDisplay : shortfallDisplay}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
