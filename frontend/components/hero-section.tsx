"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { AdGenerationModal } from "./ad-generation-modal";

export function HeroSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-16">
        {/* Gradient background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-br from-gradient-start to-gradient-end rounded-full blur-3xl opacity-20 animate-float" />
          <div
            className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-br from-gradient-end to-gradient-start rounded-full blur-3xl opacity-20 animate-float"
            style={{ animationDelay: "3s" }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border backdrop-blur-sm animate-fade-in-up">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              {"AI-Powered Ad Generation"}
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-balance animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            {"Create viral ads in"}{" "}
            <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent animate-gradient">
              {"seconds"}
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            {
              "Transform your products into scroll-stopping ads with AI. No editing skills required. Just upload, customize, and publish."
            }
          </p>

          {/* CTA buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-fade-in-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Button
              size="lg"
              className="text-lg px-8 py-6 bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity"
              onClick={() => setIsModalOpen(true)}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {"Generate Your First Ad"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-border hover:bg-secondary/50 bg-transparent"
            >
              {"Watch Demo"}
            </Button>
          </div>

          {/* Trust indicators */}
          <p
            className="text-sm text-muted-foreground pt-8 animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {"Trusted by 10,000+ brands worldwide"}
          </p>
        </div>
      </section>

      <AdGenerationModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
