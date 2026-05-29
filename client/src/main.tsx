import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { store } from "./store/store";
import "./index.css";
// import 'react-markdown-mermaid/style.css'; 
import App from "./App.tsx";

import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your_frontend_dsn",
  integrations: [Sentry.browserTracingIntegration()],
  tracePropagationTargets: ["localhost", /^\//, 'https://yourdomain.com'],
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    
    console.log(event)
   
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
      
    }

    // 2. Clear out sensitive Request Headers (like Auth tokens or Cookies)
    if (event &&event.request && event.request.headers) {
      const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
      sensitiveHeaders.forEach(header => {
        if (event.request.headers[header]) {
          event.request.headers[header] = '[FILTERED]';
        }
      });
    }

    return event; 
  },
});


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, 
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Provider>,
);
