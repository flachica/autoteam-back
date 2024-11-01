import { parse } from "path";

export function round(value: number): number {
    try {
        return parseFloat(value.toFixed(2));
    } catch (error) {
        return value;
    }
}