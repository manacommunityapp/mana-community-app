import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ToastContainer } from "react-toastify";
import { Toaster } from "sonner";
import "react-toastify/dist/ReactToastify.css";

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
    </>
  );
}

