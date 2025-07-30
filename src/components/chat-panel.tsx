"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Volume2, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { converseWithAi } from "@/ai/flows/generate-conversation";
import { convertTextToSpeech } from "@/ai/flows/convert-text-to-speech";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const result = await converseWithAi({ prompt: currentInput });
      const assistantMessage: Message = { id: `asst-${Date.now()}`, role: "assistant", content: result.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error in conversation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response from the AI.",
      });
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAudio = async (messageId: string, text: string) => {
    if (audioPlaying === messageId) {
      audioRef.current?.pause();
      setAudioPlaying(null);
      return;
    }

    if (audioRef.current) {
        audioRef.current.pause();
    }
    setAudioPlaying(messageId);
    try {
      const { media } = await convertTextToSpeech(text);
      const audio = new Audio(media);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => {
        setAudioPlaying(null);
        audioRef.current = null;
      };
      audio.onerror = () => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to play audio.",
        });
        setAudioPlaying(null);
        audioRef.current = null;
      }
    } catch (error) {
      console.error("Error converting text to speech:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate audio.",
      });
      setAudioPlaying(null);
    }
  };

  return (
    <div className="flex flex-col h-[60vh] space-y-4">
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex items-start gap-4", message.role === "user" && "justify-end")}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 border">
                  <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg p-3 space-y-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.role === 'assistant' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => handlePlayAudio(message.id, message.content)}
                    disabled={audioPlaying !== null && audioPlaying !== message.id}
                  >
                    <Volume2 className="h-4 w-4" />
                     <span className="sr-only">Play audio</span>
                  </Button>
                )}
              </div>
              {message.role === "user" && (
                 <Avatar className="h-8 w-8 border">
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8 border">
                 <AvatarFallback><Bot className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div className="bg-secondary rounded-lg p-3 flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">HariumAI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t pt-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
