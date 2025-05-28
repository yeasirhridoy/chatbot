import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    chats?: any[];
    currentChatId?: number;
    onNewChat?: () => void;
    className?: string;
}

export default ({ children, breadcrumbs, chats, currentChatId, onNewChat, className, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} chats={chats} currentChatId={currentChatId} onNewChat={onNewChat} className={className} {...props}>
        {children}
    </AppLayoutTemplate>
);
