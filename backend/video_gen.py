import os
import json
import asyncio
from pathlib import Path

VIDEO_PROJECT = os.path.join(os.path.dirname(__file__), "video")

# Estado en memoria: {listing_id: {"status": "...", "progress": 0, "error": ""}}
_status: dict[int, dict] = {}

PHOTO_FRAMES = 120  # 4 segundos a 30 fps por foto


def get_video_path(listing_id: int) -> str:
    out_dir = os.getenv("OUTPUT_DIR", "./generated")
    path = os.path.join(out_dir, "videos", f"{listing_id}.mp4")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    return path


def get_status(listing_id: int) -> dict:
    return _status.get(listing_id, {"status": "idle"})



async def render_video(listing_id: int, listing_data: dict):
    _status[listing_id] = {"status": "rendering", "progress": 0}

    output_path = get_video_path(listing_id)

    props_json = json.dumps({"listing": listing_data})

    # render.mjs lee REMOTION_CHROME_EXECUTABLE del entorno directamente
    cmd = [
        "node", "--max-old-space-size=2048", "render.mjs",
        props_json,
        output_path,
    ]

    stderr_lines: list[str] = []

    async def drain_stderr(stream):
        async for raw in stream:
            stderr_lines.append(raw.decode(errors="replace").rstrip())

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=VIDEO_PROJECT,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env={**os.environ},
        )

        # Leer stdout (PROGRESS) y stderr en paralelo para evitar deadlocks
        async def drain_stdout():
            async for raw in proc.stdout:
                text = raw.decode(errors="replace").strip()
                if text.startswith("PROGRESS:"):
                    try:
                        _status[listing_id]["progress"] = int(text.split(":")[1])
                    except ValueError:
                        pass

        await asyncio.gather(drain_stdout(), drain_stderr(proc.stderr))
        await proc.wait()

        if proc.returncode == 0:
            _status[listing_id] = {"status": "done", "progress": 100}
        else:
            error = "\n".join(stderr_lines[-30:]) or "Error desconocido"
            _status[listing_id] = {"status": "error", "error": error}

    except Exception as e:
        _status[listing_id] = {"status": "error", "error": str(e)}
