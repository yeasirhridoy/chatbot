<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_homepage_shows_chat_interface(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('chat')
            ->where('chat', null)
        );
    }

    public function test_authenticated_user_can_fetch_chats_via_api(): void
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id, 'title' => 'Test Chat']);

        $response = $this->actingAs($user)->get('/api/chats');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJson([
            [
                'id' => $chat->id,
                'title' => 'Test Chat',
            ]
        ]);
    }

    public function test_user_can_view_specific_chat(): void
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->get("/chat/{$chat->id}");

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('chat')
            ->where('chat.id', $chat->id)
        );
    }

    public function test_user_cannot_view_other_users_chat(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $otherUser->id]);

        $response = $this->actingAs($user)->get("/chat/{$chat->id}");

        $response->assertStatus(403);
    }

    public function test_authenticated_user_can_create_new_chat(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/chat', [
            'title' => 'New Chat',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('chats', [
            'user_id' => $user->id,
            'title' => 'New Chat',
        ]);
    }

    public function test_unauthenticated_user_cannot_create_chat(): void
    {
        $response = $this->post('/chat', [
            'title' => 'New Chat',
        ]);

        $response->assertRedirect('/login');
    }
}
