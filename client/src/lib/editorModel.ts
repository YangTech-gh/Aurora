export type Breakpoint = "desktop" | "tablet" | "mobile";
export type ComponentKind =
  | "section"
  | "heading"
  | "paragraph"
  | "button"
  | "image"
  | "container"
  | "stack"
  | "carousel"
  | "form"
  | "video"
  | "scrub-video"
  | "grid"
  | "navbar"
  | "card";

export type NodeStyle = {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  background: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  radius: number;
  padding: number;
  opacity: number;
  display: "block" | "flex" | "grid";
  alignItems: "start" | "center" | "end";
  justifyContent: "start" | "center" | "end" | "space-between";
  borderColor: string;
  borderWidth: number;
  shadow: string;
  rotation: number;
}

export type EditorNode = {
  id: string;
  kind: ComponentKind;
  name: string;
  content: string;
  styles: Record<Breakpoint, Partial<NodeStyle>>;
  animation: {
    enabled: boolean;
    preset: "fade" | "slide-up" | "scale" | "none";
    duration: number;
    delay: number;
    ease: string;
    easeReverse?: string | boolean;
    repeat?: number;
    yoyo?: boolean;
    stagger?: number;
    scrub?: boolean | number;
    snap?: number | string;
    start?: string;
    end?: string;
    toggleActions?: string;
    markers?: boolean;
    plugins?: string[];
    lifecycle?: "onMount" | "onEnter" | "onScroll";
  };
  asset?: { url?: string; key?: string; mimeType?: string; fileName?: string };
  video?: { src?: string; poster?: string; duration?: number; currentTime?: number; autoplay?: boolean; loop?: boolean; muted?: boolean };
  form?: { fields: Array<{ id: string; label: string; type: "text" | "email" | "textarea" | "select"; required?: boolean }> };
  carousel?: { slides: number; autoplay: boolean; interval: number; gap: number };
  grid?: { columns: number; gap: number };
  navbar?: { links: string[]; sticky: boolean };
  card?: { variant: "glass" | "solid" | "outline" };
  constraints?: { left: boolean; right: boolean; top: boolean; bottom: boolean; width: "fixed" | "fill"; height: "fixed" | "hug" };
  states?: { hover: boolean; pressed: boolean; focus: boolean };
  accessibility?: { role?: string; label?: string; hidden?: boolean };
  children?: EditorNode[];
};

export type EditorProject = {
  name: string;
  activePage: string;
  pages: string[];
  nodes: EditorNode[];
  pageNodes?: Record<string, EditorNode[]>;
  updatedAt: string;
  breakpoints?: Record<Breakpoint, number>;
  breakpointOrientations?: Record<Breakpoint, "portrait" | "landscape">;
  origin?: "blank" | "folder" | "github";
  detectedFramework?: "html" | "vue" | "react" | "svelte" | "unknown";
  sourceUrl?: string;
  importedFiles?: Array<{ path: string; size: number; kind: "source" | "style" | "asset" | "config"; content?: string }>;
};

const baseStyle = (style: Partial<NodeStyle>, mobile: Partial<NodeStyle> = {}): Record<Breakpoint, Partial<NodeStyle>> => ({
  desktop: style,
  tablet: {},
  mobile,
});

const animation = (
  preset: EditorNode["animation"]["preset"] = "none",
  duration = 0.8,
  delay = 0,
): EditorNode["animation"] => ({
  enabled: preset !== "none",
  preset,
  duration,
  delay,
  ease: "power3.out",
  easeReverse: "power2.inOut",
  repeat: 0,
  yoyo: false,
  stagger: 0,
  scrub: false,
  snap: 1,
  start: "top 85%",
  end: "bottom 20%",
  toggleActions: "play none none reverse",
  markers: false,
});

export const starterProject: EditorProject = {
  name: "Aurora Studio",
  activePage: "Home",
  pages: ["Home", "About", "Contact"],
  updatedAt: new Date().toISOString(),
  breakpoints: { desktop: 1000, tablet: 768, mobile: 390 },
  breakpointOrientations: { desktop: "landscape", tablet: "landscape", mobile: "portrait" },
  nodes: [
    {
      id: "hero-section",
      kind: "section",
      name: "Hero / Aurora",
      content: "",
      styles: baseStyle({
        x: 0,
        y: 0,
        width: 1000,
        height: 650,
        color: "#f7f6f2",
        background: "linear-gradient(135deg, #1b1728 0%, #342a56 54%, #193b3c 100%)",
        fontSize: 16,
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: 0,
        radius: 0,
        padding: 0,
        opacity: 1,
        display: "block",
        alignItems: "start",
        justifyContent: "start",
        borderColor: "transparent",
        borderWidth: 0,
        shadow: "none",
        rotation: 0,
      }),
      animation: animation("fade", 1.1),
      children: [
        {
          id: "eyebrow",
          kind: "paragraph",
          name: "Eyebrow",
          content: "VISUAL DEVELOPMENT SYSTEM",
          styles: baseStyle({
            x: 94,
            y: 86,
            width: 260,
            height: 22,
            color: "#9ce8cd",
            background: "transparent",
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.4,
            letterSpacing: 2.2,
            radius: 0,
            padding: 0,
            opacity: 1,
            display: "block",
            alignItems: "start",
            justifyContent: "start",
          }),
          animation: animation("slide-up", 0.75, 0.08),
        },
        {
          id: "hero-heading",
          kind: "heading",
          name: "Hero headline",
          content: "Shape the interface.\nKeep the feeling.",
          styles: baseStyle({
            x: 90,
            y: 132,
            width: 640,
            height: 180,
            color: "#f7f6f2",
            background: "transparent",
            fontSize: 64,
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: -3.5,
            radius: 0,
            padding: 0,
            opacity: 1,
            display: "block",
            alignItems: "start",
            justifyContent: "start",
          }, { x: 28, y: 124, width: 330, height: 132, fontSize: 42, lineHeight: 1.02, letterSpacing: -2.1 }),
          animation: animation("slide-up", 0.9, 0.16),
        },
        {
          id: "hero-copy",
          kind: "paragraph",
          name: "Hero description",
          content:
            "Compose responsive interfaces, systems and motion directly on the canvas — without leaving the idea behind.",
          styles: baseStyle({
            x: 96,
            y: 356,
            width: 350,
            height: 68,
            color: "#d6d1df",
            background: "transparent",
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
            radius: 0,
            padding: 0,
            opacity: 1,
            display: "block",
            alignItems: "start",
            justifyContent: "start",
          }, { x: 30, y: 300, width: 300, height: 92, fontSize: 14, lineHeight: 1.45 }),
          animation: animation("slide-up", 0.9, 0.22),
        },
        {
          id: "hero-cta",
          kind: "button",
          name: "Primary CTA",
          content: "Explore our work",
          styles: baseStyle({
            x: 96,
            y: 468,
            width: 174,
            height: 52,
            color: "#17141d",
            background: "#a7f0d4",
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: 0.1,
            radius: 99,
            padding: 16,
            opacity: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }, { x: 30, y: 422, width: 170, height: 48, fontSize: 12 }),
          animation: animation("scale", 0.72, 0.3),
        },
        {
          id: "hero-orbit",
          kind: "image",
          name: "Orbital visual",
          content: "",
          styles: baseStyle({
            x: 656,
            y: 84,
            width: 270,
            height: 392,
            color: "#f7f6f2",
            background: "linear-gradient(145deg, #b8f4db 0%, #5c87a6 44%, #222033 100%)",
            fontSize: 16,
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: 0,
            radius: 148,
            padding: 0,
            opacity: 1,
            display: "block",
            alignItems: "center",
            justifyContent: "center",
          }, { x: 232, y: 86, width: 120, height: 190, opacity: 0.82 }),
          animation: animation("scale", 1.05, 0.18),
        },
        {
          id: "hero-footer-note",
          kind: "paragraph",
          name: "Footer note",
          content: "Canvas-first development · GSAP motion ready",
          styles: baseStyle({
            x: 96,
            y: 584,
            width: 320,
            height: 20,
            color: "#a9a1b8",
            background: "transparent",
            fontSize: 11,
            fontWeight: 500,
            lineHeight: 1.4,
            letterSpacing: 0.5,
            radius: 0,
            padding: 0,
            opacity: 1,
            display: "block",
            alignItems: "start",
            justifyContent: "start",
          }, { x: 30, y: 520, width: 270, height: 18, fontSize: 9 }),
          animation: animation("fade", 0.8, 0.48),
        },
      ],
    },
  ],
};

