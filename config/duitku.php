<?php

return [
    'merchant_code' => env('DUITKU_MERCHANT_CODE', ''),
    'api_key' => env('DUITKU_API_KEY', ''),
    'env' => env('DUITKU_ENV', 'sandbox'), // 'sandbox' or 'production'

    'base_url' => env('DUITKU_ENV', 'sandbox') === 'production'
        ? 'https://api-prod.duitku.com'
        : 'https://api-sandbox.duitku.com',

    'callback_url' => env('DUITKU_CALLBACK_URL', 'https://centrally-resolved-molly.ngrok-free.app/api/duitku/callback'),
    'return_url' => env('DUITKU_RETURN_URL', env('APP_URL', 'http://localhost').'/duitku/return'),
    'expiry_period' => (int) env('DUITKU_EXPIRY_PERIOD', 60), // minutes
];
