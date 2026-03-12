"use client";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";
import { Calculator as CalcIcon, MoveRight, Package, Ruler, Trash2, BoxSelect, SquareDashed, BrickWall, LayoutGrid, Layers } from "lucide-react";
import { Input } from "./ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { cn } from "@/lib/utils";

type CalculationMode = "dimensions" | "direct";

type FormValues = {
    // Dimensions
    width: number;
    length: number;
    height: number;
    manualArea: number;
    includeWalls: boolean;
    fireRate: number;

    // Product Specs
    tileWidth: number;   // cm
    tileLength: number;  // cm
    piecesPerPackage: number;
    unitPrice: number;
};

const defaultValues: FormValues = {
    width: 0,
    length: 0,
    height: 2.6,
    manualArea: 0,
    includeWalls: false,
    fireRate: 10,

    tileWidth: 60,
    tileLength: 120,
    piecesPerPackage: 2,
    unitPrice: 0,
};

export function Calculator() {
    const [mode, setMode] = React.useState<CalculationMode>("dimensions");

    const {
        register,
        control,
        reset,
        setValue,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues,
        mode: "onChange",
    });

    const values = useWatch({ control });

    // --- 1. Customer Requirement Calculation ---
    const width = Number(values.width) || 0;
    const length = Number(values.length) || 0;
    const height = Number(values.height) || 0;
    const manualArea = Number(values.manualArea) || 0;
    const fireRate = Number(values.fireRate) || 0;
    const includeWalls = values.includeWalls;

    let baseFloorArea = 0;
    let wallArea = 0;
    let rawArea = 0;

    if (mode === "direct") {
        rawArea = manualArea;
    } else {
        baseFloorArea = width * length;
        if (includeWalls && height > 0) {
            wallArea = (width + length) * 2 * height;
        }
        rawArea = baseFloorArea + wallArea;
    }

    // Total Needed m² (with waste)
    const requiredArea = rawArea > 0 ? rawArea * (1 + fireRate / 100) : 0;

    // --- 2. Product Specs & Logic ---
    const tileWidth = Number(values.tileWidth) || 0;
    const tileLength = Number(values.tileLength) || 0;
    const piecesPerPackage = Number(values.piecesPerPackage) || 0;
    const unitPrice = Number(values.unitPrice) || 0;

    // Single Tile Area (cm -> m²)
    const singleTileArea = (tileWidth * tileLength) / 10000;

    // Package Total Area
    const packageArea = singleTileArea * piecesPerPackage;

    // Piece Calculation
    // How many pieces needed for requiredArea?
    const requiredPieces = (requiredArea > 0 && singleTileArea > 0)
        ? Math.ceil(requiredArea / singleTileArea)
        : 0;

    // Package Calculation
    // How many packages needed for requiredPieces?
    const requiredPackages = (requiredPieces > 0 && piecesPerPackage > 0)
        ? Math.ceil(requiredPieces / piecesPerPackage)
        : 0;

    // Final Sold Area
    const soldArea = requiredPackages * packageArea;

    // Final Price
    const totalPrice = soldArea * unitPrice;


    // --- Formatters ---
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const formatNumber = (num: number, maxDigits = 2) => {
        return new Intl.NumberFormat("tr-TR", {
            maximumFractionDigits: maxDigits,
        }).format(num);
    }

    const handleModeChange = (newMode: CalculationMode) => {
        setMode(newMode);
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Panel: Inputs */}
            <Card className="h-fit">
                <CardHeader className="border-b bg-gray-50/50 pb-0 pt-0 px-0">
                    {/* Mode Tabs */}
                    <div className="flex w-full">
                        <button
                            onClick={() => handleModeChange("dimensions")}
                            className={cn(
                                "flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
                                mode === "dimensions"
                                    ? "border-blue-600 text-blue-600 bg-white"
                                    : "border-transparent text-gray-500 hover:text-gray-700 bg-gray-50/50"
                            )}
                        >
                            <Ruler size={18} />
                            Ölçü Girerek
                        </button>
                        <button
                            onClick={() => handleModeChange("direct")}
                            className={cn(
                                "flex-1 py-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2",
                                mode === "direct"
                                    ? "border-blue-600 text-blue-600 bg-white"
                                    : "border-transparent text-gray-500 hover:text-gray-700 bg-gray-50/50"
                            )}
                        >
                            <SquareDashed size={18} />
                            Direkt m²
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6 p-6">

                    {/* 1. Customer Area Input */}
                    <div className="min-h-[120px]">
                        {mode === "dimensions" ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Input
                                            label="Genişlik (m)"
                                            type="number"
                                            step="0.01"
                                            placeholder="Örn: 2"
                                            {...register("width", { min: 0 })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            label="Uzunluk (m)"
                                            type="number"
                                            step="0.01"
                                            placeholder="Örn: 3"
                                            {...register("length", { min: 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-dashed">
                                    <div className="flex items-center gap-2 mb-3">
                                        <input
                                            type="checkbox"
                                            id="includeWalls"
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            {...register("includeWalls")}
                                        />
                                        <label htmlFor="includeWalls" className="text-sm font-medium text-gray-700 select-none flex items-center gap-1.5 cursor-pointer">
                                            <BrickWall size={14} className="text-gray-500" />
                                            Duvarları da dahil et
                                        </label>
                                    </div>

                                    {includeWalls && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                            <Input
                                                label="Tavan Yüksekliği (m)"
                                                type="number"
                                                step="0.01"
                                                placeholder="Örn: 2.60"
                                                {...register("height", { min: 0 })}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <Input
                                    label="Toplam İhtiyaç (m²)"
                                    type="number"
                                    step="0.01"
                                    className="text-lg"
                                    placeholder="Örn: 25"
                                    autoFocus
                                    {...register("manualArea", { min: 0 })}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Input
                            label="Fire Oranı (%)"
                            type="number"
                            placeholder="Örn: 10"
                            {...register("fireRate", { min: 0 })}
                        />
                    </div>

                    {/* 2. Product Specs Input */}
                    <div className="pt-4 border-t">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                            <Layers size={16} />
                            Ürün Bilgileri
                        </h4>

                        {/* Quick Select Presets */}
                        <div className="mb-4">
                            <p className="text-xs text-gray-500 mb-2">Hızlı Ölçü Seçimi:</p>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { w: 20, l: 90 },
                                    { w: 45, l: 45 },
                                    { w: 30, l: 60 },
                                    { w: 30, l: 75 },
                                    { w: 30, l: 90 },
                                    { w: 60, l: 60 },
                                    { w: 40, l: 120 },
                                    { w: 60, l: 120 },
                                ].map((size) => (
                                    <button
                                        key={`${size.w}x${size.l}`}
                                        onClick={() => {
                                            setValue("tileWidth", size.w);
                                            setValue("tileLength", size.l);
                                        }}
                                        className="px-2 py-1.5 text-xs border rounded hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                                    >
                                        {size.w}x{size.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input
                                    label="Seramik En (cm)"
                                    type="number"
                                    placeholder="Örn: 60"
                                    {...register("tileWidth", { required: true, min: 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    label="Seramik Boy (cm)"
                                    type="number"
                                    placeholder="Örn: 120"
                                    {...register("tileLength", { required: true, min: 0 })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="space-y-2">
                                <Input
                                    label="Kutu İçi Adet"
                                    type="number"
                                    placeholder="Örn: 2"
                                    {...register("piecesPerPackage", { required: true, min: 1 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Input
                                    label="m² Fiyatı (TL)"
                                    type="number"
                                    step="0.01"
                                    // className="text-lg font-medium"
                                    placeholder="Örn: 450"
                                    {...register("unitPrice", { required: true, min: 0 })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            reset(defaultValues);
                            setMode("dimensions");
                        }}
                        className="flex items-center justify-center w-full gap-2 p-2 mt-2 text-sm text-gray-500 transition-colors border border-dashed rounded-md hover:bg-gray-50 hover:text-red-500 hover:border-red-200"
                    >
                        <Trash2 size={16} />
                        Formu Sıfırla
                    </button>
                </CardContent>
            </Card>

            {/* Right Panel: Summary */}
            <Card className="flex flex-col h-full border-blue-100 shadow-md bg-blue-50/30">
                <CardHeader className="border-b bg-white/50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <CalcIcon size={20} />
                        </div>
                        <CardTitle>Hesaplama Özeti</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-between flex-1 p-6 space-y-6">

                    <div className="space-y-4">
                        {/* Product Info Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 text-center">
                            <div className="bg-white/50 p-2 rounded">
                                Tek Seramik: <span className="font-medium text-gray-700">{formatNumber(singleTileArea, 4)} m²</span>
                            </div>
                            <div className="bg-white/50 p-2 rounded">
                                Kutu Alanı: <span className="font-medium text-gray-700">{formatNumber(packageArea, 4)} m²</span>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="grid gap-2 p-4 text-sm bg-white border rounded-xl shadow-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Müşteri İhtiyacı (Ham):</span>
                                <span className="font-medium text-gray-900">{formatNumber(rawArea)} m²</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Fire Dahil (+%{fireRate}):</span>
                                <span className="font-bold text-blue-700">{formatNumber(requiredArea)} m²</span>
                            </div>
                            <div className="border-b my-2 border-dashed"></div>
                            <div className="flex justify-between items-center text-blue-800">
                                <span className="font-medium flex items-center gap-1">
                                    <LayoutGrid size={14} />
                                    Gereken Net Adet:
                                </span>
                                <span className="font-bold text-lg">{requiredPieces} <span className="text-xs font-normal opacity-80">Seramik</span></span>
                            </div>
                        </div>

                        {/* Box Count Highlight */}
                        <div className="relative overflow-hidden flex items-center justify-between p-6 text-white shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl group transition-all hover:scale-[1.02]">
                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                    <Package className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs uppercase tracking-wider font-bold mb-0.5">Teslim Edilecek</p>
                                    <p className="text-4xl font-extrabold tracking-tight">{requiredPackages} <span className="text-lg font-medium opacity-80">Paket</span></p>
                                </div>
                            </div>
                            <BoxSelect className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12" />
                        </div>

                        {/* Sold Area Details */}
                        <div className="bg-blue-100/50 rounded-lg p-3 border border-blue-200/50">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-blue-700 font-medium uppercase tracking-wide">Faturaya Yansıyacak</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-green-700">{formatNumber(soldArea)}</span>
                                    <span className="text-sm text-green-600 font-medium">m² Alan</span>
                                </div>
                                <MoveRight className="text-gray-400" size={20} />
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-500">
                                        {requiredPackages} pkt x {formatNumber(packageArea, 2)} m²
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Total Price */}
                    <div className="pt-6 mt-auto border-t border-blue-100">
                        <div className="flex items-end justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium text-gray-500">Genel Toplam Tutar</p>
                                <p className="text-xs text-gray-400">(KDV Dahil)</p>
                            </div>
                            <div className="text-5xl font-bold text-gray-900 tracking-tighter">
                                {formatCurrency(totalPrice)}
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