const starterHero = starterProject.nodes[0];
if (starterHero) {
  starterHero.styles.mobile = { ...starterHero.styles.mobile, width: 390, height: 620 };
  const mobileOverrides: Record<string, Partial<NodeStyle>> = {
    eyebrow: { x: 30, y: 46, width: 260, fontSize: 9 },
    "hero-heading": { x: 28, y: 86, width: 320, height: 110, fontSize: 38, letterSpacing: -1.6 },
    "hero-copy": { x: 30, y: 225, width: 285, height: 78, fontSize: 14 },
    "hero-cta": { x: 30, y: 340, width: 160, height: 48 },
    "hero-orbit": { x: 240, y: 420, width: 112, height: 156, radius: 90 },
    "hero-footer-note": { x: 30, y: 585, width: 300, height: 18, fontSize: 9 },
  };
  starterHero.children?.forEach((child) => {
    if (mobileOverrides[child.id]) child.styles.mobile = { ...child.styles.mobile, ...mobileOverrides[child.id] };
  });
}

export const componentCatalog: Array<{
  kind: ComponentKind;
  label: string;
  description: string;
  icon: string;
}> = [
  { kind: "section", label: "Section", description: "Full-width canvas section", icon: "▤" },
  { kind: "heading", label: "Heading", description: "Display typography", icon: "T" },
  { kind: "paragraph", label: "Text", description: "Body copy and labels", icon: "¶" },
  { kind: "button", label: "Button", description: "Action with intent", icon: "↗" },
  { kind: "image", label: "Image", description: "Visual content block", icon: "▧" },
  { kind: "container", label: "Container", description: "Flexible frame", icon: "□" },
  { kind: "stack", label: "Stack", description: "Auto-layout group", icon: "☷" },
  { kind: "carousel", label: "Carousel", description: "Responsive slide gallery", icon: "◫" },
  { kind: "form", label: "Form", description: "Accessible input flow", icon: "⌁" },
  { kind: "video", label: "Video", description: "Media player block", icon: "▶" },
  { kind: "scrub-video", label: "Video scrub", description: "Timeline-driven media", icon: "◌" },
  { kind: "grid", label: "Grid", description: "Adaptive content grid", icon: "▦" },
  { kind: "navbar", label: "Navbar", description: "Responsive navigation", icon: "≡" },
  { kind: "card", label: "Card", description: "Content surface", icon: "▣" },
];

export const breakpointLabels: Record<Breakpoint, { label: string; width: number }> = {
  desktop: { label: "Desktop", width: 1000 },
  tablet: { label: "Tablet", width: 720 },
  mobile: { label: "Mobile", width: 390 },
};

export function updateBreakpointConfig(project: EditorProject, breakpoint: Breakpoint, patch: { width?: number; orientation?: "portrait" | "landscape" }): EditorProject {
  const width = patch.width ?? project.breakpoints?.[breakpoint] ?? breakpointLabels[breakpoint].width;
  const orientation = patch.orientation ?? project.breakpointOrientations?.[breakpoint] ?? (breakpoint === "mobile" ? "portrait" : "landscape");
  return {
    ...project,
    breakpoints: { desktop: 1000, tablet: 768, mobile: 390, ...(project.breakpoints ?? {}), [breakpoint]: Math.min(1800, Math.max(240, width)) },
    breakpointOrientations: { desktop: "landscape", tablet: "landscape", mobile: "portrait", ...(project.breakpointOrientations ?? {}), [breakpoint]: orientation },
    updatedAt: new Date().toISOString(),
  };
}

export function getProjectPageNodes(project: EditorProject, pageName: string): EditorNode[] {
  if (project.pageNodes?.[pageName]) {
    return project.pageNodes[pageName]!;
  }
  if (pageName === "Home" || pageName === project.activePage) {
    return project.nodes;
  }
  // Generate starter nodes for secondary pages
  const section = createNode("section", 0);
  section.name = `${pageName} / Section`;
  const heading = createNode("heading", 1);
  heading.content = pageName === "About" ? "About Aurora Studio\nOur Vision & Team" : pageName === "Contact" ? "Get in Touch\nLet's Build Together" : `${pageName} Page\nVisual Forge Component`;
  const text = createNode("paragraph", 2);
  text.content = pageName === "About" ? "We build next-generation interfaces with visual-first controls and frame-accurate motion." : pageName === "Contact" ? "Send us a message or request a demo for your development team." : "Manage and compose nodes for this page directly on canvas.";
  section.children = [heading, text];
  return [section];
}

export function switchProjectPage(project: EditorProject, targetPage: string): EditorProject {
  const currentNodes = project.nodes;
  const pageNodesMap = {
    ...(project.pageNodes ?? {}),
    [project.activePage]: currentNodes,
  };
  const targetNodes = pageNodesMap[targetPage] ?? getProjectPageNodes({ ...project, pageNodes: pageNodesMap }, targetPage);
  return {
    ...project,
    activePage: targetPage,
    pageNodes: {
      ...pageNodesMap,
      [targetPage]: targetNodes,
    },
    nodes: targetNodes,
    updatedAt: new Date().toISOString(),
  };
}

export function migrateProject(input: EditorProject): EditorProject {
  const next = JSON.parse(JSON.stringify(input)) as EditorProject;
  next.breakpoints = { desktop: 1000, tablet: 768, mobile: 390, ...(input.breakpoints ?? {}) };
  next.breakpointOrientations = { desktop: "landscape", tablet: "landscape", mobile: "portrait", ...(input.breakpointOrientations ?? {}) };
  if (!next.pageNodes) {
    next.pageNodes = { [next.activePage || "Home"]: next.nodes };
  }
  const hero = next.nodes[0];
  if (!hero) return next;
  hero.styles.mobile = { ...hero.styles.mobile, width: 390, height: 620 };
  const overrides: Record<string, Partial<NodeStyle>> = {
    eyebrow: { x: 30, y: 46, width: 260, fontSize: 9 },
    "hero-heading": { x: 28, y: 86, width: 320, height: 110, fontSize: 38, letterSpacing: -1.6 },
    "hero-copy": { x: 30, y: 225, width: 285, height: 78, fontSize: 14 },
    "hero-cta": { x: 30, y: 340, width: 160, height: 48 },
    "hero-orbit": { x: 240, y: 420, width: 112, height: 156, radius: 90 },
    "hero-footer-note": { x: 30, y: 585, width: 300, height: 18, fontSize: 9 },
  };
  hero.children?.forEach((child) => {
    const override = overrides[child.id];
    if (override) child.styles.mobile = { ...child.styles.mobile, ...override };
  });
  return next;
}

