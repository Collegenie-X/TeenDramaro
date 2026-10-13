import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
export async function resolve(spec, ctx, next) {
  if (spec.startsWith(".") && !spec.endsWith(".ts")) {
    try {
      const url = new URL(spec + ".ts", ctx.parentURL);
      if (existsSync(fileURLToPath(url))) return next(spec + ".ts", ctx);
    } catch {}
  }
  return next(spec, ctx);
}
