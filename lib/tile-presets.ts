export interface TilePreset {
    id: string;
    name: string;
    prompt: string;
    negativePrompt: string;
    color: string;
    emoji: string;
    description: string;
}

export const tilePresets: TilePreset[] = [
    {
        id: "marble-white",
        name: "Beyaz Mermer",
        description: "Gri damarlı lüks beyaz mermer",
        prompt:
            "luxury white marble floor tiles with subtle grey veins, polished surface, high-end interior design, photorealistic, 8k quality",
        negativePrompt:
            "blurry, distorted, cartoon, low quality, deformed walls, changed furniture, altered room structure",
        color: "#e8e8e8",
        emoji: "🤍",
    },
    {
        id: "marble-black",
        name: "Siyah Mermer",
        description: "Altın damarlı premium siyah mermer",
        prompt:
            "premium black marble floor tiles with gold veins, polished glossy surface, luxury interior design, photorealistic, 8k quality",
        negativePrompt:
            "blurry, distorted, cartoon, low quality, deformed walls, changed furniture, altered room structure",
        color: "#1a1a2e",
        emoji: "🖤",
    },
    {
        id: "granite",
        name: "Granit",
        description: "Benekli dokulu doğal granit taş",
        prompt:
            "natural granite stone floor tiles, speckled texture, matte finish, modern interior, photorealistic, 8k quality",
        negativePrompt:
            "blurry, distorted, cartoon, low quality, deformed walls, changed furniture, altered room structure",
        color: "#6b7280",
        emoji: "🪨",
    },
    {
        id: "wood-look",
        name: "Ahşap Görünüm",
        description: "Sıcak meşe ahşap görünümlü porselen",
        prompt:
            "wood-look porcelain floor tiles, warm oak color, realistic wood grain texture, modern interior design, photorealistic, 8k quality",
        negativePrompt:
            "blurry, distorted, cartoon, low quality, deformed walls, changed furniture, altered room structure",
        color: "#a0714f",
        emoji: "🪵",
    },
    {
        id: "travertine",
        name: "Traverten",
        description: "Sıcak bej tonlarında doğal traverten",
        prompt:
            "natural travertine floor tiles, warm beige tones, filled and honed finish, elegant classic interior, photorealistic, 8k quality",
        negativePrompt:
            "blurry, distorted, cartoon, low quality, deformed walls, changed furniture, altered room structure",
        color: "#d4b896",
        emoji: "🏛️",
    },
    {
        id: "geometric",
        name: "Geometrik Desen",
        description: "Fas stili mavi-beyaz geometrik seramik",
        prompt:
            "geometric patterned ceramic floor tiles, moroccan style, blue and white pattern, intricate design, photorealistic, 8k quality",
        negativePrompt:
            "blurry, distorted, cartoon, low quality, deformed walls, changed furniture, altered room structure",
        color: "#2563eb",
        emoji: "🔷",
    },
    {
        id: "concrete",
        name: "Beton Görünüm",
        description: "Modern minimalist beton görünüm",
        prompt:
            "industrial concrete look floor tiles, grey cement texture, modern minimalist interior, matte finish, photorealistic, 8k quality",
        negativePrompt:
            "blurry, distorted, cartoon, low quality, deformed walls, changed furniture, altered room structure",
        color: "#9ca3af",
        emoji: "🏗️",
    },
    {
        id: "white-ceramic",
        name: "Beyaz Seramik",
        description: "Parlak yüzeyli temiz beyaz seramik",
        prompt:
            "clean white ceramic floor tiles, glossy finish, modern bathroom or kitchen interior, bright and minimal, photorealistic, 8k quality",
        negativePrompt:
            "blurry, distorted, cartoon, low quality, deformed walls, changed furniture, altered room structure",
        color: "#f5f5f5",
        emoji: "⬜",
    },
];
