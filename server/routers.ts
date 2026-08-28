import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getVisualProject, listVisualProjects, saveVisualProject } from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";

const githubUrlSchema = z.string().url().max(500).refine((value) => /^https:\/\/github\.com\//i.test(value), "Only public GitHub repository URLs are supported");

export function githubRepoParts(value: string) {
  const match = value.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:\/tree\/([^/#?]+))?\/?$/i);
  if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Use a URL like https://github.com/owner/repository" });
  return { owner: match[1], repo: match[2], branch: match[3] };
}

export function decodeAssetPayload(data: string, maxBytes = 5_000_000) {
  const bytes = Buffer.from(data, "base64");
  if (bytes.byteLength > maxBytes) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Assets must be smaller than 5 MB." });
  return bytes;
}

async function importGithubTree(sourceUrl: string) {
  const { owner, repo, branch } = githubRepoParts(sourceUrl);
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "visual-forge-editor" };
  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
  if (!repoResponse.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "GitHub repository could not be read. Check that it is public." });
  const repository = await repoResponse.json() as { default_branch?: string };
  const ref = branch || repository.default_branch || "main";
  const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`, { headers });
  if (!treeResponse.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "The repository branch could not be read." });
  const tree = await treeResponse.json() as { tree?: Array<{ path: string; type: string; size?: number }>; truncated?: boolean };
  const entries = (tree.tree ?? []).filter((entry) => entry.type === "blob").slice(0, 300);
  let contentBudget = 1_500_000;
  const files = await Promise.all(entries.map(async (entry, index) => {
    const lower = entry.path.toLowerCase();
    const kind = /\.(png|jpe?g|gif|webp|svg|mp4|webm|mov|woff2?|ttf)$/.test(lower) ? "asset" : /\.(css|scss|less)$/.test(lower) ? "style" : /(^|\/)(package|vite|tsconfig|eslint|tailwind|astro|svelte|next)\b|\.json$/.test(lower) ? "config" : "source";
    const size = Math.min(entry.size ?? 0, 2_000_000);
    const shouldRead = index < 40 && kind !== "asset" && size > 0 && size < 180_000 && contentBudget >= size;
    if (!shouldRead) return { path: entry.path, size, kind } as const;
    contentBudget -= size;
    const rawPath = entry.path.split("/").map((part) => encodeURIComponent(part)).join("/");
    const rawResponse = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${rawPath}`, { headers });
    const content = rawResponse.ok ? (await rawResponse.text()).slice(0, 180_000) : undefined;
    return { path: entry.path, size, kind, content } as const;
  }));
  return { files, truncated: Boolean(tree.truncated), sourceUrl, ref };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  projects: router({
    list: protectedProcedure.query(({ ctx }) => listVisualProjects(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getVisualProject(ctx.user.id, input.id)),
    importGithub: protectedProcedure.input(z.object({ url: githubUrlSchema })).mutation(({ input }) => importGithubTree(input.url)),
    uploadAsset: protectedProcedure.input(z.object({ name: z.string().min(1).max(180), mimeType: z.string().max(120), size: z.number().int().positive().max(5_000_000), data: z.string().max(7_000_000) })).mutation(async ({ ctx, input }) => {
      const bytes = decodeAssetPayload(input.data);
      return storagePut(`${ctx.user.id}-assets/${input.name}`, bytes, input.mimeType);
    }),
    save: protectedProcedure
      .input(z.object({
        id: z.number().int().positive().optional(),
        name: z.string().min(1).max(160),
        activePage: z.string().min(1).max(160),
        projectJson: z.string().min(2),
        origin: z.enum(["blank", "folder", "github"]).optional(),
        detectedFramework: z.enum(["html", "vue", "react", "svelte", "unknown"]).optional(),
        sourceUrl: z.string().max(500).optional(),
        importedFiles: z.string().optional(),
      }))
      .mutation(({ ctx, input }) => saveVisualProject({ ...input, ownerId: ctx.user.id })),
  }),
});

export type AppRouter = typeof appRouter;
