import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Fragment } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  FolderOpen,
  Grid2X2,
  Image as ImageIcon,
  Layers3,
  LayoutTemplate,
  Link2,
  Lock,
  MoreHorizontal,
  MousePointer2,
  Move,
  Paintbrush,
  Play,
  Pause,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Sparkles,
  SquareDashedMousePointer,
  Type,
  Undo2,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  breakpointLabels,
  componentCatalog,
  createNode,
  exportCss,
  exportResponsiveCss,
  exportFramework,
  exportFrameworkProject,
  exportHtml,
  exportHtmlProject,
  findNode,
  getNodeStyle,
  starterProject,
  updateNodeTree,
  updateBreakpointConfig,
  projectFromImportedFiles,
  updateImportedFileContent,
  bundleProjectForLiveDev,
  gsapContextSnippet,
  migrateProject,
  clampMediaTime,
  seekMediaElement,
  nextMediaPlayingState,
  toggleMediaPlayback,
  switchProjectPage,
} from "@/lib/editorModel";
import type { Breakpoint, ComponentKind, EditorNode, EditorProject, NodeStyle } from "@/lib/editorModel";
import { trpc } from "@/lib/trpc";

type RailKey = "library" | "layers" | "assets" | "files" | "settings";
type InspectorTab = "design" | "motion";
type CodeTab = "html" | "css" | "vue" | "react" | "svelte" | "gsap";

type FlatLayer = EditorNode & { depth: number };

const gsapPlugins = ["ScrollTrigger", "ScrollSmoother", "ScrollToPlugin", "Observer", "Draggable", "InertiaPlugin", "Flip", "MotionPathPlugin", "MotionPathHelper", "DrawSVGPlugin", "MorphSVGPlugin", "SplitText", "ScrambleTextPlugin", "TextPlugin", "Physics2DPlugin", "PhysicsPropsPlugin", "CustomEase", "CustomBounce", "CustomWiggle"] as const;

const railItems: Array<{ key: RailKey; label: string; icon: typeof LayoutTemplate }> = [
  { key: "library", label: "Library", icon: LayoutTemplate },
  { key: "layers", label: "Layers", icon: Layers3 },
  { key: "assets", label: "Assets", icon: ImageIcon },
  { key: "files", label: "Files", icon: FolderOpen },
  { key: "settings", label: "Settings", icon: Settings2 },
];

const cloneProject = (project: EditorProject): EditorProject => JSON.parse(JSON.stringify(project)) as EditorProject;

function flattenLayers(nodes: EditorNode[], depth = 0): FlatLayer[] {
  return nodes.flatMap((node) => [
    { ...node, depth },
    ...(node.children ? flattenLayers(node.children, depth + 1) : []),
  ]);
}

function reorderSiblings(nodes: EditorNode[], draggedId: string, targetId: string): EditorNode[] {
  const draggedIndex = nodes.findIndex((node) => node.id === draggedId);
  const targetIndex = nodes.findIndex((node) => node.id === targetId);
  if (draggedIndex >= 0 && targetIndex >= 0) {
    const next = [...nodes];
    const [dragged] = next.splice(draggedIndex, 1);
    if (!dragged) return nodes;
    next.splice(targetIndex, 0, dragged);
    return next;
  }
  return nodes.map((node) => node.children ? { ...node, children: reorderSiblings(node.children, draggedId, targetId) } : node);
}

function containsNode(node: EditorNode, id: string): boolean {
  return node.id === id || Boolean(node.children?.some((child) => containsNode(child, id)));
}

function removeNode(nodes: EditorNode[], id: string): { nodes: EditorNode[]; removed?: EditorNode } {
  const index = nodes.findIndex((node) => node.id === id);
  if (index >= 0) {
    const next = [...nodes];
    const [removed] = next.splice(index, 1);
    return { nodes: next, removed };
  }
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (!node?.children) continue;
    const result = removeNode(node.children, id);
    if (result.removed) {
      const next = [...nodes];
      next[index] = { ...node, children: result.nodes };
      return { nodes: next, removed: result.removed };
    }
  }
  return { nodes };
}

function insertAfterTarget(nodes: EditorNode[], targetId: string, nodeToInsert: EditorNode): EditorNode[] {
  const targetIndex = nodes.findIndex((node) => node.id === targetId);
  if (targetIndex >= 0) {
    const next = [...nodes];
    next.splice(targetIndex + 1, 0, nodeToInsert);
    return next;
  }
  return nodes.map((node) => node.children ? { ...node, children: insertAfterTarget(node.children, targetId, nodeToInsert) } : node);
}

export function moveLayer(nodes: EditorNode[], draggedId: string, targetId: string): EditorNode[] {
  const dragged = findNode(nodes, draggedId);
  const target = findNode(nodes, targetId);
  if (!dragged || !target || draggedId === targetId || containsNode(dragged, targetId)) return nodes;
  const removed = removeNode(nodes, draggedId);
  if (!removed.removed) return nodes;
  if (["section", "container", "stack"].includes(target.kind)) {
    return updateNodeTree(removed.nodes, targetId, (node) => ({ ...node, children: [...(node.children ?? []), removed.removed as EditorNode] }));
  }
  return insertAfterTarget(removed.nodes, targetId, removed.removed);
}

function snapToGrid(value: number, grid = 8) {
  return Math.round(value / grid) * grid;
}

function smartSnap(value: number, targets: number[]) {
  const nearest = targets.reduce((best, target) => Math.abs(target - value) < Math.abs(best - value) ? target : best, Number.POSITIVE_INFINITY);
  return Number.isFinite(nearest) && Math.abs(nearest - value) <= 10 ? nearest : snapToGrid(value);
}

function kindIcon(kind: ComponentKind) {
  if (kind === "heading") return <Type size={13} strokeWidth={1.8} />;
  if (kind === "paragraph") return <AlignLeft size={13} strokeWidth={1.8} />;
  if (kind === "button") return <MousePointer2 size={13} strokeWidth={1.8} />;
  if (kind === "image") return <ImageIcon size={13} strokeWidth={1.8} />;
  if (kind === "section") return <LayoutTemplate size={13} strokeWidth={1.8} />;
  if (kind === "stack") return <Grid2X2 size={13} strokeWidth={1.8} />;
  return <SquareDashedMousePointer size={13} strokeWidth={1.8} />;
}

function formatValue(value: string | number | undefined) {
  if (typeof value === "number") return `${Math.round(value)}px`;
  return value ?? "—";
}

