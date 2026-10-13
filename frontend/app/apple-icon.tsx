import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/** iOS 홈 화면 아이콘 — SVG 를 못 쓰니 public/mindscene-mark.svg 를 PNG 로 굽는다 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const svg = await readFile(path.join(process.cwd(), "public/mindscene-mark.svg"));
  const src = `data:image/svg+xml;base64,${svg.toString("base64")}`;
  return new ImageResponse(<img src={src} width={180} height={180} alt="" />, size);
}
