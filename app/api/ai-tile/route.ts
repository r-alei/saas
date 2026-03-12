import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

// --- Main POST handler ---
export async function POST(request: NextRequest) {
    try {
        if (!process.env.REPLICATE_API_TOKEN) {
            return NextResponse.json(
                {
                    error: "REPLICATE_API_TOKEN ayarlanmamış. Lütfen .env.local dosyasına ekleyin.",
                },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { imageBase64, prompt, negativePrompt, tileImageBase64 } = body;

        if (!imageBase64 || !prompt) {
            return NextResponse.json(
                { error: "imageBase64 ve prompt alanları zorunludur." },
                { status: 400 }
            );
        }

        // Convert base64 to data URI
        const roomImageUri = `data:image/png;base64,${imageBase64}`;

        let resultUrl: string;

        if (tileImageBase64) {
            // ═══════════════════════════════════════════════════════
            // MODE 1: User provided a specific tile image
            // Use style-transfer to apply the tile texture to the room
            // ═══════════════════════════════════════════════════════
            console.log("[AI-Tile] Kullanıcı fayans görseli verdi — Style Transfer modu");

            const tileImageUri = `data:image/png;base64,${tileImageBase64}`;

            // Step 1: Use SDXL img2img with the tile reference
            // The prompt guides the model to apply the tile style to the floor
            const output = await replicate.run(
                "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
                {
                    input: {
                        image: roomImageUri,
                        prompt: `${prompt}, the floor tiles must exactly match the reference tile pattern and texture, seamless tile application on the floor only, keep room walls ceiling furniture lighting unchanged, interior design photography, photorealistic, high resolution, 8k quality`,
                        negative_prompt:
                            negativePrompt ||
                            "blurry, distorted, cartoon, anime, low quality, deformed walls, changed furniture, altered room structure, different room, warped perspective, text, watermark",
                        num_outputs: 1,
                        num_inference_steps: 35,
                        guidance_scale: 8.0,
                        prompt_strength: 0.5,
                        scheduler: "DPMSolverMultistep",
                        refine: "expert_ensemble_refiner",
                        high_noise_frac: 0.8,
                        width: 1024,
                        height: 1024,
                        apply_watermark: false,
                    },
                }
            );

            const outputArray = output as string[];
            if (!outputArray || outputArray.length === 0) {
                throw new Error("Replicate'ten sonuç alınamadı.");
            }
            resultUrl = outputArray[0];
        } else {
            // ═══════════════════════════════════════════════════════
            // MODE 2: Prompt-only mode (presets / custom text)
            // Use Flux Fill Dev for high-quality inpainting
            // ═══════════════════════════════════════════════════════
            console.log("[AI-Tile] Prompt modu — Flux Fill Dev ile inpainting");

            // Create a simple floor mask: bottom 60% of image is white (floor area)
            // This is a basic heuristic; for production you'd use segmentation
            const maskBase64 = generateFloorMask();
            const maskUri = `data:image/png;base64,${maskBase64}`;

            const output = await replicate.run(
                "black-forest-labs/flux-fill-dev",
                {
                    input: {
                        image: roomImageUri,
                        mask: maskUri,
                        prompt: `${prompt}, seamless floor tiles covering the entire floor area, photorealistic, professional interior design photography, high resolution, 8k quality`,
                        steps: 30,
                        guidance: 7.0,
                        output_format: "png",
                        output_quality: 95,
                    },
                }
            );

            // Flux Fill Dev returns a FileOutput object or URL
            if (typeof output === "string") {
                resultUrl = output;
            } else if (output && typeof output === "object") {
                // Could be a FileOutput or array
                const outputAny = output as Record<string, unknown>;
                if (outputAny.url) {
                    resultUrl = outputAny.url as string;
                } else if (Array.isArray(output)) {
                    resultUrl = (output as string[])[0];
                } else {
                    resultUrl = String(output);
                }
            } else {
                throw new Error("Replicate'ten sonuç alınamadı.");
            }
        }

        console.log("[AI-Tile] Sonuç URL:", resultUrl);

        // Fetch the generated image and convert to base64
        const imageRes = await fetch(resultUrl);
        if (!imageRes.ok) {
            throw new Error(`Sonuç görseli alınamadı: ${imageRes.status}`);
        }

        const resultBuffer = Buffer.from(await imageRes.arrayBuffer());
        const resultBase64 = resultBuffer.toString("base64");

        // Detect content type
        const contentType = imageRes.headers.get("content-type") || "image/png";
        const mimeType = contentType.includes("jpeg") || contentType.includes("jpg")
            ? "image/jpeg"
            : contentType.includes("webp")
                ? "image/webp"
                : "image/png";

        return NextResponse.json({
            success: true,
            image: `data:${mimeType};base64,${resultBase64}`,
        });
    } catch (error) {
        console.error("AI Tile Error:", error);

        const message =
            error instanceof Error
                ? error.message
                : "Bilinmeyen bir hata oluştu.";

        if (
            message.includes("Unauthenticated") ||
            message.includes("Invalid token")
        ) {
            return NextResponse.json(
                {
                    error: "Replicate API token geçersiz. Lütfen .env.local dosyanızdaki REPLICATE_API_TOKEN'ı kontrol edin.",
                },
                { status: 401 }
            );
        }

        if (message.includes("rate limit") || message.includes("429")) {
            return NextResponse.json(
                {
                    error: "Replicate API rate limit aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.",
                },
                { status: 429 }
            );
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// --- Generate a basic floor mask (bottom 60% = white, top 40% = black) ---
// White = area to inpaint, Black = area to preserve
function generateFloorMask(): string {
    // Create a 1024x1024 PNG with bottom 60% white, top 40% black
    // Using a minimal PNG encoder (raw uncompressed PNG)
    const width = 1024;
    const height = 1024;
    const floorStartY = Math.floor(height * 0.4); // Floor starts at 40% from top

    // PNG signature
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8; // bit depth
    ihdrData[9] = 0; // grayscale
    ihdrData[10] = 0; // compression
    ihdrData[11] = 0; // filter
    ihdrData[12] = 0; // interlace
    const ihdr = createPNGChunk("IHDR", ihdrData);

    // IDAT chunk - image data
    // Each row: filter byte (0) + pixel data
    const rawData: number[] = [];
    for (let y = 0; y < height; y++) {
        rawData.push(0); // filter byte: None
        const pixelValue = y >= floorStartY ? 255 : 0; // white for floor, black for keep
        for (let x = 0; x < width; x++) {
            rawData.push(pixelValue);
        }
    }

    // Use zlib to compress
    const zlib = require("zlib");
    const compressed = zlib.deflateSync(Buffer.from(rawData));
    const idat = createPNGChunk("IDAT", compressed);

    // IEND chunk
    const iend = createPNGChunk("IEND", Buffer.alloc(0));

    // Combine all chunks
    const png = Buffer.concat([signature, ihdr, idat, iend]);
    return png.toString("base64");
}

function createPNGChunk(type: string, data: Buffer): Buffer {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);

    const typeBuffer = Buffer.from(type, "ascii");
    const crcInput = Buffer.concat([typeBuffer, data]);

    // CRC32
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcInput), 0);

    return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
}

const crc32Table = (() => {
    const table: number[] = [];
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
            c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        }
        table.push(c);
    }
    return table;
})();
