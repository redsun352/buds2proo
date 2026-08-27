from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
ICON_PATHS = [
    PROJECT_ROOT / "assets/images/icon.png",
    PROJECT_ROOT / "assets/images/splash-icon.png",
    PROJECT_ROOT / "assets/images/favicon.png",
    PROJECT_ROOT / "assets/images/android-icon-foreground.png",
]
TARGET_SIZE = (512, 512)


def optimize_icon(path: Path) -> None:
    with Image.open(path) as image:
        normalized = image.convert("RGB")
        scaled = normalized.resize(TARGET_SIZE, Image.Resampling.LANCZOS)
        scaled.save(path, format="PNG", optimize=True, compress_level=9)


for icon_path in ICON_PATHS:
    optimize_icon(icon_path)
    print(f"optimized {icon_path.relative_to(PROJECT_ROOT)}")
