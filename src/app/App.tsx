import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "sonner";
import { ConsentBanner } from "./components/commons/privacy/ConsentBanner";

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
      {/* DPDP Act 2023 s.6 — consent banner for non-essential trackers */}
      <ConsentBanner />
    </>
  );
}

