
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User, Volume2, Send, Loader2, Mic, Paperclip, ImageIcon, Copy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { converseWithAi } from "@/ai/flows/generate-conversation";
import { convertTextToSpeech } from "@/ai/flows/convert-text-to-speech";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { HariumLogo } from "./harium-logo";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getChatHistory } from "@/ai/flows/get-chat-history";
import { v4 as uuidv4 } from 'uuid';

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "image";
};

type ChatPanelProps = {
    chatId?: string;
}

export function ChatPanel({ chatId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [currentSessionId, setCurrentSessionId] = useState(chatId || uuidv4());

  useEffect(() => {
    if (chatId) {
      setCurrentSessionId(chatId);
    }
  }, [chatId]);


  useEffect(() => {
    if (!authLoading) {
        let currentUserId = user?.uid;
        if (!currentUserId) {
            currentUserId = localStorage.getItem('anonymous_user_id') || uuidv4();
            localStorage.setItem('anonymous_user_id', currentUserId);
        }
        setUserId(currentUserId);
    }
  }, [user, authLoading]);

  useEffect(() => {
    const fetchHistory = async () => {
        if (chatId) {
            setIsLoading(true);
            try {
                const history = await getChatHistory({ sessionId: chatId });
                if (history.length > 0) {
                    const loadedMessages = history.map((item, index) => ({
                        id: `hist-${index}-${Date.now()}`,
                        role: item.role,
                        content: item.content,
                        // This part needs to be smarter if we save images
                        type: item.content.startsWith('data:image') ? 'image' : 'text' as const, 
                    }));
                    setMessages(loadedMessages);
                } else {
                     setMessages([]);
                }
            } catch (error) {
                 console.error("Error fetching chat history:", error);
                 toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load chat history.",
                  });
            } finally {
                setIsLoading(false);
            }
        } else {
            setMessages([]);
            setIsLoading(false);
        }
    };
    fetchHistory();
  }, [chatId, toast]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent, prompt?: string) => {
    e.preventDefault();
    const currentInput = prompt || input;
    if (!currentInput.trim() || !userId) return;

    const isNewChat = !chatId;

    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content: currentInput, type: "text" };
    
    // For new chats, we want to clear the placeholder and only show the user message
    setMessages(prev => isNewChat ? [userMessage] : [...prev, userMessage]);
    
    if(!prompt) {
        setInput("");
    }
    setIsLoading(true);

    try {
        const result = await converseWithAi({ prompt: currentInput, sessionId: currentSessionId, userId });
        
        if (result.responseType === 'image') {
          toast({
              title: "Image Generated",
              description: "Images are not saved in your chat history.",
          });
        }

        if (isNewChat && result.newSessionId) {
            router.push(`/chat/${result.newSessionId}`);
            // Don't add the assistant message here, it will be loaded by the new page
            return;
        }

        const assistantMessage: Message = { 
            id: `asst-${Date.now()}`, 
            role: "assistant", 
            content: result.response,
            type: result.responseType
        };
        setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error in conversation:", error);
      
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response from the AI.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || isLoading) return;
    const lastUserMessage = messages.filter(m => m.role === 'user').at(-1);
    if(lastUserMessage) {
        const newMessages = messages.slice(0, -1);
        setMessages(newMessages);
        handleSendMessage(new Event('submit') as unknown as React.FormEvent, lastUserMessage.content);
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copied!",
        description: "The response has been copied to your clipboard.",
    });
  }

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

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(Chohan Space)/gi);
    return parts.map((part, index) =>
      part.toLowerCase() === 'chohan space' ? (
        <a
          key={index}
          href="https://thechohan.space"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {part}
        </a>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-6 max-w-3xl mx-auto py-8">
            {!chatId && messages.length === 0 && !isLoading && (
                 <div className="flex flex-col items-center justify-center h-full pt-24">
                     <HariumLogo className="h-24 w-24" />
                     <h2 className="mt-6 text-2xl font-black">Hey, I'm Harium.</h2>
                     <p className="text-muted-foreground">What do you want to know?</p>
                 </div>
            )}
          {messages.map((message, index) => (
            <div key={message.id} className={cn("flex items-start gap-4", message.role === "user" && "justify-end")}>
              {message.role === "assistant" && (
                 <Avatar className="h-8 w-8 border-none bg-transparent">
                  <AvatarFallback className="bg-transparent text-transparent">
                    <HariumLogo className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg p-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card",
                )}
              >
                {message.type === 'image' ? (
                   <Image
                        src={message.content}
                        alt="Generated image"
                        width={512}
                        height={512}
                        className="rounded-lg"
                        data-ai-hint="generated image"
                    />
                ) : (
                    <p className="text-sm leading-relaxed break-words">{renderMessageContent(message.content)}</p>
                )}
                
                {message.role === 'assistant' && !isLoading && index === messages.length - 1 && (
                    <div className="mt-2 flex items-center gap-2">
                         {message.type === 'text' && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => handlePlayAudio(message.id, message.content)}
                                    disabled={audioPlaying !== null && audioPlaying !== message.id}
                                    title="Play audio"
                                >
                                    {audioPlaying === message.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
                                    <span className="sr-only">Play audio</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleCopy(message.content)}
                                    title="Copy response"
                                >
                                    <Copy className="h-4 w-4" />
                                    <span className="sr-only">Copy response</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                    onClick={handleRegenerate}
                                    disabled={isLoading}
                                    title="Regenerate response"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    <span className="sr-only">Regenerate response</span>
                                </Button>
                            </>
                        )}
                    </div>
                )}
              </div>
              {message.role === "user" && (
                 <Avatar className="h-8 w-8 border bg-background">
                    <AvatarFallback className="bg-primary text-primary-foreground"><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
           {isLoading && messages.length > 0 && (
            <div className="flex items-start gap-4">
               <Avatar className="h-8 w-8 border-none bg-transparent">
                  <AvatarFallback className="bg-transparent text-transparent">
                    <HariumLogo className="h-8 w-8" />
                  </AvatarFallback>
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
             <div className="h-28" />
            <form onSubmit={handleSendMessage} className="relative">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 resize-none rounded-full bg-secondary border-none pl-4 pr-24 py-3 min-h-0 h-12"
                    rows={1}
                    onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                    }
                    }}
                    disabled={isLoading || !userId}
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
