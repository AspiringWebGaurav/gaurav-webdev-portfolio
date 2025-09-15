// utils/toastUtils.js
import { toast } from "react-toastify";

export const showBanToast = () => {
  toast.warning("⚠️ You are being banned by Gaurav. Redirecting...");
};

export const showUnbanToast = () => {
  toast.success("🎉 You are now unbanned. Welcome back!");
};

export const showProcessingToast = (msg = "⏳ Processing...") => {
  toast.info(msg);
};

export const showGenericSuccess = (msg) => {
  toast.success(`✅ ${msg}`);
};

export const showGenericError = (msg) => {
  toast.error(`❌ ${msg}`);
};
