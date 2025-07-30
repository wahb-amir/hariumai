"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { generateImageFromText } from "@/ai/flows/generate-image-from-text";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ImagePanel() {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setImageUrl(null);

    try {
      const result = await generateImageFromText({ prompt });
      setImageUrl(result.imageUrl);
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate image.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleGenerateImage} className="space-y-4">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A photo of an astronaut riding a horse on Mars, cinematic lighting"
          className="resize-none"
          rows={3}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !prompt.trim()} className="w-full">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Image
        </Button>
      </form>

      <Card>
        <CardContent className="p-4">
          <div className="aspect-square w-full rounded-lg overflow-hidden flex items-center justify-center bg-secondary">
            {isLoading && <Skeleton className="h-full w-full" />}
            {!isLoading && imageUrl && (
              <Image
                src={imageUrl}
                alt={prompt}
                width={512}
                height={512}
                className="object-cover w-full h-full transition-opacity duration-500 opacity-100"
                data-ai-hint="generated image"
              />
            )}
            {!isLoading && !imageUrl && (
              <div className="text-center text-muted-foreground p-8">
                <Sparkles className="mx-auto h-12 w-12 mb-4" />
                <p>Your generated image will appear here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
