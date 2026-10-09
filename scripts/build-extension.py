from pathlib import Path
import json, zipfile, hashlib, re
root = Path(__file__).resolve().parents[1]
source = root / "extension"
manifest = json.loads((source / "manifest.json").read_text(encoding="utf-8"))
files = [source / "manifest.json"] + [p for base in ["src", "icons"] for p in (source / base).rglob("*") if p.is_file()]
allowed = {".js", ".css", ".html", ".png", ".jpg", ".svg", ".woff", ".woff2", ".json"}
if any(p.suffix not in allowed for p in files): raise RuntimeError("Unexpected extension artifact")
output = root / "public/fairy-house-extension-v2.zip"
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for file in sorted(files):
        info = zipfile.ZipInfo(file.relative_to(source).as_posix(), date_time=(2026,10,10,0,0,0))
        info.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(info, file.read_bytes())
with zipfile.ZipFile(output) as archive:
    for file in files:
        assert archive.read(file.relative_to(source).as_posix()) == file.read_bytes()
metadata = {"version": manifest["version"], "sha256": hashlib.sha256(output.read_bytes()).hexdigest(), "files": len(files)}
(root / "public/extension-release.json").write_text(json.dumps(metadata,indent=2)+"\n")
print(json.dumps(metadata))
