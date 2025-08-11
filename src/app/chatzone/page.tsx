
"use client";

import * as React from "react";
import { PlusCircle, MessageSquare, User, Bot, Send, Loader2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { HariumLogo } from "@/components/harium-logo";

const BACKEND_URL = "https://harium-ai-backend.onrender.com";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Session = {
  _id: string;
  title: string;
};

const Typewriter = ({ text }: { text: string }) => {
    const [displayedText, setDisplayedText] = React.useState("");
  
    React.useEffect(() => {
      setDisplayedText("");
      let i = 0;
      const intervalId = setInterval(() => {
        if (i < text.length) {
          setDisplayedText((prev) => prev + text.charAt(i));
          i++;
        } else {
          clearInterval(intervalId);
        }
      }, 20);
  
      return () => clearInterval(intervalId);
    }, [text]);
  
    return (
      <p className="text-sm leading-relaxed break-words">
        {displayedText}
        <span className="animate-pulse">●</span>
      </p>
    );
}


export default function ChatzonePage() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/sessions`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        console.error("Failed to fetch sessions");
        setSessions([]);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    }
  };

  React.useEffect(() => {
    loadSessions();
  }, []);

  const handleNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const loadChat = async (sessionId: string) => {
    if (isLoading) return;
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`${BACKEND_URL}/chat/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setCurrentChatId(sessionId);
      } else {
        console.error("Failed to fetch chat history");
        setMessages([]);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    } finally {
        setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input,
          sessionId: currentChatId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = { role: "assistant", content: data.response };
        setMessages((prev) => [...prev, assistantMessage]);
        if (!currentChatId && data.sessionId) {
            setCurrentChatId(data.sessionId);
            loadSessions(); // Refresh session list
        }
      } else {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        const errorMessage: Message = { role: "assistant", content: "Sorry, something went wrong." };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = { role: "assistant", content: "Sorry, I couldn't connect to the backend." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans">
      {/* Sidebar */}
      <aside className={cn(
        "bg-green-800 text-white flex flex-col p-2 transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-64" : "w-0 p-0 overflow-hidden"
      )}>
        <div className="p-2">
            <h1 className="text-xl font-black text-center text-white">ChatZone AI Beta</h1>
        </div>
        <div className="p-2">
          <Button onClick={handleNewChat} variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-green-700 hover:text-white">
            <PlusCircle className="h-5 w-5" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto mt-4">
            <h2 className="px-4 text-xs font-semibold text-gray-300 uppercase tracking-wider">Recent Chats</h2>
            <ul className="mt-2 space-y-1">
                {sessions.length > 0 ? sessions.map((session) => (
                    <li key={session._id}>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-2 text-white hover:bg-green-700 hover:text-white",
                                currentChatId === session._id && "bg-green-700"
                            )}
                            onClick={() => loadChat(session._id)}
                            disabled={isLoadingHistory}
                        >
                            <MessageSquare className="h-4 w-4" />
                            <span className="truncate">{session.title}</span>
                        </Button>
                    </li>
                )) : (
                    <p className="px-4 text-sm text-gray-400">No recent chats.</p>
                )}
            </ul>
        </div>
        <div className="p-2 border-t border-green-700">
            <Button variant="ghost" className="w-full justify-start gap-2 text-white hover:bg-green-700 hover:text-white">
                <User className="h-5 w-5" />
                Profile
            </Button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="h-8 w-8">
                    <Menu className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-bold">Chat</h2>
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <div className="space-y-6 max-w-3xl mx-auto">
                {messages.length === 0 && !isLoading && !isLoadingHistory && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                        <div className="p-4 bg-green-500 rounded-full">
                            <Bot className="h-12 w-12 text-white" />
                        </div>
                        <h2 className="mt-6 text-2xl font-bold text-gray-700">ChatZone AI</h2>
                        <p className="text-gray-500">Start a conversation to begin.</p>
                    </div>
                )}
                 {isLoadingHistory && (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                )}
                {!isLoadingHistory && messages.map((message, index) => (
                    <div key={index} className={cn("flex items-start gap-4", message.role === "user" && "justify-end")}>
                    {message.role === "assistant" && (
                        <Avatar className="h-8 w-8 border-none bg-green-500 text-white">
                            <AvatarFallback className="bg-transparent">
                                <Bot className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div className={cn("max-w-[75%] rounded-lg p-3 shadow-sm", message.role === "user" ? "bg-green-600 text-white" : "bg-white text-gray-800")}>
                        {message.role === 'assistant' && isLoading && index === messages.length - 1 ? (
                            <Typewriter text={message.content} />
                        ) : (
                            <p className="text-sm leading-relaxed break-words">{message.content}</p>
                        )}
                    </div>
                    {message.role === "user" && (
                        <Avatar className="h-8 w-8 border bg-white">
                            <AvatarFallback className="bg-gray-200 text-gray-600">
                                <User className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4">
                        <Avatar className="h-8 w-8 border-none bg-green-500 text-white">
                            <AvatarFallback className="bg-transparent">
                                <Bot className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="bg-white rounded-lg p-3 flex items-center space-x-2 shadow-sm">
                           <Loader2 className="h-5 w-5 animate-spin text-green-600" />
                           <span className="text-sm text-gray-500">ChatZone AI is thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>

        <div className="border-t p-4 bg-white">
            <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSendMessage} className="relative">
                <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Send a message..."
                    className="flex-1 resize-none rounded-full bg-gray-100 border-gray-300 focus:border-green-500 focus:ring-green-500 pl-4 pr-12 py-3 min-h-0 h-12"
                    rows={1}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                        }
                    }}
                    disabled={isLoading || isLoadingHistory}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Button type="submit" size="icon" className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700 text-white" disabled={isLoading || isLoadingHistory || !input.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send</span>
                    </Button>
                </div>
                </form>
            </div>
        </div>
      </main>
    </div>
  );
}
 