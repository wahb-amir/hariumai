"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Volume2, Send, Loader2, Mic, Paperclip, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { converseWithAi } from "@/ai/flows/generate-conversation";
import { convertTextToSpeech } from "@/ai/flows/convert-text-to-speech";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const suggestionPrompts = [
    "How does a car engine work?",
    "Generate an image of a majestic dragon flying over mountains",
    "What's the meaning of life?",
    "Write a poem about a rainy day"
]

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'start-1', role: 'assistant', content: "Hello, I'm Harium, your friendly assistant. How can I help you today? ✨ You can ask me questions or generate images!"}
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent, prompt?: string) => {
    e.preventDefault();
    const currentInput = prompt || input;
    if (!currentInput.trim() || isLoading) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: currentInput };
    setMessages((prev) => [...prev, userMessage]);
    
    if(!prompt) {
        setInput("");
    }
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
    <div className="flex flex-col h-[calc(100vh-80px)]">
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-6 max-w-3xl mx-auto py-8">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex items-start gap-4", message.role === "user" && "justify-end")}>
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 border bg-background">
                  <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg p-3 space-y-2",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card" 
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
                    {audioPlaying === message.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
                     <span className="sr-only">Play audio</span>
                  </Button>
                )}
              </div>
              {message.role === "user" && (
                 <Avatar className="h-8 w-8 border bg-background">
                    <AvatarFallback className="bg-primary text-primary-foreground"><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && (
            <div className="flex items-start gap-4">
              <Avatar className="h-8 w-8 border bg-background">
                 <AvatarFallback className="bg-transparent"><Bot className="h-5 w-5" /></AvatarFallback>
              </Avatar>
              <div className="bg-card rounded-lg p-3 flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm text-muted-foreground">HariumAI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t pt-4 bg-background">
        <div className="max-w-3xl mx-auto">
            {messages.length <= 1 && (
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3 px-2">
                        <Sparkles className="h-4 w-4" />
                        <h3 className="text-sm font-medium">Try these:</h3>
                    </div>
                    <ScrollArea className="whitespace-nowrap -mb-4">
                        <div className="flex gap-2 pb-4 px-2">
                            {suggestionPrompts.map(prompt => (
                                <Button 
                                    key={prompt} 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs h-8 rounded-full"
                                    onClick={(e) => handleSendMessage(e, prompt)}
                                    disabled={isLoading}
                                >
                                    {prompt}
                                </Button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
            <form onSubmit={handleSendMessage} className="relative">
                <Avatar className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    N
                  </AvatarFallback>
                </Avatar>
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Send a message or attach an image..."
                    className="flex-1 resize-none rounded-full bg-secondary border-none pl-14 pr-24 py-3 min-h-0 h-12"
                    rows={1}
                    onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                    }
                    }}
                    disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={isLoading}><Paperclip className="h-4 w-4" /></Button>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" disabled={isLoading}><Mic className="h-4 w-4" /></Button>
                    <Button type="submit" size="icon" className="h-8 w-8 rounded-full" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
