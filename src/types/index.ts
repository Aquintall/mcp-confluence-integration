export interface ConfluenceCookie {
    name: string;
    value: string;
    domain: string;
}

export interface DatabaseConfig {
    path: string;
}

export interface ServerConfig {
    confluenceUrl: string;
    database: DatabaseConfig;
}

export interface StoredCookies {
    cookies: ConfluenceCookie[];
    timestamp: string;
}