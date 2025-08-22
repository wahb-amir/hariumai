

"use client";

import * as React from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarInset,
} from "@/components/ui/sidebar";
import {
  Users,
  Volume2,
  User as UserIcon,
  LogOut,
  Cog,
  Menu,
  Moon,
  MessageSquare,
  Image as ImageIcon,
  LogIn,
  PlusCircle,
  History,
  ChevronDown,
  MoreVertical,
  Search,
  BrainCircuit,
  Clapperboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HariumLogo } from "./harium-logo";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { getAuth, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase";
import { getChatSessions } from "@/ai/flows/get-chat-sessions";
import type { GetChatSessionsOutput } from "@/ai/flows/get-chat-sessions";
import { v4 as uuidv4 } from "uuid";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "./ui/dropdown-menu";
import { type ChatMode } from "./chat-panel";

type HariumAiLayoutClientProps = {
    children?: React.ReactNode;
    model: string;
    onModelChange: (model: string) => void;
    chatMode: ChatMode;
    onChatModeChange: (mode: ChatMode) => void;
    voiceResponses: boolean;
    onVoiceResponsesChange: (enabled: boolean) => void;
}

function HariumAiLayoutClient({ children, model, onModelChange, chatMode, onChatModeChange, voiceResponses, onVoiceResponsesChange }: HariumAiLayoutClientProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [chatSessions, setChatSessions] = React.useState<GetChatSessionsOutput>([]);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading) {
      let currentUserId = user?.uid;
      if (!currentUserId) {
        currentUserId = localStorage.getItem('anonymous_user_id') || uuidv4();
        localStorage.setItem('anonymous_user_id', currentUserId);
      }
      setUserId(currentUserId);
    }
  }, [user, authLoading]);

  const fetchSessions = React.useCallback(async () => {
    if (userId) {
      try {
        const sessions = await getChatSessions({ userId });
        setChatSessions(sessions);
      } catch (error) {
        console.error("Failed to fetch chat sessions:", error);
      }
    }
  }, [userId]);

  React.useEffect(() => {
    fetchSessions();
    const handleChatUpdated = () => {
      fetchSessions();
    };
    window.addEventListener('chat-updated', handleChatUpdated);
    return () => {
        window.removeEventListener('chat-updated', handleChatUpdated);
    };
  }, [userId, fetchSessions]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
        if (app) {
            const auth = getAuth(app);
            await signOut(auth);
            toast({
                title: 'Signed Out',
                description: 'You have been successfully signed out.'
            });
            localStorage.removeItem('anonymous_user_id');
            router.push('/login');
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to sign out.'
        })
    }
  }

  const handleModelChange = (newModel: string) => {
    if (onModelChange) {
        onModelChange(newModel);
    }
    toast({
        title: "Model Switched",
        description: `Switched to ${newModel}`,
    });
    router.push('/');
  }

  const handleSetMode = (mode: ChatMode) => {
    onChatModeChange(mode);
    if (pathname !== '/') {
        router.push('/');
    }
  }

  const mainContent = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { model, chatMode, onChatModeChange, voiceResponses });
    }
    return child;
  });

  const models = ["ha 1.1", "1.2ot", "1.2otpro", "1.3 (In Testing)"];

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <HariumLogo />
            <h1 className="text-lg font-black">HariumAI</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarGroup>
                <SidebarMenuItem>
                    <Link href="/" className="w-full">
                        <SidebarMenuButton>
                        <PlusCircle />
                        New Chat
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel className="flex items-center gap-2"><History className="h-4 w-4" />Recent Chats</SidebarGroupLabel>
              {chatSessions.map(session => (
                 <SidebarMenuItem key={session.sessionId}>
                    <Link href={`/chat/${session.sessionId}`} className="w-full">
                        <SidebarMenuButton isActive={pathname === `/chat/${session.sessionId}`}>
                            <MessageSquare />
                            <span className="truncate">{session.title}</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
              ))}
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Features</SidebarGroupLabel>
              <SidebarMenuItem>
                 <Link href="/generation/image" className="w-full">
                    <SidebarMenuButton isActive={pathname === '/generation/image'}>
                      <ImageIcon />
                      Image Generation
                    </SidebarMenuButton>
                  </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <Users />
                  Live Group Chat (Coming Soon)
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Accessibility</SidebarGroupLabel>
              <SidebarMenuItem>
                <div className="flex items-center justify-between w-full p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span>Voice Responses</span>
                  </div>
                  <Switch
                    checked={voiceResponses}
                    onCheckedChange={onVoiceResponsesChange}
                  />
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <div className="flex items-center justify-between w-full p-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <span>Dark Mode</span>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
                </div>
              </SidebarMenuItem>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Profile</SidebarGroupLabel>
              {user ? (
                <>
                <SidebarMenuItem>
                    <SidebarMenuButton>
                    <UserIcon />
                    <span className="truncate">{user.email || user.phoneNumber}</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout}>
                    <LogOut />
                    Logout
                    </SidebarMenuButton>
                </SidebarMenuItem>
                </>
              ) : (
                <SidebarMenuItem>
                    <Link href="/login" className="w-full">
                        <SidebarMenuButton>
                            <LogIn />
                            Login
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
              )}
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden">
              <Menu />
            </SidebarTrigger>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1 h-auto font-black text-lg">
                        Harium AI{" "}
                        <span className="text-xs text-muted-foreground font-normal ml-2">
                            ({model})
                        </span>
                        <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {models.map(m => (
                        <DropdownMenuItem key={m} onSelect={() => handleModelChange(m)} disabled={m === model}>
                            {m}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">Options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>AI Modes</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={chatMode === 'chit-chat'} onSelect={() => handleSetMode('chit-chat')}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Chit Chatting</span>
                    </DropdownMenuCheckboxItem>
                     <DropdownMenuCheckboxItem checked={chatMode === 'search-web'} onSelect={() => handleSetMode('search-web')}>
                        <Search className="mr-2 h-4 w-4" />
                        <span>Search Web</span>
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={chatMode === 'deep-research'} onSelect={() => handleSetMode('deep-research')}>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        <span>Deep Research</span>
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 flex flex-col relative">
          {mainContent}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


type HariumAiLayoutProps = {
    children?: React.ReactNode;
    model: string;
    onModelChange: (model: string) => void;
    chatMode: ChatMode;
    onChatModeChange: (mode: ChatMode) => void;
};

export function HariumAiLayout({ children, model, onModelChange, chatMode, onChatModeChange }: HariumAiLayoutProps) {
    const [voiceResponses, setVoiceResponses] = React.useState(false);
    return (
        <AuthProvider>
            <HariumAiLayoutClient 
                model={model} 
                onModelChange={onModelChange} 
                chatMode={chatMode} 
                onChatModeChange={onChatModeChange}
                voiceResponses={voiceResponses}
                onVoiceResponsesChange={setVoiceResponses}
            >
                {children}
            </HariumAiLayoutClient>
        </AuthProvider>
    )
}
