import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

interface Chat {
    id: number;
    title: string;
    created_at: string;
    updated_at: string;
}

interface ChatListProps {
    currentChatId?: number;
    isAuthenticated: boolean;
}

// Simple in-memory cache
let chatCache: Chat[] = [];
let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

export default function ChatList({ currentChatId, isAuthenticated }: ChatListProps) {
    const [chats, setChats] = useState<Chat[]>(chatCache);
    const [loading, setLoading] = useState(false);
    const lastCurrentChatId = useRef<number | undefined>(undefined);

    const fetchChats = useCallback(async (force = false) => {
        if (!isAuthenticated) {
            setChats([]);
            chatCache = [];
            return;
        }
        
        const now = Date.now();
        if (!force && chatCache.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
            setChats(chatCache);
            return;
        }
        
        try {
            setLoading(true);
            const response = await fetch('/api/chats');
            const data = await response.json();
            chatCache = data;
            lastFetchTime = now;
            setChats(data);
        } catch (error) {
            // Silently handle fetch errors
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    // Only refresh when currentChatId changes to a new value (new chat created)
    useEffect(() => {
        if (currentChatId && currentChatId !== lastCurrentChatId.current) {
            lastCurrentChatId.current = currentChatId;
            // Check if this chat is already in our list
            if (!chats.some(chat => chat.id === currentChatId)) {
                fetchChats(true); // Force refresh for new chats
            }
        }
    }, [currentChatId, chats, fetchChats]);

    const handleNewChat = () => {
        if (!isAuthenticated) {
            router.visit('/login');
        } else {
            router.post('/chat', {}, {
                onSuccess: () => {
                    // Chats will refresh when currentChatId changes
                }
            });
        }
    };

    const handleDeleteChat = (chatId: number, event?: React.MouseEvent) => {
        event?.preventDefault();
        event?.stopPropagation();
        
        router.delete(`/chat/${chatId}`, {
            onSuccess: () => {
                // Force refresh the chat list
                fetchChats(true);
            }
        });
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Chats</h3>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={handleNewChat}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="space-y-1">
                    {loading && chats.length === 0 ? (
                        <p className="text-muted-foreground py-2 text-sm">Loading...</p>
                    ) : chats.length === 0 ? (
                        <p className="text-muted-foreground py-2 text-sm">No chats yet</p>
                    ) : (
                        chats.map((chat) => (
                            <div key={chat.id} className="group relative">
                                <Link
                                    href={`/chat/${chat.id}`}
                                    className={cn(
                                        'hover:bg-accent flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                                        currentChatId === chat.id && 'bg-accent',
                                    )}
                                    preserveState={false}
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    <span className="truncate flex-1">{chat.title}</span>
                                </Link>
                                
                                {/* Delete button - only visible on hover */}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete "{chat.title}"? This action cannot be undone and will permanently delete the chat and all its messages.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteChat(chat.id)}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}