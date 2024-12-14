import { MCPServer } from '@modelcontextprotocol/sdk';
import { readFileSync } from 'fs';
import sqlite3 from 'sqlite3';
import fetch from 'node-fetch';

// Initialize SQLite database
const db = new sqlite3.Database('c:\\vault\\claude_chat.db');

// Create assistant_state table if not exists
db.run(`CREATE TABLE IF NOT EXISTS assistant_state (
  key TEXT PRIMARY KEY,
  value TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

interface ConfluenceSession {
  cookies: string;
  timestamp: Date;
}

async function getConfluenceCookies(): Promise<ConfluenceSession | null> {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT value, timestamp FROM assistant_state WHERE key = "confluence_cookies"',
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        if (!row) {
          resolve(null);
          return;
        }
        resolve({
          cookies: row.value,
          timestamp: new Date(row.timestamp)
        });
      }
    );
  });
}

async function saveConfluenceCookies(cookies: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO assistant_state (key, value) VALUES ("confluence_cookies", ?)',
      [cookies],
      (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      }
    );
  });
}

async function refreshConfluenceAuth(): Promise<string> {
  // Execute PowerShell script and get new cookies
  const { execSync } = require('child_process');
  const scriptPath = 'c:\\vault\\scripts\\confluence_login.ps1';
  
  try {
    const output = execSync(`powershell -File ${scriptPath}`, { encoding: 'utf8' });
    const cookieLines = output.split('\n')
      .filter(line => line.startsWith('Cookie:'))
      .map(line => line.replace('Cookie: ', '').trim());
    
    const cookies = cookieLines.join('; ');
    await saveConfluenceCookies(cookies);
    return cookies;
  } catch (error) {
    console.error('Failed to refresh Confluence auth:', error);
    throw error;
  }
}

async function makeConfluenceRequest(path: string, options: any = {}) {
  let session = await getConfluenceCookies();
  
  if (!session) {
    const cookies = await refreshConfluenceAuth();
    session = { cookies, timestamp: new Date() };
  } else {
    // Refresh if cookies are older than 1 hour
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (session.timestamp < hourAgo) {
      const cookies = await refreshConfluenceAuth();
      session = { cookies, timestamp: new Date() };
    }
  }

  const response = await fetch(`https://confluence.21-school.ru${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: session.cookies,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Confluence request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

const server = new MCPServer();

server.addTool('confluence_search', {
  description: 'Search Confluence content',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query'
      }
    },
    required: ['query']
  },
  execute: async ({ query }) => {
    return makeConfluenceRequest(`/rest/api/content/search?cql=text~'${query}'`);
  }
});

server.addTool('confluence_get_content', {
  description: 'Get Confluence content by ID',
  parameters: {
    type: 'object', 
    properties: {
      contentId: {
        type: 'string',
        description: 'Content ID'
      },
      expand: {
        type: 'string',
        description: 'Comma-separated list of properties to expand',
        default: 'body.storage'
      }
    },
    required: ['contentId']
  },
  execute: async ({ contentId, expand }) => {
    return makeConfluenceRequest(`/rest/api/content/${contentId}?expand=${expand}`);
  }
});

server.start();