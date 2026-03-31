import { bundle }                                    from "@remotion/bundler";
import { renderMedia, selectComposition, ensureBrowser } from "@remotion/renderer";
import path                               from "path";
import { fileURLToPath }                  from "url";
import fs                                 from "fs";
import https                              from "https";
import http                               from "http";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const propsJson  = process.argv[2];
const outputPath = process.argv[3];
const chromePath = process.argv[4] ?? process.env.REMOTION_CHROME_EXECUTABLE ?? undefined;

if (!propsJson || !outputPath) {
  process.stderr.write("Uso: node render.mjs '<props_json>' <output_path>\n");
  process.exit(1);
}

// ── Utilidades ─────────────────────────────────────────────────────────────────

function progress(n) {
  process.stdout.write(`PROGRESS:${Math.min(100, Math.max(0, Math.round(n)))}\n`);
}

function log(msg) {
  process.stderr.write(`[video] ${msg}\n`);
}

async function downloadToFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;
    const file = fs.createWriteStream(destPath);
    const req = protocol.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

// ── Resolución de imágenes ──────────────────────────────────────────────────────
// Convierte URLs remotas / locales en URLs accesibles durante el render

async function resolveImages(images, outputDir) {
  const limited    = (images || []).filter(Boolean).slice(0, 6);
  const uploadsDir = path.join(outputDir || path.join(__dirname, "..", "generated"), "uploads");
  const slidesDir  = path.join(__dirname, "public", "slides");

  fs.mkdirSync(slidesDir, { recursive: true });

  // Borrar slides anteriores
  for (const f of fs.readdirSync(slidesDir)) {
    try { fs.unlinkSync(path.join(slidesDir, f)); } catch (_) {}
  }

  const resolved = [];

  for (let i = 0; i < limited.length; i++) {
    const url = limited[i];
    const ext = (url.split(".").pop() || "jpg").split("?")[0].toLowerCase().replace(/[^a-z]/g, "") || "jpg";
    const filename = `slide-${i}.${ext}`;
    const dest     = path.join(slidesDir, filename);

    try {
      if (url.startsWith("/uploads/")) {
        const localPath = path.join(uploadsDir, url.replace("/uploads/", ""));
        if (fs.existsSync(localPath)) {
          fs.copyFileSync(localPath, dest);
          resolved.push(`slides/${filename}`);
        } else {
          log(`Local upload not found: ${localPath}`);
        }
      } else if (url.startsWith("http://") || url.startsWith("https://")) {
        await downloadToFile(url, dest);
        resolved.push(`slides/${filename}`);
      }
    } catch (e) {
      log(`Skipping image ${i} (${url.slice(0, 60)}): ${e.message}`);
    }

    progress(2 + Math.round(((i + 1) / limited.length) * 13)); // 2-15%
  }

  log(`Resolved ${resolved.length}/${limited.length} images`);
  return resolved;
}

// ── Main ────────────────────────────────────────────────────────────────────────

const { listing } = JSON.parse(propsJson);
const outputDir   = process.env.OUTPUT_DIR;

progress(2);

// Si Python ya pre-procesó y mejoró las imágenes, usarlas directamente.
// De lo contrario, descargar desde las URLs originales.
let imageFiles;
if (listing.imageFiles && listing.imageFiles.length > 0) {
  log(`Using ${listing.imageFiles.length} pre-enhanced image(s) from Python...`);
  imageFiles = listing.imageFiles;
  progress(15);
} else {
  log("Resolving images...");
  imageFiles = await resolveImages(listing.images, outputDir);
}

const musicPath = path.join(__dirname, "public", "music", "background.mp3");
const hasMusic  = fs.existsSync(musicPath);
if (hasMusic) log("Music found, will include audio");

// Asegurar carpeta de salida
fs.mkdirSync(path.dirname(outputPath), { recursive: true });

const PHOTO_FRAMES  = 120;   // 4 s a 30 fps
const OUTRO_FRAMES  = 90;    // 3 s
const numSlides     = Math.max(1, imageFiles.length);
const totalFrames   = numSlides * PHOTO_FRAMES + OUTRO_FRAMES;

const inputProps = {
  listing: {
    ...listing,
    imageFiles,          // nombres relativos al publicDir: "slides/slide-0.jpg"
  },
  hasMusic,
  photoFrames:  PHOTO_FRAMES,
  outroFrames:  OUTRO_FRAMES,
  totalFrames,
};

// ── Bundling ────────────────────────────────────────────────────────────────────

progress(15);
log("Bundling Remotion...");

const serveUrl = await bundle({
  entryPoint:      path.join(__dirname, "src/index.ts"),
  publicDir:       path.join(__dirname, "public"),
  webpackOverride: (config) => config,
  onProgress:      (p) => progress(15 + Math.round(p * 0.20)), // 15-35%
});

// ── Asegurar navegador (usa binario local si está disponible) ───────────────────

progress(35);

// Callback que evita la descarga automática de Chrome Headless Shell si ya
// hay un ejecutable configurado, o muestra progreso si hay que descargarlo.
const onBrowserDownload = chromePath
  ? () => { log("Using provided browser, skipping download"); return { version: "custom" }; }
  : (info) => { log(`Downloading browser: ${info.url}`); };

await ensureBrowser({ browserExecutable: chromePath ?? null, logLevel: "warn", onBrowserDownload });

// ── Selección de composición ────────────────────────────────────────────────────

log("Selecting composition...");

const chromiumOptions = {
  executablePath:          chromePath,
  disableWebSecurity:      true,
  ignoreCertificateErrors: true,
  gl:                      "swangle",   // software WebGL – funciona en Docker sin GPU
};

const composition = await selectComposition({
  serveUrl,
  id: "PropertyReel",
  inputProps,
  chromiumOptions,
});

log(`Rendering ${totalFrames} frames (${(totalFrames / 30).toFixed(1)} s)...`);

// ── Render ──────────────────────────────────────────────────────────────────────

progress(38);

await renderMedia({
  composition: { ...composition, durationInFrames: totalFrames },
  serveUrl,
  codec:          "h264",
  outputLocation: outputPath,
  inputProps,
  chromiumOptions,
  concurrency:    2,
  logLevel:       "warn",
  onProgress: ({ progress: p }) => {
    progress(38 + Math.round(p * 62)); // 38-100%
  },
});

progress(100);
log("Done!");
