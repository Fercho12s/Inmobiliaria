import os
import json
import asyncio
from pathlib import Path

VIDEO_PROJECT = os.path.join(os.path.dirname(__file__), "video")

# Estado en memoria: {listing_id: {"status": "...", "progress": 0, "error": ""}}
_status: dict[int, dict] = {}

PHOTO_FRAMES = 90   # 3 segundos a 30 fps por foto
OUTRO_FRAMES = 90   # 3 segundos de cierre


def get_video_path(listing_id: int) -> str:
    out_dir = os.getenv("OUTPUT_DIR", "./generated")
    path = os.path.join(out_dir, "videos", f"{listing_id}.mp4")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    return path


def get_status(listing_id: int) -> dict:
    return _status.get(listing_id, {"status": "idle"})


def video_exists(listing_id: int) -> bool:
    return Path(get_video_path(listing_id)).exists()


async def render_video(listing_id: int, listing_data: dict):
    _status[listing_id] = {"status": "rendering", "progress": 0}

    output_path = get_video_path(listing_id)
    props_json  = json.dumps({"listing": listing_data})

    chrome_exe = os.getenv("REMOTION_CHROME_EXECUTABLE", "")
    chrome_flag = f"--browser-executable={chrome_exe}" if chrome_exe else ""

    cmd = [
        "node", "render.mjs",
        props_json,
        output_path,
    ]
    if chrome_flag:
        cmd.append(chrome_flag)

    try:
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=VIDEO_PROJECT,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        # Leer stdout para reportar progreso
        while True:
            line = await proc.stdout.readline()
            if not line:
                break
            text = line.decode().strip()
            if text.startswith("PROGRESS:"):
                try:
                    _status[listing_id]["progress"] = int(text.split(":")[1])
                except ValueError:
                    pass

        await proc.wait()

        if proc.returncode == 0:
            _status[listing_id] = {"status": "done", "progress": 100}
        else:
            stderr = await proc.stderr.read()
            error  = stderr.decode()[-500:] if stderr else "Error desconocido"
            _status[listing_id] = {"status": "error", "error": error}

    except Exception as e:
        _status[listing_id] = {"status": "error", "error": str(e)}
