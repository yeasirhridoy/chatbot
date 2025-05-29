<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('sidebar defaults to collapsed for guests', function () {
    $response = $this->get('/');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('sidebarOpen', false)
    );
});

test('sidebar defaults to expanded for authenticated users without cookie', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('sidebarOpen', true)
    );
});

test('sidebar respects cookie preference for guests', function () {
    // Test with cookie set to true
    $response = $this->call('GET', '/', [], ['sidebar_state' => 'true']);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('sidebarOpen', true)
    );

    // Test with cookie set to false
    $response = $this->call('GET', '/', [], ['sidebar_state' => 'false']);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('sidebarOpen', false)
    );
});

test('sidebar respects cookie preference for authenticated users', function () {
    $user = User::factory()->create();

    // Test with cookie set to false
    $response = $this->actingAs($user)
        ->call('GET', '/', [], ['sidebar_state' => 'false']);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('sidebarOpen', false)
    );

    // Test with cookie set to true
    $response = $this->actingAs($user)
        ->call('GET', '/', [], ['sidebar_state' => 'true']);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('sidebarOpen', true)
    );
});
