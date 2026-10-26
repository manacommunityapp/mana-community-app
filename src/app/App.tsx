import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ToastContainer } from "react-toastify";
import { Toaster } from "sonner";
import "react-toastify/dist/ReactToastify.css";
import { ConsentBanner } from "./components/commons/privacy/ConsentBanner";

export default function App() {
  return (
    <>
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
    </>
  );
}

