import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Instagram, Share2, PenTool, BarChart3 } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
            alt="Luxury modern mansion" 
            className="w-full h-full object-cover opacity-40 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center w-full max-w-5xl"
          >
            <h1 className="text-6xl md:text-[10rem] font-sans font-bold text-white tracking-tighter leading-none mb-6">
              VENDRIXA
            </h1>
            <p className="text-sm md:text-lg text-muted-foreground uppercase tracking-[0.4em] mb-12">
              A NEW STANDARD OF REAL ESTATE MARKETING
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link 
                href="/nuevo-listado" 
                className="group w-full sm:w-auto px-10 py-4 bg-white text-black font-semibold uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-gray-200 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/listados" 
                className="w-full sm:w-auto px-10 py-4 bg-transparent hover:bg-white/5 text-white font-medium uppercase tracking-widest text-sm border border-white/20 transition-all duration-300"
              >
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 bg-background relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-20">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-white mb-6">Our Services</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
            {[
              {
                num: "01",
                title: "PROPERTY SHOWCASE",
                desc: "Elegant, high-impact visuals that elevate each property's unique essence."
              },
              {
                num: "02",
                title: "AI COPYWRITING",
                desc: "Smart, emotionally resonant descriptions that drive engagement and sales."
              },
              {
                num: "03",
                title: "CONTENT ENGINE",
                desc: "Complete marketing material: Instagram captions, PDF brochures, and more."
              },
              {
                num: "04",
                title: "ANALYTICS",
                desc: "Data-driven insights to maximize your listings' performance and reach."
              }
            ].map((service, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
                className="group border-t border-white/10 pt-8"
              >
                <div className="flex items-start gap-6">
                  <span className="text-sm font-mono text-muted-foreground">{service.num}</span>
                  <div>
                    <h3 className="text-xl font-sans font-bold tracking-wide text-white mb-4 uppercase">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed font-light text-sm max-w-sm">
                      {service.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
            <div className="flex-1">
              <p className="text-5xl font-sans font-bold text-white mb-2">3</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Listings</p>
            </div>
            <div className="hidden md:block w-px h-16 bg-white/10" />
            <div className="flex-1">
              <p className="text-5xl font-sans font-bold text-white mb-2">Instant</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Content</p>
            </div>
            <div className="hidden md:block w-px h-16 bg-white/10" />
            <div className="flex-1">
              <p className="text-5xl font-sans font-bold text-white mb-2">100%</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Premium</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-background relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-[#111111] border border-white/10 p-12 md:p-24">
            <h2 className="text-3xl md:text-5xl font-sans font-bold text-white mb-6 uppercase tracking-tight">Built for Professionals</h2>
            <p className="text-muted-foreground leading-relaxed font-light mb-12 max-w-xl mx-auto">
              Join the new wave of real estate marketing. Streamline your workflow and create unforgettable property experiences.
            </p>
            <Link 
              href="/nuevo-listado" 
              className="inline-block px-10 py-4 bg-white text-black font-semibold uppercase tracking-widest text-sm hover:bg-gray-200 transition-all duration-300"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