export function getNodeStyle(node: EditorNode, breakpoint: Breakpoint): NodeStyle {
  const merged = {
    ...(node.styles.desktop as NodeStyle),
    ...(node.styles[breakpoint] as Partial<NodeStyle>),
  };
  return {
    ...merged,
    borderColor: merged.borderColor ?? "transparent",
    borderWidth: merged.borderWidth ?? 0,
    shadow: merged.shadow ?? "none",
    rotation: merged.rotation ?? 0,
  };
}

export function findNode(nodes: EditorNode[], id: string): EditorNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = node.children ? findNode(node.children, id) : undefined;
    if (child) return child;
  }
  return undefined;
}

export function updateNodeTree(
  nodes: EditorNode[],
  id: string,
  updater: (node: EditorNode) => EditorNode,
): EditorNode[] {
  return nodes.map((node) => {
    const updated = node.id === id ? updater(node) : node;
    return {
      ...updated,
      ...(updated.children
        ? { children: updateNodeTree(updated.children, id, updater) }
        : {}),
    };
  });
}

export function createNode(kind: ComponentKind, index: number): EditorNode {
  const defaults: Record<ComponentKind, { name: string; content: string; style: Partial<NodeStyle> }> = {
    section: {
      name: "New section",
      content: "",
      style: { width: 1000, height: 420, background: "#f2f0eb", color: "#25212e" },
    },
    heading: {
      name: "New heading",
      content: "A clear point of view.",
      style: { width: 420, height: 72, fontSize: 48, fontWeight: 600, lineHeight: 1.02, color: "#f7f6f2", background: "transparent" },
    },
    paragraph: {
      name: "New text",
      content: "Add a sentence that gives your idea a little more room to breathe.",
      style: { width: 330, height: 62, fontSize: 15, lineHeight: 1.5, color: "#c5becd", background: "transparent" },
    },
    button: {
      name: "New button",
      content: "Start a conversation",
      style: { width: 178, height: 50, fontSize: 13, fontWeight: 700, color: "#17141d", background: "#a7f0d4", radius: 99, padding: 16, display: "flex", alignItems: "center", justifyContent: "center" },
    },
    image: {
      name: "New image",
      content: "",
      style: { width: 220, height: 180, color: "#f7f6f2", background: "linear-gradient(145deg, #f1b7d6, #6650a6)", radius: 28 },
    },
    container: {
      name: "New container",
      content: "",
      style: { width: 360, height: 220, color: "#f7f6f2", background: "rgba(255,255,255,.08)", radius: 18, padding: 24 },
    },
      stack: {
      name: "New stack",
      content: "",
      style: { width: 380, height: 160, color: "#f7f6f2", background: "rgba(167,240,212,.12)", radius: 18, padding: 20, display: "flex", alignItems: "center", justifyContent: "center" },
    },
    carousel: { name: "New carousel", content: "A considered sequence of moments.", style: { width: 620, height: 260, color: "#f7f6f2", background: "#211b31", radius: 22, padding: 24, display: "flex", alignItems: "center", justifyContent: "space-between" } },
    form: { name: "New form", content: "Tell us what you are building.", style: { width: 420, height: 300, color: "#f7f6f2", background: "rgba(255,255,255,.08)", radius: 18, padding: 22 } },
    video: { name: "New video", content: "", style: { width: 520, height: 300, color: "#f7f6f2", background: "#14131a", radius: 18 } },
    "scrub-video": { name: "Video scrub", content: "", style: { width: 560, height: 320, color: "#f7f6f2", background: "#14131a", radius: 18 } },
    grid: { name: "New grid", content: "", style: { width: 640, height: 300, color: "#f7f6f2", background: "rgba(255,255,255,.05)", radius: 18, padding: 18, display: "grid" } },
    navbar: { name: "New navbar", content: "Visual Forge", style: { width: 720, height: 64, color: "#f7f6f2", background: "rgba(18,16,24,.86)", radius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between" } },
    card: { name: "New card", content: "A small surface with a clear point of view.", style: { width: 300, height: 210, color: "#f7f6f2", background: "linear-gradient(145deg,#3a2b59,#191923)", radius: 20, padding: 22 } },
  };
  const config = defaults[kind];
  const width = config.style.width ?? 220;
  const height = config.style.height ?? 100;
  return {
    id: `${kind}-${Date.now()}-${index}`,
    kind,
    name: config.name,
    content: config.content,
    styles: baseStyle({
      x: Math.max(36, 96 + (index % 3) * 48),
      y: Math.max(60, 74 + (index % 4) * 52),
      width,
      height,
      color: "#f7f6f2",
      background: "transparent",
      fontSize: 16,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0,
      radius: 0,
      padding: 0,
      opacity: 1,
      display: "block",
      alignItems: "start",
      justifyContent: "start",
      ...config.style,
    }),
    animation: animation("fade", 0.72),
    ...(kind === "carousel" ? { carousel: { slides: 4, autoplay: true, interval: 4, gap: 16 } } : {}),
    ...(kind === "form" ? { form: { fields: [{ id: "name", label: "Name", type: "text", required: true }, { id: "email", label: "Email", type: "email", required: true }, { id: "message", label: "Message", type: "textarea" }] } } : {}),
    ...(kind === "grid" ? { grid: { columns: 2, gap: 12 } } : {}),
    ...(kind === "navbar" ? { navbar: { links: ["Work", "About", "Contact"], sticky: false } } : {}),
    ...(kind === "card" ? { card: { variant: "glass" as const } } : {}),
    ...(kind === "video" || kind === "scrub-video" ? { video: { duration: kind === "scrub-video" ? 12 : 30, autoplay: false, loop: true, muted: true } } : {}),
    constraints: { left: true, right: false, top: true, bottom: false, width: "fixed", height: "fixed" },
    states: { hover: false, pressed: false, focus: false },
    accessibility: { role: kind === "button" ? "button" : undefined, label: config.name },
  };
}

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
}

function styleToCss(style: NodeStyle) {
  return [
    `position:absolute`,
    `left:${style.x}px`,
    `top:${style.y}px`,
    `width:${style.width}px`,
    `height:${style.height}px`,
    `color:${style.color}`,
    `background:${style.background}`,
    `font-size:${style.fontSize}px`,
    `font-weight:${style.fontWeight}`,
    `line-height:${style.lineHeight}`,
    `letter-spacing:${style.letterSpacing}px`,
    `border-radius:${style.radius}px`,
    `padding:${style.padding}px`,
    `opacity:${style.opacity}`,
    `display:${style.display}`,
    `align-items:${style.alignItems === "start" ? "flex-start" : style.alignItems === "end" ? "flex-end" : "center"}`,
    `justify-content:${style.justifyContent === "start" ? "flex-start" : style.justifyContent === "end" ? "flex-end" : style.justifyContent}`,
    `border:${style.borderWidth}px solid ${style.borderColor}`,
    `box-shadow:${style.shadow}`,
    `transform:rotate(${style.rotation}deg)`,
    `box-sizing:border-box`,
  ].join(";");
}

function nodeTag(node: EditorNode) {
  if (node.kind === "heading") return "h1";
  if (node.kind === "paragraph") return "p";
  if (node.kind === "button") return "a";
  return "div";
}

function renderNode(node: EditorNode, breakpoint: Breakpoint, indent = "  "): string {
  const style = getNodeStyle(node, breakpoint);
  const animationAttribute = node.animation.enabled ? ` data-animation="${node.animation.preset}"` : "";
  const content = node.kind === "image"
    ? `<span class=\"vf-image-orbit\" aria-hidden=\"true\"></span>`
    : node.kind === "video" || node.kind === "scrub-video"
      ? `<video class=\"vf-video-element\" src=\"${escapeHtml(node.video?.src ?? node.asset?.url ?? "")}\" controls playsinline></video>`
      : node.kind === "form"
        ? `<form class=\"vf-form\"><h3>${escapeHtml(node.content || "Tell us what you are building.")}</h3><label>Name<input type=\"text\" required /></label><label>Email<input type=\"email\" required /></label><label>Message<textarea></textarea></label><button type=\"submit\">Send inquiry</button></form>`
        : node.kind === "carousel"
          ? `<div class=\"vf-carousel-track\"><article>${escapeHtml(node.content || "A considered sequence of moments.")}</article><article>Second frame</article><article>Third frame</article></div>`
          : node.kind === "grid"
            ? `<div class=\"vf-grid-cells\"><span></span><span></span><span></span><span></span></div>`
            : node.kind === "navbar"
              ? `<nav><strong>${escapeHtml(node.content || "Visual Forge")}</strong><span>Work</span><span>About</span><span>Contact</span></nav>`
              : node.kind === "card"
                ? `<article class=\"vf-card-content\"><span>Visual system</span><strong>${escapeHtml(node.content || "A clear point of view.")}</strong></article>`
                : node.kind === "button"
                  ? escapeHtml(node.content)
                  : node.kind === "section" || node.kind === "container" || node.kind === "stack"
                    ? (node.children ?? []).map((child) => `\n${renderNode(child, breakpoint, `${indent}  `)}`).join("")
                    : escapeHtml(node.content).replace(/\n/g, "<br />");
  const tag = nodeTag(node);
  const role = node.kind === "button" ? " role=\"button\"" : "";
  const closing = `${indent}</${tag}>`;
  return `${indent}<${tag} class=\"vf-node vf-${node.kind}\" data-node-id=\"${node.id}\" style=\"${styleToCss(style)}\"${animationAttribute}${role}>${content}${content.includes("\n") ? `\n${indent}` : ""}${closing}`;
}

export function exportHtml(project: EditorProject, breakpoint: Breakpoint = "desktop") {
  const nodes = project.nodes.map((node) => renderNode(node, breakpoint)).join("\n");
  return `<main class="vf-page" data-breakpoint="${breakpoint}">\n${nodes}\n</main>`;
}

export function exportHtmlProject(project: EditorProject) {
  const nodes = project.nodes.map((node) => renderNode(node, "desktop")).join("\n");
  const collectNodes = (items: EditorNode[]): EditorNode[] => items.flatMap((node) => [node, ...(node.children ? collectNodes(node.children) : [])]);
  const motion = collectNodes(project.nodes).filter((node) => node.animation.enabled).map((node) => ({ id: node.id, animation: node.animation }));
  const manifest = JSON.stringify({ breakpoints: project.breakpoints, orientations: project.breakpointOrientations, motion }).replace(/</g, "\\u003c");
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width,initial-scale=1" />\n<title>${escapeHtml(project.name)}</title>\n<style>\n${exportResponsiveCss(project)}\n</style>\n</head>\n<body>\n<main class="vf-page" data-breakpoint="desktop">\n${nodes}\n</main>\n<script type="application/json" id="visual-forge-manifest">${manifest}</script>\n</body>\n</html>`;
}

export function exportCss() {
  return `.vf-page { position: relative; width: 1000px; min-height: 650px; overflow: hidden; font-family: Inter, system-ui, sans-serif; }\n.vf-page *, .vf-page *::before, .vf-page *::after { box-sizing: border-box; }\n.vf-image-orbit { display:block; width:55%; height:55%; margin:22% auto; border:1px solid rgba(255,255,255,.58); border-radius:50%; box-shadow:0 0 0 22px rgba(255,255,255,.12), 0 0 0 46px rgba(255,255,255,.08); }\n.vf-video-element { width:100%; height:100%; object-fit:cover; border-radius:inherit; }\n.vf-form { display:grid; gap:12px; }\n.vf-form label { display:grid; gap:5px; }\n.vf-form input, .vf-form textarea { min-height:32px; border:1px solid rgba(255,255,255,.18); border-radius:6px; background:rgba(255,255,255,.06); }\n.vf-carousel-track { display:grid; grid-auto-flow:column; grid-auto-columns:100%; gap:12px; overflow:hidden; }\n.vf-grid-cells { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; width:100%; height:100%; }\n.vf-grid-cells span { border:1px solid rgba(167,240,212,.22); border-radius:10px; }\n.vf-page nav { display:flex; align-items:center; justify-content:space-between; gap:16px; }\n@media (max-width: 720px) { .vf-page { width: 720px; } }\n@media (max-width: 480px) { .vf-page { width: 390px; } }`;
}

export function exportResponsiveCss(project: EditorProject) {
  const collectNodes = (items: EditorNode[]): EditorNode[] => items.flatMap((node) => [node, ...(node.children ? collectNodes(node.children) : [])]);
  const nodes = collectNodes(project.nodes);
  const base = exportCss();
  const rules = (["tablet", "mobile"] as Breakpoint[]).map((bp) => {
    const width = project.breakpoints?.[bp] ?? breakpointLabels[bp].width;
    const overrides = nodes.map((node) => Object.keys(node.styles[bp] ?? {}).length ? `[data-node-id="${node.id}"] { ${styleToCss(getNodeStyle(node, bp))} }` : "").filter(Boolean).join("\n");
    return `@media (max-width: ${width}px) { .vf-page { width: ${width}px; }\n${overrides}\n}`;
  }).join("\n");
  return `${base}\n${rules}`;
}

function componentNameFor(kind: ComponentKind) {
  return kind === "heading" ? "h1" : kind === "paragraph" ? "p" : kind === "button" ? "a" : "div";
}

function frameworkStyle(style: NodeStyle): Record<string, string | number> {
  return {
    position: "absolute",
    left: `${style.x}px`,
    top: `${style.y}px`,
    width: `${style.width}px`,
    height: `${style.height}px`,
    color: style.color,
    background: style.background,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: `${style.letterSpacing}px`,
    borderRadius: `${style.radius}px`,
    padding: `${style.padding}px`,
    opacity: style.opacity,
    display: style.display,
    alignItems: style.alignItems === "start" ? "flex-start" : style.alignItems === "end" ? "flex-end" : "center",
    justifyContent: style.justifyContent === "start" ? "flex-start" : style.justifyContent === "end" ? "flex-end" : style.justifyContent,
    border: `${style.borderWidth}px solid ${style.borderColor}`,
    boxShadow: style.shadow,
    transform: `rotate(${style.rotation}deg)`,
    boxSizing: "border-box",
  };
}

function reactStyle(style: Record<string, string | number>) {
  return `{ ${Object.entries(style).map(([key, value]) => `${key}: ${typeof value === "number" ? value : `\"${value}\"`}`).join(", ")} }`;
}

function vueStyle(style: Record<string, string | number>) {
  return `{ ${Object.entries(style).map(([key, value]) => `${key}: ${typeof value === "number" ? value : `'${value}'`}`).join(", ")} }`;
}

function renderFrameworkNode(node: EditorNode, framework: "vue" | "react" | "svelte", breakpoint: Breakpoint): string {
  const style = getNodeStyle(node, breakpoint);
  const visualStyle = frameworkStyle(style);
  const children: string = (node.children ?? []).map((child) => renderFrameworkNode(child, framework, breakpoint)).join("\n");
  const imageContent = framework === "react" ? "<span className=\"vf-image-orbit\" />" : "<span class=\"vf-image-orbit\"></span>";
  const mediaSource = escapeHtml(node.video?.src ?? node.asset?.url ?? "");
  const rawText: string = node.kind === "image" ? imageContent : node.kind === "video" || node.kind === "scrub-video" ? `<video class=\"vf-video-element\" src=\"${mediaSource}\" controls playsinline></video>` : node.kind === "form" ? `<form><label>Name<input type=\"text\" /></label><label>Email<input type=\"email\" /></label><button type=\"submit\">Send inquiry</button></form>` : node.kind === "carousel" ? `<div class=\"vf-carousel-track\"><article>${escapeHtml(node.content || "A considered sequence of moments.")}</article><article>Second frame</article></div>` : node.kind === "grid" ? `<div class=\"vf-grid-cells\"><span></span><span></span><span></span><span></span></div>` : node.kind === "navbar" ? `<nav><strong>${escapeHtml(node.content || "Visual Forge")}</strong><span>Work</span><span>About</span><span>Contact</span></nav>` : node.kind === "card" ? `<article>${escapeHtml(node.content || "A clear point of view.")}</article>` : node.kind === "section" || node.kind === "container" || node.kind === "stack" ? children : escapeHtml(node.content).replace(/\n/g, "<br />");
  const text = framework === "react" ? rawText.replace(/ class=/g, " className=").replace(/ playsinline/g, " playsInline").replace(/ for=/g, " htmlFor=") : rawText;
  const dataAttribute = `data-visual-node=\"${node.id}\"`;
  const accessibleLabel = node.accessibility?.label ? ` aria-label=\"${escapeHtml(node.accessibility.label)}\"` : "";
  const motionAttributes = node.animation.enabled ? ` data-animation=\"${node.animation.preset}\" data-motion-lifecycle=\"${node.animation.lifecycle ?? "onMount"}\" data-motion-duration=\"${node.animation.duration}\"` : "";
  const tag = componentNameFor(node.kind);
  if (framework === "vue") return `<${tag} class=\"vf-${node.kind}\" ${dataAttribute}${accessibleLabel}${motionAttributes} :style=\"${vueStyle(visualStyle)}\">${text}</${tag}>`;
  if (framework === "svelte") return `<${tag} class=\"vf-${node.kind}\" ${dataAttribute}${accessibleLabel}${motionAttributes} style=\"${styleToCss(style)}\">${text}</${tag}>`;
  return `<${tag} className=\"vf-${node.kind}\" ${dataAttribute}${accessibleLabel}${motionAttributes} style=${reactStyle(visualStyle)}>${text}</${tag}>`;
}

export function detectProjectFramework(files: Array<{ path: string; content?: string }>): EditorProject["detectedFramework"] {
  const paths = files.map((file) => file.path.toLowerCase());
  const source = files.map((file) => file.content ?? "").join("\n");
  if (paths.some((path) => path.endsWith(".svelte"))) return "svelte";
  if (paths.some((path) => path.endsWith(".vue"))) return "vue";
  if (paths.some((path) => path.endsWith(".jsx") || path.endsWith(".tsx")) || /from\s+[\"']react[\"']|import\s+React/.test(source)) return "react";
  if (paths.some((path) => path.endsWith(".html")) || /<!doctype html|<html[\s>]/i.test(source)) return "html";
  return "unknown";
}

function stripImportedText(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function importedAttribute(attrs: string, name: string) {
  return attrs.match(new RegExp(`${name}\\s*=\\s*[\\"']([^\\"']+)[\\"']`, "i"))?.[1];
}

export function reconstructImportedNodes(files: Array<{ path: string; content?: string }>, framework: EditorProject["detectedFramework"] = "unknown") {
  const source = files.filter((file) => file.content).map((file) => file.content).join("\n").replace(/<\/?(template|script|style|html|head|body|main|svg)[^>]*>/gi, "").slice(0, 1_500_000);
  const nodes: EditorNode[] = [];
  const addNode = (tagValue: string, attrs: string, body: string) => {
    const tag = tagValue.toLowerCase();
    if (["option", "label"].includes(tag) || nodes.length >= 24) return;
    const className = importedAttribute(attrs, "class") ?? importedAttribute(attrs, ":class") ?? "";
    const component = `${tag} ${className}`.toLowerCase();
    const kind: ComponentKind = component.includes("carousel") || component.includes("slider") ? "carousel" : component.includes("navbar") || tag === "nav" ? "navbar" : component.includes("video") || tag === "video" ? "video" : component.includes("form") || tag === "form" ? "form" : component.includes("grid") ? "grid" : component.includes("card") ? "card" : tag.match(/^h[1-6]$/) ? "heading" : tag === "button" || tag === "a" ? "button" : tag === "img" ? "image" : tag === "section" || tag === "div" ? "container" : "paragraph";
    const node = createNode(kind, nodes.length);
    node.id = `imported-${nodes.length + 1}-${kind}`;
    node.name = `${framework?.toUpperCase() ?? "Imported"} ${kind}`;
    node.content = stripImportedText(body).slice(0, 240);
    const style = node.styles.desktop ?? {};
    node.styles.desktop = { ...style, x: 36 + (nodes.length % 2) * 450, y: 42 + Math.floor(nodes.length / 2) * 148, width: kind === "heading" ? 420 : kind === "container" ? 420 : style.width, height: kind === "heading" ? 82 : kind === "form" ? 280 : style.height };
    node.styles.mobile = { ...node.styles.mobile, x: 24, y: 32 + nodes.length * 100, width: 340, height: Math.min(220, Number(node.styles.desktop.height ?? 100)) };
    const src = importedAttribute(attrs, "src");
    const alt = importedAttribute(attrs, "alt");
    if (kind === "image" && src) node.asset = { url: src, mimeType: "image/*", fileName: alt || "imported-image" };
    if (kind === "video" && src) node.video = { src, duration: 100, currentTime: 0, muted: true, loop: true };
    node.animation = { ...node.animation, enabled: false, preset: "none" };
    nodes.push(node);
  };
  const paired = /<(h[1-6]|button|a|nav|form|section|article|div|p)([^>]*)>([^<]{0,280})<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = paired.exec(source)) && nodes.length < 24) addNode(match[1], match[2] ?? "", match[3] ?? "");
  const media = /<(img|video)([^>]*)\/?\s*>/gi;
  while ((match = media.exec(source)) && nodes.length < 24) addNode(match[1], match[2] ?? "", "");
  return nodes;
}

export function projectFromImportedFiles(files: Array<{ path: string; size: number; kind: "source" | "style" | "asset" | "config"; content?: string }>, origin: "folder" | "github", sourceUrl?: string): EditorProject {
  const project = JSON.parse(JSON.stringify(starterProject)) as EditorProject;
  const detectedFramework = detectProjectFramework(files);
  const entry = files.find((file) => file.content?.match(/<h1[^>]*>([\s\S]*?)<\/h1>|<template|export default|function App/i));
  const importedTitle = entry?.content?.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, "").trim();
  project.name = sourceUrl?.split("/").filter(Boolean).pop()?.replace(/\.git$/, "") || (origin === "github" ? "GitHub import" : "Folder import");
  project.origin = origin;
  project.sourceUrl = sourceUrl;
  project.detectedFramework = detectedFramework;
  project.importedFiles = files.map(({ path, size, kind, content }) => ({ path, size, kind, content }));
  const importedNodes = reconstructImportedNodes(files, detectedFramework);
  const root = project.nodes[0];
  if (root && importedNodes.length) {
    root.children = importedNodes;
    root.name = `${project.name} / imported canvas`;
  }
  const heading = findNode(project.nodes, "hero-heading");
  if (heading && importedTitle) heading.content = importedTitle;
  return project;
}

export function updateImportedFileContent(project: EditorProject, targetPath: string, newContent: string): EditorProject {
  const files = (project.importedFiles ?? []).map((file) => file.path === targetPath ? { ...file, content: newContent, size: newContent.length } : file);
  const detectedFramework = detectProjectFramework(files);
  const nextNodes = reconstructImportedNodes(files, detectedFramework);
  const root = project.nodes[0];
  const updatedNodes = root && nextNodes.length
    ? updateNodeTree(project.nodes, root.id, (current) => ({ ...current, children: nextNodes }))
    : project.nodes;
  return {
    ...project,
    importedFiles: files,
    detectedFramework,
    nodes: updatedNodes,
    updatedAt: new Date().toISOString(),
  };
}

export function bundleProjectForLiveDev(project: EditorProject): string {
  const framework = project.detectedFramework ?? "unknown";
  const files = project.importedFiles ?? [];
  const cssFiles = files.filter((f) => f.kind === "style" && f.content).map((f) => f.content).join("\n");
  const responsiveCss = exportResponsiveCss(project);
  const combinedCss = `${responsiveCss}\n${cssFiles}`;

  const htmlEntry = files.find((f) => f.path.toLowerCase().endsWith(".html") && f.content);
  const reactEntry = files.find((f) => (f.path.toLowerCase().endsWith(".jsx") || f.path.toLowerCase().endsWith(".tsx") || f.path.toLowerCase().includes("app")) && f.content);
  const vueEntry = files.find((f) => f.path.toLowerCase().endsWith(".vue") && f.content);

  if (framework === "react" && reactEntry) {
    const rawJsx = reactEntry.content || "";
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${combinedCss}</style>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
</head>
<body style="margin:0; background:#121018; color:#f7f6f2;">
  <div id="root"></div>
  <script type="text/babel">
    ${rawJsx.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, "")}

    if (typeof App !== 'undefined') {
      ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    } else if (typeof Component !== 'undefined') {
      ReactDOM.createRoot(document.getElementById('root')).render(<Component />);
    } else {
      const Fallback = () => (
        <main className="vf-page">
          ${reactEntry.content ? `<h1>Loaded React Entry</h1><pre style={{color:'#a7f0d4'}}>${escapeHtml(reactEntry.path)}</pre>` : `<h1>React Live Mount</h1>`}
        </main>
      );
      ReactDOM.createRoot(document.getElementById('root')).render(<Fallback />);
    }
  </script>
</body>
</html>`;
  }

  if (framework === "vue" && vueEntry) {
    const rawVue = vueEntry.content || "";
    const templateMatch = rawVue.match(/<template>([\s\S]*?)<\/template>/i)?.[1] || "<div>Vue Mount</div>";
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>${combinedCss}</style>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
</head>
<body style="margin:0; background:#121018; color:#f7f6f2;">
  <div id="app"></div>
  <script>
    const { createApp } = Vue;
    createApp({
      template: \`${templateMatch.replace(/`/g, "\\`")}\`
    }).mount('#app');
  </script>
</body>
</html>`;
  }

  if (htmlEntry) {
    return htmlEntry.content?.includes("<html")
      ? htmlEntry.content
      : `<!DOCTYPE html><html><head><style>${combinedCss}</style></head><body style="margin:0; background:#121018; color:#f7f6f2;">${htmlEntry.content}</body></html>`;
  }

  return exportHtmlProject(project);
}

