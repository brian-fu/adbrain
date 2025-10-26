"use client"

import { Zap, Palette, TrendingUp, Share2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Generate professional ads in under 2 minutes. Our AI handles the heavy lifting.",
  },
  {
    icon: Palette,
    title: "Fully Customizable",
    description: "Fine-tune every aspect of your ad with our intuitive customization tools.",
  },
  {
    icon: TrendingUp,
    title: "Proven Results",
    description: "Our AI is trained on millions of high-performing ads to maximize your ROI.",
  },
  {
    icon: Share2,
    title: "One-Click Publishing",
    description: "Export and publish directly to Instagram, TikTok, and other platforms.",
  },
]

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold">
            {"Everything you need to "}
            <span className="bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
              {"dominate"}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {"Powerful features designed for modern marketers and brands"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className={`group p-8 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-gradient-start to-gradient-end group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-background" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
