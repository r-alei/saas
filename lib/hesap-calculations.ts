export type CalculationMode = "dimensions" | "direct" | "metre";

export type HesapInputs = {
    mode: CalculationMode;
    width: number;
    length: number;
    height: number;
    includeWalls: boolean;
    manualArea: number;
    manualMetres: number;
    tileWidth: number;
    tileLength: number;
    unitPrice: number;
};

export type HesapResult = {
    requiredArea: number;
    packageArea: number;
    requiredPackages: number;
    soldArea: number;
    totalPrice: number;
    tileSpec: string;
};

const PACKAGE_AREA_MAP: Record<string, number> = {
    "45x45": 1.82,
    "58x58": 1.35,
    "60x60": 1.46,
    "60x120": 1.44,
    "30x90": 1.35,
    "30x75": 1.35,
    "30x60": 2.16,
};

const toPositive = (value: number) => {
    const safe = Number(value) || 0;
    return safe > 0 ? safe : 0;
};

export const getPackageArea = (tileWidth: number, tileLength: number) => {
    const key = `${tileWidth}x${tileLength}`;
    const mapped = PACKAGE_AREA_MAP[key];

    if (mapped) {
        return mapped;
    }

    return ((toPositive(tileWidth) * toPositive(tileLength)) / 10000) || 0;
};

export const calculateHesapResult = (inputs: HesapInputs): HesapResult => {
    const width = toPositive(inputs.width);
    const length = toPositive(inputs.length);
    const height = toPositive(inputs.height);
    const manualArea = toPositive(inputs.manualArea);
    const manualMetres = toPositive(inputs.manualMetres);
    const tileWidth = toPositive(inputs.tileWidth);
    const tileLength = toPositive(inputs.tileLength);
    const unitPrice = toPositive(inputs.unitPrice);

    let rawArea = 0;

    if (inputs.mode === "direct") {
        rawArea = manualArea;
    } else if (inputs.mode === "metre") {
        rawArea = manualMetres * (tileWidth / 100);
    } else {
        const baseArea = width * length;
        const wallArea = inputs.includeWalls ? (width + length) * 2 * height : 0;
        rawArea = baseArea + wallArea;
    }

    const requiredArea = rawArea > 0 ? rawArea : 0;
    const packageArea = getPackageArea(tileWidth, tileLength);

    const requiredPackages =
        requiredArea > 0 && packageArea > 0 ? Math.ceil(requiredArea / packageArea) : 0;

    const soldArea = requiredPackages * packageArea;
    const totalPrice = soldArea * unitPrice;

    return {
        requiredArea,
        packageArea,
        requiredPackages,
        soldArea,
        totalPrice,
        tileSpec: `${tileWidth}x${tileLength} cm`,
    };
};
