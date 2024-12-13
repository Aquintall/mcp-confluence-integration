import { ConfluenceServer } from './server/ConfluenceServer';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH || 'c:\\vault\\database\\claude_chat.db';
const confluenceUrl = process.env.CONFLUENCE_URL;

if (!confluenceUrl) {
    throw new Error('CONFLUENCE_URL environment variable is required');
}

const server = new ConfluenceServer({
    confluenceUrl,
    database: {
        path: dbPath
    }
});

server.run().catch(console.error);