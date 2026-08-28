import { describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({ storagePut: vi.fn() }));
import {
  componentCatalog,
  clampMediaTime,
  createNode,
  detectProjectFramework,
  exportCss,
  exportResponsiveCss,
  exportFramework,
  exportFrameworkProject,
  exportHtml,
  generateProjectZipFiles,
  getProjectPageNodes,
  getNodeStyle,
  gsapContextSnippet,
  migrateProject,
  projectFromImportedFiles,
  switchProjectPage,
  updateImportedFileContent,
  bundleProjectForLiveDev,
  reconstructImportedNodes,
  nextMediaPlayingState,
  seekMediaElement,
  toggleMediaPlayback,
  starterProject,
  updateNodeTree,
  updateBreakpointConfig,
} from "../client/src/lib/editorModel";
import { moveLayer } from "../client/src/pages/Home";
import { appRouter, decodeAssetPayload, githubRepoParts } from "./routers";
import { storagePut } from "./storage";

describe("editor model", () => {
  it("validates GitHub repositories and asset payload limits", () => {
    expect(githubRepoParts("https://github.com/acme/visual-forge/tree/main")).toEqual({ owner: "acme", repo: "visual-forge", branch: "main" });
    expect(decodeAssetPayload(Buffer.from("asset-data").toString("base64")).toString()).toBe("asset-data");
    expect(() => decodeAssetPayload(Buffer.from("0123456789").toString("base64"), 4)).toThrow("5 MB");
  });

  it("detects source framework and preserves import metadata", () => {
    expect(detectProjectFramework([{ path: "src/App.vue" }])).toBe("vue");
    const imported = projectFromImportedFiles([{ path: "src/App.svelte", size: 120, kind: "source" }], "folder");
    expect(imported.origin).toBe("folder");
    expect(imported.detectedFramework).toBe("svelte");
    expect(imported.importedFiles?.[0]?.path).toBe("src/App.svelte");
  });

  it("updates imported file content and re-detects framework and nodes", () => {
    const project = projectFromImportedFiles([{ path: "index.html", content: "<h1>Old</h1>", size: 20, kind: "source" }], "folder");
    const updated = updateImportedFileContent(project, "index.html", "<h1>New Edited Content</h1>");
    expect(updated.importedFiles?.[0]?.content).toBe("<h1>New Edited Content</h1>");
    expect(updated.nodes[0]?.children?.some((node) => node.content.includes("New Edited Content"))).toBe(true);
  });

  it("bundles imported React, Vue and HTML projects for live dev mounting", () => {
    const reactProject = projectFromImportedFiles([{ path: "src/App.tsx", content: "function App() { return <h1>React App Live</h1>; }", size: 60, kind: "source" }], "folder");
    const reactBundle = bundleProjectForLiveDev(reactProject);
    expect(reactBundle).toContain("@babel/standalone");
    expect(reactBundle).toContain("ReactDOM.createRoot");
    expect(reactBundle).toContain("React App Live");

    const vueProject = projectFromImportedFiles([{ path: "src/App.vue", content: "<template><div>Vue Live</div></template>", size: 50, kind: "source" }], "folder");
    const vueBundle = bundleProjectForLiveDev(vueProject);
    expect(vueBundle).toContain("vue.global.js");
    expect(vueBundle).toContain("Vue Live");
  });

  it("exposes advanced building blocks in the library", () => {
    expect(componentCatalog.map((item) => item.kind)).toEqual(expect.arrayContaining(["carousel", "form", "video", "scrub-video", "grid", "navbar", "card"]));
    expect(createNode("scrub-video", 1).kind).toBe("scrub-video");
    expect(createNode("form", 2).kind).toBe("form");
  });

  it("creates framework-aware GSAP lifecycle snippets", () => {
    const node = { ...starterProject.nodes[0]!, animation: { ...starterProject.nodes[0]!.animation, lifecycle: "onEnter" as const, plugins: ["ScrollTrigger"] } };
    expect(gsapContextSnippet("react", node)).toContain("useLayoutEffect");
    expect(gsapContextSnippet("vue", node)).toContain("onMounted");
    expect(gsapContextSnippet("svelte", node)).toContain("onMount");
    const snippet = gsapContextSnippet("react", node);
    expect(snippet).toContain("toggleActions");
    expect(snippet).toContain("easeReverse");
    expect(snippet).toContain("repeat");
    expect(snippet).toContain("yoyo");
    expect(snippet).toContain("stagger");
    expect(gsapContextSnippet("react", { ...node, animation: { ...node.animation, lifecycle: "onScroll" } })).toContain("scrub: true");
    expect(gsapContextSnippet("vue", node)).toContain("registerPlugin(ScrollTrigger)");
  });

  it("reconstructs visual nodes from imported source files", () => {
    const files = [{ path: "src/App.vue", content: "<template><section class='hero'><h1>Hello imported</h1><button>Start</button></section></template>" }];
    const nodes = reconstructImportedNodes(files, "vue");
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    expect(nodes.some((node) => node.kind === "heading" && node.content.includes("Hello imported"))).toBe(true);
    const imported = projectFromImportedFiles([{ ...files[0], size: files[0].content.length, kind: "source" }], "folder");
    expect(imported.nodes[0]?.children?.length).toBeGreaterThan(0);
    expect(starterProject.breakpoints?.mobile).toBe(390);
    expect(starterProject.breakpointOrientations?.mobile).toBe("portrait");
    expect(exportResponsiveCss(starterProject)).toContain("@media (max-width: 390px)");
  });

  it("clamps and seeks scrub media safely", () => {
    expect(clampMediaTime(-5, 12)).toBe(0);
    expect(clampMediaTime(42, 12)).toBe(12);
    expect(clampMediaTime(Number.NaN, 12)).toBe(0);
    const media = { currentTime: 0 };
    expect(seekMediaElement(media, 18, 12)).toBe(12);
    expect(media.currentTime).toBe(12);
  });

  it("toggles scrub media play and pause explicitly", async () => {
    const play = vi.fn(async () => undefined);
    const pause = vi.fn();
    const media = { paused: true, play, pause };
    expect(await toggleMediaPlayback(media)).toBe(true);
    expect(play).toHaveBeenCalledOnce();
    let mediaPlaying = nextMediaPlayingState({}, "video-1", true);
    expect(mediaPlaying["video-1"]).toBe(true);
    media.paused = false;
    expect(await toggleMediaPlayback(media)).toBe(false);
    mediaPlaying = nextMediaPlayingState(mediaPlaying, "video-1", false);
    expect(mediaPlaying["video-1"]).toBe(false);
    expect(pause).toHaveBeenCalledOnce();
  });

  it("uploads an asset through the protected mutation and rejects oversized bytes", async () => {
    vi.mocked(storagePut).mockResolvedValue({ key: "1-assets/demo.png", url: "https://storage.example/demo.png" });
    const ctx = { user: { id: 1, openId: "test", name: "Test", email: "test@example.com", loginMethod: "test", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: {} as any, res: {} as any };
    const result = await appRouter.createCaller(ctx).projects.uploadAsset({ name: "demo.png", mimeType: "image/png", size: 4, data: Buffer.from("demo").toString("base64") });
    expect(result.url).toBe("https://storage.example/demo.png");
    expect(storagePut).toHaveBeenCalled();
    await expect(appRouter.createCaller(ctx).projects.uploadAsset({ name: "large.bin", mimeType: "application/octet-stream", size: 5_000_000, data: Buffer.alloc(5_000_001).toString("base64") })).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });
  it("persists breakpoint width and orientation immutably", () => {
    const next = updateBreakpointConfig(starterProject, "mobile", { width: 412, orientation: "landscape" });
    expect(next.breakpoints?.mobile).toBe(412);
    expect(next.breakpointOrientations?.mobile).toBe("landscape");
    expect(starterProject.breakpoints?.mobile).toBe(390);
    expect(starterProject.breakpointOrientations?.mobile).toBe("portrait");
  });

  it("keeps desktop styles as the responsive base", () => {
    const hero = starterProject.nodes[0];
    const mobile = getNodeStyle(hero, "mobile");
    expect(mobile.width).toBe(390);
    expect(mobile.height).toBe(620);
  });

  it("updates a nested node without mutating the original project", () => {
    const original = starterProject.nodes;
    const next = updateNodeTree(original, "hero-heading", (node) => ({ ...node, content: "Updated" }));
    expect(next).not.toBe(original);
    expect(next[0]?.children?.find((node) => node.id === "hero-heading")?.content).toBe("Updated");
    expect(original[0]?.children?.find((node) => node.id === "hero-heading")?.content).toContain("Shape the interface");
  });

  it("moves a nested layer into another parent", () => {
    const first = JSON.parse(JSON.stringify(starterProject.nodes[0]));
    const second = createNode("section", 12);
    const moved = moveLayer([first, second], "hero-heading", second.id);
    expect(moved[0]?.children?.some((node) => node.id === "hero-heading")).toBe(false);
    expect(moved[1]?.children?.some((node) => node.id === "hero-heading")).toBe(true);
  });

  it("re-inserts a moved layer after a non-container target in another parent", () => {
    const first = JSON.parse(JSON.stringify(starterProject.nodes[0]));
    const second = createNode("section", 13);
    const target = createNode("paragraph", 14);
    second.children = [target];
    const moved = moveLayer([first, second], "hero-heading", target.id);
    expect(moved[0]?.children?.some((node) => node.id === "hero-heading")).toBe(false);
    expect(moved[1]?.children?.map((node) => node.id)).toEqual([target.id, "hero-heading"]);
  });

  it("exports advanced media markup with framework-valid React attributes", () => {
    const project = JSON.parse(JSON.stringify(starterProject));
    const video = createNode("scrub-video", 90);
    video.asset = { url: "https://cdn.example.com/demo.mp4", mimeType: "video/mp4", fileName: "demo.mp4" };
    video.video = { src: video.asset.url, duration: 24, currentTime: 0, muted: true, loop: true };
    project.nodes[0].children.push(video);
    const react = exportFramework(project, "react");
    expect(react).toContain("className=\"vf-scrub-video\"");
    expect(react).toContain("playsInline");
    expect(react).toContain("data-visual-node=\"scrub-video-");
    expect(react).not.toContain("<video class=\"");
  });

  it("exports the complete project manifest and style injection for React", () => {
    const animated = { ...starterProject, nodes: [{ ...starterProject.nodes[0]!, animation: { ...starterProject.nodes[0]!.animation, enabled: true } }] };
    expect(exportFrameworkProject(animated, "vue")).toContain("visualForgeManifest");
    const reactProjectExport = exportFrameworkProject(animated, "react");
    expect(reactProjectExport).toContain("data-motion-lifecycle");
    expect(reactProjectExport).toContain("<style dangerouslySetInnerHTML={{ __html: visualForgeResponsiveCss }} />");
    expect(exportFrameworkProject(animated, "svelte")).toContain("breakpoints");
  });

  it("restores custom breakpoints and orientations in migrateProject", () => {
    const customProject = { ...starterProject, breakpoints: { desktop: 1200, tablet: 800, mobile: 400 }, breakpointOrientations: { desktop: "landscape" as const, tablet: "portrait" as const, mobile: "landscape" as const } };
    const restored = migrateProject(customProject);
    expect(restored.breakpoints?.desktop).toBe(1200);
    expect(restored.breakpointOrientations?.tablet).toBe("portrait");
    expect(restored.breakpointOrientations?.mobile).toBe("landscape");
  });

  it("formats advanced GSAP motion properties correctly", () => {
    const advancedNode = {
      ...starterProject.nodes[0]!,
      animation: {
        enabled: true,
        preset: "slide-up" as const,
        duration: 1.2,
        delay: 0.2,
        ease: "power2.out",
        easeReverse: "power2.inOut",
        repeat: 3,
        yoyo: true,
        stagger: 0.15,
        scrub: 0.5,
        snap: "labels",
        start: "top 80%",
        end: "bottom 30%",
        toggleActions: "play pause resume reset",
        markers: true,
        plugins: ["ScrollTrigger", "Observer"],
        lifecycle: "onScroll" as const,
      },
    };
    const snippet = gsapContextSnippet("react", advancedNode);
    expect(snippet).toContain("repeat: 3");
    expect(snippet).toContain("yoyo: true");
    expect(snippet).toContain("stagger: 0.15");
    expect(snippet).toContain("scrub: 0.5");
    expect(snippet).toContain('snap: "labels"');
    expect(snippet).toContain("markers: true");
    expect(snippet).toContain("Observer");
  });

  it("manages multi-page project state and node switching", () => {
    const p1 = switchProjectPage(starterProject, "About");
    expect(p1.activePage).toBe("About");
    expect(p1.pageNodes?.["Home"]).toEqual(starterProject.nodes);
    expect(p1.pageNodes?.["About"]).toBeDefined();
    expect(getProjectPageNodes(p1, "About")[0]?.name).toContain("About");

    const p2 = switchProjectPage(p1, "Home");
    expect(p2.activePage).toBe("Home");
    expect(p2.nodes).toEqual(starterProject.nodes);
  });

  it("generates complete ZIP package file manifests for React, Vue, Svelte, and HTML", () => {
    const reactZip = generateProjectZipFiles(starterProject, "react");
    expect(reactZip["package.json"]).toContain('"react"');
    expect(reactZip["src/App.tsx"]).toContain('import Home from "./pages/Home"');
    expect(reactZip["src/pages/Home.tsx"]).toContain("export default function Home()");

    const vueZip = generateProjectZipFiles(starterProject, "vue");
    expect(vueZip["package.json"]).toContain('"vue"');
    expect(vueZip["src/App.vue"]).toContain("<template>");

    const svelteZip = generateProjectZipFiles(starterProject, "svelte");
    expect(svelteZip["package.json"]).toContain('"svelte"');
    expect(svelteZip["src/App.svelte"]).toContain("<script");

    const htmlZip = generateProjectZipFiles(starterProject, "html");
    expect(htmlZip["index.html"]).toContain("<!doctype html>");
    expect(htmlZip["styles.css"]).toContain(".vf-page");
  });

  it("exports the same model to HTML, CSS and framework representations", () => {
    const html = exportHtml(starterProject);
    const css = exportCss();
    const vue = exportFramework(starterProject, "vue");
    const react = exportFramework(starterProject, "react");
    const svelte = exportFramework(starterProject, "svelte");

    expect(html).toContain("data-node-id=\"hero-section\"");
    expect(css).toContain("@media (max-width: 720px)");
    expect(vue).toContain("<template>");
    expect(vue).toContain("class=\"vf-heading\"");
    expect(vue).toContain(":style=\"{ position:");
    expect(vue).toContain("Shape the interface.");
    expect(vue).not.toContain("className");
    expect(react).toContain("GeneratedPage");
    expect(react).toContain("className=\"vf-heading\"");
    expect(react).toContain("style={");
    expect(svelte).toContain("<script lang=\"ts\">");
    expect(svelte).toContain("class=\"vf-heading\"");
    expect(svelte).toContain("style=\"position:absolute");
    expect(svelte).not.toContain("className");
  });
});
