import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

interface AppSidebarLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    currentChatId?: number;
    className?: string;
}

export default function AppSidebarLayout({ children, className }: PropsWithChildren<AppSidebarLayoutProps>) {
    return (
        <AppShell variant="sidebar">
            <AppContent variant="sidebar" className={className}>
                {children}
            </AppContent>
        </AppShell>
    );
}
