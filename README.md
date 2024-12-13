# MCP Confluence Integration

MCP server implementation for Confluence integration with automated authentication management.

## Features

- Automated Confluence authentication via cookies
- Cookie management through SQLite database
- Automatic cookie refresh mechanism
- MCP server implementation for Confluence access

## Project Structure

```
.
├── src/                  # Source files
│   ├── server/          # MCP server implementation
│   └── scripts/         # PowerShell scripts
└── sql/                 # Database scripts
```

## Setup

1. Configure the database:
   ```bash
   sqlite3 c:\vault\database\claude_chat.db < sql/init.sql
   ```

2. Set up authentication:
   ```powershell
   .\src\scripts\confluence-auth.ps1
   ```

3. Configure the MCP server in Claude Desktop config.

## Development

```bash
# Install dependencies
npm install

# Build the server
npm run build

# Run tests
npm test
```

## License

MIT