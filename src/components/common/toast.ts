import axios from "axios";
import toast from "react-hot-toast";

// Pulls the server's { message } out of an unknown error without casting.
function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
      return data.message;
    }
    return error.message;
  }
  return "Something went wrong";
}

export const openSuccessToast = ({ message }: { message: string }): string => toast.success(message, { id: "success" });
export const openErrorToast = ({ error }: { error: unknown }): string => toast.error(errorMessage(error), { id: "error" });
export const openWarningToast = ({ message }: { message: string }): string => toast(message, { icon: "⚠️", duration: 5000, id: "warning" });
