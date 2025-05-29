import { cn } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { Check, MessageSquare, Pencil, Plus, Trash2, X } from 'lucide-react';
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
import { Input } from './ui/input';
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
    const [editingChatId, setEditingChatId] = useState<number | null>(null);
    const lastCurrentChatId = useRef<number | undefined>(undefined);
    const editInputRef = useRef<HTMLInputElement>(null);
    
    const { data, setData, patch, processing } = useForm({
        title: '',
    });
    const { post: createChat, processing: createProcessing } = useForm();

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
            createChat('/chat', {}, {
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
            onBefore: () => {
                // Optimistically remove from local state
                setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
                // Clear cache to force fresh fetch next time
                chatCache = chatCache.filter(chat => chat.id !== chatId);
            },
            onError: () => {
                // If error, refresh to get correct state
                fetchChats(true);
            },
            onFinish: () => {
                // Refresh chat list to ensure consistency
                setTimeout(() => {
                    fetchChats(true);
                }, 100);
            },
            preserveScroll: true
        });
    };

    const handleEditClick = (chatId: number, currentTitle: string, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Start editing
        setEditingChatId(chatId);
        setData('title', currentTitle || '');
        // Focus the input after it's rendered
        setTimeout(() => {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }, 10);
    };

    const cancelEditing = () => {
        setEditingChatId(null);
        setData('title', '');
    };

    const saveTitle = (chatId: number) => {
        if (!data.title.trim() || processing) return;

        patch(`/chat/${chatId}`, {
            onSuccess: () => {
                // Update local state
                setChats(prevChats => 
                    prevChats.map(chat => 
                        chat.id === chatId 
                            ? { ...chat, title: data.title.trim() }
                            : chat
                    )
                );
                // Update cache
                chatCache = chatCache.map(chat => 
                    chat.id === chatId 
                        ? { ...chat, title: data.title.trim() }
                        : chat
                );
                setEditingChatId(null);
                setData('title', '');
            },
            onError: () => {
                // If error, refresh to get correct state
                fetchChats(true);
            },
            preserveState: true,
            preserveScroll: true,
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
                    disabled={createProcessing}
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
                            <div key={chat.id} className="group/chat relative">
                                {editingChatId === chat.id ? (
                                    // Edit mode
                                    <div className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm">
                                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                        <Input
                                            ref={editInputRef}
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    saveTitle(chat.id);
                                                } else if (e.key === 'Escape') {
                                                    cancelEditing();
                                                }
                                            }}
                                            className="h-6 flex-1 text-xs"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5 hover:bg-green-50 dark:hover:bg-green-950/20"
                                            onClick={() => saveTitle(chat.id)}
                                            disabled={processing}
                                        >
                                            <Check className="h-3 w-3 text-green-600 hover:text-green-700 transition-colors" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-5 w-5"
                                            onClick={cancelEditing}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground" />
                                        </Button>
                                    </div>
                                ) : (
                                    // View mode
                                    <>
                                        <Link
                                            href={`/chat/${chat.id}`}
                                            prefetch="hover"
                                            cacheFor="5m"
                                            className={cn(
                                                'hover:bg-accent flex items-center gap-2 rounded-lg px-2 py-1.5 pr-16 text-sm transition-colors relative',
                                                currentChatId === chat.id && 'bg-accent',
                                            )}
                                        >
                                            <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                            <span className="truncate max-w-[120px]">{chat.title}</span>
                                            {/* Fade overlay for long titles */}
                                            <div className={cn(
                                                "absolute right-16 top-0 bottom-0 w-8 bg-gradient-to-l to-transparent pointer-events-none transition-colors",
                                                currentChatId === chat.id 
                                                    ? "from-accent" 
                                                    : "from-sidebar group-hover/chat:from-accent"
                                            )} />
                                        </Link>
                                        
                                        {/* Edit and Delete buttons - only visible on hover of this specific chat */}
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 transition-all duration-200 group-hover/chat:opacity-100 hover:bg-green-50 dark:hover:bg-green-950/20"
                                                onClick={(e) => handleEditClick(chat.id, chat.title || 'Untitled Chat', e)}
                                            >
                                                <Pencil className="h-3 w-3 text-muted-foreground hover:text-green-600 transition-colors" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 transition-all duration-200 group-hover/chat:opacity-100 hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-3 w-3 text-muted-foreground transition-colors hover:text-destructive" />
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
                                                            className="bg-destructive text-white hover:bg-destructive/90 focus:ring-destructive"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}