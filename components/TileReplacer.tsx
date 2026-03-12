"use client";

import * as React from "react";
import {
    ImageIcon,
    Loader2,
    Download,
    Sparkles,
    X,
    AlertCircle,
    CheckCircle2,
    RotateCcw,
    Plus,
    Trash2,
    Search,
    Heart,
} from "lucide-react";
import { ComparisonSlider } from "./ComparisonSlider";

interface CustomTile {
    id: string;
    name: string;
    description: string;
    prompt: string;
    negativePrompt: string;
    imagePath: string;
    createdAt: string;
}

type TileSelection =
    | { type: "custom-lib"; tile: CustomTile }
    | { type: "custom-prompt" };

type Status = "idle" | "uploading" | "processing" | "done" | "error";

export function TileReplacer() {
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [selection, setSelection] = React.useState<TileSelection | null>(null);
    const [customPrompt, setCustomPrompt] = React.useState("");
    const [status, setStatus] = React.useState<Status>("idle");
    const [resultImage, setResultImage] = React.useState<string | null>(null);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [customTiles, setCustomTiles] = React.useState<CustomTile[]>([]);
    const [showPromptInput, setShowPromptInput] = React.useState(false);
    const [zoom, setZoom] = React.useState(1);
    const [pan, setPan] = React.useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = React.useState(false);
    const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const imageContainerRef = React.useRef<HTMLDivElement>(null);

    // Load custom tiles
    React.useEffect(() => {
        fetch("/api/tile-library")
            .then((r) => r.json())
            .then((data) => setCustomTiles(data.tiles || []))
            .catch(() => { });
    }, []);

    // --- File handling ---
    const handleFileSelect = (file: File) => {
        if (file.size > 10 * 1024 * 1024) {
            setErrorMessage("Dosya boyutu 10MB'dan küçük olmalıdır.");
            return;
        }
        if (!file.type.startsWith("image/")) {
            setErrorMessage("Lütfen bir görsel dosyası seçin.");
            return;
        }
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setErrorMessage(null);
        setResultImage(null);
        setStatus("idle");
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const resetAll = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setSelection(null);
        setCustomPrompt("");
        setStatus("idle");
        setResultImage(null);
        setErrorMessage(null);
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // --- Zoom & Pan handlers ---
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        setZoom((prev) => {
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            return Math.min(4, Math.max(0.5, prev + delta));
        });
    };

    const handlePanStart = (e: React.MouseEvent) => {
        if (zoom <= 1) return;
        e.preventDefault();
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handlePanMove = (e: React.MouseEvent) => {
        if (!isPanning) return;
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    };

    const handlePanEnd = () => {
        setIsPanning(false);
    };

    const resetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // --- Convert file to base64 ---
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // --- Build prompt ---
    const buildPrompt = (): { prompt: string; negativePrompt: string } | null => {
        if (!selection) return null;

        const floorInstruction = "floor tiles only, keep room walls ceiling furniture lighting unchanged, interior design photography, photorealistic, high resolution, 8k quality";
        const baseNegative = "blurry, distorted, cartoon, anime, low quality, deformed walls, changed furniture, altered room structure, different room layout, different room, warped perspective, text, watermark";

        if (selection.type === "custom-lib") {
            return {
                prompt: `${selection.tile.prompt}, ${floorInstruction}`,
                negativePrompt: `${selection.tile.negativePrompt}, ${baseNegative}`,
            };
        }

        if (selection.type === "custom-prompt" && customPrompt.trim()) {
            return {
                prompt: `${customPrompt.trim()} floor tiles, ${floorInstruction}`,
                negativePrompt: baseNegative,
            };
        }

        return null;
    };

    const canGenerate =
        selectedFile !== null &&
        buildPrompt() !== null &&
        status !== "uploading" &&
        status !== "processing";

    // --- Fetch image as base64 ---
    const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
        try {
            const res = await fetch(url);
            if (!res.ok) return null;
            const blob = await res.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    resolve(result.split(",")[1]);
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    };

    // --- Submit ---
    const handleGenerate = async () => {
        if (!selectedFile) return;
        const promptData = buildPrompt();
        if (!promptData) return;

        setStatus("uploading");
        setErrorMessage(null);
        setResultImage(null);

        try {
            const base64 = await fileToBase64(selectedFile);
            setStatus("processing");

            let tileImageBase64: string | null = null;
            if (selection?.type === "custom-lib" && selection.tile.imagePath) {
                tileImageBase64 = await fetchImageAsBase64(selection.tile.imagePath);
            }

            const res = await fetch("/api/ai-tile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64,
                    prompt: promptData.prompt,
                    negativePrompt: promptData.negativePrompt,
                    ...(tileImageBase64 ? { tileImageBase64 } : {}),
                }),
            });

            const data = await res.json();

            if (!res.ok || data.error) {
                throw new Error(data.error || "Bir hata oluştu.");
            }

            setResultImage(data.image);
            setStatus("done");
        } catch (err) {
            setErrorMessage(
                err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu."
            );
            setStatus("error");
        }
    };

    // --- Download ---
    const handleDownload = () => {
        if (!resultImage) return;
        const link = document.createElement("a");
        link.href = resultImage;
        const tileName =
            selection?.type === "custom-lib"
                ? selection.tile.id
                : "custom";
        link.download = `seramikai-${tileName}-${Date.now()}.png`;
        link.click();
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-130px)] gap-0 max-w-[1600px] mx-auto">
            {/* ─── Left Sidebar: Tile Selection ─── */}
            <div className="lg:w-[320px] xl:w-[350px] shrink-0 border-r border-gray-100 bg-white overflow-y-auto flex flex-col">
                {/* Sidebar Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-800">Ürünlere göz at</span>
                        <button
                            onClick={() => setShowPromptInput(!showPromptInput)}
                            className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1.5 transition-all ${showPromptInput
                                ? "bg-accent/10 text-accent-dark border-accent/30"
                                : "border-gray-200 text-gray-500 hover:border-accent/30 hover:text-accent-dark"
                                }`}
                        >
                            <Sparkles className="w-3 h-3" />
                            Yapay zekâ stilleri
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                                type="text"
                                placeholder="Ara..."
                                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Custom Prompt (toggle) */}
                {showPromptInput && (
                    <div className="px-4 py-3 border-b border-gray-100 bg-blue-50/50">
                        <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">AI ile özel fayans tanımlayın</label>
                        <textarea
                            value={customPrompt}
                            onChange={(e) => {
                                setCustomPrompt(e.target.value);
                                if (e.target.value.trim()) {
                                    setSelection({ type: "custom-prompt" });
                                } else {
                                    setSelection(null);
                                }
                            }}
                            placeholder="Örn: Beyaz mermer görünümlü parlak seramik..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none transition-all"
                        />
                        {customPrompt.trim() && (
                            <div className="mt-2 flex items-center gap-1 text-[10px] text-accent-dark">
                                <CheckCircle2 className="w-3 h-3" />
                                Özel prompt seçili
                            </div>
                        )}
                    </div>
                )}

                {/* Tiles List */}
                <div className="flex-1 overflow-y-auto">
                    <SidebarTiles
                        customTiles={customTiles}
                        selection={selection}
                        onSelect={(tile) => setSelection({ type: "custom-lib", tile })}
                        onTilesChanged={() => {
                            fetch("/api/tile-library")
                                .then((r) => r.json())
                                .then((data) => setCustomTiles(data.tiles || []))
                                .catch(() => { });
                        }}
                    />
                </div>
            </div>

            {/* ─── Main Area: Full-width View ─── */}
            <div className="flex-1 min-w-0 flex flex-col bg-gray-50/30">
                {/* Top Toolbar */}
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        {previewUrl && (
                            <button
                                onClick={resetAll}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                                Sıfırla
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        {resultImage && (
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                <Download className="w-3.5 h-3.5" />
                                İndir
                            </button>
                        )}
                        {resultImage && (
                            <button
                                onClick={() => { setResultImage(null); setStatus("idle"); }}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Tekrar Dene
                            </button>
                        )}
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate}
                            className="flex items-center gap-1.5 text-xs font-medium text-white bg-accent hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-all shadow-sm"
                        >
                            {status === "uploading" || status === "processing" ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    {status === "uploading" ? "Yükleniyor..." : "AI Çalışıyor..."}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Dönüştür
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mx-5 mt-3 flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-500 text-xs">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="flex-1">{errorMessage}</span>
                        <button onClick={() => setErrorMessage(null)} className="shrink-0 p-0.5 hover:bg-red-100 rounded">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center p-5 overflow-hidden">
                    {status === "processing" || status === "uploading" ? (
                        /* Loading state */
                        <div className="flex flex-col items-center justify-center gap-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent/15 to-blue-500/15 flex items-center justify-center">
                                    <Loader2 className="w-10 h-10 text-accent animate-spin" />
                                </div>
                                <div className="absolute -inset-3 border border-accent/15 rounded-3xl animate-pulse" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-medium text-gray-700 text-sm">
                                    {status === "uploading" ? "Görsel yükleniyor..." : "AI seramikleri değiştiriyor..."}
                                </p>
                                <p className="text-xs text-gray-400">Bu işlem 10-60 saniye sürebilir</p>
                            </div>
                            <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full w-1/3 bg-gradient-to-r from-accent to-blue-500 rounded-full progress-indeterminate" />
                            </div>
                        </div>
                    ) : resultImage && previewUrl ? (
                        /* Result: full comparison slider */
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-full max-h-full">
                                <ComparisonSlider
                                    beforeImage={previewUrl}
                                    afterImage={resultImage}
                                    beforeLabel="Orijinal"
                                    afterLabel="AI Sonuç"
                                />
                            </div>
                        </div>
                    ) : previewUrl ? (
                        /* Preview uploaded image with zoom/pan */
                        <div
                            ref={imageContainerRef}
                            className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
                            onWheel={handleWheel}
                            onMouseDown={handlePanStart}
                            onMouseMove={handlePanMove}
                            onMouseUp={handlePanEnd}
                            onMouseLeave={handlePanEnd}
                            style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
                        >
                            <img
                                src={previewUrl}
                                alt="Yüklenen oda fotoğrafı"
                                className="max-w-full max-h-full object-contain rounded-xl shadow-sm transition-transform duration-100"
                                style={{
                                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                                }}
                                draggable={false}
                            />

                            {/* Zoom controls */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.max(0.5, z - 0.25)); }}
                                    className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors text-sm font-medium"
                                >−</button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                                    className="px-2 h-7 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors text-[11px] font-medium min-w-[40px]"
                                >{Math.round(zoom * 100)}%</button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(4, z + 0.25)); }}
                                    className="w-7 h-7 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors text-sm font-medium"
                                >+</button>
                            </div>

                            {/* File name badge */}
                            <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/50 backdrop-blur-sm text-white text-[11px] rounded-lg flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-green-400" />
                                {selectedFile?.name}
                            </div>
                        </div>
                    ) : (
                        /* Empty state: upload */
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onClick={() => fileInputRef.current?.click()}
                            className={`
                                w-full h-full flex flex-col items-center justify-center gap-5 rounded-2xl cursor-pointer transition-all duration-300
                                ${isDragging
                                    ? "bg-accent/5 border-2 border-dashed border-accent/40 scale-[1.005]"
                                    : "hover:bg-gray-50"
                                }
                            `}
                        >
                            <div className={`p-6 rounded-2xl transition-all ${isDragging ? "bg-accent/10 scale-110" : "bg-gray-100"}`}>
                                <ImageIcon className={`w-12 h-12 transition-colors ${isDragging ? "text-accent" : "text-gray-300"}`} />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-gray-600">Oda fotoğrafınızı yükleyin</p>
                                <p className="text-xs text-gray-400 mt-1">Sürükleyip bırakın veya tıklayın · max 10MB</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Sidebar Tiles Sub-Component ─── */
interface SidebarTilesProps {
    customTiles: CustomTile[];
    selection: TileSelection | null;
    onSelect: (tile: CustomTile) => void;
    onTilesChanged: () => void;
}

function SidebarTiles({ customTiles, selection, onSelect, onTilesChanged }: SidebarTilesProps) {
    const [showQuickAdd, setShowQuickAdd] = React.useState(false);
    const [quickFile, setQuickFile] = React.useState<File | null>(null);
    const [quickPreview, setQuickPreview] = React.useState<string | null>(null);
    const [quickName, setQuickName] = React.useState("");
    const [quickDesc, setQuickDesc] = React.useState("");
    const [uploading, setUploading] = React.useState(false);
    const [deleting, setDeleting] = React.useState<string | null>(null);
    const quickInputRef = React.useRef<HTMLInputElement>(null);

    const handleQuickUpload = async () => {
        if (!quickFile || !quickName.trim()) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("image", quickFile);
            formData.append("name", quickName.trim());
            formData.append("description", quickDesc.trim());
            formData.append("prompt", `${quickName.trim()} floor tiles, photorealistic, 8k quality`);

            const res = await fetch("/api/tile-library", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setShowQuickAdd(false);
                setQuickFile(null);
                setQuickPreview(null);
                setQuickName("");
                setQuickDesc("");
                onTilesChanged();
            }
        } catch {
            // ignore
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleting(id);
        try {
            await fetch("/api/tile-library", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            onTilesChanged();
        } catch {
            // ignore
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div>
            {/* Quick Add Button / Form */}
            {!showQuickAdd ? (
                <button
                    onClick={() => setShowQuickAdd(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 border-b border-dashed border-gray-100 text-xs text-gray-400 hover:text-accent hover:bg-accent/5 transition-all"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Fayans Ekle
                </button>
            ) : (
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Yeni Fayans</span>
                        <button
                            onClick={() => { setShowQuickAdd(false); setQuickFile(null); setQuickPreview(null); setQuickName(""); setQuickDesc(""); }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        {/* Image upload */}
                        {!quickPreview ? (
                            <div
                                onClick={() => quickInputRef.current?.click()}
                                className="w-20 h-20 shrink-0 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-accent/30 hover:bg-accent/5 transition-all"
                            >
                                <ImageIcon className="w-5 h-5 text-gray-300" />
                                <span className="text-[9px] text-gray-300">Fotoğraf</span>
                                <input
                                    ref={quickInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024) {
                                            setQuickFile(file);
                                            setQuickPreview(URL.createObjectURL(file));
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden relative group">
                                <img src={quickPreview} alt="" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setQuickFile(null); setQuickPreview(null); }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-4 h-4 text-white" />
                                </button>
                            </div>
                        )}

                        {/* Name & desc */}
                        <div className="flex-1 space-y-1.5">
                            <input
                                value={quickName}
                                onChange={(e) => setQuickName(e.target.value)}
                                placeholder="Fayans adı..."
                                className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-accent/30"
                            />
                            <input
                                value={quickDesc}
                                onChange={(e) => setQuickDesc(e.target.value)}
                                placeholder="Açıklama (opsiyonel)..."
                                className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 bg-white text-xs text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-accent/30"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleQuickUpload}
                        disabled={!quickFile || !quickName.trim() || uploading}
                        className="w-full py-2 text-xs font-medium text-white bg-accent hover:bg-accent-dark rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                    >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        {uploading ? "Yükleniyor..." : "Ekle"}
                    </button>
                </div>
            )}

            {/* Tiles list */}
            {customTiles.length === 0 && !showQuickAdd ? (
                <div className="text-center py-10 px-4">
                    <ImageIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-xs text-gray-400">Henüz fayans eklenmedi</p>
                    <p className="text-[10px] text-gray-300 mt-1">Yukarıdaki butonu kullanarak fayans ekleyin</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-50">
                    {customTiles.map((tile) => {
                        const isSelected =
                            selection?.type === "custom-lib" &&
                            selection.tile.id === tile.id;
                        return (
                            <div
                                key={tile.id}
                                onClick={() => onSelect(tile)}
                                className={`
                                    flex items-start gap-3 p-3 cursor-pointer transition-all duration-200 group relative
                                    ${isSelected
                                        ? "bg-accent/5 border-l-2 border-accent"
                                        : "hover:bg-gray-50 border-l-2 border-transparent"
                                    }
                                `}
                            >
                                {/* Thumbnail */}
                                <div className={`w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 ${isSelected ? "ring-2 ring-accent ring-offset-1" : ""}`}>
                                    <img
                                        src={tile.imagePath}
                                        alt={tile.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 py-0.5">
                                    {tile.description && (
                                        <p className="text-[10px] text-gray-400 mb-0.5 truncate">{tile.description}</p>
                                    )}
                                    <p className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">
                                        {tile.name}
                                    </p>
                                    <p className="text-[10px] text-accent-dark/70 mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        Daha fazla detay →
                                    </p>
                                </div>

                                {/* Select / Heart icon */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onSelect(tile); }}
                                    className={`shrink-0 mt-1 p-1 rounded-full transition-all ${isSelected ? "text-accent" : "text-gray-200 hover:text-gray-400"}`}
                                >
                                    <Heart className={`w-4 h-4 ${isSelected ? "fill-accent" : ""}`} />
                                </button>

                                {/* Delete button */}
                                <button
                                    onClick={(e) => handleDelete(e, tile.id)}
                                    disabled={deleting === tile.id}
                                    className="shrink-0 mt-1 p-1 text-gray-200 hover:text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    {deleting === tile.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
