// src/utils/httpErrors.ts
import { Response } from "express";

export function handleError(res: Response, error: unknown): void {
    if (error instanceof Error) {
        if (error.message.startsWith("FORBIDDEN"))
            return void res.status(403).json({ message: error.message });
        if (error.message.startsWith("NOT_FOUND") || (error as { code?: string }).code === "P2025")
            return void res.status(404).json({ message: error.message });
        if (error.message.startsWith("INVALID") || error.message.startsWith("WIP_LIMIT"))
            return void res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error" });
}