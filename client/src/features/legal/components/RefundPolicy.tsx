import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-300 font-sans p-8 sm:p-12">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-100 transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-white mb-6">Refund Policy</h1>
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Refund Eligibility</h2>
            <p>
              We want you to be satisfied with our Service. If you are not completely satisfied with your purchase, you may be eligible for a refund within the first 7 days of your initial subscription purchase.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Exclusions</h2>
            <p>
              Refunds are not granted for renewal charges after the initial 7-day period. Additionally, we cannot issue refunds for usage-based costs incurred in the "Bring Your Own Key" (BYOK) plan, as these charges are billed directly by your API provider.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How to Request a Refund</h2>
            <p>
              To request a refund, please contact our support team with your account details and the reason for your request. Refunds will be processed back to the original method of payment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Processing Time</h2>
            <p>
              Once approved, refunds typically take 5-10 business days to appear on your statement, depending on your financial institution.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Subscription Cancellations</h2>
            <p>
              You can cancel your subscription at any time to prevent future billing. Cancellation does not automatically trigger a refund for the current billing cycle unless it falls within the initial 7-day period.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
