import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    currentChatId?: number;
    className?: string;
}

export default ({ children, breadcrumbs, currentChatId, className, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} currentChatId={currentChatId} className={className} {...props}>
        {children}
    </AppLayoutTemplate>
);
