"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { AdGenerationModal } from "./ad-generation-modal";

export function CTASection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-3xl bg-gradient-to-br from-gradient-start/10 to-gradient-end/10 border border-accent/20">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">
            {"Ready to transform your marketing?"}
          </h2>
          <p className="text-xl text-muted-foreground">
            {"Join thousands of brands creating viral ads with AI"}
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90 transition-opacity"
            onClick={() => setIsModalOpen(true)}
          >
            {"Start Creating Free"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      <AdGenerationModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
