"use client";

import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#06081a]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center">
<Image
  src="/fansixs-logo.png"
  alt="Fansixs"
  width={360}
  height={100}
  priority
  className="h-16 w-auto object-contain transition duration-300 hover:scale-105"
/>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center gap-10 md:flex">
          <a
            href="#tjanster"
            className="text-slate-300 transition duration-300 hover:text-purple-400"
          >
            Tjänster
          </a>

          <a
            href="#om"
            className="text-slate-300 transition duration-300 hover:text-purple-400"
          >
            Om oss
          </a>

          <a
            href="#kontakt"
            className="text-slate-300 transition duration-300 hover:text-purple-400"
          >
            Kontakt
          </a>
        </nav>

        {/* CTA */}
        <a
          href="#kontakt"
          className="rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition duration-300 hover:scale-105 hover:shadow-purple-500/60"
        >
          Boka demo
        </a>

      </div>
    </header>
  );
}