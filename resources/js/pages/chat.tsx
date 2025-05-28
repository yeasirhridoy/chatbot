import Conversation from '@/components/conversation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { router, usePage } from '@inertiajs/react';
import { useStream } from '@laravel/stream-react';
import { Info } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

type Message = {
    id?: number;
    type: 'response' | 'error' | 'prompt';
    content: string;
    saved?: boolean;
};

type ChatType = {
    id: number;
    title: string;
    messages: Message[];
    created_at: string;
    updated_at: string;
};

type PageProps = {
    auth: any;
    chat?: ChatType;
    chats: ChatType[];
};

export default function Chat() {
    const { auth, chat, chats } = usePage<PageProps>().props;
    const [messages, setMessages] = useState<Message[]>(chat?.messages || []);
    const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const streamUrl = chat ? `/chat/${chat.id}/stream` : '/chat/stream';
    const { data, send, cancel, isStreaming, isFetching, id } = useStream(streamUrl);

    // Combine saved messages with session messages
    const allMessages = [...messages, ...sessionMessages];

    useEffect(() => {
        // Reset messages when chat changes
        setMessages(chat?.messages || []);
        setSessionMessages([]);
        // Clear any streaming data when switching chats
        if (data) {
            cancel();
        }
        // Focus input when chat changes
        inputRef.current?.focus();
    }, [chat?.id]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // When streaming completes, add the response to messages and focus input
    useEffect(() => {
        if (!isStreaming && data && sessionMessages.length > 0) {
            const lastMessage = sessionMessages[sessionMessages.length - 1];
            if (lastMessage.type === 'prompt' && !sessionMessages.some((m) => m.type === 'response' && m.content === data)) {
                setSessionMessages((prev) => [
                    ...prev,
                    {
                        type: 'response',
                        content: data,
                    },
                ]);
                // Focus input after response is added
                setTimeout(() => inputRef.current?.focus(), 100);
            }
        }
    }, [isStreaming]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                cancel();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [cancel]);


    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.querySelector('input') as HTMLInputElement;
        const query = input?.value.trim();

        if (!query) return;

        const toAdd: Message[] = [];

        // Don't add previous response when sending new message

        // Add new prompt
        toAdd.push({
            type: 'prompt',
            content: query,
        });

        // For anonymous users or new chats, use session messages
        if (!chat) {
            const newSessionMessages = [...sessionMessages, ...toAdd];
            setSessionMessages(newSessionMessages);
            send({ messages: newSessionMessages });
        } else {
            // For saved chats, combine all messages
            const allCurrentMessages = [...messages, ...sessionMessages, ...toAdd];
            setSessionMessages([...sessionMessages, ...toAdd]);
            send({ messages: allCurrentMessages });
        }
        input.value = '';
    };

    const startNewChat = () => {
        if (!auth.user) {
            // If not authenticated, redirect to login
            router.visit('/login');
        } else {
            // If authenticated, create a new chat
            router.post('/chat', {});
        }
    };

    return (
        <AppLayout chats={chats} currentChatId={chat?.id} onNewChat={startNewChat} className="flex h-[calc(100vh-theme(spacing.4))] md:h-[calc(100vh-theme(spacing.8))] flex-col overflow-hidden">
            {/* Sticky Header */}
            {!auth.user && !chat && (
                <div className="bg-background flex-shrink-0 border-b p-4">
                    <Alert className="mx-auto max-w-3xl">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            You're chatting anonymously. Your conversation won't be saved.
                            <Button variant="link" className="h-auto p-0 text-sm" onClick={startNewChat}>
                                Sign in to save your chats
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            {/* Scrollable Conversation Area */}
            <Conversation messages={allMessages} streamingData={data} isStreaming={isStreaming} streamId={id} />

            {/* Sticky Input Footer */}
            <div className="bg-background flex-shrink-0 border-t">
                <div className="mx-auto max-w-3xl p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="flex gap-2">
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder="Type a message..."
                                className="flex-1"
                                disabled={isStreaming || isFetching}
                            />
                            <Button type="submit" disabled={isStreaming || isFetching}>
                                Send
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
