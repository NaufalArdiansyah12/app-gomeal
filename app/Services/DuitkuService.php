<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DuitkuService
{
    protected string $merchantCode;

    protected string $apiKey;

    protected string $baseUrl;

    protected string $callbackUrl;

    protected string $returnUrl;

    protected int $expiryPeriod;

    public function __construct()
    {
        $this->merchantCode = (string) config('duitku.merchant_code');
        $this->apiKey = (string) config('duitku.api_key');
        $this->baseUrl = rtrim((string) config('duitku.base_url'), '/');
        $this->callbackUrl = (string) config('duitku.callback_url');
        $this->returnUrl = (string) config('duitku.return_url');
        $this->expiryPeriod = (int) config('duitku.expiry_period', 60);
    }

    /**
     * Check if Duitku credentials are configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->merchantCode) && ! empty($this->apiKey);
    }

    /**
     * Create Invoice / Request payment URL from Duitku.
     *
     * @param array{
     *     order_id: string,
     *     amount: int|float,
     *     product_details: string,
     *     customer_name: string,
     *     email?: string|null,
     *     phone?: string|null,
     *     payment_method?: string|null,
     *     item_details?: array<int, array{name: string, price: int|float, quantity: int}>
     * } $payload
     * @return array{success: bool, payment_url?: string, reference?: string, message?: string}
     */
    public function createInvoice(array $payload): array
    {
        if (! $this->isConfigured()) {
            return [
                'success' => false,
                'message' => 'Duitku credentials (Merchant Code & API Key) are not configured in .env',
            ];
        }

        $amount = (int) round($payload['amount']);
        $orderId = (string) $payload['order_id'];
        $timestamp = (string) round(microtime(true) * 1000);
        $signature = hash_hmac('sha256', $this->merchantCode.$timestamp, $this->apiKey);

        $body = [
            'paymentAmount' => $amount,
            'merchantOrderId' => $orderId,
            'productDetails' => $payload['product_details'],
            'additionalParam' => '',
            'merchantUserInfo' => '',
            'customerVaName' => $payload['customer_name'],
            'email' => ! empty($payload['email']) ? $payload['email'] : 'pelanggan@gomeal.local',
            'phoneNumber' => ! empty($payload['phone']) ? $payload['phone'] : '081234567890',
            'callbackUrl' => $this->callbackUrl,
            'returnUrl' => $payload['return_url'] ?? $this->returnUrl,
            'expiryPeriod' => $this->expiryPeriod,
        ];

        if (! empty($payload['payment_method'])) {
            $body['paymentMethod'] = $payload['payment_method'];
        }

        if (! empty($payload['item_details'])) {
            $body['itemDetails'] = array_map(function ($item) {
                return [
                    'name' => $item['name'],
                    'price' => (int) round($item['price']),
                    'quantity' => (int) $item['quantity'],
                ];
            }, $payload['item_details']);
        }

        try {
            $response = Http::timeout(20)
                ->asJson()
                ->acceptJson()
                ->withHeaders([
                    'x-duitku-merchantcode' => $this->merchantCode,
                    'x-duitku-timestamp' => $timestamp,
                    'x-duitku-signature' => $signature,
                ])
                ->post($this->baseUrl.'/api/merchant/createInvoice', $body);

            $data = $response->json();

            if ($response->successful() && isset($data['statusCode']) && $data['statusCode'] === '00') {
                return [
                    'success' => true,
                    'payment_url' => $data['paymentUrl'] ?? '',
                    'reference' => $data['reference'] ?? '',
                ];
            }

            $message = $data['statusMessage'] ?? ('Duitku error HTTP '.$response->status());
            Log::warning('Duitku createInvoice failed', [
                'http_status' => $response->status(),
                'response' => $data ?? $response->body(),
                'order_id' => $orderId,
                'amount' => $amount,
            ]);

            return [
                'success' => false,
                'message' => $message,
            ];
        } catch (\Throwable $e) {
            Log::error('Duitku createInvoice exception', ['error' => $e->getMessage()]);

            return [
                'success' => false,
                'message' => 'Koneksi ke gateway Duitku bermasalah: '.$e->getMessage(),
            ];
        }
    }

    /**
     * Validate callback notification from Duitku.
     *
     * @param  array<string, mixed>  $input
     * @return array{valid: bool, is_success: bool, order_id: string|null, reference: string|null, amount: float|int|null, message?: string}
     */
    public function validateCallback(array $input): array
    {
        $merchantCode = (string) ($input['merchantCode'] ?? '');
        $amount = (string) ($input['amount'] ?? '');
        $merchantOrderId = (string) ($input['merchantOrderId'] ?? '');
        $signature = (string) ($input['signature'] ?? '');
        $resultCode = (string) ($input['resultCode'] ?? '');
        $reference = (string) ($input['reference'] ?? '');

        if (empty($merchantCode) || empty($amount) || empty($merchantOrderId) || empty($signature)) {
            return [
                'valid' => false,
                'is_success' => false,
                'order_id' => null,
                'reference' => null,
                'amount' => null,
                'message' => 'Parameter callback Duitku tidak lengkap.',
            ];
        }

        $expectedSignature = hash_hmac('sha256', $merchantCode.$amount.$merchantOrderId, $this->apiKey);

        if (! hash_equals($expectedSignature, $signature)) {
            return [
                'valid' => false,
                'is_success' => false,
                'order_id' => $merchantOrderId,
                'reference' => $reference,
                'amount' => (float) $amount,
                'message' => 'Signature callback Duitku tidak valid.',
            ];
        }

        return [
            'valid' => true,
            'is_success' => $resultCode === '00',
            'order_id' => $merchantOrderId,
            'reference' => $reference,
            'amount' => (float) $amount,
            'message' => $resultCode === '00' ? 'Pembayaran berhasil' : 'Pembayaran gagal/dibatalkan',
        ];
    }
}