export function clampMediaTime(value: number, duration = 100) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), Math.max(duration, 0));
}

export function seekMediaElement(media: { currentTime: number } | null, value: number, duration = 100) {
  const nextTime = clampMediaTime(value, duration);
  if (media) media.currentTime = nextTime;
  return nextTime;
}

export function nextMediaPlayingState(state: Record<string, boolean>, id: string, playing: boolean) {
  return { ...state, [id]: playing };
}

export async function toggleMediaPlayback(media: { paused: boolean; play: () => Promise<void> | void; pause: () => void }) {
  if (media.paused) {
    await media.play();
    return true;
  }
  media.pause();
  return false;
}

export function gsapContextSnippet(framework: "html" | "vue" | "react" | "svelte" | "unknown", node: EditorNode) {
  const selector = `[data-visual-node=\"${node.id}\"]`;
  const motion = node.animation;
  const lifecycle = motion.lifecycle ?? "onMount";
  const plugins = Array.from(new Set([...(motion.plugins ?? []), ...(lifecycle === "onMount" ? [] : ["ScrollTrigger"])]));
  const pluginImports = plugins.length ? `\nimport { ${plugins.join(", ")} } from "gsap/all";\ngsap.registerPlugin(${plugins.join(", ")});\n` : "";
  const scroll = lifecycle === "onMount" ? "" : `scrollTrigger: { trigger: "${selector}", start: "${motion.start ?? "top 85%"}", end: "${motion.end ?? "bottom 20%"}", ${lifecycle === "onScroll" ? `scrub: ${motion.scrub === true ? "true" : typeof motion.scrub === "number" ? motion.scrub : "true"}, snap: ${typeof motion.snap === "string" ? JSON.stringify(motion.snap) : motion.snap ?? 1}, ` : `toggleActions: "${motion.toggleActions ?? "play none none reverse"}", `}markers: ${Boolean(motion.markers)} }, `;
  const vars = `${scroll}opacity: 0, y: 20, duration: ${motion.duration}, delay: ${motion.delay}, ease: "${motion.ease}", easeReverse: ${typeof motion.easeReverse === "string" ? `"${motion.easeReverse}"` : Boolean(motion.easeReverse)}, repeat: ${motion.repeat ?? 0}, yoyo: ${Boolean(motion.yoyo)}, stagger: ${motion.stagger ?? 0}`;
  const animationCode = `gsap.from("${selector}", { ${vars} })`;
  if (framework === "vue") return `import { onMounted, onUnmounted, ref } from "vue";\nimport { gsap } from "gsap";${pluginImports}\nconst root = ref<HTMLElement | null>(null);\nlet ctx: gsap.Context;\nonMounted(() => { ctx = gsap.context(() => ${animationCode}, root.value!); });\nonUnmounted(() => ctx?.revert());`;
  if (framework === "react") return `import { useLayoutEffect, useRef } from "react";\nimport gsap from "gsap";${pluginImports}\nconst root = useRef<HTMLDivElement>(null);\nuseLayoutEffect(() => { const ctx = gsap.context(() => ${animationCode}, root); return () => ctx.revert(); }, []);`;
  if (framework === "svelte") return `import { onMount } from "svelte";\nimport gsap from "gsap";${pluginImports}\nonMount(() => { const ctx = gsap.context(() => ${animationCode}); return () => ctx.revert(); });`;
  return `import { gsap } from "gsap";${pluginImports}\nconst ctx = gsap.context(() => ${animationCode});\n// Call ctx.revert() when the page is disposed.`;
}

