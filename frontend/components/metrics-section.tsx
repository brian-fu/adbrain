"use client"

import { useEffect, useRef, useState } from "react"

const metrics = [
  {
    value: "10M+",
    label: "Ads Generated",
    company: "Nike",
  },
  {
    value: "500%",
    label: "Average ROI Increase",
    company: "Shopify",
  },
  {
    value: "2 min",
    label: "Average Creation Time",
    company: "Adidas",
  },
  {
    value: "98%",
    label: "Customer Satisfaction",
    company: "Coca-Cola",
  },
]

export function MetricsSection() {
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
    <section ref={sectionRef} className="py-24 px-4 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className={`text-center space-y-2 transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gradient-start to-gradient-end bg-clip-text text-transparent">
                {metric.value}
              </div>
              <div className="text-muted-foreground text-lg">{metric.label}</div>
              <div className="text-sm text-muted-foreground/60">{metric.company}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
