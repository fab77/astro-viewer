import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicRoot = path.join(root, "public");
const meshHiPSRoot =
  process.env.MESHIPS_LOCAL_STATIC_ROOT ||
  path.resolve(root, "../astrobrowser-infra/docker/meships-local");
const port = Number(process.env.PORT || process.argv[2] || 8080);

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".csv", "text/csv; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".obj", "text/plain; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  ["", "text/plain; charset=utf-8"],
]);

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveStaticPath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  if (clean.startsWith("/meships-local/")) {
    return {
      root: meshHiPSRoot,
      filePath: path.resolve(
        meshHiPSRoot,
        clean.replace(/^\/meships-local\//, ""),
      ),
      cacheControl: "public, max-age=3600",
    };
  }

  const publicPath = clean === "/" ? "/index.html" : clean;
  return {
    root: publicRoot,
    filePath: path.resolve(publicRoot, publicPath.replace(/^\/+/, "")),
    cacheControl: "no-store",
  };
}

const server = http.createServer((request, response) => {
  const method = request.method || "GET";

  if (method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, HEAD, OPTIONS",
      "access-control-allow-headers": "Content-Type",
    });
    response.end();
    return;
  }

  if (method !== "GET" && method !== "HEAD") {
    response.writeHead(405);
    response.end("Method not allowed");
    return;
  }

  const resolved = resolveStaticPath(request.url || "/");
  if (!isInside(resolved.root, resolved.filePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(resolved.filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      response.writeHead(404, {
        "access-control-allow-origin": "*",
        "content-type": "text/plain; charset=utf-8",
      });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "access-control-allow-origin": "*",
      "content-type":
        contentTypes.get(path.extname(resolved.filePath)) ||
        "application/octet-stream",
      "cache-control": resolved.cacheControl,
    });

    if (method === "HEAD") {
      response.end();
      return;
    }

    fs.createReadStream(resolved.filePath).pipe(response);
  });
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AstroViewer test UI: http://127.0.0.1:${port}/`);
  console.log(`MeshHiPS local root: ${meshHiPSRoot}`);
});