export function exportFramework(project: EditorProject, framework: "vue" | "react" | "svelte", breakpoint: Breakpoint = "desktop") {
  const body = project.nodes.map((node) => renderFrameworkNode(node, framework, breakpoint)).join("\n");
  if (framework === "vue") return `<template>\n  <main class=\"vf-page\">\n${body}\n  </main>\n</template>\n\n<script setup lang=\"ts\">\n// Generated by Visual Forge\n</script>`;
  if (framework === "svelte") return `<script lang=\"ts\">\n  // Generated by Visual Forge\n</script>\n\n<main class=\"vf-page\">\n${body}\n</main>`;
  return `export default function GeneratedPage() {\n  return (\n    <main className=\"vf-page\">\n${body}\n    </main>\n  );\n}`;
}

export function exportFrameworkProject(project: EditorProject, framework: "vue" | "react" | "svelte") {
  const body = project.nodes.map((node) => renderFrameworkNode(node, framework, "desktop")).join("\n");
  const collectNodes = (items: EditorNode[]): EditorNode[] => items.flatMap((node) => [node, ...(node.children ? collectNodes(node.children) : [])]);
  const motion = collectNodes(project.nodes).filter((node) => node.animation.enabled).map((node) => ({ id: node.id, animation: node.animation }));
  const manifest = JSON.stringify({ breakpoints: project.breakpoints, orientations: project.breakpointOrientations, motion }).replace(/</g, "\\u003c");
  const responsiveCss = exportResponsiveCss(project);
  if (framework === "vue") return `<template>\n  <main class=\"vf-page\">\n${body}\n  </main>\n</template>\n\n<style>\n${responsiveCss}\n</style>\n\n<script setup lang=\"ts\">\nimport { onMounted, onUnmounted } from \"vue\";\nimport { gsap } from \"gsap\";\nconst visualForgeManifest = ${manifest};\nlet ctx: gsap.Context;\nonMounted(() => { ctx = gsap.context(() => {}); });\nonUnmounted(() => ctx?.revert());\n</script>`;
  if (framework === "svelte") return `<style>\n${responsiveCss}\n</style>\n\n<script lang=\"ts\">\nimport { onMount } from \"svelte\";\nimport gsap from \"gsap\";\nconst visualForgeManifest = ${manifest};\nonMount(() => { const ctx = gsap.context(() => {}); return () => ctx.revert(); });\n</script>\n\n<main class=\"vf-page\">\n${body}\n</main>`;
  return `import { useLayoutEffect } from \"react\";\nimport gsap from \"gsap\";\nconst visualForgeManifest = ${manifest};\nconst visualForgeResponsiveCss = ${JSON.stringify(responsiveCss)};\n\nexport default function GeneratedPage() {\n  useLayoutEffect(() => { const ctx = gsap.context(() => {}); return () => ctx.revert(); }, []);\n  return (\n    <>\n      <style dangerouslySetInnerHTML={{ __html: visualForgeResponsiveCss }} />\n      <main className=\"vf-page\">\n${body}\n      </main>\n    </>\n  );\n}`;
}

