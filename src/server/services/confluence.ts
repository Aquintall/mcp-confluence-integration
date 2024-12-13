import { ConfluenceConfig, ConfluenceCookie, ConfluenceError } from '../../types';
import fetch from 'node-fetch';

export class ConfluenceService {
    private baseUrl: string;
    private apiPath: string;
    private cookies: ConfluenceCookie[] = [];

    constructor(config: ConfluenceConfig) {
        this.baseUrl = config.baseUrl;
        this.apiPath = config.apiPath || '/wiki/rest/api';
    }

    setCookies(cookies: ConfluenceCookie[]) {
        this.cookies = cookies;
    }

    private get cookieHeader(): string {
        return this.cookies
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${this.apiPath}${path}`;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Cookie': this.cookieHeader,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const error: ConfluenceError = {
                statusCode: response.status,
                message: response.statusText
            };

            try {
                error.data = await response.json();
            } catch {
                // Ignore JSON parse errors
            }

            throw error;
        }

        return response.json();
    }
}