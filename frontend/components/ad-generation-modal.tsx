"use client";

import type React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, ArrowRight, ArrowLeft, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AdGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "details" | "customization" | "generating";

export function AdGenerationModal({
  open,
  onOpenChange,
}: AdGenerationModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [productImage, setProductImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    productName: "",
    script: "",
    musicVibe: "",
    customPrompt: "",
    duration: "8", // 8, 16, or 24 seconds
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (step === "details") {
      setStep("customization");
    } else if (step === "customization") {
      setStep("generating");
      await generateVideo();
    }
  };

  const buildBasePrompt = () => {
    const duration = parseInt(formData.duration);
    const numSegments = duration / 8;

    // Build the base prompt with the overall ad concept
    let prompt = `Create a professional advertisement video for ${formData.productName}. `;
    prompt += `Script: ${formData.script}. `;

    if (formData.musicVibe) {
      prompt += `Music vibe: ${formData.musicVibe}. `;
    }

    if (formData.customPrompt) {
      prompt += `Additional details: ${formData.customPrompt}. `;
    }

    // Add the segmented structure based on duration
    if (numSegments === 1) {
      prompt += `\n\nPart 1 (0-8 seconds): Show the complete ad with product introduction, key message, and call to action.`;
    } else if (numSegments === 2) {
      prompt += `\n\nThe ad should be structured as follows:`;
      prompt += `\nPart 1 (0-8 seconds): Hook and product introduction - Open with an attention-grabbing scene that introduces the product.`;
      prompt += `\nPart 2 (8-16 seconds): Main message and call to action - Deliver the key benefit and end with a strong call to action.`;
    } else if (numSegments === 3) {
      prompt += `\n\nThe ad should be structured as follows:`;
      prompt += `\nPart 1 (0-8 seconds): Hook - Open with a compelling visual or problem that grabs attention.`;
      prompt += `\nPart 2 (8-16 seconds): Product showcase - Demonstrate the product and its key benefits.`;
      prompt += `\nPart 3 (16-24 seconds): Call to action - Close with brand reinforcement and clear next steps.`;
    }

    return prompt;
  };

  const generateVideo = async () => {
    try {
      // Build the base prompt with numbered sections
      const basePrompt = buildBasePrompt();

      console.log("Base prompt:", basePrompt);

      // Get the Supabase session token
      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("You must be logged in to generate videos");
      }

      // Create FormData to send the single prompt string and duration
      const formDataToSend = new FormData();

      // Send the base prompt as a single string (backend will handle segmentation)
      formDataToSend.append("prompt", basePrompt);
      formDataToSend.append("duration", formData.duration);
      formDataToSend.append("title", formData.productName); // Add product name as title

      if (productImage) {
        formDataToSend.append("image", productImage);
      }

      // Call the API with authorization header
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/v1/videos/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          const currentPath = window.location.pathname;
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
          throw new Error("Your session has expired. Please log in again.");
        }

        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate video");
      }

      const data = await response.json();
      console.log("Video generated:", data);

      // Store video URL in sessionStorage for the preview page
      if (data.video_url) {
        sessionStorage.setItem(`video_${data.video_id}`, data.video_url);
      }

      // Navigate to preview page with the video ID
      onOpenChange(false);
      router.push(`/preview?videoId=${data.video_id}`);

      // Reset state after navigation
      setTimeout(() => {
        setStep("details");
        setProductImage(null);
        setImagePreview("");
        setFormData({
          productName: "",
          script: "",
          musicVibe: "",
          customPrompt: "",
          duration: "8",
        });
      }, 500);
    } catch (error) {
      console.error("Error generating video:", error);
      alert(
        `Failed to generate video: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setStep("customization"); // Go back to customization step on error
    }
  };

  const handleBack = () => {
    if (step === "customization") {
      setStep("details");
    }
  };

  const canProceed = () => {
    if (step === "details") {
      return productImage && formData.productName && formData.script;
    }
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === "details" && "Tell us about your product"}
            {step === "customization" && "Customize your ad"}
            {step === "generating" && "Generating your ad"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`h-2 flex-1 rounded-full transition-colors ${
              step === "details"
                ? "bg-gradient-to-r from-gradient-start to-gradient-end"
                : "bg-secondary"
            }`}
          />
          <div
            className={`h-2 flex-1 rounded-full transition-colors ${
              step === "customization" || step === "generating"
                ? "bg-gradient-to-r from-gradient-start to-gradient-end"
                : "bg-secondary"
            }`}
          />
          <div
            className={`h-2 flex-1 rounded-full transition-colors ${
              step === "generating"
                ? "bg-gradient-to-r from-gradient-start to-gradient-end"
                : "bg-secondary"
            }`}
          />
        </div>

        {/* Step 1: Product Details */}
        {step === "details" && (
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="product-image" className="text-base">
                {"Product Image *"}
              </Label>
              <div className="relative">
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label
                  htmlFor="product-image"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent/50 transition-colors bg-secondary/30"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {"Click to upload product image"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {"PNG, JPG up to 10MB"}
                      </span>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <Label htmlFor="product-name" className="text-base">
                {"Product Name *"}
              </Label>
              <Input
                id="product-name"
                placeholder="e.g., Nike Air Max 2024"
                value={formData.productName}
                onChange={(e) =>
                  handleInputChange("productName", e.target.value)
                }
                className="h-12"
              />
            </div>

            {/* Script */}
            <div className="space-y-2">
              <Label htmlFor="script" className="text-base">
                {"Ad Script *"}
              </Label>
              <Textarea
                id="script"
                placeholder="Describe what you want the ad to say or show. Be specific about the message, tone, and key features to highlight."
                value={formData.script}
                onChange={(e) => handleInputChange("script", e.target.value)}
                className="min-h-32 resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {
                  "Example: Show the product with dynamic camera movements, emphasize comfort and style"
                }
              </p>
            </div>

            {/* Music/Vibe (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="music-vibe" className="text-base">
                {"Music/Vibe (Optional)"}
              </Label>
              <Select
                value={formData.musicVibe}
                onValueChange={(value) => handleInputChange("musicVibe", value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a vibe for your ad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="energetic">
                    {"Energetic & Upbeat"}
                  </SelectItem>
                  <SelectItem value="calm">{"Calm & Relaxing"}</SelectItem>
                  <SelectItem value="dramatic">
                    {"Dramatic & Cinematic"}
                  </SelectItem>
                  <SelectItem value="modern">{"Modern & Tech"}</SelectItem>
                  <SelectItem value="luxury">{"Luxury & Elegant"}</SelectItem>
                  <SelectItem value="fun">{"Fun & Playful"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-base">
                {"Video Duration *"}
              </Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => handleInputChange("duration", value)}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select video duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">{"8 seconds"}</SelectItem>
                  <SelectItem value="16">{"16 seconds"}</SelectItem>
                  <SelectItem value="24">{"24 seconds"}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {
                  "Longer videos are created by seamlessly combining multiple clips"
                }
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Customization */}
        {step === "customization" && (
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-secondary/30 border border-border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                {"AI Customization Prompt"}
              </h3>
              <Textarea
                placeholder="Add any specific instructions for the AI to customize your ad. For example: 'Make it more vibrant', 'Add text overlay with product benefits', 'Use slow-motion effects'..."
                value={formData.customPrompt}
                onChange={(e) =>
                  handleInputChange("customPrompt", e.target.value)
                }
                className="min-h-40 resize-none"
              />
            </div>

            {/* Preview of entered data */}
            <div className="space-y-4">
              <h3 className="font-semibold">{"Your Ad Details"}</h3>
              <div className="grid grid-cols-2 gap-4">
                {imagePreview && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {"Product Image"}
                    </p>
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Product"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {"Product Name"}
                  </p>
                  <p className="font-medium">{formData.productName}</p>
                </div>
                <div className="space-y-2 col-span-2">
                  <p className="text-sm text-muted-foreground">{"Script"}</p>
                  <p className="text-sm">{formData.script}</p>
                </div>
                {formData.musicVibe && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">{"Vibe"}</p>
                    <p className="font-medium capitalize">
                      {formData.musicVibe.replace("-", " ")}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{"Duration"}</p>
                  <p className="font-medium">{formData.duration} seconds</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === "generating" && (
          <div className="py-12 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-gradient-start to-gradient-end animate-spin" />
              <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
                <Sparkles className="w-12 h-12 text-accent" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-semibold">
                {"Creating your viral ad..."}
              </h3>
              <p className="text-muted-foreground">
                {formData.duration === "8"
                  ? "This usually takes 30-60 seconds"
                  : formData.duration === "16"
                  ? "This usually takes 60-90 seconds (generating 2 clips)"
                  : "This usually takes 90-120 seconds (generating 3 clips)"}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {"Analyzing product image"}
            </div>
          </div>
        )}

        {/* Action buttons */}
        {step !== "generating" && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === "details"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {"Back"}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-gradient-start to-gradient-end hover:opacity-90"
            >
              {step === "details" ? "Next" : "Generate Ad"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
