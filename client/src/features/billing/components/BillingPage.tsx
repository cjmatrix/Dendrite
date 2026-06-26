import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, Zap, Shield, Key, Loader2, HelpCircle } from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../../store/store";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { checkAuth } from "../../auth/store/authSlice";
import { useCreateCheckoutSession, useCreatePortalSession } from "../hooks/useBilling";

type BillingCycle = "monthly" | "yearly";

export default function BillingPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const currentTier = user?.tier || "free";
  
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  const checkoutMutation = useCreateCheckoutSession();
  const portalMutation = useCreatePortalSession();

  const isAnyLoading = checkoutMutation.isPending || portalMutation.isPending;

  useEffect(() => {
    const success = searchParams.get("success") === "true" || searchParams.get("status") === "success";
    if (success) {
      toast.success("Payment completed successfully! Upgrading your plan...", {
        style: {
          background: "#262626",
          color: "#fff",
          border: "1px solid #10b98140",
          fontSize: "14px",
        },
      });


      queryClient.invalidateQueries({ queryKey: ["user"] });
      dispatch(checkAuth());

    
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("success");
      newParams.delete("status");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams, queryClient, dispatch]);

  const handlePlanAction = (planId: string) => {
    if (planId === "free") return;
    setActivePlanId(planId);
    
    if (planId === currentTier) {
      portalMutation.mutate(undefined, {
        onSettled: () => setActivePlanId(null),
      });
      return;
    }

    checkoutMutation.mutate(
      { tier: planId, billingCycle },
      {
        onSettled: () => setActivePlanId(null),
      }
    );
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      description: "For individuals exploring the fundamentals and basic generation.",
      priceMonthly: 0,
      priceYearly: 0,
      icon: <Zap className="w-5 h-5 text-neutral-400" />,
      features: [
        "Up to 3 high-level milestones",
        "Standard AI model capabilities",
        "Local memory and basic recall",
        "Single workspace directory",
        "Community support",
      ],
      cta: "Default",
    },
    {
      id: "pro",
      name: "Pro",
      description: "For professionals who need advanced scope and priority access.",
      priceMonthly: 20,
      priceYearly: 16,
      icon: <Sparkles className="w-5 h-5 text-blue-400" />,
      features: [
        "Up to 10 deep-dive milestones",
        "Advanced LLM models (Gemini 3.5 Pro)",
        "Priority queue generation speed",
        "Unlimited active learning workspaces",
        "Unlimited recall storage",
        "Priority developer support",
      ],
      cta: "Upgrade to Pro",
      popular: true,
    },
    {
      id: "byok",
      name: "byok",
      description: "Bring Your Own Key (BYOK) for ultimate control and unlimited runs.",
      priceMonthly: 5,
      priceYearly: 4,
      icon: <Key className="w-5 h-5 text-neutral-400" />,
      features: [
        "Connect custom Gemini & OpenAI keys",
        "Zero token limits or platform caps",
        "Pay directly to API providers",
        "Full access to premium structures",
        "Advanced folder tree analysis",
        "Standard developer support",
      ],
      cta: "Configure Key",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Tailored infrastructure, customized workflows, and team SLAs.",
      priceMonthly: 99,
      priceYearly: 79,
      icon: <Shield className="w-5 h-5 text-neutral-400" />,
      features: [
        "Dedicated model endpoints",
        "Custom workspace prompt directives",
        "SSO / SAML authentication",
        "Comprehensive team analytics",
        "99.9% uptime SLA",
        "24/7 dedicated support manager",
      ],
      cta: "Contact Sales",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-300 font-sans selection:bg-blue-500/20 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Subtle Ambient Blue Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        {/* Top Navigation */}
        <div className="max-w-7xl mx-auto flex justify-between items-center mb-20">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Workspace
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-800/80 border border-neutral-700/80 rounded-md text-xs font-medium text-neutral-300 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            Current Plan: <span className="text-white capitalize">{currentTier}</span>
          </div>
        </div>

        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-base text-neutral-400 mb-10">
            Generate milestones, manage research repositories, and build active recall decks with next-gen technical assistants.
          </p>

          {/* Segmented Control for Billing Cycle */}
          <div className="inline-flex items-center p-1 bg-neutral-800/80 border border-neutral-700/80 rounded-lg backdrop-blur-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-neutral-700 text-white shadow-sm border border-neutral-600/50"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-neutral-700 text-white shadow-sm border border-neutral-600/50"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Yearly
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentTier;
            const displayPrice = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col p-6 rounded-xl transition-all duration-300 ${
                  plan.popular
                    ? "bg-neutral-800/80 border-blue-500/30 shadow-[0_0_40px_-15px_rgba(59,130,246,0.1)]"
                    : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700"
                } border backdrop-blur-md`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-6 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-[10px] font-semibold text-blue-400 uppercase tracking-wide backdrop-blur-md">
                    Most Popular
                  </div>
                )}

                {/* Card Header */}
                <div className="mb-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg border ${plan.popular ? 'bg-blue-500/10 border-blue-500/20' : 'bg-neutral-800 border-neutral-700'}`}>
                      {plan.icon}
                    </div>
                    <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-neutral-700/50">
                  <span className="text-4xl font-semibold text-white tracking-tight">
                    ${displayPrice}
                  </span>
                  <span className="text-sm text-neutral-500">/mo</span>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-blue-400' : 'text-neutral-500'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <button
                  disabled={isAnyLoading}
                  onClick={() => handlePlanAction(plan.id)}
                  className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                    isCurrent
                      ? "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600"
                      : plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-900/50"
                      : "bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600"
                  }`}
                >
                  {isAnyLoading && activePlanId === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent && plan.id !== "free" ? (
                    "Manage Plan"
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-32 pt-16 border-t border-neutral-800">
          <div className="flex items-center gap-2 mb-8">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-medium text-white">Frequently Asked Questions</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div>
              <h4 className="text-sm font-medium text-white mb-2">What is BYOK (Bring Your Own Key)?</h4>
              <p className="text-sm text-neutral-400 leading-relaxed">
                BYOK allows developers to supply their own API keys from Google Gemini, OpenAI, or other AI engines. You only pay raw token costs directly to the provider, bypassing our platform limits.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-white mb-2">Can I change plans at any time?</h4>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Yes, you can upgrade, downgrade, or switch billing cycles instantly. When upgrading, charges are prorated automatically based on your current usage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}