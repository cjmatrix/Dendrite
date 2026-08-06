import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store/store";
import "./index.css";
import "katex/dist/katex.min.css";
// import 'react-markdown-mermaid/style.css'; 
import App from "./App.tsx";
import { initializePaddle } from "@paddle/paddle-js";

initializePaddle({
  environment: "production",
  token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "",
  eventCallback: function(event) {
    if (event.name === "checkout.completed") {
     
      window.location.href = "https://nurons.me";
    }
  }
});

import * as Sentry from "@sentry/react";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn && sentryDsn !== "your_frontend_dsn") {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [Sentry.browserTracingIntegration()],
    tracePropagationTargets: ["localhost", /^\//, "https://nurons.me"],
    tracesSampleRate: 1.0,

    beforeSend(event: Sentry.ErrorEvent) {
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      if (event && event.request && event.request.headers) {
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
        sensitiveHeaders.forEach(header => {
          if (event.request?.headers?.[header]) {
            event.request.headers[header] = '[FILTERED]';
          }
        });
      }

      return event; 
    },
  });
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, 
    },
  },
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/firebase-messaging-sw.js")
      .then((registration) => {
        console.log("Service Worker registered successfully:", registration.scope);
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Provider>,
);
