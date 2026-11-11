import * as React from 'react';
import { motion } from 'framer-motion';

const springSnappy = { type: 'spring', stiffness: 320, damping: 28, mass: 0.8 };

export function ArtisanalHero({ onCta }: { onCta: () => void }) {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 py-24 bg-background text-foreground overflow-x-hidden">
      <div className="flex flex-col gap-6">
        <span className="text-xs uppercase tracking-widest font-mono text-muted-foreground">
          Adaptive Kinetic Architecture
        </span>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
          Artisanal Digital Experiences
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Crafted with physics-calibrated springs, liquid surfaces, and headless accessibility.
        </p>
        <div className="flex gap-4 pt-4">
          <motion.button
            type="button"
            onClick={onCta}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={springSnappy}
            className="min-h-[44px] min-w-[44px] px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            Explore Showcase
          </motion.button>
        </div>
      </div>
    </section>
  );
}
