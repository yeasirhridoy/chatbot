import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type User } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';
import ChatList from './chat-list';

interface AppSidebarProps {
    currentChatId?: number;
}

export function AppSidebar({ currentChatId }: AppSidebarProps) {
    const { auth } = usePage<{ auth: { user?: User } }>().props;
    
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
                <div className="px-3 py-2">
                    <ChatList 
                        currentChatId={currentChatId} 
                        isAuthenticated={!!auth.user} 
                    />
                </div>
            </SidebarContent>

            <SidebarFooter>
                {auth.user && <NavUser />}
            </SidebarFooter>
        </Sidebar>
    );
}