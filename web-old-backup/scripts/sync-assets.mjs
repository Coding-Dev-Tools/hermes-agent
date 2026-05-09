import { rmSync, cpSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(DIR, "..");
const UI = join(ROOT, "node_modules", "@nous-research", "ui", "dist");
const PUBLIC = join(ROOT, "public");

const targets = [
  { src: join(UI, "fonts"), dest: join(PUBLIC, "fonts") },
  { src: join(UI, "assets"), dest: join(PUBLIC, "ds-assets") },
];

for (const { src, dest } of targets) {
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  cpSync(src, dest, { recursive: true, force: true });
}
