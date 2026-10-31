"""Optional: python3 -m pip install Pillow; python3 scripts/optimize-images.py.
Originals are retained; generated webp files are reproducible.
"""
from pathlib import Path
from PIL import Image, ImageOps
import json
root=Path(__file__).resolve().parent.parent
out=root/'assets/images';out.mkdir(exist_ok=True)
manifest={};before=after=0
for f in sorted(list(root.glob('*.jpg'))+list(root.glob('*.png'))):
    im=ImageOps.exif_transpose(Image.open(f)).convert('RGB');before+=f.stat().st_size
    sizes=[]
    for size in [480,960,1440]:
        target=out/f'{f.stem}-{size}.webp';copy=im.copy();copy.thumbnail((size,size),Image.Resampling.LANCZOS)
        copy.save(target,'WEBP',quality=82,method=6)
        sizes.append({'src':str(target.relative_to(root)),'width':copy.width,'height':copy.height});after+=target.stat().st_size
    manifest[f.name]=sizes
(root/'assets/image-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(f'{len(manifest)} images; originals {before/1e6:.1f} MB; all three responsive versions {after/1e6:.1f} MB')
