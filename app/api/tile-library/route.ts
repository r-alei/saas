import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir, readFile } from "fs/promises";
import path from "path";

// Tile library storage directory
const TILE_LIBRARY_DIR = path.join(process.cwd(), "public", "tile-library");

// Ensure directory exists
async function ensureDir() {
    try {
        await mkdir(TILE_LIBRARY_DIR, { recursive: true });
    } catch {
        // directory already exists
    }
}

// GET — List all custom tiles
export async function GET() {
    try {
        await ensureDir();
        const metaPath = path.join(TILE_LIBRARY_DIR, "tiles.json");

        try {
            const data = await readFile(metaPath, "utf-8");
            const tiles = JSON.parse(data);
            return NextResponse.json({ tiles });
        } catch {
            return NextResponse.json({ tiles: [] });
        }
    } catch (error) {
        console.error("Tile library GET error:", error);
        return NextResponse.json({ error: "Kütüphane okunamadı" }, { status: 500 });
    }
}

// POST — Add a new tile to library
export async function POST(request: NextRequest) {
    try {
        await ensureDir();

        const formData = await request.formData();
        const file = formData.get("image") as File | null;
        const name = formData.get("name") as string;
        const description = formData.get("description") as string;
        const prompt = formData.get("prompt") as string;

        if (!file || !name) {
            return NextResponse.json(
                { error: "Fotoğraf ve isim zorunludur." },
                { status: 400 }
            );
        }

        // Save image file
        const ext = file.name.split(".").pop() || "jpg";
        const id = `custom-${Date.now()}`;
        const filename = `${id}.${ext}`;
        const filePath = path.join(TILE_LIBRARY_DIR, filename);

        const bytes = new Uint8Array(await file.arrayBuffer());
        await writeFile(filePath, bytes);

        // Read existing tiles
        const metaPath = path.join(TILE_LIBRARY_DIR, "tiles.json");
        let tiles: CustomTile[] = [];
        try {
            const data = await readFile(metaPath, "utf-8");
            tiles = JSON.parse(data);
        } catch {
            // No existing tiles
        }

        // Add new tile
        const newTile: CustomTile = {
            id,
            name,
            description: description || "",
            prompt: prompt || `${name} floor tiles, photorealistic, 8k quality`,
            negativePrompt:
                "blurry, distorted, cartoon, low quality, deformed walls, changed furniture, altered room structure",
            imagePath: `/tile-library/${filename}`,
            createdAt: new Date().toISOString(),
        };

        tiles.push(newTile);
        await writeFile(metaPath, JSON.stringify(tiles, null, 2));

        return NextResponse.json({ tile: newTile });
    } catch (error) {
        console.error("Tile library POST error:", error);
        return NextResponse.json(
            { error: "Fayans eklenemedi." },
            { status: 500 }
        );
    }
}

// DELETE — Remove a tile from library
export async function DELETE(request: NextRequest) {
    try {
        await ensureDir();

        const { id } = await request.json();
        if (!id) {
            return NextResponse.json({ error: "ID zorunludur." }, { status: 400 });
        }

        const metaPath = path.join(TILE_LIBRARY_DIR, "tiles.json");
        let tiles: CustomTile[] = [];
        try {
            const data = await readFile(metaPath, "utf-8");
            tiles = JSON.parse(data);
        } catch {
            return NextResponse.json({ error: "Kütüphane bulunamadı." }, { status: 404 });
        }

        // Find and remove tile
        const tileIndex = tiles.findIndex((t) => t.id === id);
        if (tileIndex === -1) {
            return NextResponse.json({ error: "Fayans bulunamadı." }, { status: 404 });
        }

        // Remove image file
        const tile = tiles[tileIndex];
        try {
            const { unlink } = await import("fs/promises");
            await unlink(path.join(process.cwd(), "public", tile.imagePath));
        } catch {
            // File might not exist
        }

        tiles.splice(tileIndex, 1);
        await writeFile(metaPath, JSON.stringify(tiles, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Tile library DELETE error:", error);
        return NextResponse.json(
            { error: "Fayans silinemedi." },
            { status: 500 }
        );
    }
}

interface CustomTile {
    id: string;
    name: string;
    description: string;
    prompt: string;
    negativePrompt: string;
    imagePath: string;
    createdAt: string;
}
