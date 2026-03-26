import os
import httpx
from dotenv import load_dotenv

load_dotenv()

UPLOAD_URL = "https://api.upload-post.com/api/upload_photos"


async def publish_to_instagram(image_path: str, caption: str) -> dict:
    api_key = os.getenv("UPLOADPOST_API_KEY", "")
    user    = os.getenv("UPLOADPOST_USER", "")

    if not api_key:
        raise ValueError("UPLOADPOST_API_KEY no configurado en .env")
    if not user:
        raise ValueError("UPLOADPOST_USER no configurado en .env")

    with open(image_path, "rb") as f:
        image_bytes = f.read()

    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            UPLOAD_URL,
            headers={"Authorization": f"Apikey {api_key}"},
            data={
                "user":        user,
                "platform[]":  "instagram",
                "title":       caption,
            },
            files={"photos[]": ("post.png", image_bytes, "image/png")},
        )

    if resp.status_code not in (200, 201, 202):
        raise Exception(f"Upload Post API error {resp.status_code}: {resp.text[:300]}")

    return resp.json()
