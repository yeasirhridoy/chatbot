<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use OpenAI\Laravel\Facades\OpenAI;

class ChatController extends Controller
{
    use AuthorizesRequests;

    public function index()
    {
        return Inertia::render('chat', [
            'chat' => null,
        ]);
    }

    public function show(Chat $chat)
    {
        $this->authorize('view', $chat);

        $chat->load('messages');

        return Inertia::render('chat', [
            'chat' => $chat,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
            'firstMessage' => 'nullable|string',
        ]);

        $title = $request->title;
        
        // If no title but firstMessage provided, use first 50 chars as title
        if (!$title && $request->firstMessage) {
            $title = substr($request->firstMessage, 0, 50) . (strlen($request->firstMessage) > 50 ? '...' : '');
        }

        $chat = Auth::user()->chats()->create([
            'title' => $title,
        ]);

        // If firstMessage provided, save it and trigger streaming via URL parameter
        if ($request->firstMessage) {
            // Save the first message
            $chat->messages()->create([
                'type' => 'prompt',
                'content' => $request->firstMessage,
            ]);
            
            return redirect()->route('chat.show', $chat)->with('stream', true);
        }

        return redirect()->route('chat.show', $chat);
    }

    public function destroy(Chat $chat)
    {
        $this->authorize('view', $chat);

        $chat->delete();

        return redirect()->route('chat.index');
    }

    public function stream(Request $request, ?Chat $chat = null)
    {
        if ($chat) {
            $this->authorize('view', $chat);
        }

        return response()->stream(function () use ($request, $chat) {
            $messages = $request->input('messages', []);

            if (empty($messages)) {
                return;
            }

            // Only save messages if we have an existing chat (authenticated user with saved chat)
            if ($chat) {
                foreach ($messages as $message) {
                    // Only save if message doesn't have an ID (not from database)
                    if (!isset($message['id'])) {
                        $chat->messages()->create([
                            'type' => $message['type'],
                            'content' => $message['content'],
                        ]);
                    }
                }
            }

            // Prepare messages for OpenAI
            $openAIMessages = collect($messages)
                ->map(fn ($message) => [
                    'role' => $message['type'] === 'prompt' ? 'user' : 'assistant',
                    'content' => $message['content'],
                ])
                ->toArray();

            // Stream response from OpenAI
            $fullResponse = '';

            if (app()->environment('testing') || ! config('openai.api_key')) {
                // Mock response for testing or when API key is not set
                $fullResponse = 'This is a test response.';
                echo $fullResponse;
                ob_flush();
                flush();
            } else {
                try {
                    $stream = OpenAI::chat()->createStreamed([
                        'model' => 'gpt-4.1-nano',
                        'messages' => $openAIMessages,
                    ]);

                    foreach ($stream as $response) {
                        $chunk = $response->choices[0]->delta->content;
                        if ($chunk !== null) {
                            $fullResponse .= $chunk;
                            echo $chunk;
                            ob_flush();
                            flush();
                        }
                    }
                } catch (\Exception $e) {
                    $fullResponse = 'Error: Unable to generate response.';
                    echo $fullResponse;
                    ob_flush();
                    flush();
                }
            }

            // Save the AI response to database if authenticated
            if ($chat && $fullResponse) {
                $chat->messages()->create([
                    'type' => 'response',
                    'content' => $fullResponse,
                ]);
            }
        }, 200, [
            'Cache-Control' => 'no-cache',
            'Content-Type' => 'text/event-stream',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function generateChatTitle(array $messages): string
    {
        $firstPrompt = collect($messages)
            ->where('type', 'prompt')
            ->first();

        if ($firstPrompt) {
            return substr($firstPrompt['content'], 0, 50).'...';
        }

        return 'New Chat';
    }
}
