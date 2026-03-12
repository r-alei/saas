"use client";

import * as React from "react";

interface ComparisonSliderProps {
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string;
    afterLabel?: string;
}

export function ComparisonSlider({
    beforeImage,
    afterImage,
    beforeLabel = "Önce",
    afterLabel = "Sonra",
}: ComparisonSliderProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState(50);
    const [isDragging, setIsDragging] = React.useState(false);

    const updatePosition = React.useCallback(
        (clientX: number) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            setPosition(percentage);
        },
        []
    );

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updatePosition(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        updatePosition(e.touches[0].clientX);
    };

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) updatePosition(e.clientX);
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) updatePosition(e.touches[0].clientX);
        };
        const handleEnd = () => setIsDragging(false);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleEnd);
        window.addEventListener("touchmove", handleTouchMove);
        window.addEventListener("touchend", handleEnd);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleEnd);
        };
    }, [isDragging, updatePosition]);

    return (
        <div
            ref={containerRef}
            className="comparison-slider relative select-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
        >
            {/* After (full) */}
            <img
                src={afterImage}
                alt={afterLabel}
                className="w-full h-auto block rounded-xl"
                draggable={false}
            />

            {/* Before (clipped) */}
            <div
                className="comparison-overlay absolute inset-0"
                style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
                <img
                    src={beforeImage}
                    alt={beforeLabel}
                    className="w-full h-auto block rounded-xl"
                    draggable={false}
                />
            </div>

            {/* Handle */}
            <div
                className="absolute top-0 bottom-0 z-10"
                style={{ left: `${position}%`, transform: "translateX(-50%)" }}
            >
                <div className="w-[3px] h-full bg-white/80 shadow-[0_0_12px_rgba(0,0,0,0.5)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="text-gray-600"
                    >
                        <path
                            d="M4 8L1 5.5M4 8L1 10.5M4 8H12M12 8L15 5.5M12 8L15 10.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
                {beforeLabel}
            </div>
            <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
                {afterLabel}
            </div>
        </div>
    );
}
