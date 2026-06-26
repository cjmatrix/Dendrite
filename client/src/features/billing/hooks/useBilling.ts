import { useMutation } from "@tanstack/react-query";
import api from "../../../lib/axios";
import toast from "react-hot-toast";

interface CheckoutSessionParams {
  tier: string;
  billingCycle: "monthly" | "yearly";
}

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: async ({ tier, billingCycle }: CheckoutSessionParams) => {
      const response = await api.post("/billing/checkout-session", {
        tier,
        billingCycle,
      });
      return response.data?.data?.url;
    },
    onSuccess: (url) => {
      if (url) {
        window.location.href = url;
      }
    },
    onError: (error: unknown) => {
      let errorMsg = "Failed to initiate checkout session";
      if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMsg = response.data.message;
        }
      }
      toast.error(
        errorMsg,
        {
          style: {
            background: "#262626",
            color: "#fff",
            border: "1px solid #3b82f640",
            fontSize: "14px",
          },
        }
      );
    },
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post("/billing/portal-session");
      return response.data?.data?.url;
    },
    onSuccess: (url) => {
      if (url) {
        window.location.href = url;
      }
    },
    onError: (error: unknown) => {
      let errorMsg = "Failed to open customer portal";
      if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        if (response?.data?.message) {
          errorMsg = response.data.message;
        }
      }
      toast.error(
        errorMsg,
        {
          style: {
            background: "#262626",
            color: "#fff",
            border: "1px solid #3b82f640",
            fontSize: "14px",
          },
        }
      );
    },
  });
}
