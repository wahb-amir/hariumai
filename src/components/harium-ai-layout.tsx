
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
  VolumeX,
  User as UserIcon,
  LogOut,
  Cog,
  Menu,
  Moon,
  MessageSquare,
  Image as ImageIcon,
  LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChatPanel } from "./chat-panel";
import { HariumLogo } from "./harium-logo";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { getAuth, signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { app } from "@/lib/firebase";


function AuthWrapper({ children }: { children: React.ReactNode}) {
    return (
        <AuthProvider>
            {children}
        </AuthProvider>
    )
}

function HariumAiLayoutClient({ children }: { children?: React.ReactNode}) {
  const [voiceResponses, setVoiceResponses] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

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

  const mainContent = children || <ChatPanel />;

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
              <SidebarGroupLabel>Features</SidebarGroupLabel>
              <SidebarMenuItem>
                 <Link href="/" className="w-full">
                    <SidebarMenuButton isActive={pathname === '/'}>
                      <MessageSquare />
                      AI Chat
                    </SidebarMenuButton>
                 </Link>
              </SidebarMenuItem>
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
                    <VolumeX className="h-4 w-4" />
                    <span>Voice Responses</span>
                  </div>
                  <Switch
                    checked={voiceResponses}
                    onCheckedChange={setVoiceResponses}
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
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupLabel>AI Model</SidebarGroupLabel>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <Cog />
                  ha-1.1
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarGroup>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="p-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden">
              <Menu />
            </SidebarTrigger>
            <h2 className="font-black text-lg">
              Harium AI{" "}
              <span className="text-xs text-muted-foreground font-normal">
                (ha-1.4)
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-2"></div>
        </header>
        <main className="flex-1 flex flex-col">
          {mainContent}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}


export function HariumAiLayout({ children }: { children?: React.ReactNode}) {
    return (
        <AuthProvider>
            <HariumAiLayoutClient>{children}</HariumAiLayoutClient>
        </AuthProvider>
    )
}
