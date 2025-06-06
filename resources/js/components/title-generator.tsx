import { useEventStream } from '@laravel/stream-react';
import { useState, useEffect } from 'react';

interface TitleGeneratorProps {
    chatId: number;
    onTitleUpdate: (title: string, isStreaming?: boolean) => void;
    onComplete: () => void;
}

export default function TitleGenerator({ chatId, onTitleUpdate, onComplete }: TitleGeneratorProps) {
    const [receivedTitle, setReceivedTitle] = useState<string>('');
    const [isAnimating, setIsAnimating] = useState<boolean>(false);

    // Use the corrected useEventStream configuration
    const { message } = useEventStream(`/chat/${chatId}/title-stream`, {
        eventName: "title-update",
        endSignal: "</stream>",
        onMessage: (event) => {
            console.log('TitleGenerator received event:', event.data);
            
            try {
                const parsed = JSON.parse(event.data);
                console.log('Parsed title:', parsed);
                
                if (parsed.title) {
                    console.log('Calling onTitleUpdate immediately with:', parsed.title);
                    onTitleUpdate(parsed.title, false);
                }
            } catch (error) {
                console.error('Error parsing title JSON:', error);
            }
        },
        onComplete: () => {
            console.log('Title generation complete');
            onComplete();
        },
        onError: (error) => {
            console.error('Title generation error:', error);
            onComplete();
        },
    });

    // Animate the title character by character when received
    useEffect(() => {
        console.log('Animation effect triggered:', { isAnimating, receivedTitle });
        
        if (!isAnimating || !receivedTitle) {
            console.log('Skipping animation - isAnimating:', isAnimating, 'receivedTitle:', receivedTitle);
            return;
        }

        console.log('Starting title animation for:', receivedTitle);
        let currentIndex = 0;
        setStreamingTitle('');

        const interval = setInterval(() => {
            if (currentIndex <= receivedTitle.length) {
                const currentTitle = receivedTitle.slice(0, currentIndex);
                console.log('Animating title step:', currentTitle);
                setStreamingTitle(currentTitle);
                
                console.log('Calling onTitleUpdate with:', currentTitle, 'isStreaming:', currentIndex < receivedTitle.length);
                onTitleUpdate(currentTitle, currentIndex < receivedTitle.length);
                currentIndex++;
            } else {
                console.log('Animation complete, clearing interval');
                clearInterval(interval);
                setIsAnimating(false);
                // Final update with complete title
                console.log('Final title update:', receivedTitle);
                onTitleUpdate(receivedTitle, false);
            }
        }, 50); // 50ms per character

        return () => {
            console.log('Cleaning up animation interval');
            clearInterval(interval);
        };
    }, [receivedTitle, isAnimating, onTitleUpdate]);

    console.log('TitleGenerator active for chat:', chatId);
    console.log('EventStream URL:', `/chat/${chatId}/title-stream`);

    // This component doesn't render anything
    return null;
}