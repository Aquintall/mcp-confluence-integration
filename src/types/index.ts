export interface ConfluenceCookie {
    name: string;
    value: string;
    domain: string;
}

export interface DatabaseConfig {
    path: string;
}

export interface ConfluenceConfig {
    baseUrl: string;
    apiPath?: string;
}

export interface ServerConfig {
    confluence: ConfluenceConfig;
    database: DatabaseConfig;
}

export interface StoredCookies {
    cookies: ConfluenceCookie[];
    timestamp: string;
}

export interface ConfluenceError {
    statusCode: number;
    message: string;
    data?: any;
}