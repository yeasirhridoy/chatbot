import { useEventStream } from '@laravel/stream-react';

interface ChatTitleUpdaterProps {
    chatId: number;
    currentTitle: string;
    onTitleUpdate?: (title: string) => void;
}

export default function ChatTitleUpdater({ chatId, currentTitle, onTitleUpdate }: ChatTitleUpdaterProps) {
    const { message } = useEventStream(`/chat/${chatId}/title-stream`, {
        event: 'title-update',
        onMessage: (event) => {
            console.log('Raw event received:', event);
            console.log('Event data:', event.data);
            console.log('Event type:', event.type);
            console.log('Current title when received:', currentTitle);
            
            try {
                const parsed = JSON.parse(event.data);
                console.log('Parsed data:', parsed);
                
                if (parsed.title) {
                    console.log('Updating conversation title to:', parsed.title);
                    console.log('Callback function:', onTitleUpdate);
                    
                    // Update the page title
                    document.title = `${parsed.title} - LaraChat`;
                    
                    // Update the conversation title via callback
                    if (onTitleUpdate) {
                        onTitleUpdate(parsed.title);
                        console.log('Callback called with:', parsed.title);
                    } else {
                        console.log('No callback function provided!');
                    }
                }
            } catch (error) {
                console.error('Error parsing title update:', error);
            }
        },
        onError: (error) => {
            console.error('EventStream error:', error);
        },
        onComplete: () => {
            console.log('Title stream completed');
        },
    });

    console.log('ChatTitleUpdater rendered with:', { chatId, currentTitle, hasCallback: !!onTitleUpdate });

    // Don't render anything - this is just a listener component
    return null;
}