import os
import json
import asyncio
import subprocess
import threading
from pathlib import Path

VIDEO_PROJECT = os.path.join(os.path.dirname(__file__), "video")

# Estado en memoria: {listing_id: {"status": "...", "progress": 0, "error": ""}}
_status: dict[int, dict] = {}


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
    props_json  = json.dumps({"listing": listing_data})

    env = {**os.environ}

    cmd = [
        "node", "--max-old-space-size=2048", "render.mjs",
        props_json,
        output_path,
    ]

    def _run_sync():
        proc = subprocess.Popen(
            cmd,
            cwd=VIDEO_PROJECT,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            env=env,
        )

        def read_stdout():
            for raw in proc.stdout:
                text = raw.decode(errors="replace").strip()
                if text.startswith("PROGRESS:"):
                    try:
                        _status[listing_id]["progress"] = int(text.split(":")[1])
                    except (ValueError, KeyError):
                        pass

        t = threading.Thread(target=read_stdout, daemon=True)
        t.start()
        stderr_data = proc.stderr.read()
        proc.wait()
        t.join(timeout=5)
        return proc.returncode, stderr_data.decode(errors="replace")

    try:
        returncode, stderr_text = await asyncio.to_thread(_run_sync)
        if returncode == 0:
            _status[listing_id] = {"status": "done", "progress": 100}
        else:
            error = "\n".join(stderr_text.splitlines()[-30:]) or "Error desconocido"
            _status[listing_id] = {"status": "error", "error": error}
    except Exception as e:
        _status[listing_id] = {"status": "error", "error": repr(e) or type(e).__name__}
