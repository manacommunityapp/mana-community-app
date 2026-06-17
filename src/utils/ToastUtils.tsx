import { toast, type ToastOptions } from "react-toastify";
import React from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaInfoCircle
} from "react-icons/fa";

const commonConfig: ToastOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored"
};

export const showSuccess = (message: string) => {
  toast.success(message, {
    ...commonConfig,
    icon: () => React.createElement(FaCheckCircle)
  });
};

export const showWarning = (message: string) => {
  toast.warning(message, {
    ...commonConfig,
    icon: () => React.createElement(FaExclamationTriangle)
  });
};

export const showError = (message: string) => {
  toast.error(message, {
    ...commonConfig,
    icon: () => React.createElement(FaTimesCircle)
  });
};

export const showInfo = (message: string) => {
  toast.info(message, {
    ...commonConfig,
    icon: () => React.createElement(FaInfoCircle)
  });
};
