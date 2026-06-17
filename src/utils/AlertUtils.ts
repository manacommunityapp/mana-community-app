import Swal from "sweetalert2";

export const confirmAction = async (
  title: string,
  text: string
): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#2563EB",
    cancelButtonColor: "#EF4444",
    confirmButtonText: "Yes",
    cancelButtonText: "No",
    reverseButtons: true
  });

  return result.isConfirmed;
};
