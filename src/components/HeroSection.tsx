"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center bg-wepac-black px-6">
      {/* Background texture */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-wepac-black/80 via-transparent to-wepac-black" />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <span className="whitespace-nowrap font-barlow text-[20vw] font-bold">
            WEPAC
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-wepac-white/40">
            Companhia de Artes
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mt-6 font-barlow text-5xl font-bold leading-none text-wepac-white md:text-7xl lg:text-8xl"
        >
          Arte e cultura
          <br />
          que transformam.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mt-8 text-lg text-wepac-white/50 md:text-xl"
        >
          Arte e educacao como motores de mudanca social
          <br className="hidden md:block" />
          e valorizacao do patrimonio.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <Link
            href="/servicos"
            className="inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
          >
            Servicos Wessex
          </Link>
          <Link
            href="/sobre"
            className="inline-block border-2 border-wepac-white/30 px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-white transition-colors hover:border-wepac-white"
          >
            Conhecer a WEPAC
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-8 w-5 rounded-full border-2 border-wepac-white/20 p-1"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-wepac-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
