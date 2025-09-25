// components/ToastProvider.jsx
"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={true}
      rtl={false}
      pauseOnFocusLoss={false}
      draggable={true}
      pauseOnHover={true}
      theme="light"
      className="toast-container-enhanced"
      style={{
        fontSize: '14px',
        fontFamily: 'var(--font-geist-sans), system-ui, sans-serif'
      }}
    />
  );
}
