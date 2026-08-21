import Swal, { type SweetAlertIcon } from "sweetalert2";

export interface ConfirmActionOptions {
  title: string;
  text?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  cancelButtonColor?: string;
  icon?: SweetAlertIcon;
}

export async function confirmAction(
  titleOrOptions: string | ConfirmActionOptions,
  text?: string
): Promise<boolean> {
  if (typeof titleOrOptions === "object" && titleOrOptions !== null) {
    const {
      title,
      text: optText,
      confirmButtonText = "Yes",
      cancelButtonText = "No",
      confirmButtonColor = "#2563EB",
      cancelButtonColor = "#EF4444",
      icon = "question",
    } = titleOrOptions;

    const result = await Swal.fire({
      title,
      text: optText,
      icon,
      showCancelButton: true,
      confirmButtonColor,
      cancelButtonColor,
      confirmButtonText,
      cancelButtonText,
      reverseButtons: true,
    });

    return result.isConfirmed;
  }

  const result = await Swal.fire({
    title: titleOrOptions,
    text: text || "",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#2563EB",
    cancelButtonColor: "#EF4444",
    confirmButtonText: "Yes",
    cancelButtonText: "No",
    reverseButtons: true,
  });

  return result.isConfirmed;
}
