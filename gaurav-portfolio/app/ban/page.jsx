// "use client";

// import { useEffect, useState } from "react";
// import Cookies from "js-cookie";
// import VisitorStatusWatcher from "@/components/VisitorStatusWatcher";

// export default function BanPage() {
//   const [fallback, setFallback] = useState(false);

//   useEffect(() => {
//     const uuid = Cookies.get("uuid");

//     if (!uuid) {
//       setFallback(true);
//       return;
//     }

//     const target = `https://ban-redirect-server.onrender.com/ban-redirect?uuid=${uuid}`;
//     //ban-redirect-server-production.up.railway.app
//     //https://ban-redirect-server.onrender.com
//     window.location.replace(target);

//     const timeout = setTimeout(() => setFallback(true), 3000);
//     return () => clearTimeout(timeout);
//   }, []);

//   if (!fallback) return null;

//   return (
//     <div className="fixed inset-0 bg-white text-black flex items-center justify-center px-4">
//       <VisitorStatusWatcher />
//       <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg px-8 py-10 text-center">
//         <div className="mb-6">
//           <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
//             <span className="text-3xl text-red-500">🚫</span>
//           </div>
//         </div>
//         <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
//         <p className="text-gray-700 mb-2">
//           You’ve been restricted from accessing this portfolio.
//         </p>
//         <p className="text-sm text-gray-500 mb-6">
//           If you believe this is a mistake, please contact Gaurav.
//         </p>
//         <button className="w-full py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition">
//           Contact Gaurav
//         </button>
//       </div>
//     </div>
//   );
// }
// test-test