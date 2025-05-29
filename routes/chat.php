<?php

use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;

Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
Route::post('/chat/stream', [ChatController::class, 'stream'])->name('chat.stream');

Route::middleware('auth')->group(function () {
    Route::post('/chat', [ChatController::class, 'store'])->name('chat.store');
    Route::get('/chat/{chat}', [ChatController::class, 'show'])->name('chat.show');
    Route::delete('/chat/{chat}', [ChatController::class, 'destroy'])->name('chat.destroy');
    Route::post('/chat/{chat}/stream', [ChatController::class, 'stream'])->name('chat.show.stream');
});
