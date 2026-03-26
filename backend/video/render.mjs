import { bundle }            from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path                  from "path";
import { fileURLToPath }     from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const propsJson   = process.argv[2];
const outputPath  = process.argv[3];
const chromePath  = process.argv[4] ?? process.env.REMOTION_CHROME_EXECUTABLE ?? undefined;

if (!propsJson || !outputPath) {
  console.error("Uso: node render.mjs '<props_json>' <output_path>");
  process.exit(1);
}

const inputProps = JSON.parse(propsJson);

console.log("Bundling...");
const serveUrl = await bundle({
  entryPoint: path.join(__dirname, "src/index.ts"),
  webpackOverride: (config) => config,
});

console.log("Selecting composition...");
const composition = await selectComposition({
  serveUrl,
  id: "PropertyReel",
  inputProps,
});

console.log(`Rendering ${composition.durationInFrames} frames...`);
await renderMedia({
  composition,
  serveUrl,
  codec:          "h264",
  outputLocation: outputPath,
  inputProps,
  chromiumOptions: {
    executablePath:     chromePath,
    disableWebSecurity: true,
    ignoreCertificateErrors: true,
    gl: "angle",
  },
  onProgress: ({ progress }) => {
    process.stdout.write(`PROGRESS:${Math.round(progress * 100)}\n`);
  },
  logLevel: "warn",
});

console.log("DONE");