export default function Home() {
  const [project, setProject] = useState<EditorProject>(() => {
    try {
      const saved = localStorage.getItem("visual-forge-project");
      return saved ? migrateProject({ ...cloneProject(starterProject), ...JSON.parse(saved) }) : cloneProject(starterProject);
    } catch {
      return cloneProject(starterProject);
    }
  });
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<number | undefined>();
  const [remoteProjectId, setRemoteProjectId] = useState<number | undefined>();
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const { data: savedProjects } = trpc.projects.list.useQuery(undefined, { enabled: Boolean(user), staleTime: 30_000 });
  const { data: remoteProject } = trpc.projects.get.useQuery(
    { id: remoteProjectId ?? 0 },
    { enabled: Boolean(user && remoteProjectId), staleTime: 30_000 },
  );
  const saveMutation = trpc.projects.save.useMutation({
    onSuccess: (savedId) => {
      if (savedId) setProjectId(savedId);
      setStatus("Saved to workspace");
    },
    onError: () => {
      setStatus("Saved locally");
      toast.error("Remote save failed; your local copy is safe");
    },
  });
  useEffect(() => {
    if (savedProjects?.[0] && !remoteProjectId) setRemoteProjectId(savedProjects[0].id);
  }, [remoteProjectId, savedProjects]);
  useEffect(() => {
    if (!remoteProject?.projectJson) return;
    try {
      const loaded = JSON.parse(remoteProject.projectJson) as EditorProject;
      const migrated = migrateProject(loaded);
      setProject(migrated);
      if (migrated.breakpoints) setBreakpointWidths(migrated.breakpoints);
      if (migrated.breakpointOrientations) setBreakpointOrientations(migrated.breakpointOrientations);
      setProjectId(remoteProject.id);
      setStatus("Loaded from workspace");
    } catch {
      toast.error("Could not load the saved project model");
    }
  }, [remoteProject]);
  const [selectedId, setSelectedId] = useState("hero-heading");
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => typeof window !== "undefined" && window.innerWidth <= 480 ? "mobile" : "desktop");
  const [breakpointWidths, setBreakpointWidths] = useState<Record<Breakpoint, number>>(() => project.breakpoints ?? { desktop: breakpointLabels.desktop.width, tablet: breakpointLabels.tablet.width, mobile: breakpointLabels.mobile.width });
  const [breakpointOrientations, setBreakpointOrientations] = useState<Record<Breakpoint, "portrait" | "landscape">>(() => project.breakpointOrientations ?? { desktop: "landscape", tablet: "landscape", mobile: "portrait" });
  const [activeRail, setActiveRail] = useState<RailKey>("library");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("design");
  const [codeTab, setCodeTab] = useState<CodeTab>("html");
  const [showCode, setShowCode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [zoom, setZoom] = useState(74);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Saved just now");
  const [history, setHistory] = useState<EditorProject[]>([]);
  const [future, setFuture] = useState<EditorProject[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [videoTimes, setVideoTimes] = useState<Record<string, number>>({});
  const [mediaPlaying, setMediaPlaying] = useState<Record<string, boolean>>({});
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [liveDevMode, setLiveDevMode] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const mediaRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const previewContext = useRef<gsap.Context | null>(null);
  const githubImport = trpc.projects.importGithub.useMutation();
  const uploadAsset = trpc.projects.uploadAsset.useMutation();
  useEffect(() => () => { previewContext.current?.revert(); }, []);

  const selectedNode = useMemo(() => findNode(project.nodes, selectedId), [project.nodes, selectedId]);
  const selectedVideoTime = selectedNode ? (videoTimes[selectedNode.id] ?? selectedNode.video?.currentTime ?? 0) : 0;
  const selectedStyle = selectedNode ? getNodeStyle(selectedNode, breakpoint) : undefined;
  const layers = useMemo(() => flattenLayers(project.nodes), [project.nodes]);
  const assetLibrary = useMemo(() => layers.filter((layer) => Boolean(layer.asset?.url)).map((layer) => ({ id: layer.id, name: layer.name, url: layer.asset?.url ?? "", kind: layer.kind })), [layers]);
  const visibleCatalog = useMemo(
    () => componentCatalog.filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(search.toLowerCase())),
    [search],
  );
  const canvasWidth = breakpointWidths[breakpoint];
  const canvasHeight = breakpointOrientations[breakpoint] === "portrait" ? Math.round(canvasWidth * 1.6) : 650;
  const hasActiveOverride = Boolean(selectedNode && Object.keys(selectedNode.styles[breakpoint] ?? {}).length);
  function updateBreakpointOrientation(value: "portrait" | "landscape") {
    setBreakpointOrientations((current) => ({ ...current, [breakpoint]: value }));
    setProject((current) => updateBreakpointConfig(current, breakpoint, { orientation: value }));
  }
  function updateBreakpointWidth(value: number) {
    const nextWidth = Math.min(1800, Math.max(240, Number(value) || 240));
    setBreakpointWidths((current) => ({ ...current, [breakpoint]: nextWidth }));
    setProject((current) => updateBreakpointConfig(current, breakpoint, { width: nextWidth }));
  }
  const currentCode = useMemo(() => {
    if (codeTab === "html") return exportHtmlProject(project);
    if (codeTab === "css") return exportResponsiveCss(project);
    if (codeTab === "gsap") return selectedNode ? gsapContextSnippet(project.detectedFramework ?? "unknown", selectedNode) : "Select a layer to generate a GSAP context.";
    return exportFrameworkProject(project, codeTab);
  }, [breakpoint, codeTab, project, selectedNode]);

  function setProjectWithHistory(next: EditorProject) {
    setHistory((items) => [...items.slice(-19), cloneProject(project)]);
    setFuture([]);
    setProject(next);
    setStatus("Unsaved changes");
  }

  function updateNode(id: string, updater: (node: EditorNode) => EditorNode, withHistory = false) {
    const updatedNodes = updateNodeTree(project.nodes, id, updater);
    const next = {
      ...project,
      updatedAt: new Date().toISOString(),
      nodes: updatedNodes,
      pageNodes: {
        ...(project.pageNodes ?? {}),
        [project.activePage]: updatedNodes,
      },
    };
    if (withHistory) setProjectWithHistory(next);
    else {
      setProject(next);
      setStatus("Unsaved changes");
    }
  }

  function updateSelectedStyle(patch: Partial<NodeStyle>, withHistory = false) {
    if (!selectedNode) return;
    updateNode(selectedNode.id, (node) => ({
      ...node,
      styles: {
        ...node.styles,
        [breakpoint]: { ...node.styles[breakpoint], ...patch },
      },
    }), withHistory);
  }

  function updateSelectedContent(content: string) {
    if (!selectedNode) return;
    updateNode(selectedNode.id, (node) => ({ ...node, content }));
  }

  function updateSelectedMeta(patch: Partial<EditorNode>) {
    if (!selectedNode) return;
    updateNode(selectedNode.id, (node) => ({ ...node, ...patch }));
  }

  function updateSelectedConstraint(patch: Partial<NonNullable<EditorNode["constraints"]>>) {
    if (!selectedNode) return;
    updateNode(selectedNode.id, (node) => ({ ...node, constraints: { left: true, right: false, top: true, bottom: false, width: "fixed", height: "fixed", ...node.constraints, ...patch } }));
  }

  function updateSelectedState(patch: Partial<NonNullable<EditorNode["states"]>>) {
    if (!selectedNode) return;
    updateNode(selectedNode.id, (node) => ({ ...node, states: { hover: false, pressed: false, focus: false, ...node.states, ...patch } }));
  }

  function addComponent(kind: ComponentKind, dropPoint?: { x: number; y: number }) {
    const newNode = createNode(kind, layers.length);
    if (dropPoint) {
      newNode.styles[breakpoint] = { ...newNode.styles[breakpoint], x: snapToGrid(dropPoint.x), y: snapToGrid(dropPoint.y) };
    }
    if (kind === "section") {
      setProjectWithHistory({ ...project, nodes: [...project.nodes, newNode], updatedAt: new Date().toISOString() });
      setSelectedId(newNode.id);
    } else {
      const root = project.nodes[0];
      if (!root) return;
      const next = {
        ...project,
        updatedAt: new Date().toISOString(),
        nodes: updateNodeTree(project.nodes, root.id, (node) => ({
          ...node,
          children: [...(node.children ?? []), newNode],
        })),
      };
      setProjectWithHistory(next);
      setSelectedId(newNode.id);
    }
    toast.success(`${componentCatalog.find((item) => item.kind === kind)?.label ?? "Component"} added to canvas`);
  }

  function undo() {
    const previous = history[history.length - 1];
    if (!previous) return;
    setFuture((items) => [cloneProject(project), ...items]);
    setHistory((items) => items.slice(0, -1));
    setProject(previous);
    setStatus("Restored previous change");
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setHistory((items) => [...items, cloneProject(project)]);
    setFuture((items) => items.slice(1));
    setProject(next);
    setStatus("Restored next change");
  }

  async function importFolder(files: FileList | null) {
    if (!files?.length) return;
    setImporting(true);
    try {
      const selected = Array.from(files).slice(0, 160);
      let contentBudget = 1_500_000;
      const imported = await Promise.all(selected.map(async (file) => {
        const lower = file.name.toLowerCase();
        const kind = /\.(png|jpe?g|gif|webp|svg|mp4|webm|mov|woff2?|ttf)$/.test(lower) ? "asset" : /\.(css|scss|less)$/.test(lower) ? "style" : /(^|\/)(package|vite|tsconfig|eslint|tailwind)\b|\.json$/.test(lower) ? "config" : "source";
        const shouldRead = (kind === "source" || kind === "style" || kind === "config") && file.size > 0 && file.size < 180_000 && contentBudget >= file.size;
        if (shouldRead) contentBudget -= file.size;
        const content = shouldRead ? (await file.text()).slice(0, 180_000) : undefined;
        return { path: file.webkitRelativePath || file.name, size: file.size, kind: kind as "source" | "style" | "asset" | "config", content };
      }));
      const importedProject = projectFromImportedFiles(imported, "folder");
      setProjectWithHistory(importedProject);
      localStorage.setItem("visual-forge-project", JSON.stringify(importedProject));
      setShowImport(false);
      toast.success(`Imported ${imported.length} files · ${importedProject.detectedFramework ?? "unknown"} detected`);
    } catch {
      toast.error("Folder import failed. Check that the files are readable.");
    } finally {
      setImporting(false);
    }
  }

  async function uploadAssetFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !user) {
      if (!user) toast.info("Sign in to persist uploaded assets");
      return;
    }
    if (file.size > 5_000_000) {
      toast.error("Assets must be smaller than 5 MB");
      return;
    }
    setUploadingAsset(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",")[1] ?? "";
      const uploaded = await uploadAsset.mutateAsync({ name: file.name, mimeType: file.type || "application/octet-stream", size: file.size, data: base64 });
      const kind: ComponentKind = file.type.startsWith("video/") ? "video" : "image";
      const node = createNode(kind, layers.length);
      node.name = file.name;
      node.asset = { url: uploaded.url, key: uploaded.key, mimeType: file.type, fileName: file.name };
      if (kind === "video") node.video = { src: uploaded.url, duration: 100, currentTime: 0, muted: true, loop: true };
      const root = project.nodes[0];
      if (!root) return;
      const next = { ...project, nodes: updateNodeTree(project.nodes, root.id, (current) => ({ ...current, children: [...(current.children ?? []), node] })), updatedAt: new Date().toISOString() };
      setProjectWithHistory(next);
      setSelectedId(node.id);
      toast.success(`${kind === "video" ? "Video" : "Image"} added from storage`);
    } catch {
      toast.error("Asset upload failed");
    } finally {
      setUploadingAsset(false);
    }
  }

  async function importGithubProject() {
    if (!githubUrl.trim()) return;
    setImporting(true);
    try {
      const result = await githubImport.mutateAsync({ url: githubUrl.trim() });
      const importedProject = projectFromImportedFiles(result.files, "github", result.sourceUrl);
      setProjectWithHistory(importedProject);
      localStorage.setItem("visual-forge-project", JSON.stringify(importedProject));
      setShowImport(false);
      toast.success(`Imported ${result.files.length} files · ${importedProject.detectedFramework ?? "unknown"} detected`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "GitHub import failed");
    } finally {
      setImporting(false);
    }
  }

  function setMediaTime(id: string, value: number) {
    const duration = findNode(project.nodes, id)?.video?.duration ?? 100;
    const media = mediaRefs.current[id];
    const nextTime = seekMediaElement(media, value, duration);
    setVideoTimes((current) => ({ ...current, [id]: nextTime }));
  }

  function toggleMedia(id: string) {
    const media = mediaRefs.current[id];
    if (!media) {
      toast.info("Add a video asset to enable playback controls");
      return;
    }
    void toggleMediaPlayback(media).then((playing) => {
      setMediaPlaying((current) => nextMediaPlayingState(current, id, playing));
    }).catch(() => toast.error("Playback could not start for this asset"));
  }

  function selectFileToEdit(path: string) {
    setActiveFilePath(path);
    const file = project.importedFiles?.find((f) => f.path === path);
    setFileContent(file?.content || "");
  }

  function handleSaveFileContent() {
    if (!activeFilePath) return;
    const nextProject = updateImportedFileContent(project, activeFilePath, fileContent);
    setProjectWithHistory(nextProject);
    toast.success(`Updated ${activeFilePath.split("/").pop()} & synced to canvas`);
  }

  function assignAssetToSelected(assetUrl: string) {
    if (!selectedNode) return;
    const asset = assetLibrary.find((item) => item.url === assetUrl);
    if (!asset) return;
    updateSelectedMeta({ asset: { ...selectedNode.asset, url: asset.url, fileName: asset.name }, video: selectedNode.kind === "video" || selectedNode.kind === "scrub-video" ? { ...selectedNode.video, src: asset.url } : selectedNode.video });
  }

  function reuseAsset(assetId: string) {
    const source = findNode(project.nodes, assetId);
    if (!source?.asset?.url) return;
    const kind: ComponentKind = source.kind === "video" || source.kind === "scrub-video" ? source.kind : "image";
    const node = createNode(kind, layers.length);
    node.name = `${source.name} copy`;
    node.asset = { ...source.asset };
    if (kind === "video" || kind === "scrub-video") node.video = { ...source.video, src: source.asset.url, duration: source.video?.duration ?? 100, currentTime: 0, muted: true, loop: true };
    const root = project.nodes[0];
    if (!root) return;
    const next = { ...project, updatedAt: new Date().toISOString(), nodes: updateNodeTree(project.nodes, root.id, (current) => ({ ...current, children: [...(current.children ?? []), node] })) };
    setProjectWithHistory(next);
    setSelectedId(node.id);
    toast.success("Asset reused on canvas");
  }

  function saveProject() {
    localStorage.setItem("visual-forge-project", JSON.stringify(project));
    if (user) {
      saveMutation.mutate({ id: projectId, name: project.name, activePage: project.activePage, projectJson: JSON.stringify(project), origin: project.origin, detectedFramework: project.detectedFramework, sourceUrl: project.sourceUrl, importedFiles: JSON.stringify(project.importedFiles ?? []) });
      setStatus("Saved to workspace");
      toast.success("Project saved to your workspace");
    } else {
      setStatus("Saved just now");
      toast.success("Project saved locally");
    }
  }

  function startDrag(event: ReactPointerEvent<HTMLElement>, id: string) {
    if (previewMode) return;
    event.stopPropagation();
    setSelectedId(id);
    const canvas = canvasRef.current;
    const node = findNode(project.nodes, id);
    if (!canvas || !node) return;
    const bounds = canvas.getBoundingClientRect();
    const startProject = cloneProject(project);
    const startStyle = getNodeStyle(node, breakpoint);
    const scale = zoom / 100;
    const startX = (event.clientX - bounds.left) / scale;
    const startY = (event.clientY - bounds.top) / scale;
    const xTargets = [0, Math.max(0, canvasWidth - startStyle.width), Math.round((canvasWidth - startStyle.width) / 2), ...layers.filter((layer) => layer.id !== id).map((layer) => getNodeStyle(layer, breakpoint).x)];
    const yTargets = [0, Math.max(0, canvasHeight - startStyle.height), Math.round((canvasHeight - startStyle.height) / 2), ...layers.filter((layer) => layer.id !== id).map((layer) => getNodeStyle(layer, breakpoint).y)];

    const move = (moveEvent: PointerEvent) => {
      const rawX = startStyle.x + (moveEvent.clientX - bounds.left) / scale - startX;
      const rawY = startStyle.y + (moveEvent.clientY - bounds.top) / scale - startY;
      const nextX = Math.max(0, smartSnap(rawX, xTargets));
      const nextY = Math.max(0, smartSnap(rawY, yTargets));
      updateNode(id, (current) => ({
        ...current,
        styles: { ...current.styles, [breakpoint]: { ...current.styles[breakpoint], x: nextX, y: nextY } },
      }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setHistory((items) => [...items.slice(-19), startProject]);
      setStatus("Unsaved changes");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function resizeNode(event: ReactPointerEvent<HTMLElement>, id: string) {
    event.stopPropagation();
    const canvas = canvasRef.current;
    const node = findNode(project.nodes, id);
    if (!canvas || !node) return;
    const bounds = canvas.getBoundingClientRect();
    const startProject = cloneProject(project);
    const startStyle = getNodeStyle(node, breakpoint);
    const scale = zoom / 100;
    const move = (moveEvent: PointerEvent) => {
      const rawWidth = startStyle.width + (moveEvent.clientX - event.clientX) / scale;
      const rawHeight = startStyle.height + (moveEvent.clientY - event.clientY) / scale;
      updateNode(id, (current) => ({
        ...current,
        styles: {
          ...current.styles,
          [breakpoint]: {
            ...current.styles[breakpoint],
            width: Math.max(30, smartSnap(rawWidth, [30, 160, 240, canvasWidth - startStyle.x])),
            height: Math.max(24, snapToGrid(rawHeight)),
          },
        },
      }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setHistory((items) => [...items.slice(-19), startProject]);
      setStatus("Unsaved changes");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const kind = event.dataTransfer.getData("component") as ComponentKind;
    const canvas = canvasRef.current;
    if (!kind || !canvas) return;
    const bounds = canvas.getBoundingClientRect();
    const scale = zoom / 100;
    addComponent(kind, {
      x: Math.max(0, (event.clientX - bounds.left) / scale),
      y: Math.max(0, (event.clientY - bounds.top) / scale),
    });
  }

  function playAnimation() {
    if (!canvasRef.current) return;
    setIsPlaying(true);
    previewContext.current?.revert();
    const targets = Array.from(canvasRef.current.querySelectorAll<HTMLElement>("[data-visual-node]"));
    previewContext.current = gsap.context(() => {
      const timeline = gsap.timeline({ onComplete: () => setIsPlaying(false) });
      targets.forEach((target) => {
        const nodeId = target.dataset.visualNode;
        if (!nodeId) return;
        const node = findNode(project.nodes, nodeId);
        if (!node || !node.animation || !node.animation.enabled || node.animation.preset === "none") return;
        const anim = node.animation;
        const fromVars: gsap.TweenVars = { opacity: 0 };
        if (anim.preset === "slide-up") fromVars.y = 28;
        if (anim.preset === "scale") fromVars.scale = 0.88;

        const toVars: gsap.TweenVars = {
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          duration: anim.duration ?? 0.8,
          delay: anim.delay ?? 0,
          ease: anim.ease ?? "power3.out",
          repeat: anim.repeat ?? 0,
          yoyo: Boolean(anim.yoyo),
        };
        timeline.fromTo(target, fromVars, toVars, 0);
      });
    }, canvasRef.current);
    toast.success("GSAP 3.15 animation context previewed");
  }

  function copyCode() {
    navigator.clipboard?.writeText(currentCode);
    toast.success(`${codeTab.toUpperCase()} copied to clipboard`);
  }

  async function downloadZipExport() {
    const framework = codeTab === "css" || codeTab === "gsap" ? "html" : codeTab;
    try {
      const { downloadProjectZip } = await import("@/lib/editorModel");
      const blob = await downloadProjectZip(project, framework as "html" | "vue" | "react" | "svelte");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.name.toLowerCase().replace(/\s+/g, "-")}-${framework}-project.zip`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported complete ${framework.toUpperCase()} project ZIP`);
    } catch {
      toast.error("Failed to package ZIP export");
    }
  }

  function downloadCode() {
    const extension = codeTab === "html" ? "html" : codeTab === "css" ? "css" : codeTab === "react" ? "tsx" : codeTab === "vue" ? "vue" : codeTab === "svelte" ? "svelte" : "ts";
    const blob = new Blob([currentCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aurora-studio.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Export ready");
  }

  function renderCanvasNode(node: EditorNode, isRoot = false) {
    const style = getNodeStyle(node, breakpoint);
    const isSelected = selectedId === node.id;
    const styleObject: CSSProperties = {
      left: isRoot ? 0 : style.x,
      top: isRoot ? 0 : style.y,
      width: isRoot ? canvasWidth : style.width,
      height: isRoot ? canvasHeight : style.height,
      color: style.color,
      background: style.background,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      borderRadius: style.radius,
      padding: style.padding,
      opacity: style.opacity,
      display: style.display,
      alignItems: style.alignItems === "start" ? "flex-start" : style.alignItems === "end" ? "flex-end" : "center",
      justifyContent: style.justifyContent === "start" ? "flex-start" : style.justifyContent === "end" ? "flex-end" : style.justifyContent,
      border: `${style.borderWidth}px solid ${style.borderColor}`,
      boxShadow: style.shadow,
      transform: `rotate(${style.rotation}deg)`,
    };
    const commonProps = {
      "data-visual-node": node.id,
      "aria-label": node.accessibility?.label ?? node.name,
      "aria-hidden": node.accessibility?.hidden || undefined,
      role: node.accessibility?.role || undefined,
      className: `canvas-node node-${node.kind} ${isSelected ? "is-selected" : ""} ${isRoot ? "is-root" : ""}`,
      style: styleObject,
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => startDrag(event, node.id),
      onClick: (event: React.MouseEvent<HTMLElement>) => { event.stopPropagation(); setSelectedId(node.id); },
    };

    const children = node.children?.map((child) => <Fragment key={child.id}>{renderCanvasNode(child)}</Fragment>) ?? [];
    const overlay = isSelected && !previewMode ? (
      <>
        <span className="selection-tag">{node.name}</span>
        <span className="resize-handle" onPointerDown={(event) => resizeNode(event, node.id)} />
      </>
    ) : null;

    if (node.kind === "heading") return <h1 {...commonProps}>{node.content.split("\n").map((line, index) => <span key={`${node.id}-${index}`}>{line}<br /></span>)}{overlay}</h1>;
    if (node.kind === "paragraph") return <p {...commonProps}>{node.content}{overlay}</p>;
    if (node.kind === "button") return <button type="button" {...commonProps}>{node.content}{overlay}</button>;
    if (node.kind === "image") return <div {...commonProps}>{node.asset?.url ? <img className="asset-image" src={node.asset.url} alt={node.accessibility?.label ?? node.asset.fileName ?? node.name} /> : <><div className="orbit-art" /><div className="image-shine" /></>}{overlay}</div>;
    if (node.kind === "video" || node.kind === "scrub-video") { const mediaSource = node.video?.src ?? node.asset?.url; return <div {...commonProps}>{mediaSource ? <video ref={(element) => { mediaRefs.current[node.id] = element; }} className="video-element" src={mediaSource} poster={node.video?.poster} muted={node.video?.muted ?? true} loop={node.video?.loop ?? true} autoPlay={node.video?.autoplay ?? false} playsInline /> : <div className="video-surface"><Play size={node.kind === "scrub-video" ? 26 : 20} fill="currentColor" /><span>{node.kind === "scrub-video" ? "Timeline video" : "Video preview"}</span></div>}{(node.kind === "scrub-video" || node.kind === "video") && <button type="button" className="canvas-media-play" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); toggleMedia(node.id); }}>{mediaPlaying[node.id] ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}</button>}{node.kind === "scrub-video" && <div className="video-scrub"><span>00:00</span><input type="range" min="0" max={node.video?.duration ?? 100} step="0.1" value={videoTimes[node.id] ?? node.video?.currentTime ?? 0} onChange={(event) => setMediaTime(node.id, Number(event.target.value))} /><span>{formatValue(node.video?.duration ?? 100).replace("px", "s")}</span></div>}{overlay}</div>; }
    if (node.kind === "form") return <div {...commonProps}><div className="advanced-title">{node.content || "Tell us what you are building."}</div><div className="form-lines"><span /><span /><span /></div><div className="form-submit">Send inquiry <ArrowRight size={13} /></div>{overlay}</div>;
    if (node.kind === "carousel") return <div {...commonProps}><div className="carousel-copy"><span className="carousel-kicker">01 / 04</span><strong>{node.content || "A considered sequence of moments."}</strong><div className="carousel-controls"><button type="button">←</button><button type="button">→</button></div></div><div className="carousel-art" />{overlay}</div>;
    if (node.kind === "navbar") return <div {...commonProps}><strong className="navbar-brand">{node.content || "Visual Forge"}</strong><div className="navbar-links"><span>Work</span><span>About</span><span>Contact</span></div>{overlay}</div>;
    if (node.kind === "grid") return <div {...commonProps}><div className="grid-cells"><span /><span /><span /><span /></div>{overlay}</div>;
    if (node.kind === "card") return <div {...commonProps}><span className="card-index">0{node.id.slice(-1)}</span><strong>{node.content || "A small surface with a clear point of view."}</strong><span className="card-arrow"><ArrowRight size={14} /></span>{overlay}</div>;
    return <div {...commonProps}>{children}{node.kind === "section" && <div className="section-grain" />}{overlay}</div>;
  }

  return (
    <div className={`forge-app ${previewMode ? "preview-mode" : ""}`}>
      <input ref={folderInputRef} className="visually-hidden" type="file" multiple onChange={(event) => importFolder(event.target.files)} {...({ webkitdirectory: "", directory: "" } as any)} />
      <input ref={assetInputRef} className="visually-hidden" type="file" accept="image/*,video/*" onChange={(event) => uploadAssetFiles(event.target.files)} />
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark"><span /><span /><span /></div>
          <div>
            <div className="brand-name">VISUAL<span>/</span>FORGE</div>
            <div className="brand-caption">The visual development system</div>
          </div>
        </div>
        <div className="project-context">
          <div className="context-icon"><Sparkles size={14} /></div>
          <div><strong>{project.name}</strong><span> / </span><span>Home</span><span className="origin-pill">{project.origin ?? "blank"} · {project.detectedFramework ?? "unknown"}</span></div>
          <span className="saved-state"><span className="saved-dot" />{status}</span>
        </div>
        <div className="top-actions">
          <button className="icon-button subtle" title="Undo" onClick={undo} disabled={!history.length}><Undo2 size={16} /></button>
          <button className="icon-button subtle" title="Redo" onClick={redo} disabled={!future.length}><Redo2 size={16} /></button>
          <span className="divider" />
          <button className={`mode-toggle ${!previewMode ? "active" : ""}`} onClick={() => setPreviewMode(false)}><Paintbrush size={14} /> Design</button>
          <button className={`mode-toggle ${previewMode ? "active" : ""}`} onClick={() => setPreviewMode(true)}><Eye size={14} /> Preview</button>
          <button className="button-ghost" onClick={() => setShowImport(true)}><FolderOpen size={15} /> Import</button>
          <button className="button-outline" onClick={() => { setShowCode(true); setCodeTab("vue"); }}><Code2 size={15} /> Code</button>
          <button className="button-primary" onClick={saveProject} disabled={saveMutation.isPending}><Save size={15} /> {saveMutation.isPending ? "Saving…" : "Save"}</button>
          <div className="avatar">AM</div>
        </div>
      </header>

      <div className="editor-body">
        {!previewMode && (
          <aside className="icon-rail">
            <button className="rail-new" onClick={() => addComponent("section")}><Plus size={18} /></button>
            <div className="rail-items">
              {railItems.map(({ key, label, icon: Icon }) => (
                <button key={key} className={`rail-item ${activeRail === key ? "active" : ""}`} onClick={() => setActiveRail(key)} title={label}>
                  <Icon size={18} /><span>{label}</span>
                </button>
              ))}
            </div>
            <div className="rail-bottom"><button className="rail-item" title="Help"><CircleHelp size={18} /><span>Help</span></button></div>
          </aside>
        )}

        {!previewMode && activeRail !== "settings" && (
          <aside className="left-panel">
            {activeRail === "library" && <>
              <div className="panel-heading"><div><p className="eyebrow-small">BUILD</p><h2>Component library</h2></div><button className="mini-icon"><MoreHorizontal size={16} /></button></div>
              <div className="panel-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search components" /><kbd>⌘ K</kbd></div>
              <div className="category-label">Advanced blocks <span>{componentCatalog.length}</span></div>
              <div className="component-list">
                {visibleCatalog.map((item) => (
                  <button
                    draggable
                    key={item.kind}
                    className="component-card"
                    onDragStart={(event) => event.dataTransfer.setData("component", item.kind)}
                    onClick={() => addComponent(item.kind)}
                  >
                    <span className={`component-icon icon-${item.kind}`}>{item.icon}</span>
                    <span className="component-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                    <Plus size={14} className="component-add" />
                  </button>
                ))}
              </div>
              <div className="library-footer"><div className="gsap-badge"><Zap size={14} fill="currentColor" /><span>GSAP <b>3.15</b></span><i>all plugins</i></div><button className="text-link" onClick={() => { setInspectorTab("motion"); setActiveRail("layers"); }}>Explore motion <ArrowRight size={13} /></button></div>
            </>}
            {activeRail === "layers" && <>
              <div className="panel-heading"><div><p className="eyebrow-small">STRUCTURE</p><h2>Layers</h2></div><button className="mini-icon"><MoreHorizontal size={16} /></button></div>
              <div className="layers-meta"><span>{layers.length} layers</span><button><Grid2X2 size={13} /> Arrange</button></div>
              <div className="layer-list">
                {layers.map((layer) => (
                  <button key={layer.id} draggable className={`layer-row ${selectedId === layer.id ? "active" : ""}`} style={{ paddingLeft: 12 + layer.depth * 17 }} onClick={() => setSelectedId(layer.id)} onDragStart={() => setDraggedLayerId(layer.id)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); if (draggedLayerId && draggedLayerId !== layer.id) setProjectWithHistory({ ...project, nodes: moveLayer(project.nodes, draggedLayerId, layer.id) }); setDraggedLayerId(null); }}>
                    {layer.children?.length ? <ChevronDown size={13} className="layer-chevron" /> : <span className="layer-spacer" />}
                    <span className="layer-kind">{kindIcon(layer.kind)}</span><span>{layer.name}</span>
                    {selectedId === layer.id && <span className="layer-eye"><Eye size={13} /></span>}
                  </button>
                ))}
              </div>
              <div className="layers-tip"><Move size={14} /><span>Drag layers to reorganize the page hierarchy.</span></div>
            </>}
            {activeRail === "assets" && <>
              <div className="panel-heading"><div><p className="eyebrow-small">CONTENT</p><h2>Assets</h2></div><button className="mini-icon" onClick={() => assetInputRef.current?.click()} aria-label="Upload asset"><Upload size={15} /></button></div>
              <div className="asset-drop"><Upload size={20} /><strong>Drop assets here</strong><span>Images, videos and files · max 5 MB</span><button onClick={() => assetInputRef.current?.click()} disabled={uploadingAsset}>{uploadingAsset ? "Uploading…" : "Browse files"}</button><button className="asset-folder-button" onClick={() => folderInputRef.current?.click()}>Import folder</button></div>
              <div className="category-label">Reusable assets <span>{assetLibrary.length}</span></div>
              {assetLibrary.length ? <div className="managed-asset-list">{assetLibrary.map((asset) => <button key={asset.id} className="managed-asset" onClick={() => reuseAsset(asset.id)}><span className={`managed-asset-preview ${asset.kind === "video" ? "is-video" : "is-image"}`}>{asset.kind === "video" ? <Play size={16} fill="currentColor" /> : <ImageIcon size={16} />}</span><span><strong>{asset.name}</strong><small>{asset.kind === "video" ? "Video asset" : "Image asset"} · reuse</small></span><Plus size={13} /></button>)}</div> : <div className="asset-empty"><ImageIcon size={17} /><span>Uploaded assets appear here for reuse across the project.</span></div>}
              <div className="category-label">Starter assets <span>3</span></div>
              <div className="asset-grid"><div className="asset-tile tile-orbit"><div className="mini-orbit" /></div><div className="asset-tile tile-gradient" /><div className="asset-tile tile-noise" /></div>
            </>}
            {activeRail === "files" && <>
              <div className="panel-heading"><div><p className="eyebrow-small">SOURCE REPO</p><h2>File Explorer</h2></div><button className="mini-icon" onClick={() => folderInputRef.current?.click()}><FolderOpen size={16} /></button></div>
              <div className="layers-meta"><span>{(project.importedFiles ?? []).length} files</span><button onClick={() => setLiveDevMode(!liveDevMode)}><Play size={13} /> {liveDevMode ? "Canvas" : "pnpm dev Mount"}</button></div>
              {project.importedFiles && project.importedFiles.length > 0 ? (
                <div className="source-file-tree">
                  <div className="file-list-tree" style={{ maxHeight: activeFilePath ? "180px" : "480px", overflowY: "auto", borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: "12px" }}>
                    {project.importedFiles.map((file) => (
                      <button key={file.path} className={`layer-row ${activeFilePath === file.path ? "active" : ""}`} onClick={() => selectFileToEdit(file.path)}>
                        <FileCode2 size={13} className="layer-kind" />
                        <span className="file-path-text" style={{ fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.path}</span>
                      </button>
                    ))}
                  </div>
                  {activeFilePath && (
                    <div className="file-editor-box" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div className="file-editor-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "#a7f0d4" }}>{activeFilePath}</span>
                        <button className="button-primary button-sm" style={{ padding: "4px 10px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }} onClick={handleSaveFileContent}><Save size={12} /> Apply & Sync</button>
                      </div>
                      <textarea className="file-editor-textarea" style={{ width: "100%", background: "#14121c", color: "#f7f6f2", border: "1px solid rgba(255,255,255,.12)", borderRadius: "8px", padding: "8px", fontFamily: "monospace", fontSize: "11px", lineHeight: "1.4", resize: "vertical" }} value={fileContent} onChange={(e) => setFileContent(e.target.value)} rows={14} spellCheck={false} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="asset-empty" style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", padding: "32px 16px", textAlign: "center" }}><FolderOpen size={24} /><span>Import a local folder or public GitHub repository to browse and edit project files.</span><button className="button-outline" onClick={() => setShowImport(true)}>Import Repo / Folder</button></div>
              )}
            </>}
          </aside>
        )}

        <main className="workspace">
          {!previewMode && <div className="workspace-toolbar">
            <div className="crumbs"><span>Pages</span><ChevronRight size={13} /><strong>{project.activePage}</strong><ChevronDown size={13} /></div>
            <div className="device-switcher">
              {(Object.keys(breakpointLabels) as Breakpoint[]).map((value) => <button key={value} className={breakpoint === value ? "active" : ""} onClick={() => setBreakpoint(value)}>{value === "desktop" ? "▣" : value === "tablet" ? "▤" : "▥"}<span>{breakpointLabels[value].label}</span><em>{breakpointWidths[value]}px</em></button>)}
            </div>
            <div className="workspace-tools"><label className="viewport-size-control" title={`Edit ${breakpointLabels[breakpoint].label} viewport width`}><span>W</span><input type="number" min="240" max="1800" step="1" value={canvasWidth} onChange={(event) => updateBreakpointWidth(Number(event.target.value))} /><em>px</em></label><select className="orientation-control" value={breakpointOrientations[breakpoint]} onChange={(event) => updateBreakpointOrientation(event.target.value as "portrait" | "landscape")} aria-label="Viewport orientation"><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select><span className={`override-badge ${hasActiveOverride ? "active" : ""}`}>{hasActiveOverride ? "Override" : "Inherited"}</span><button className={`mode-toggle ${liveDevMode ? "active" : ""}`} title="Toggle pnpm dev Live Mount Preview" onClick={() => setLiveDevMode(!liveDevMode)}><Play size={13} fill="currentColor" /> pnpm dev Mount</button><button className="tool-button active"><MousePointer2 size={15} /></button><button className="tool-button"><Move size={15} /></button><span className="toolbar-divider" /><button className="tool-button" onClick={() => setZoom((value) => Math.max(40, value - 10))}><ArrowLeft size={14} /></button><span className="zoom-value">{zoom}%</span><button className="tool-button" onClick={() => setZoom((value) => Math.min(110, value + 10))}><ArrowRight size={14} /></button></div>
          </div>}
          <div className="canvas-stage" onClick={() => setSelectedId("")}>
            <div className="canvas-stage-label top-label"><span className="live-dot" /> {liveDevMode ? "PNPM DEV LIVE MOUNT" : "LIVE CANVAS"} <span className="stage-divider" /> {breakpointLabels[breakpoint].label.toUpperCase()} / {canvasWidth}px</div>
            <div className="canvas-viewport" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
              {liveDevMode ? (
                <iframe title="pnpm dev live mount" className="live-dev-iframe" srcDoc={bundleProjectForLiveDev(project)} style={{ width: canvasWidth, height: canvasHeight, border: "1px solid rgba(167,240,212,.3)", borderRadius: 12, background: "#121018" }} />
              ) : (
                <div
                  ref={canvasRef}
                  className="page-canvas"
                  style={{ width: canvasWidth, height: canvasHeight, transform: `scale(${zoom / 100})`, transformOrigin: "center top" }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {project.nodes.map((node) => <Fragment key={node.id}>{renderCanvasNode(node, true)}</Fragment>)}
                  <div className="canvas-page-number">01 <span>/</span> 03</div>
                </div>
              )}
            </div>
            <div className="canvas-stage-label bottom-label"><span>Scroll to explore</span><span className="stage-divider" /><span>Auto layout <b>ON</b></span><span className="stage-divider" /><span>Snap <b>8px</b></span></div>
          </div>
          {!previewMode && <div className="page-strip"><div className="page-strip-label"><span>Pages</span><button title="Create page" onClick={() => {
            const pageName = `Page ${project.pages.length + 1}`;
            const updatedProject = switchProjectPage({ ...project, pages: [...project.pages, pageName] }, pageName);
            setProjectWithHistory(updatedProject);
            toast.success(`Created and selected ${pageName}`);
          }}><Plus size={14} /></button></div><div className="page-tabs">{project.pages.map((page, index) => <button key={page} className={project.activePage === page ? "active" : ""} onClick={() => {
            if (project.activePage !== page) {
              setProject((current) => switchProjectPage(current, page));
            }
          }}><span className="page-thumb"><span className={`thumb-${(index % 3) + 1}`} /></span><small>{page}</small><em>0{index + 1}</em></button>)}</div><div className="strip-actions"><button onClick={() => toast.info(`Active page: ${project.activePage}`)}><Settings2 size={14} /></button><button onClick={() => toast.info("Page options ready")}><MoreHorizontal size={16} /></button></div></div>}
        </main>

        {!previewMode && <aside className="inspector-panel">
          <div className="inspector-top"><div><p className="eyebrow-small">INSPECTOR</p><h2>{selectedNode?.name ?? "Select an element"}</h2></div><button className="mini-icon"><MoreHorizontal size={16} /></button></div>
          {selectedNode ? <>
            <div className="inspector-tabs"><button className={inspectorTab === "design" ? "active" : ""} onClick={() => setInspectorTab("design")}>Design</button><button className={inspectorTab === "motion" ? "active" : ""} onClick={() => setInspectorTab("motion")}><Sparkles size={13} /> Motion</button></div>
            {inspectorTab === "design" && selectedStyle && <div className="inspector-scroll">
              {(["heading", "paragraph", "button", "card", "navbar", "carousel", "form"].includes(selectedNode.kind)) && <section className="inspector-section"><div className="section-title"><span>Content</span><button><Lock size={12} /></button></div><textarea className="content-input" value={selectedNode.content} onChange={(event) => updateSelectedContent(event.target.value)} rows={selectedNode.kind === "heading" ? 3 : 2} /></section>}
              <section className="inspector-section"><div className="section-title"><span>Behavior</span><span className="unit-label">{selectedNode.kind}</span></div><div className="select-field"><span>Width constraint</span><select value={selectedNode.constraints?.width ?? "fixed"} onChange={(event) => updateSelectedConstraint({ width: event.target.value as "fixed" | "fill" })}><option value="fixed">Fixed</option><option value="fill">Fill parent</option></select></div><div className="select-field"><span>Height constraint</span><select value={selectedNode.constraints?.height ?? "fixed"} onChange={(event) => updateSelectedConstraint({ height: event.target.value as "fixed" | "hug" })}><option value="fixed">Fixed</option><option value="hug">Hug content</option></select></div><div className="constraint-grid">{(["left", "right", "top", "bottom"] as const).map((edge) => <button key={edge} className={selectedNode.constraints?.[edge] ? "active" : ""} onClick={() => updateSelectedConstraint({ [edge]: !selectedNode.constraints?.[edge] })}>{edge}</button>)}</div><div className="state-chips"><span>States</span>{(["hover", "pressed", "focus"] as const).map((state) => <button key={state} className={selectedNode.states?.[state] ? "active" : ""} onClick={() => updateSelectedState({ [state]: !selectedNode.states?.[state] })}>{state}</button>)}</div><div className="select-field"><span>ARIA role</span><select value={selectedNode.accessibility?.role ?? ""} onChange={(event) => updateSelectedMeta({ accessibility: { ...selectedNode.accessibility, role: event.target.value || undefined, label: selectedNode.accessibility?.label ?? selectedNode.name } })}><option value="">Auto</option><option value="button">Button</option><option value="navigation">Navigation</option><option value="region">Region</option><option value="form">Form</option></select></div><div className="color-field compact-color"><span className="hex-mark">label</span><input value={selectedNode.accessibility?.label ?? selectedNode.name} onChange={(event) => updateSelectedMeta({ accessibility: { ...selectedNode.accessibility, label: event.target.value } })} aria-label="Accessible label" /></div>{(selectedNode.kind === "image" || selectedNode.kind === "video" || selectedNode.kind === "scrub-video") && <div className="asset-picker"><div className="color-caption">Asset source</div><select value={selectedNode.asset?.url ?? ""} onChange={(event) => assignAssetToSelected(event.target.value)}><option value="">No uploaded asset</option>{assetLibrary.map((asset) => <option key={asset.id} value={asset.url}>{asset.name}</option>)}</select>{assetLibrary.length === 0 && <small>Upload an image or video from Assets first.</small>}{assetLibrary.length > 0 && <small>{assetLibrary.length} reusable asset{assetLibrary.length > 1 ? "s" : ""} available.</small>}</div>}</section>
              <section className="inspector-section"><div className="section-title"><span>Layout</span><button><Link2 size={12} /></button></div><div className="field-grid"><Field label="X" value={selectedStyle.x} suffix="px" onChange={(value) => updateSelectedStyle({ x: value }, true)} /><Field label="Y" value={selectedStyle.y} suffix="px" onChange={(value) => updateSelectedStyle({ y: value }, true)} /><Field label="W" value={selectedStyle.width} suffix="px" onChange={(value) => updateSelectedStyle({ width: value }, true)} /><Field label="H" value={selectedStyle.height} suffix="px" onChange={(value) => updateSelectedStyle({ height: value }, true)} /></div></section>
              <section className="inspector-section"><div className="section-title"><span>Spacing</span><button className="unit-label">PX</button></div><div className="field-grid"><Field label="Padding" value={selectedStyle.padding} suffix="px" onChange={(value) => updateSelectedStyle({ padding: value })} /><Field label="Radius" value={selectedStyle.radius} suffix="px" onChange={(value) => updateSelectedStyle({ radius: value })} /></div></section>
              {(selectedNode.kind === "heading" || selectedNode.kind === "paragraph" || selectedNode.kind === "button") && <section className="inspector-section"><div className="section-title"><span>Typography</span><button className="unit-label">REM</button></div><div className="field-grid"><Field label="Size" value={selectedStyle.fontSize} suffix="px" onChange={(value) => updateSelectedStyle({ fontSize: value })} /><Field label="Weight" value={selectedStyle.fontWeight} suffix="" onChange={(value) => updateSelectedStyle({ fontWeight: value })} /><Field label="Leading" value={selectedStyle.lineHeight} suffix="" step={0.05} onChange={(value) => updateSelectedStyle({ lineHeight: value })} /><Field label="Tracking" value={selectedStyle.letterSpacing} suffix="px" step={0.1} onChange={(value) => updateSelectedStyle({ letterSpacing: value })} /></div></section>}
              <section className="inspector-section"><div className="section-title"><span>Color & fill</span><button><MoreHorizontal size={13} /></button></div><div className="color-caption">Background</div><div className="color-field"><span className="color-swatch" style={{ background: selectedStyle.background }} /><input value={selectedStyle.background} onChange={(event) => updateSelectedStyle({ background: event.target.value })} /><span className="hex-mark">⌘</span></div><div className="color-caption">Text color</div><div className="color-field"><span className="color-swatch" style={{ background: selectedStyle.color }} /><input value={selectedStyle.color} onChange={(event) => updateSelectedStyle({ color: event.target.value })} /><span className="hex-mark">⌘</span></div><div className="opacity-row"><span>Opacity</span><input type="range" min="0" max="1" step="0.01" value={selectedStyle.opacity} onChange={(event) => updateSelectedStyle({ opacity: Number(event.target.value) })} /><span>{Math.round(selectedStyle.opacity * 100)}%</span></div></section>
              <section className="inspector-section"><div className="section-title"><span>Layout behavior</span><button><MoreHorizontal size={13} /></button></div><div className="select-field"><span>Display</span><select value={selectedStyle.display} onChange={(event) => updateSelectedStyle({ display: event.target.value as NodeStyle["display"] })}><option value="block">Block</option><option value="flex">Flex</option><option value="grid">Grid</option></select></div><div className="alignment-row"><button className={selectedStyle.justifyContent === "start" ? "active" : ""} onClick={() => updateSelectedStyle({ justifyContent: "start" })}><AlignLeft size={14} /></button><button className={selectedStyle.justifyContent === "center" ? "active" : ""} onClick={() => updateSelectedStyle({ justifyContent: "center" })}><AlignCenter size={14} /></button><button className={selectedStyle.justifyContent === "space-between" ? "active" : ""} onClick={() => updateSelectedStyle({ justifyContent: "space-between" })}><AlignJustify size={14} /></button></div></section><section className="inspector-section"><div className="section-title"><span>Effects & borders</span><button><Sparkles size={13} /></button></div><div className="field-grid"><Field label="Border" value={selectedStyle.borderWidth} suffix="px" onChange={(value) => updateSelectedStyle({ borderWidth: value })} /><Field label="Rotate" value={selectedStyle.rotation} suffix="deg" onChange={(value) => updateSelectedStyle({ rotation: value })} /></div><div className="color-field compact-color"><span className="color-swatch" style={{ background: selectedStyle.borderColor }} /><input value={selectedStyle.borderColor} onChange={(event) => updateSelectedStyle({ borderColor: event.target.value })} /><span className="hex-mark">border</span></div><div className="select-field effect-select"><span>Shadow</span><select value={selectedStyle.shadow} onChange={(event) => updateSelectedStyle({ shadow: event.target.value })}><option value="none">None</option><option value="0 16px 40px rgba(0,0,0,.22)">Soft</option><option value="0 22px 60px rgba(0,0,0,.34)">Deep</option></select></div></section>{selectedNode.kind === "carousel" && <section className="inspector-section"><div className="section-title"><span>Carousel settings</span><span className="unit-label">SLIDES</span></div><div className="field-grid"><Field label="Slides" value={selectedNode.carousel?.slides ?? 4} suffix="" onChange={(value) => updateNode(selectedNode.id, (node) => ({ ...node, carousel: { ...(node.carousel ?? { slides: 4, autoplay: true, interval: 4, gap: 16 }), slides: Math.max(1, Math.round(value)) } }))} /><Field label="Gap" value={selectedNode.carousel?.gap ?? 16} suffix="px" onChange={(value) => updateNode(selectedNode.id, (node) => ({ ...node, carousel: { ...(node.carousel ?? { slides: 4, autoplay: true, interval: 4, gap: 16 }), gap: Math.max(0, value) } }))} /></div><div className="select-field"><span>Autoplay</span><select value={String(selectedNode.carousel?.autoplay ?? true)} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, carousel: { ...(node.carousel ?? { slides: 4, autoplay: true, interval: 4, gap: 16 }), autoplay: event.target.value === "true" } }))}><option value="true">Enabled</option><option value="false">Disabled</option></select></div></section>}{selectedNode.kind === "form" && <section className="inspector-section"><div className="section-title"><span>Form fields</span><span className="unit-label">{selectedNode.form?.fields.length ?? 0} FIELDS</span></div>{(selectedNode.form?.fields ?? []).map((field, index) => <div className="form-field-row" key={field.id}><input value={field.label} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, form: { fields: (node.form?.fields ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) } }))} /><select value={field.type} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, form: { fields: (node.form?.fields ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value as "text" | "email" | "textarea" | "select" } : item) } }))}><option value="text">Text</option><option value="email">Email</option><option value="textarea">Textarea</option><option value="select">Select</option></select><button className={field.required ? "active" : ""} onClick={() => updateNode(selectedNode.id, (node) => ({ ...node, form: { fields: (node.form?.fields ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, required: !item.required } : item) } }))}>Req</button></div>)}</section>}{selectedNode.kind === "grid" && <section className="inspector-section"><div className="section-title"><span>Grid settings</span><span className="unit-label">ADAPTIVE</span></div><div className="field-grid"><Field label="Columns" value={selectedNode.grid?.columns ?? 2} suffix="" onChange={(value) => updateNode(selectedNode.id, (node) => ({ ...node, grid: { ...(node.grid ?? { columns: 2, gap: 12 }), columns: Math.min(6, Math.max(1, Math.round(value))) } }))} /><Field label="Gap" value={selectedNode.grid?.gap ?? 12} suffix="px" onChange={(value) => updateNode(selectedNode.id, (node) => ({ ...node, grid: { ...(node.grid ?? { columns: 2, gap: 12 }), gap: Math.max(0, value) } }))} /></div></section>}{selectedNode.kind === "navbar" && <section className="inspector-section"><div className="section-title"><span>Navigation</span><span className="unit-label">LINKS</span></div><div className="color-field compact-color"><input value={(selectedNode.navbar?.links ?? ["Work", "About", "Contact"]).join(", ")} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, navbar: { ...(node.navbar ?? { links: ["Work", "About", "Contact"], sticky: false }), links: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } }))} /><span className="hex-mark">comma</span></div><div className="select-field"><span>Sticky</span><select value={String(selectedNode.navbar?.sticky ?? false)} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, navbar: { ...(node.navbar ?? { links: ["Work", "About", "Contact"], sticky: false }), sticky: event.target.value === "true" } }))}><option value="false">Normal</option><option value="true">Sticky</option></select></div></section>}{selectedNode.kind === "card" && <section className="inspector-section"><div className="section-title"><span>Card variant</span><span className="unit-label">SURFACE</span></div><div className="select-field"><span>Style</span><select value={selectedNode.card?.variant ?? "glass"} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, card: { variant: event.target.value as "glass" | "solid" | "outline" } }))}><option value="glass">Glass</option><option value="solid">Solid</option><option value="outline">Outline</option></select></div></section>}{(selectedNode.kind === "video" || selectedNode.kind === "scrub-video") && <section className="inspector-section"><div className="section-title"><span>Video behavior</span><span className="unit-label">MEDIA</span></div><div className="field-grid"><Field label="Duration" value={selectedNode.video?.duration ?? 30} suffix="s" step={0.5} onChange={(value) => updateNode(selectedNode.id, (node) => ({ ...node, video: { ...(node.video ?? {}), duration: Math.max(0.1, value) } }))} /><label className="field"><span>Poster URL</span><span className="field-input"><input value={selectedNode.video?.poster ?? ""} placeholder="Optional image URL" onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, video: { ...(node.video ?? {}), poster: event.target.value } }))} /></span></label></div><div className="select-field"><span>Playback</span><select value={`${selectedNode.video?.autoplay ? "auto" : "manual"}-${selectedNode.video?.loop === false ? "once" : "loop"}`} onChange={(event) => { const [autoplay, loop] = event.target.value.split("-"); updateNode(selectedNode.id, (node) => ({ ...node, video: { ...(node.video ?? {}), autoplay: autoplay === "auto", loop: loop !== "once" } })); }}><option value="manual-loop">Manual / loop</option><option value="auto-loop">Autoplay / loop</option><option value="manual-once">Manual / once</option></select></div><div className="select-field"><span>Audio</span><select value={String(selectedNode.video?.muted ?? true)} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, video: { ...(node.video ?? {}), muted: event.target.value === "true" } }))}><option value="true">Muted</option><option value="false">Sound on</option></select></div></section>}{(selectedNode.kind === "video" || selectedNode.kind === "scrub-video") && <section className="inspector-section"><div className="section-title"><span>Media timeline</span><span className="unit-label">SEC</span></div><div className="video-inspector"><strong>{selectedNode.kind === "scrub-video" ? "Scrub interaction" : "Playback"}</strong><button className="media-play" type="button" onClick={() => toggleMedia(selectedNode.id)}>{mediaPlaying[selectedNode.id] ? <Pause size={13} /> : <Play size={13} fill="currentColor" />}</button><input type="range" min="0" max={selectedNode.video?.duration ?? 100} step="0.1" value={selectedVideoTime} onChange={(event) => setMediaTime(selectedNode.id, Number(event.target.value))} /><div><span>{selectedVideoTime.toFixed(1)}s</span><span>{(selectedNode.video?.duration ?? 100).toFixed(1)}s</span></div></div></section>}
            </div>}
            {inspectorTab === "motion" && <div className="motion-panel"><div className="motion-hero"><div className="motion-icon"><Wand2 size={17} /></div><div><strong>Animate this layer</strong><span>GSAP 3.15 · {(project.detectedFramework ?? "unknown").toUpperCase()} API</span></div><button className={`switch ${selectedNode.animation.enabled ? "on" : ""}`} onClick={() => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, enabled: !node.animation.enabled } }))}><i /></button></div><div className="motion-section-title">Preset <span>4 available</span></div><div className="motion-presets">{(["fade", "slide-up", "scale", "none"] as const).map((preset) => <button key={preset} className={selectedNode.animation.preset === preset ? "active" : ""} onClick={() => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, preset, enabled: preset !== "none" } }))}><span className={`preset-icon preset-${preset}`} />{preset === "slide-up" ? "Slide up" : preset[0].toUpperCase() + preset.slice(1)}</button>)}</div><div className="motion-fields"><Field label="Duration" value={selectedNode.animation.duration} suffix="s" step={0.05} onChange={(value) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, duration: value } }))} /><Field label="Delay" value={selectedNode.animation.delay} suffix="s" step={0.05} onChange={(value) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, delay: value } }))} /></div><div className="select-field"><span>Ease</span><select value={selectedNode.animation.ease} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, ease: event.target.value } }))}><option value="power3.out">Power 3 / Out</option><option value="power2.out">Power 2 / Out</option><option value="back.out(1.7)">Back / Out</option><option value="elastic.out(1, 0.4)">Elastic / Out</option></select></div><div className="select-field"><span>Lifecycle</span><select value={selectedNode.animation.lifecycle ?? "onMount"} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, lifecycle: event.target.value as "onMount" | "onEnter" | "onScroll" } }))}><option value="onMount">onMount / mount</option><option value="onEnter">onEnter / view</option><option value="onScroll">onScroll / scrub</option></select></div><div className="motion-fields"><Field label="Repeat" value={selectedNode.animation.repeat ?? 0} suffix="x" onChange={(value) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, repeat: Math.max(0, Math.round(value)) } }))} /><Field label="Stagger" value={selectedNode.animation.stagger ?? 0} suffix="s" step={0.05} onChange={(value) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, stagger: Math.max(0, value) } }))} /></div><div className="select-field"><span>Ease reverse</span><select value={typeof selectedNode.animation.easeReverse === "string" ? selectedNode.animation.easeReverse : ""} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, easeReverse: event.target.value || true } }))}><option value="power2.inOut">Power 2 / In Out</option><option value="sine.in">Sine / In</option><option value="expo.in">Expo / In</option></select></div><div className="motion-toggle-row"><span>Yoyo</span><button className={`switch ${selectedNode.animation.yoyo ? "on" : ""}`} onClick={() => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, yoyo: !node.animation.yoyo } }))}><i /></button><span>Markers</span><button className={`switch ${selectedNode.animation.markers ? "on" : ""}`} onClick={() => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, markers: !node.animation.markers } }))}><i /></button></div>{selectedNode.animation.lifecycle === "onScroll" && <><div className="motion-fields"><label className="field"><span>Scrub</span><span className="field-input"><select value={String(selectedNode.animation.scrub ?? false)} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, scrub: event.target.value === "true" ? true : event.target.value === "false" ? false : Number(event.target.value) } }))}><option value="false">Off</option><option value="true">On</option><option value="0.5">0.5s</option><option value="1">1s</option></select></span></label><label className="field"><span>Snap</span><span className="field-input"><select value={String(selectedNode.animation.snap ?? 1)} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, snap: event.target.value === "labels" ? "labels" : Number(event.target.value) } }))}><option value="1">1</option><option value="0.5">0.5</option><option value="labels">Labels</option></select></span></label></div><div className="motion-fields"><label className="field"><span>Start</span><span className="field-input"><input value={selectedNode.animation.start ?? "top 85%"} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, start: event.target.value } }))} /></span></label><label className="field"><span>End</span><span className="field-input"><input value={selectedNode.animation.end ?? "bottom 20%"} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, end: event.target.value } }))} /></span></label></div><div className="select-field"><span>Toggle actions</span><select value={selectedNode.animation.toggleActions ?? "play none none reverse"} onChange={(event) => updateNode(selectedNode.id, (node) => ({ ...node, animation: { ...node.animation, toggleActions: event.target.value } }))}><option value="play none none reverse">Play / reverse</option><option value="play pause resume reset">Pause / resume</option><option value="restart none none none">Restart once</option></select></div></>}<div className="plugin-shelf"><div><Zap size={13} /><strong>Plugin shelf</strong><span>API-aware</span></div>{gsapPlugins.map((plugin) => <button key={plugin} className={selectedNode.animation.plugins?.includes(plugin) ? "active" : ""} onClick={() => updateNode(selectedNode.id, (node) => { const plugins = node.animation.plugins ?? []; return { ...node, animation: { ...node.animation, plugins: plugins.includes(plugin) ? plugins.filter((item) => item !== plugin) : [...plugins, plugin] } }; })}>{plugin}</button>)}</div><button className="preview-motion" onClick={playAnimation}><Play size={14} fill="currentColor" /> {isPlaying ? "Playing timeline…" : "Preview timeline"}</button></div>}
          </> : <div className="empty-inspector"><SquareDashedMousePointer size={24} /><strong>Choose a layer to inspect</strong><span>Click any element on the canvas or in the layer tree.</span></div>}
          <div className="inspector-footer"><span><span className="status-pip" /> Synced with canvas</span><button onClick={() => toast.info("Inspector shortcuts: G to move, R to resize")}>⌘ <CircleHelp size={12} /></button></div>
        </aside>}
      </div>

      {!previewMode && <div className="statusbar"><span><span className="status-pip green" /> All changes synced locally</span><span className="statusbar-center">{layers.length} layers <span>·</span> {project.pages.length} pages <span>·</span> {breakpointLabels[breakpoint].label} viewport</span><span>Visual Forge v0.9 <span className="statusbar-separator" /> <button onClick={() => toast.info("Keyboard shortcuts coming next")}>Shortcuts <kbd>?</kbd></button></span></div>}

      {showImport && <div className="code-overlay" onClick={() => setShowImport(false)}><section className="import-drawer" onClick={(event) => event.stopPropagation()}><div className="code-header"><div><p className="eyebrow-small">INGEST</p><h2>Import a project</h2><span>Bring a visual system into the canvas.</span></div><button className="close-button" onClick={() => setShowImport(false)}><X size={17} /></button></div><div className="import-options"><button className="import-option" onClick={() => folderInputRef.current?.click()}><FolderOpen size={18} /><strong>Local folder</strong><span>Read source, style and asset files from a directory.</span></button><div className="import-divider"><span>or</span></div><div className="github-import"><label>Public GitHub repository</label><div className="github-row"><input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="https://github.com/owner/repository" /><button className="button-primary" onClick={importGithubProject} disabled={importing}>{importing ? "Reading…" : "Import"}</button></div><small>Framework detection supports HTML, Vue, React and Svelte. Only a bounded file manifest is fetched.</small></div></div><div className="import-footer"><span className="status-pip green" />{project.origin ? `Current source: ${project.origin} · ${project.detectedFramework ?? "unknown"}` : "No source imported yet"}</div></section></div>}

      {showCode && <div className="code-overlay" onClick={() => setShowCode(false)}><section className="code-drawer" onClick={(event) => event.stopPropagation()}><div className="code-header"><div><p className="eyebrow-small">EXPORT</p><h2>Code output</h2><span>Generated from your visual model · source {(project.detectedFramework ?? "unknown").toUpperCase()}</span></div><button className="close-button" onClick={() => setShowCode(false)}><X size={17} /></button></div><div className="code-tabs">{(["html", "css", "vue", "react", "svelte", "gsap"] as CodeTab[]).map((tab) => <button key={tab} className={codeTab === tab ? "active" : ""} onClick={() => setCodeTab(tab)}>{tab === "html" ? "HTML" : tab === "css" ? "CSS" : tab[0].toUpperCase() + tab.slice(1)}</button>)}</div><div className="code-meta"><span><FileCode2 size={14} /> {codeTab === "html" ? "index.html" : codeTab === "css" ? "styles.css" : `GeneratedPage.${codeTab === "react" ? "tsx" : codeTab}`}</span><span className="code-actions"><button onClick={copyCode}><Copy size={14} /> Copy</button><button onClick={downloadCode}><Download size={14} /> Download</button><button onClick={downloadZipExport} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}><ArrowDownToLine size={14} /> Export ZIP Project</button></span></div><pre className="code-content"><code>{currentCode}</code></pre><div className="code-footer"><span><span className="status-pip green" /> Output follows {breakpointLabels[breakpoint].label} styles</span><button onClick={() => { setShowCode(false); setInspectorTab("motion"); }}>Configure animations <ArrowRight size={14} /></button></div></section></div>}
    </div>
  );
}

function Field({ label, value, suffix, step = 1, onChange }: { label: string; value: number; suffix: string; step?: number; onChange: (value: number) => void }) {
  return <label className="field"><span>{label}</span><span className="field-input"><input type="number" step={step} value={Number.isFinite(value) ? value : 0} onChange={(event) => onChange(Number(event.target.value))} /><em>{suffix}</em></span></label>;
}
