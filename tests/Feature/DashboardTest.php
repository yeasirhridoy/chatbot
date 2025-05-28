<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('dashboard route no longer exists', function () {
    $this->get('/dashboard')->assertStatus(404);
});

test('authenticated users redirected to home after login', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect('/');
});
