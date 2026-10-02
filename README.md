# level-jobs-mcp

MCP server (stdio) for [Level](https://jobsbylevel.com), a job catalog where every posting is rated on an **AI level**:

| Level | Meaning |
|---|---|
| 1 | Little AI |
| 2 | Uses AI |
| 3 | Works on AI |
| 4 | Builds AI |

Read-only. No API key. It calls the public REST API documented at <https://jobsbylevel.com/developers>.

## Tools

- `search_jobs`: filter by query, AI level range, remote, city, company, recency (max 20 results per page).
- `get_job`: full public record of one job from its `slug`.
- `level_lookup`: AI level assigned to a job title (optionally at a company).

## Install

Claude Desktop / Cursor (`mcpServers`):

```json
{
  "mcpServers": {
    "level-jobs": { "command": "npx", "args": ["-y", "level-jobs-mcp"] }
  }
}
```

Claude Code:

```bash
claude mcp add level-jobs -- npx -y level-jobs-mcp
```

A hosted version (Streamable HTTP, no install) is also available at `https://jobsbylevel.com/mcp`.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `LEVEL_API_URL` | `https://jobsbylevel.com` | Base URL of the API (for testing). |

## Development

```bash
npm install
node index.mjs   # speaks MCP over stdio
```

## License

MIT. Job data is served by jobsbylevel.com under its own terms; results link back to the canonical page.
