"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Link } from "@/i18n/navigation";

export function HeroSection() {
  const reduceMotion = useReducedMotion();
  const initial = (y: number) => (reduceMotion ? false : { opacity: 0, y });
  const transition = (delay = 0) =>
    reduceMotion ? { duration: 0 } : { duration: 0.8, delay, ease: "easeOut" as const };

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
          initial={initial(20)}
          animate={{ opacity: 1, y: 0 }}
          transition={transition()}
        >
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-wepac-white/40">
            Cultura que transforma
          </p>
        </motion.div>

        <motion.h1
          initial={initial(30)}
          animate={{ opacity: 1, y: 0 }}
          transition={transition(0.2)}
          className="mt-6 font-barlow text-5xl font-bold leading-none text-wepac-white md:text-7xl lg:text-8xl"
        >
          Arte e cultura
          <br />
          que transformam.
        </motion.h1>

        <motion.p
          initial={initial(20)}
          animate={{ opacity: 1, y: 0 }}
          transition={transition(0.4)}
          className="mt-8 text-lg text-wepac-white/50 md:text-xl"
        >
          Arte e educação como motores de mudança social
          <br className="hidden md:block" />
          e valorização do património.
        </motion.p>

        <motion.div
          initial={initial(20)}
          animate={{ opacity: 1, y: 0 }}
          transition={transition(0.6)}
          className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <Link
            href="/servicos"
            className="inline-block bg-wepac-white px-8 py-3 font-barlow text-sm font-bold uppercase tracking-wider text-wepac-black transition-opacity hover:opacity-90"
          >
            Serviços Wessex
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
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transition(1.2)}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
          transition={reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
          className="h-8 w-5 rounded-full border-2 border-wepac-white/20 p-1"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-wepac-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
}
