import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
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
        <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as your name, email address, and payment information when you create an account or subscribe to our Service. We also collect the content you upload and queries you send for processing.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>
              We use the collected information to operate, maintain, and improve our Service. Your uploaded documents and chat histories are processed to provide personalized AI responses, context retention, and feature functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Sharing and Processing</h2>
            <p>
              We do not sell your personal data. We share necessary data with third-party service providers (like payment processors and AI API providers) strictly for the purpose of operating the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Your Rights</h2>
            <p>
              Depending on your location, you may have rights to access, correct, or delete your personal data. You can manage your account data within the app or contact us for assistance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
