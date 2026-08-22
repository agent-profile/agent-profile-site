#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { lstat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(scriptDir, "..", "dist");
const host = process.env.HOST || "127.0.0.1";
const port = Number.parseInt(process.env.PORT || "4321", 10);
const configuredBasePath = process.env.TEST_BASE_PATH || "/";
const basePath =
  configuredBasePath === "/"
    ? ""
    : `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`;

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
]);

function send(response, statusCode, body) {
  response.writeHead(statusCode, {
    "content-length": Buffer.byteLength(body),
    "content-type": "text/plain; charset=utf-8",
  });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.setHeader("allow", "GET, HEAD");
    send(response, 405, "Method not allowed.\n");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(
      new URL(request.url || "/", `http://${request.headers.host || host}`)
        .pathname,
    );
  } catch {
    send(response, 400, "Bad request.\n");
    return;
  }

  if (
    basePath &&
    pathname !== basePath &&
    !pathname.startsWith(`${basePath}/`)
  ) {
    send(response, 404, "Not found.\n");
    return;
  }

  const relativeUrlPath = basePath ? pathname.slice(basePath.length) : pathname;
  const segments = relativeUrlPath.split("/");
  if (segments.includes("..") || relativeUrlPath.includes("\0")) {
    send(response, 400, "Bad request.\n");
    return;
  }

  const relativeFile =
    relativeUrlPath === "/" || relativeUrlPath === ""
      ? "index.html"
      : relativeUrlPath.endsWith("/")
        ? `${relativeUrlPath.slice(1)}index.html`
        : relativeUrlPath.slice(1);
  const filePath = path.resolve(distDir, relativeFile);
  const relativeToDist = path.relative(distDir, filePath);
  if (
    relativeToDist === ".." ||
    relativeToDist.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToDist)
  ) {
    send(response, 400, "Bad request.\n");
    return;
  }

  let currentPath = distDir;
  let fileStat;
  const fileSegments = relativeFile.split("/");
  for (const [index, segment] of fileSegments.entries()) {
    currentPath = path.join(currentPath, segment);
    try {
      fileStat = await lstat(currentPath);
    } catch (error) {
      if (error && ["ENOENT", "ENOTDIR"].includes(error.code)) {
        send(response, 404, "Not found.\n");
        return;
      }
      send(response, 500, "Internal server error.\n");
      return;
    }

    const isLast = index === fileSegments.length - 1;
    if (
      fileStat.isSymbolicLink() ||
      (isLast ? !fileStat.isFile() : !fileStat.isDirectory())
    ) {
      send(response, 404, "Not found.\n");
      return;
    }
  }

  response.writeHead(200, {
    "content-length": fileStat.size,
    "content-type":
      contentTypes.get(path.extname(filePath)) || "application/octet-stream",
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Serving dist at http://${host}:${port}${basePath}/`);
});

function closeServer() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", closeServer);
process.on("SIGTERM", closeServer);
