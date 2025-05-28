import StreamingIndicator from '@/components/streaming-indicator';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

type Message = {
    id?: number;
    type: 'response' | 'error' | 'prompt';
    content: string;
    saved?: boolean;
};

interface ConversationProps {
    messages: Message[];
    streamingData?: string;
    isStreaming: boolean;
    streamId?: number;
}

export default function Conversation({ messages, streamingData, isStreaming, streamId }: ConversationProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when messages change or during streaming
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length, streamingData]);

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="mx-auto max-w-3xl space-y-4 p-4">
                {messages.length === 0 && (
                    <p className="text-muted-foreground mt-8 text-center">
                        Type your message below and hit enter to send.
                    </p>
                )}
                {messages.map((message, index) => (
                    <div key={message.id || index} className={cn('relative', message.type === 'prompt' && 'flex justify-end')}>
                        <div
                            className={cn(
                                'inline-block max-w-[80%] rounded-lg p-3',
                                message.type === 'prompt' ? 'bg-primary text-primary-foreground' : 'bg-muted',
                            )}
                        >
                            {message.type === 'prompt' && (index === messages.length - 1 || index === messages.length - 2) && (
                                <StreamingIndicator id={streamId} className="absolute top-3 -left-8" />
                            )}
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                ))}
                {streamingData && isStreaming && (
                    <div className="relative">
                        <div className="bg-muted inline-block max-w-[80%] rounded-lg p-3">
                            <p className="whitespace-pre-wrap">{streamingData}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}