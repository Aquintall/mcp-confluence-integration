import { ConfluenceConfig, ConfluenceCookie, ConfluenceError } from '../../types';
import fetch from 'node-fetch';

export interface ContentResponse {
    id: string;
    type: string;
    status: string;
    title: string;
    body?: {
        storage: {
            value: string;
            representation: string;
        };
    };
}

export interface SearchResponse {
    results: Array<{
        content: ContentResponse;
    }>;
}

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

    async getPage(pageId: string): Promise<ContentResponse> {
        return this.request(`/content/${pageId}?expand=body.storage`);
    }

    async searchContent(space: string, query: string): Promise<SearchResponse> {
        const cql = encodeURIComponent(`space="${space}" AND text~"${query}"`);
        return this.request(`/search?cql=${cql}`);
    }

    async getSpaceContent(space: string): Promise<ContentResponse[]> {
        const response: SearchResponse = await this.request(
            `/content?spaceKey=${space}&expand=body.storage&limit=100`
        );
        return response.results.map(r => r.content);
    }
}