import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./routes";
import { ToastContainer } from "react-toastify";
import { Toaster } from "sonner";
import "react-toastify/dist/ReactToastify.css";
import { ConsentBanner } from "./components/commons/privacy/ConsentBanner";
import { PendingSyncBanner } from "./components/commons/PendingSyncBanner";
import { initRequestQueueSync } from "../lib/requestQueue";
import { apiClient } from "../services/common/apiClient";
import { showApiError } from "./components/commons/ApiErrorToast";

// Replay queued writes when the browser comes back online
initRequestQueueSync(async (req) => {
  await apiClient.post(req.url, req.body, req.headers);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      onError: (err) => showApiError(err),
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
      {/* DPDP Act 2023 s.6 — consent banner for non-essential trackers */}
      <ConsentBanner />
      <PendingSyncBanner />
    </QueryClientProvider>
  );
}

