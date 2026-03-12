"use client";

import * as React from "react";
import {
    Plus,
    Trash2,
    ImageIcon,
    X,
    Loader2,
    CheckCircle2,
    Library,
    Upload,
} from "lucide-react";

interface CustomTile {
    id: string;
    name: string;
    description: string;
    prompt: string;
    negativePrompt: string;
    imagePath: string;
    createdAt: string;
}

export function TileLibraryManager() {
    const [tiles, setTiles] = React.useState<CustomTile[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [showForm, setShowForm] = React.useState(false);
    const [formName, setFormName] = React.useState("");
    const [formDesc, setFormDesc] = React.useState("");
    const [formPrompt, setFormPrompt] = React.useState("");
    const [formFile, setFormFile] = React.useState<File | null>(null);
    const [formPreview, setFormPreview] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const [deleting, setDeleting] = React.useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const fetchTiles = async () => {
        try {
            const res = await fetch("/api/tile-library");
            const data = await res.json();
            setTiles(data.tiles || []);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchTiles();
    }, []);

    const handleFileChange = (file: File) => {
        if (!file.type.startsWith("image/")) return;
        if (file.size > 10 * 1024 * 1024) return;
        setFormFile(file);
        setFormPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async () => {
        if (!formFile || !formName.trim()) return;
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("image", formFile);
            formData.append("name", formName.trim());
            formData.append("description", formDesc.trim());
            formData.append(
                "prompt",
                formPrompt.trim() ||
                `${formName.trim()} floor tiles, photorealistic, 8k quality`
            );

            const res = await fetch("/api/tile-library", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setShowForm(false);
                setFormName("");
                setFormDesc("");
                setFormPrompt("");
                setFormFile(null);
                setFormPreview(null);
                fetchTiles();
            }
        } catch {
            // ignore
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            await fetch("/api/tile-library", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            fetchTiles();
        } catch {
            // ignore
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-accent-light animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white/90 flex items-center gap-2">
                        <Library className="w-5 h-5 text-accent-light" />
                        Fayans Kütüphanesi
                    </h2>
                    <p className="text-sm text-white/40 mt-1">
                        Kendi fayans fotoğraflarınızı ekleyin ve AI ile kullanın
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-accent flex items-center gap-2 py-2.5 px-5 text-sm"
                >
                    {showForm ? (
                        <>
                            <X className="w-4 h-4" />
                            İptal
                        </>
                    ) : (
                        <>
                            <Plus className="w-4 h-4" />
                            Yeni Fayans
                        </>
                    )}
                </button>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="glass-card p-6 space-y-5">
                    <h3 className="font-semibold text-white/80 text-sm">
                        Yeni Fayans Ekle
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-5">
                        {/* Image upload */}
                        <div>
                            {!formPreview ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-accent/30 hover:bg-accent/5 transition-all"
                                >
                                    <Upload className="w-8 h-8 text-white/20" />
                                    <p className="text-xs text-white/30">
                                        Fayans fotoğrafı yükleyin
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileChange(file);
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="aspect-square rounded-xl overflow-hidden relative group">
                                    <img
                                        src={formPreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => {
                                            setFormFile(null);
                                            setFormPreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Form fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-white/50 mb-1.5 block">
                                    Fayans Adı *
                                </label>
                                <input
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="Örn: İtalyan Beyaz Mermer"
                                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/50 mb-1.5 block">
                                    Açıklama
                                </label>
                                <input
                                    value={formDesc}
                                    onChange={(e) => setFormDesc(e.target.value)}
                                    placeholder="Kısa açıklama..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-white/50 mb-1.5 block">
                                    AI Prompt (İsteğe Bağlı)
                                </label>
                                <textarea
                                    value={formPrompt}
                                    onChange={(e) => setFormPrompt(e.target.value)}
                                    placeholder="Boş bırakırsanız otomatik oluşturulur..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none transition-all"
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!formFile || !formName.trim() || uploading}
                                className="btn-accent w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Yükleniyor...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Kaydet
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tiles Grid */}
            {tiles.length === 0 ? (
                <div className="glass-card flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-dashed border-white/10 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-white/15" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-white/40">Henüz fayans eklenmemiş</p>
                        <p className="text-xs text-white/20 mt-1">
                            &quot;Yeni Fayans&quot; butonuna tıklayarak başlayın
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {tiles.map((tile) => (
                        <div
                            key={tile.id}
                            className="glass-card glass-card-hover overflow-hidden group"
                        >
                            <div className="aspect-square overflow-hidden">
                                <img
                                    src={tile.imagePath}
                                    alt={tile.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>
                            <div className="p-3 space-y-2">
                                <div>
                                    <p className="text-sm font-medium text-white/80 truncate">
                                        {tile.name}
                                    </p>
                                    {tile.description && (
                                        <p className="text-[10px] text-white/30 truncate mt-0.5">
                                            {tile.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDelete(tile.id)}
                                    disabled={deleting === tile.id}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                    {deleting === tile.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3 h-3" />
                                    )}
                                    Sil
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
