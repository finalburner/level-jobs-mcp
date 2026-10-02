#!/usr/bin/env node
// Serveur MCP stdio, lecture seule, pour le catalogue public de Level
// (https://jobsbylevel.com). Il appelle uniquement l'API REST publique
// documentée sur https://jobsbylevel.com/developers : aucune clé, aucune base.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = (process.env.LEVEL_API_URL || "https://jobsbylevel.com").replace(/\/+$/, "");
const TIMEOUT_MS = 15000;

async function api(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "level-jobs-mcp/1.0" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = await res.text();
  if (!res.ok) {
    throw new Error(res.status === 429 ? "Rate limited by jobsbylevel.com, retry later." : `HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  return JSON.parse(body);
}

const ok = (payload) => ({ content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] });
const fail = (error) => ({ isError: true, content: [{ type: "text", text: String(error?.message ?? error) }] });
const level = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);

export function createServer() {
  const server = new McpServer({ name: "level-jobs-mcp", version: "1.0.0" });

  server.registerTool(
    "search_jobs",
    {
      title: "Search AI-level-rated jobs",
      description:
        "Search Level's job catalog. Each job has an AI level: 1 = Little AI, 2 = Uses AI, 3 = Works on AI, 4 = Builds AI. Returns at most 20 jobs per page with canonical jobsbylevel.com URLs.",
      inputSchema: {
        query: z.string().max(200).optional().describe("Free-text query, e.g. 'machine learning engineer'."),
        ai_level_min: level.optional().describe("Minimum AI level (1-4)."),
        ai_level_max: level.optional().describe("Maximum AI level (1-4)."),
        remote: z.boolean().optional().describe("Only remote jobs."),
        city: z.string().max(200).optional(),
        company: z.string().max(200).optional(),
        posted_within_hours: z.number().int().min(1).max(168).optional().describe("Only jobs posted in the last N hours (1-168)."),
        sort: z.enum(["recent"]).optional(),
        page: z.number().int().min(1).optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      try {
        return ok(await api("/api/v1/jobs", { ...args, remote: args.remote ? "1" : undefined }));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_job",
    {
      title: "Get a job by slug",
      description: "Get the full public record of one job, using the `slug` returned by search_jobs.",
      inputSchema: { slug: z.string().min(1).max(300) },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ slug }) => {
      try {
        return ok(await api(`/api/v1/jobs/${encodeURIComponent(slug)}`));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "level_lookup",
    {
      title: "Look up the AI level of a job title",
      description: "Find the AI level (1-4) Level assigned to a job matching a title, optionally at a given company.",
      inputSchema: {
        title: z.string().min(2).max(200).describe("Job title, e.g. 'Data Scientist'."),
        company: z.string().max(200).optional(),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      try {
        return ok(await api("/api/v1/level-lookup", args));
      } catch (e) {
        return fail(e);
      }
    },
  );

  return server;
}

await createServer().connect(new StdioServerTransport());
