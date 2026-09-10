import Link from "next/link";
import { FaLocationArrow, FaFolderOpen } from "react-icons/fa6";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-black-100 flex flex-col items-center justify-center px-5 text-center relative overflow-hidden">
      {/* Background Grid */}
      <div className="h-full w-full dark:bg-black-100 bg-white dark:bg-grid-white/[0.03] bg-grid-black-100/[0.2] absolute top-0 left-0 flex items-center justify-center pointer-events-none -z-10">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black-100 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </div>

      <div className="max-w-md z-10 flex flex-col items-center">
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-purple bg-purple/10 border border-purple/30 rounded-full px-4 py-1 mb-4">
          Status 404
        </span>
        <h1 className="text-7xl md:text-9xl font-extrabold text-purple tracking-widest mb-4 drop-shadow-[0_0_25px_rgba(203,172,249,0.3)]">
          404
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Page Not Found
        </h2>
        <p className="text-white-200 text-sm md:text-base mb-8 leading-relaxed">
          The requested route could not be found or has been migrated. You can explore the engineering projects catalog or return to the portfolio.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple text-black font-semibold hover:bg-purple/90 transition-all text-sm shadow-md"
          >
            <FaFolderOpen className="w-3.5 h-3.5" />
            <span>Explore Projects</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white font-medium hover:bg-white/[0.08] transition-all text-sm"
          >
            <span>Return Home</span>
            <FaLocationArrow className="w-3 h-3 text-purple" />
          </Link>
        </div>
      </div>
    </main>
  );
}
