<?php

namespace Tests\Unit;

use App\Models\Chat;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChatPersistenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_belongs_to_user(): void
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);

        $this->assertTrue($chat->user->is($user));
    }

    public function test_chat_has_many_messages(): void
    {
        $chat = Chat::factory()->create();
        $messages = Message::factory()->count(3)->create(['chat_id' => $chat->id]);

        $this->assertCount(3, $chat->messages);
        $this->assertTrue($chat->messages->first()->is($messages->first()));
    }

    public function test_message_belongs_to_chat(): void
    {
        $chat = Chat::factory()->create();
        $message = Message::factory()->create(['chat_id' => $chat->id]);

        $this->assertTrue($message->chat->is($chat));
    }

    public function test_user_has_many_chats(): void
    {
        $user = User::factory()->create();
        $chats = Chat::factory()->count(3)->create(['user_id' => $user->id]);

        $this->assertCount(3, $user->chats);
    }

    public function test_chat_title_can_be_null(): void
    {
        $chat = Chat::factory()->create(['title' => null]);

        $this->assertNull($chat->title);
        $this->assertDatabaseHas('chats', [
            'id' => $chat->id,
            'title' => null,
        ]);
    }

    public function test_message_types_are_validated(): void
    {
        $validTypes = ['prompt', 'response', 'error'];

        foreach ($validTypes as $type) {
            $message = Message::factory()->create(['type' => $type]);
            $this->assertEquals($type, $message->type);
        }
    }

    public function test_cascading_delete_removes_messages_when_chat_deleted(): void
    {
        $chat = Chat::factory()->create();
        $messages = Message::factory()->count(3)->create(['chat_id' => $chat->id]);

        $this->assertDatabaseCount('messages', 3);

        $chat->delete();

        $this->assertDatabaseCount('messages', 0);
    }

    public function test_cascading_delete_removes_chats_when_user_deleted(): void
    {
        $user = User::factory()->create();
        $chat = Chat::factory()->create(['user_id' => $user->id]);
        Message::factory()->count(2)->create(['chat_id' => $chat->id]);

        $this->assertDatabaseCount('chats', 1);
        $this->assertDatabaseCount('messages', 2);

        $user->delete();

        $this->assertDatabaseCount('chats', 0);
        $this->assertDatabaseCount('messages', 0);
    }
}
