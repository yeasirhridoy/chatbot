import Conversation from '@/components/conversation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router, usePage } from '@inertiajs/react';
import { useStream } from '@laravel/stream-react';
import { Info } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

type Message = {
    id?: number;
    type: 'response' | 'error' | 'prompt';
    content: string;
};

type ChatType = {
    id: number;
    title: string;
    messages: Message[];
    created_at: string;
    updated_at: string;
};

type PageProps = {
    auth: {
        user?: {
            id: number;
            name: string;
            email: string;
        };
    };
    chat?: ChatType;
    flash?: {
        stream?: boolean;
    };
};

function ChatWithStream({ chat, auth, flash }: { chat: ChatType | undefined; auth: PageProps['auth']; flash: PageProps['flash'] }) {
    const [messages, setMessages] = useState<Message[]>(chat?.messages || []);
    const inputRef = useRef<HTMLInputElement>(null);

    const currentChatId = chat?.id || null;
    const streamUrl = currentChatId ? `/chat/${currentChatId}/stream` : '/chat/stream';

    const { data, send, isStreaming, isFetching, id } = useStream(streamUrl);

    // Auto-focus input and handle auto-streaming on mount
    useEffect(() => {
        inputRef.current?.focus();
        
        // Auto-stream if we have a chat with exactly 1 message (newly created chat)
        // OR if flash.stream is true (fallback)
        const shouldAutoStream = (chat?.messages?.length === 1) || (flash?.stream && chat?.messages && chat.messages.length > 0);
        
        if (shouldAutoStream) {
            setTimeout(() => {
                send({ messages: chat.messages });
            }, 100);
        }
    }, [chat?.messages, flash?.stream, send]); // Only run on mount

    // Handle streaming response
    useEffect(() => {
        if (!isStreaming && data && data.trim()) {
            setMessages((currentMessages) => {
                const hasResponse = currentMessages.some((m) => m.content === data);
                if (hasResponse) {
                    return currentMessages;
                }

                return [
                    ...currentMessages,
                    {
                        type: 'response',
                        content: data,
                    },
                ];
            });
            
            // Focus the input after streaming is complete
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isStreaming, data]);

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.querySelector('input') as HTMLInputElement;
        const query = input?.value.trim();

        if (!query) return;

        const newMessage: Message = {
            type: 'prompt',
            content: query,
        };

        if (!auth.user) {
            const newMessages = [...messages, newMessage];
            setMessages(newMessages);
            send({ messages: newMessages });
        } else if (!chat) {
            router.post('/chat', {
                firstMessage: query,
            }, {
                preserveState: false,
            });
        } else {
            const newMessages = [...messages, newMessage];
            setMessages(newMessages);
            send({ messages: newMessages });
        }

        input.value = '';
    };

    return (
        <>
            <Head title={chat?.title || 'Chat'} />
            <AppLayout
                currentChatId={chat?.id}
                className="flex h-[calc(100vh-theme(spacing.4))] flex-col overflow-hidden md:h-[calc(100vh-theme(spacing.8))]"
            >
                {!auth.user && (
                <div className="bg-background flex-shrink-0 border-b p-4">
                    <Alert className="mx-auto max-w-3xl">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            You're chatting anonymously. Your conversation won't be saved.
                            <Button variant="link" className="h-auto p-0 text-sm" onClick={() => router.visit('/login')}>
                                Sign in to save your chats
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            )}

            <Conversation messages={messages} streamingData={data} isStreaming={isStreaming} streamId={id} />

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
        </>
    );
}

export default function Chat() {
    const { auth, chat, flash } = usePage<PageProps>().props;

    // Use the chat ID as a key to force complete re-creation of the ChatWithStream component
    // This ensures useStream is completely reinitialized with the correct URL
    const key = chat?.id ? `chat-${chat.id}` : 'no-chat';

    return <ChatWithStream key={key} chat={chat} auth={auth} flash={flash} />;
}
