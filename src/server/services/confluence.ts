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
}