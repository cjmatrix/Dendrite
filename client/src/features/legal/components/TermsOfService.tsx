import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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
        <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Nurons ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              Nurons is an AI-powered knowledge management and research platform. The Service includes AI chat, document processing, and data visualization. We reserve the right to modify, suspend, or discontinue any part of the Service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must immediately notify us of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p>
              You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, or impairs the Service. This includes, but is not limited to, unauthorized scraping, uploading malicious files, or attempting to bypass rate limits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Intellectual Property</h2>
            <p>
              You retain all rights to the content you upload. The generated outputs may be subject to the terms of the underlying AI providers (such as OpenAI, Google, or Anthropic). The Nurons platform and its original content remain the exclusive property of Nurons.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users of the Service, us, or third parties.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
