import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { MessageSquare, Plus } from 'lucide-react';
import AppLogo from './app-logo';

// Main navigation removed - only showing chats

interface AppSidebarProps {
    chats?: any[];
    currentChatId?: number;
    onNewChat?: () => void;
}

export function AppSidebar({ chats = [], currentChatId, onNewChat }: AppSidebarProps) {
    const { auth } = usePage<any>().props;
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <div className="flex h-full flex-col px-3 py-2">
                    <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight">Chats</h2>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNewChat || (() => router.visit('/'))}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="space-y-1">
                            {chats.length === 0 ? (
                                <p className="text-muted-foreground py-2 text-sm">No chats yet</p>
                            ) : (
                                chats.map((chat) => (
                                    <Link
                                        key={chat.id}
                                        href={`/chat/${chat.id}`}
                                        className={cn(
                                            'hover:bg-accent flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                                            currentChatId === chat.id && 'bg-accent',
                                        )}
                                    >
                                        <MessageSquare className="h-4 w-4" />
                                        <span className="truncate">{chat.title || 'Untitled Chat'}</span>
                                    </Link>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </SidebarContent>

            <SidebarFooter>
                {auth.user ? (
                    <NavUser />
                ) : (
                    <div className="px-3 py-2">
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/login">Sign in</Link>
                        </Button>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
