# Confluence authentication management script

# Database configuration
$dbPath = "c:\vault\database\claude_chat.db"

# Load SQLite assembly
Add-Type -Path "C:\Program Files\System.Data.SQLite\2015\bin\System.Data.SQLite.dll"

function Get-ConfluenceCookies {
    $cookies = @()
    $chromePath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Network\Cookies"
    
    $connection = New-Object System.Data.SQLite.SQLiteConnection("Data Source=$chromePath")
    $connection.Open()
    
    $query = "SELECT name, value, host_key FROM cookies WHERE host_key LIKE '%confluence%'"
    $command = $connection.CreateCommand()
    $command.CommandText = $query
    
    try {
        $reader = $command.ExecuteReader()
        while ($reader.Read()) {
            $cookies += @{
                name = $reader["name"]
                value = $reader["value"]
                domain = $reader["host_key"]
            }
        }
    }
    finally {
        $connection.Close()
    }
    
    return $cookies
}

function Save-ConfluenceCookies {
    param (
        [string]$cookiesJson
    )
    
    $query = @"
    INSERT INTO assistant_state (key, value, timestamp, description)
    VALUES ('confluence_cookies', @cookies, datetime('now'), 'Confluence authentication cookies')
    ON CONFLICT(key) DO UPDATE SET 
    value = @cookies,
    timestamp = datetime('now');
"@

    $connection = New-Object System.Data.SQLite.SQLiteConnection("Data Source=$dbPath")
    $connection.Open()
    
    $command = $connection.CreateCommand()
    $command.CommandText = $query
    $command.Parameters.AddWithValue("@cookies", $cookiesJson)
    
    try {
        $command.ExecuteNonQuery()
        Write-Host "Cookies successfully saved to DB"
    }
    catch {
        Write-Error "Failed to save cookies to DB: $_"
        exit 1
    }
    finally {
        $connection.Close()
    }
}

# Main execution
try {
    $cookies = Get-ConfluenceCookies
    if ($cookies.Count -eq 0) {
        Write-Error "No Confluence cookies found in Chrome"
        exit 1
    }
    
    $cookiesJson = $cookies | ConvertTo-Json
    Save-ConfluenceCookies -cookiesJson $cookiesJson
    
    Write-Host "Confluence authentication updated successfully"
    exit 0
}
catch {
    Write-Error "Script execution failed: $_"
    exit 1
}