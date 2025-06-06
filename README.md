# Laravel Chat Demo with useStream

A real-time chat application demonstrating the power of Laravel's `useStream` hook for React applications. This demo showcases how to build a ChatGPT-like interface with streaming responses, message persistence, and authentication support.

## Video Tutorial

[YouTube Video Placeholder - Add your embed here]

## Features

- 🚀 Real-time streaming responses using Server-Sent Events (SSE)
- 💬 ChatGPT-like interface with message history
- 🔐 Optional authentication with message persistence
- 🎨 Beautiful UI with Tailwind CSS v4 and shadcn/ui
- 📱 Responsive design with mobile support
- 🌓 Dark/light mode with system preference detection

## Quick Start

1. Clone the repository and install dependencies:

```bash
composer install
npm install
```

2. Set up your environment:

```bash
cp .env.example .env
php artisan key:generate
```

3. Configure your OpenAI API key in `.env`:

```env
OPENAI_API_KEY=your-api-key-here
```

4. Run migrations and start the development server:

```bash
php artisan migrate
composer dev
```

## Using the useStream Hook

The `useStream` hook from `@laravel/stream-react` makes it incredibly simple to consume streamed responses in your React application. Here's how this demo implements it:

### Basic Chat Implementation

```tsx
import { useStream } from '@laravel/stream-react';

function Chat() {
    const [messages, setMessages] = useState([]);
    const { data, send, isStreaming } = useStream('/chat/stream');

    const handleSubmit = (e) => {
        e.preventDefault();
        const query = e.target.query.value;

        // Add user message to local state
        const newMessage = { type: 'prompt', content: query };
        setMessages([...messages, newMessage]);

        // Send all messages to the stream
        send({ messages: [...messages, newMessage] });
        
        e.target.reset();
    };

    return (
        <div>
            {/* Display messages */}
            {messages.map((msg, i) => (
                <div key={i}>{msg.content}</div>
            ))}
            
            {/* Show streaming response */}
            {data && <div>{data}</div>}
            
            {/* Input form */}
            <form onSubmit={handleSubmit}>
                <input name="query" disabled={isStreaming} />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}
```

### Key Concepts

1. **Stream URL**: The hook connects to your Laravel endpoint that returns a streamed response
2. **Sending Data**: The `send` method posts JSON data to your stream endpoint
3. **Streaming State**: Use `isStreaming` to show loading indicators or disable inputs
4. **Response Accumulation**: The `data` value automatically accumulates the streamed response

### Backend Stream Endpoint

On the Laravel side, create a streaming endpoint:

```php
public function stream(Request $request)
{
    return response()->stream(function () use ($request) {
        $messages = $request->input('messages', []);
        
        // Stream response from OpenAI
        $stream = OpenAI::chat()->createStreamed([
            'model' => 'gpt-4',
            'messages' => $messages,
        ]);

        foreach ($stream as $response) {
            $chunk = $response->choices[0]->delta->content;
            if ($chunk !== null) {
                echo $chunk;
                ob_flush();
                flush();
            }
        }
    }, 200, [
        'Content-Type' => 'text/event-stream',
        'Cache-Control' => 'no-cache',
        'X-Accel-Buffering' => 'no',
    ]);
}
```

### Advanced Features in This Demo

- **Authentication Support**: Authenticated users get their chats persisted to the database
- **Dynamic Routing**: Different stream URLs for authenticated vs anonymous users
- **Message Persistence**: Completed responses are added to the message history
- **Error Handling**: Graceful fallbacks for API failures

## Project Structure

```
resources/js/
├── pages/
│   └── chat.tsx          # Main chat component with useStream
├── components/
│   ├── conversation.tsx  # Message display component
│   └── ui/              # shadcn/ui components
└── layouts/
    └── app-layout.tsx   # Main application layout
```

## Learn More

- [Laravel Stream Documentation](https://github.com/laravel/stream)
- [Server-Sent Events in Laravel](https://laravel.com/docs/responses#event-streams)
- [OpenAI PHP Client](https://github.com/openai-php/client)

## License

This demo is open-sourced software licensed under the [MIT license](LICENSE.md).