import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ReadResourceRequestSchema, ListResourcesRequestSchema } from '@modelcontextprotocol/sdk/types';
import { Database } from "sqlite3";
import fetch from "node-fetch";
import { config } from 'dotenv';

config();

const dbPath = process.env.DB_PATH || "c:\\vault\\database\\claude_chat.db";
const confluenceUrl = process.env.CONFLUENCE_URL;

if (!confluenceUrl) {
    throw new Error("CONFLUENCE_URL environment variable is required");
}

const server = new Server({
    name: "mcp-confluence",
    version: "1.0.0"
}, {
    capabilities: {
        resources: {}
    }
});

const db = new Database(dbPath);

interface StoredCookies {
    cookies: Array<{
        name: string;
        value: string;
        domain: string;
    }>;
}

async function getCookies(): Promise<StoredCookies> {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT value FROM assistant_state WHERE key = ?', 
            ['confluence_cookies'],
            (err, row: { value: string } | undefined) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new Error('No Confluence cookies found'));
                    return;
                }
                resolve(JSON.parse(row.value));
            }
        );
    });
}

interface ConfluencePage {
    id: string;
    title: string;
    body?: {
        storage: {
            value: string;
        };
    };
}

async function getConfluencePage(pageId: string, cookies: StoredCookies): Promise<ConfluencePage> {
    const cookieHeader = cookies.cookies
        .map(c => `${c.name}=${c.value}`)
        .join('; ');

    const response = await fetch(
        `${confluenceUrl}/wiki/rest/api/content/${pageId}?expand=body.storage`,
        {
            headers: {
                'Cookie': cookieHeader,
                'Accept': 'application/json'
            }
        }
    );

    if (!response.ok) {
        throw new Error(`Confluence API error: ${response.statusText}`);
    }

    const data = await response.json() as ConfluencePage;
    return data;
}

// Обработчики MCP
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const cookies = await getCookies();
    const pageId = process.env.CONFLUENCE_HOME_PAGE || '123456'; // ID главной страницы

    const page = await getConfluencePage(pageId, cookies);

    return {
        resources: [{
            uri: `confluence://spaces/home`,
            name: page.title || 'Confluence Home',
            mimeType: 'text/html',
            description: 'Main Confluence page'
        }]
    };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const cookies = await getCookies();
    const pageId = process.env.CONFLUENCE_HOME_PAGE || '123456';
    
    const page = await getConfluencePage(pageId, cookies);

    return {
        contents: [{
            uri: request.params.uri,
            mimeType: 'text/html',
            text: page.body?.storage.value || 'No content'
        }]
    };
});

// Запуск сервера
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Confluence MCP server started');
}

main().catch(console.error);