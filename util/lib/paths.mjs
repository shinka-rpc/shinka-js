import { join } from "path";

export const rootDir = new URL(import.meta.url + "/../../..").pathname;
export const distDir = join(rootDir, "dist");
export const packagesDir = join(rootDir, "packages");
