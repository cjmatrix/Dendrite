import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, Zap, Shield, Key, Loader2, HelpCircle } from "lucide-react";
import { useAppSelector } from "../../../store/store";
import toast from "react-hot-toast";

type BillingCycle = "monthly" | "yearly";

export default function BillingPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const currentTier = user?.tier || "free";
  
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handlePlanAction = (planId: string) => {
    if (planId === currentTier) {
      toast.success("You are already on this plan!");
      return;
    }

    setIsLoading(planId);
    setTimeout(() => {
      setIsLoading(null);
      toast.success(`Successfully upgraded to ${planId.toUpperCase()}! (Simulation)`, {
        icon: "⚡",
        duration: 4000,
        style: {
          background: "#18181b",
          color: "#e4e4e7",
          border: "1px solid #3f3f46",
          borderRadius: "16px",
        }
      });
    }, 1500);
  };

  const plans = [
    {
      id: "free",
      name: "Free Plan",
      description: "Get started with fundamental learning and workspace generation.",
      priceMonthly: 0,
      priceYearly: 0,
      icon: <Zap className="w-6 h-6 text-zinc-400" />,
      features: [
        "Up to 3 high-level milestones",
        "Standard AI model capabilities",
        "Local memory and basic recall",
        "Single workspace directory",
        "Community support",
      ],
      cta: "Current Plan",
      color: "from-zinc-500 to-zinc-700",
    },
    {
      id: "pro",
      name: "Pro Developer",
      description: "Unlock advanced generation scope, deep dives, and priority access.",
      priceMonthly: 20,
      priceYearly: 16,
      icon: <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />,
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
      color: "from-cyan-500 to-blue-600",
      glowColor: "rgba(6, 182, 212, 0.15)",
    },
    {
      id: "byok",
      name: "BYOK (Developer)",
      description: "Bring Your Own Key for ultimate control and unlimited query runs.",
      priceMonthly: 5,
      priceYearly: 4,
      icon: <Key className="w-6 h-6 text-purple-400" />,
      features: [
        "Connect custom Gemini & OpenAI keys",
        "Zero token limits or platform caps",
        "Pay directly to API providers",
        "Full access to premium structures",
        "Advanced folder tree analysis",
        "Standard developer support",
      ],
      cta: "Configure Key",
      color: "from-purple-500 to-pink-600",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Tailored infrastructure, customized workflows, and SLAs for teams.",
      priceMonthly: 99,
      priceYearly: 79,
      icon: <Shield className="w-6 h-6 text-amber-400" />,
      features: [
        "Dedicated model endpoints",
        "Custom workspace prompt directives",
        "SSO / SAML authentication integration",
        "Comprehensive team management analytics",
        "99.9% uptime SLA",
        "24/7 dedicated support manager",
      ],
      cta: "Contact Sales",
      color: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-zinc-100 font-sans relative overflow-x-hidden py-10 px-4 sm:px-6 lg:px-8">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-15%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[150px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[150px] -z-10" />

      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-12">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700/80 transition-all active:scale-95 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Workspace
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/40 border border-zinc-800/80 rounded-full text-xs font-semibold text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          Active Subscription: <span className="text-white uppercase ml-1">{currentTier}</span>
        </div>
      </div>

      {/* Pricing Header */}
      <div className="max-w-4xl mx-auto text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mb-4 bg-clip-text text-transparent bg-linear-to-b from-white to-zinc-400">
          Tailored Plans for Lifelong Learning
        </h1>
        <p className="text-lg text-zinc-400 max-w-xl mx-auto mb-8">
          Generate milestones, manage research repositories, and build active recall decks with next-gen technical assistants.
        </p>

        {/* Pricing Toggle */}
        <div className="inline-flex items-center gap-1 p-1 bg-zinc-950/80 border border-zinc-800/60 rounded-full">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all ${
              billingCycle === "monthly"
                ? "bg-zinc-800 text-white shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`relative px-5 py-2 rounded-full text-xs font-bold tracking-wide uppercase transition-all flex items-center gap-1 ${
              billingCycle === "yearly"
                ? "bg-zinc-800 text-white shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Yearly
            <span className="absolute -top-6 -right-6 px-2 py-0.5 text-[9px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full animate-bounce">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentTier;
          const displayPrice = billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between p-6 rounded-3xl bg-zinc-950/40 backdrop-blur-xl border transition-all duration-300 group hover:scale-[1.02] ${
                plan.popular
                  ? "border-cyan-500/40 shadow-[0_10px_30px_rgba(6,182,212,0.1)]"
                  : isCurrent
                  ? "border-zinc-700/80 bg-zinc-900/10"
                  : "border-zinc-800/60 hover:border-zinc-700/80"
              }`}
              style={{
                boxShadow: plan.popular ? `0 0 40px ${plan.glowColor}` : undefined
              }}
            >
              {plan.popular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-linear-to-r from-cyan-500 to-blue-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md shadow-cyan-500/25">
                  Most Popular
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/50 shadow-inner">
                    {plan.icon}
                  </div>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-xs text-zinc-400 mb-6 leading-relaxed min-h-[40px]">{plan.description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-black text-white">${displayPrice}</span>
                  <span className="text-xs text-zinc-500">/ user / month</span>
                </div>

                {/* Feature List */}
                <div className="w-full h-px bg-zinc-800/50 mb-6" />
                <ul className="space-y-3.5 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                disabled={isLoading !== null}
                onClick={() => handlePlanAction(plan.id)}
                className={`w-full py-3 px-4 rounded-2xl font-bold text-xs tracking-wide uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                  isCurrent
                    ? "bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700/50"
                    : plan.popular
                    ? "bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
                    : "bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 hover:border-zinc-700 active:scale-[0.98]"
                }`}
              >
                {isLoading === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isCurrent ? (
                  "Active Plan"
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ Summary */}
      <div className="max-w-3xl mx-auto mt-20 p-8 rounded-3xl border border-zinc-800/40 bg-zinc-950/20 backdrop-blur-md">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          Subscription FAQ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400">
          <div>
            <h4 className="font-semibold text-zinc-200 mb-1">What is BYOK (Bring Your Own Key)?</h4>
            <p className="leading-relaxed">
              BYOK allows developers to supply their own API keys from Google Gemini, OpenAI, or other AI engines. This ensures you only pay raw token costs directly to the provider, bypassing platform limits.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-zinc-200 mb-1">Can I change plans at any time?</h4>
            <p className="leading-relaxed">
              Yes, you can upgrade, downgrade, or switch between billing cycles instantly. Upgrade charges will be prorated automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
