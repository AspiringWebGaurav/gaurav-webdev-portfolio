"use client";

import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './toast-custom.css';

export default function ToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      autoClose={1000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss={false}
      draggable
      pauseOnHover={false}
      theme="light"
      transition={Bounce}
      limit={3}
      stacked
      style={{
        top: '5rem',
        right: '1rem',
        zIndex: 99999,
      }}
    />
  );
}
