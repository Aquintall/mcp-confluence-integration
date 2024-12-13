import { Server } from "@modelcontextprotocol/sdk/server";
import { Database } from "sqlite3";
import { StoredCookies, ServerConfig } from "../types";

export class ConfluenceServer {
    private server: Server;
    private db: Database;
    private cookies: StoredCookies | null = null;

    constructor(private config: ServerConfig) {
        this.server = new Server({
            name: "mcp-confluence",
            version: "1.0.0"
        }, {
            capabilities: {
                resources: {},
                tools: {}
            }
        });

        this.db = new Database(config.database.path);
        this.setupHandlers();
    }

    private async loadCookies(): Promise<boolean> {
        return new Promise((resolve) => {
            this.db.get(
                'SELECT value FROM assistant_state WHERE key = ?',
                ['confluence_cookies'],
                (err, row: { value: string } | undefined) => {
                    if (err || !row) {
                        resolve(false);
                        return;
                    }

                    try {
                        this.cookies = JSON.parse(row.value);
                        resolve(true);
                    } catch {
                        resolve(false);
                    }
                }
            );
        });
    }

    private setupHandlers() {
        // TODO: Implement handlers
    }

    async initialize() {
        if (!await this.loadCookies()) {
            throw new Error('No Confluence cookies found in database');
        }
    }

    async run() {
        await this.initialize();
        // TODO: Set up transport
    }
}