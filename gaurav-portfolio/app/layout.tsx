import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./provider";
import ToastProvider from "@/components/ToastProvider";
import { db } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Gaurav's Portfolio",
  description: "Modern Slick and Minimal Portfolio Showcasing JS Mastery",
  icons: {
    icon: "/favicon.ico", // ✅ This line ensures it's included
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // ✅ Await cookie read
  const uuid = cookieStore.get("uuid")?.value;

  if (uuid) {
    try {
      const docSnap = await db.collection("visitors").doc(uuid).get();
      const isBanned = docSnap.exists && docSnap.data()?.status === "banned";

      // ✅ Safe redirect before render
      if (isBanned) {
        console.log("🚫 SSR redirect: user is banned");
        redirect("/ban");
      }
    } catch (err) {
      console.error("🔥 SSR ban check failed:", err);
    }
  }

  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
