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
        $chats = Auth::check()
            ? Auth::user()->chats()->with('messages')->latest()->get()
            : [];

        return Inertia::render('chat', [
            'chats' => $chats,
        ]);
    }

    public function show(Chat $chat)
    {
        $this->authorize('view', $chat);

        return Inertia::render('chat', [
            'chat' => $chat->load('messages'),
            'chats' => Auth::user()->chats()->latest()->get(),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'nullable|string|max:255',
        ]);

        $chat = Auth::user()->chats()->create([
            'title' => $request->title,
        ]);

        return redirect()->route('chat.show', $chat);
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
                    if (! isset($message['saved']) || ! $message['saved']) {
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
