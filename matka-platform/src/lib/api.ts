// src/lib/api.ts
// API client — centralized fetch wrapper for all backend calls

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    grandTotal?: Record<string, number>;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        // Add JWT token if available
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('matka_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    async get<T>(endpoint: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: this.getHeaders(),
        });

        return response.json();
    }

    async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });

        return response.json();
    }

    async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });

        return response.json();
    }

    async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });

        return response.json();
    }

    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'DELETE',
            headers: this.getHeaders(),
        });

        return response.json();
    }
}

export const api = new ApiClient(API_BASE);