import JSZip from "jszip";

export function generateProjectZipFiles(project: EditorProject, framework: "html" | "vue" | "react" | "svelte"): Record<string, string> {
  const files: Record<string, string> = {};
  const responsiveCss = exportResponsiveCss(project);
  const pages = project.pages.length ? project.pages : ["Home"];

  if (framework === "react") {
    files["package.json"] = JSON.stringify({
      name: project.name.toLowerCase().replace(/\s+/g, "-"),
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { react: "^18.3.1", "react-dom": "^18.3.1", gsap: "^3.12.5" },
      devDependencies: { "@types/react": "^18.3.1", "@types/react-dom": "^18.3.1", "@vitejs/plugin-react": "^4.3.1", typescript: "^5.5.3", vite: "^5.4.1" },
    }, null, 2);
    files["vite.config.ts"] = `import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n`;
    files["index.html"] = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${escapeHtml(project.name)}</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>\n`;
    files["src/index.css"] = responsiveCss;
    files["src/main.tsx"] = `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./index.css";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);\n`;

    pages.forEach((pageName) => {
      const pageNodes = getProjectPageNodes(project, pageName);
      const componentName = pageName.replace(/[^a-zA-Z0-9]/g, "") || "Page";
      const body = pageNodes.map((node) => renderFrameworkNode(node, "react", "desktop")).join("\n");
      files[`src/pages/${componentName}.tsx`] = `import { useLayoutEffect, useRef } from "react";\nimport gsap from "gsap";\nimport { ScrollTrigger } from "gsap/ScrollTrigger";\ngsap.registerPlugin(ScrollTrigger);\n\nexport default function ${componentName}() {\n  const containerRef = useRef<HTMLDivElement>(null);\n  useLayoutEffect(() => {\n    const ctx = gsap.context(() => {\n      containerRef.current?.querySelectorAll("[data-animation]").forEach((el) => {\n        const preset = el.getAttribute("data-animation");\n        const vars: gsap.TweenVars = { opacity: 0, duration: 0.8, ease: "power3.out" };\n        if (preset === "slide-up") vars.y = 24;\n        if (preset === "scale") vars.scale = 0.92;\n        gsap.from(el, vars);\n      });\n    }, containerRef);\n    return () => ctx.revert();\n  }, []);\n\n  return (\n    <div ref={containerRef} className="vf-page">\n${body}\n    </div>\n  );\n}\n`;
    });

    const firstPageComp = pages[0]!.replace(/[^a-zA-Z0-9]/g, "") || "Page";
    files["src/App.tsx"] = `import React, { useState } from "react";\n${pages.map((p) => { const name = p.replace(/[^a-zA-Z0-9]/g, "") || "Page"; return `import ${name} from "./pages/${name}";`; }).join("\n")}\n\nexport default function App() {\n  const [activeTab, setActiveTab] = useState("${firstPageComp}");\n  return (\n    <div>\n      <nav style={{ display: "flex", gap: "12px", padding: "16px", background: "#17141d", color: "#f7f6f2", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>\n        ${pages.map((p) => { const name = p.replace(/[^a-zA-Z0-9]/g, "") || "Page"; return `<button key="${name}" style={{ background: activeTab === "${name}" ? "#a7f0d4" : "transparent", color: activeTab === "${name}" ? "#121018" : "#f7f6f2", border: "none", padding: "8px 16px", borderRadius: "99px", cursor: "pointer", fontWeight: 600 }} onClick={() => setActiveTab("${name}")}>${p}</button>`; }).join("\n        ")}\n      </nav>\n      ${pages.map((p) => { const name = p.replace(/[^a-zA-Z0-9]/g, "") || "Page"; return `{activeTab === "${name}" && <${name} />}`; }).join("\n      ")}\n    </div>\n  );\n}\n`;
  } else if (framework === "vue") {
    files["package.json"] = JSON.stringify({
      name: project.name.toLowerCase().replace(/\s+/g, "-"),
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { vue: "^3.4.31", gsap: "^3.12.5" },
      devDependencies: { "@vitejs/plugin-vue": "^5.0.5", typescript: "^5.5.3", vite: "^5.4.1" },
    }, null, 2);
    files["vite.config.ts"] = `import { defineConfig } from "vite";\nimport vue from "@vitejs/plugin-vue";\nexport default defineConfig({ plugins: [vue()] });\n`;
    files["index.html"] = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${escapeHtml(project.name)}</title>\n</head>\n<body>\n  <div id="app"></div>\n  <script type="module" src="/src/main.ts"></script>\n</body>\n</html>\n`;
    files["src/index.css"] = responsiveCss;
    files["src/main.ts"] = `import { createApp } from "vue";\nimport App from "./App.vue";\nimport "./index.css";\ncreateApp(App).mount("#app");\n`;

    pages.forEach((pageName) => {
      const pageNodes = getProjectPageNodes(project, pageName);
      const componentName = pageName.replace(/[^a-zA-Z0-9]/g, "") || "Page";
      const body = pageNodes.map((node) => renderFrameworkNode(node, "vue", "desktop")).join("\n");
      files[`src/pages/${componentName}.vue`] = `<template>\n  <main ref="containerRef" class="vf-page">\n${body}\n  </main>\n</template>\n\n<script setup lang="ts">\nimport { onMounted, onUnmounted, ref } from "vue";\nimport { gsap } from "gsap";\nimport { ScrollTrigger } from "gsap/ScrollTrigger";\ngsap.registerPlugin(ScrollTrigger);\n\nconst containerRef = ref<HTMLElement | null>(null);\nlet ctx: gsap.Context;\n\nonMounted(() => {\n  ctx = gsap.context(() => {\n    containerRef.value?.querySelectorAll("[data-animation]").forEach((el) => {\n      const preset = el.getAttribute("data-animation");\n      const vars: gsap.TweenVars = { opacity: 0, duration: 0.8, ease: "power3.out" };\n      if (preset === "slide-up") vars.y = 24;\n      if (preset === "scale") vars.scale = 0.92;\n      gsap.from(el, vars);\n    });\n  }, containerRef.value!);\n});\n\nonUnmounted(() => ctx?.revert());\n</script>\n`;
    });

    const firstPageComp = pages[0]!.replace(/[^a-zA-Z0-9]/g, "") || "Page";
    files["src/App.vue"] = `<template>\n  <div>\n    <nav style="display: flex; gap: 12px; padding: 16px; background: #17141d; color: #f7f6f2; border-bottom: 1px solid rgba(255,255,255,0.1);">\n      ${pages.map((p) => { const name = p.replace(/[^a-zA-Z0-9]/g, "") || "Page"; return `<button :style="{ background: activeTab === '${name}' ? '#a7f0d4' : 'transparent', color: activeTab === '${name}' ? '#121018' : '#f7f6f2', border: 'none', padding: '8px 16px', borderRadius: '99px', cursor: 'pointer', fontWeight: 600 }" @click="activeTab = '${name}'">${p}</button>`; }).join("\n      ")}\n    </nav>\n    ${pages.map((p) => { const name = p.replace(/[^a-zA-Z0-9]/g, "") || "Page"; return `<${name} v-if="activeTab === '${name}'" />`; }).join("\n    ")}\n  </div>\n</template>\n\n<script setup lang="ts">\nimport { ref } from "vue";\n${pages.map((p) => { const name = p.replace(/[^a-zA-Z0-9]/g, "") || "Page"; return `import ${name} from "./pages/${name}.vue";`; }).join("\n")}\n\nconst activeTab = ref("${firstPageComp}");\n</script>\n`;
  } else if (framework === "svelte") {
    files["package.json"] = JSON.stringify({
      name: project.name.toLowerCase().replace(/\s+/g, "-"),
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { svelte: "^4.2.18", gsap: "^3.12.5" },
      devDependencies: { "@sveltejs/vite-plugin-svelte": "^3.1.1", typescript: "^5.5.3", vite: "^5.4.1" },
    }, null, 2);
    files["vite.config.ts"] = `import { defineConfig } from "vite";\nimport { svelte } from "@sveltejs/vite-plugin-svelte";\nexport default defineConfig({ plugins: [svelte()] });\n`;
    files["index.html"] = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${escapeHtml(project.name)}</title>\n</head>\n<body>\n  <div id="app"></div>\n  <script type="module" src="/src/main.ts"></script>\n</body>\n</html>\n`;
    files["src/index.css"] = responsiveCss;
    files["src/main.ts"] = `import App from "./App.svelte";\nimport "./index.css";\nconst app = new App({ target: document.getElementById("app")! });\nexport default app;\n`;

    pages.forEach((pageName) => {
      const pageNodes = getProjectPageNodes(project, pageName);
      const componentName = pageName.replace(/[^a-zA-Z0-9]/g, "") || "Page";
      const body = pageNodes.map((node) => renderFrameworkNode(node, "svelte", "desktop")).join("\n");
      files[`src/pages/${componentName}.svelte`] = `<script lang="ts">\n  import { onMount } from "svelte";\n  import { gsap } from "gsap";\n  import { ScrollTrigger } from "gsap/ScrollTrigger";\n  gsap.registerPlugin(ScrollTrigger);\n  let containerRef: HTMLElement;\n  onMount(() => {\n    const ctx = gsap.context(() => {\n      containerRef?.querySelectorAll("[data-animation]").forEach((el) => {\n        const preset = el.getAttribute("data-animation");\n        const vars: gsap.TweenVars = { opacity: 0, duration: 0.8, ease: "power3.out" };\n        if (preset === "slide-up") vars.y = 24;\n        if (preset === "scale") vars.scale = 0.92;\n        gsap.from(el, vars);\n      });\n    }, containerRef);\n    return () => ctx.revert();\n  });\n</script>\n\n<main bind:this={containerRef} class="vf-page">\n${body}\n</main>\n`;
    });

    const firstPageComp = pages[0]!.replace(/[^a-zA-Z0-9]/g, "") || "Page";
    files["src/App.svelte"] = `<script lang="ts">\n  ${pages.map((p) => { const name = p.replace(/[^a-zA-Z0-9]/g, "") || "Page"; return `import ${name} from "./pages/${name}.svelte";`; }).join("\n  ")}\n  let activeTab = "${firstPageComp}";\n</script>\n\n<div>\n  <nav style="display: flex; gap: 12px; padding: 16px; background: #17141d; color: #f7f6f2; border-bottom: 1px solid rgba(255,255,255,0.1);">\n    ${pages.map((p) => { const name = p.replace(/[^a-zA-Z0-9]/g, "") || "Page"; return `<button style="background: {activeTab === '${name}' ? '#a7f0d4' : 'transparent'}; color: {activeTab === '${name}' ? '#121018' : '#f7f6f2'}; border: none; padding: 8px 16px; border-radius: 99px; cursor: pointer; font-weight: 600;" on:click={() => activeTab = '${name}'}>${p}</button>`; }).join("\n    ")}\n  </nav>\n  ${pages.map((p) => { const name = p.replace(/[^a-zA-Z0-9]/g, "") || "Page"; return `{#if activeTab === '${name}'}<${name} />{/if}`; }).join("\n  ")}\n</div>\n`;
  } else {
    files["styles.css"] = responsiveCss;
    pages.forEach((pageName, index) => {
      const pageNodes = getProjectPageNodes(project, pageName);
      const filename = index === 0 ? "index.html" : `${pageName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`;
      const nodesMarkup = pageNodes.map((node) => renderNode(node, "desktop")).join("\n");
      const navLinks = pages.map((p, i) => {
        const href = i === 0 ? "index.html" : `${p.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`;
        return `<a href="${href}" style="color:${p === pageName ? "#a7f0d4" : "#f7f6f2"}; text-decoration:none; font-weight:600;">${p}</a>`;
      }).join(" | ");

      files[filename] = `<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8" />\n  <meta name="viewport" content="width=device-width,initial-scale=1" />\n  <title>${escapeHtml(project.name)} - ${escapeHtml(pageName)}</title>\n  <link rel="stylesheet" href="styles.css" />\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>\n  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>\n</head>\n<body>\n<header style="padding:16px; background:#17141d; color:#f7f6f2; display:flex; gap:16px;">${navLinks}</header>\n<main class="vf-page" data-breakpoint="desktop">\n${nodesMarkup}\n</main>\n<script>\n  document.addEventListener("DOMContentLoaded", () => {\n    gsap.registerPlugin(ScrollTrigger);\n    document.querySelectorAll("[data-animation]").forEach((el) => {\n      const preset = el.getAttribute("data-animation");\n      const vars = { opacity: 0, duration: 0.8, ease: "power3.out" };\n      if (preset === "slide-up") vars.y = 24;\n      if (preset === "scale") vars.scale = 0.92;\n      gsap.from(el, vars);\n    });\n  });\n</script>\n</body>\n</html>`;
    });
  }

  return files;
}

export async function downloadProjectZip(project: EditorProject, framework: "html" | "vue" | "react" | "svelte"): Promise<Blob> {
  const zip = new JSZip();
  const files = generateProjectZipFiles(project, framework);
  Object.entries(files).forEach(([filepath, content]) => {
    zip.file(filepath, content);
  });
  return await zip.generateAsync({ type: "blob" });
}
