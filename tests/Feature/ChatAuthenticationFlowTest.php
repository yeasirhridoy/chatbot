<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatAuthenticationFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_anonymous_user_redirected_to_login_when_creating_chat(): void
    {
        $response = $this->post('/chat');

        $response->assertRedirect('/login');
    }

    public function test_anonymous_user_redirected_to_login_when_viewing_specific_chat(): void
    {
        $response = $this->get('/chat/1');

        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_access_chat_routes(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/');
        $response->assertStatus(200);

        $response = $this->actingAs($user)->post('/chat');
        $response->assertRedirect(); // Redirects to new chat
    }

    public function test_anonymous_user_can_access_main_chat_page(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('chat')
            ->has('chats', 0) // No chats for anonymous users
        );
    }

    public function test_anonymous_user_can_stream_without_authentication(): void
    {
        $response = $this->post('/chat/stream', [
            'messages' => [
                ['type' => 'prompt', 'content' => 'Hello'],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/event-stream; charset=UTF-8');
    }
}
