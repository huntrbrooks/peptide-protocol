#!/usr/bin/env python3
"""
Deterministic THE PROTOCOL vial-label compositor.

Rebuilds all target SKUs to a shared layout matching the ideal TB-500 screenshot:
  1) pale header with centered text logo + headroom
  2) accent product-name bar (white title, optically centered)
  3) pale middle with DNA watermark, optional subtitle, dosage box
  4) accent footer with vertically centered disclaimer

Outputs:
  public/labels/color-masters/{slug}.png          → 2000×1200
  public/labels/color-masters-38x15/{slug}.png    → 3040×1200 (peptides; not BAC)
"""

from __future__ import annotations

import math
import shutil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WEB_DIR = ROOT / "public/labels/color-masters"
PRINT_DIR = ROOT / "public/labels/color-masters-38x15"
WORK_DIR = WEB_DIR / "_work/logo-crop-fix"
BACKUP_WEB = WEB_DIR / "_backup-logo-crop-fix"
BACKUP_PRINT = PRINT_DIR / "_backup-logo-crop-fix"

WEB_SIZE = (2000, 1200)
PRINT_SIZE = (3040, 1200)

# Layout fractions matched to ideal TB-500 screenshot (~1024×404)
HEADER_FRAC = 0.270
NAME_FRAC = 0.200
FOOTER_FRAC = 0.160  # slightly tighter than raw crop (UI chrome) for usable middle
# middle = remainder

FOOTER_TEXT = "PURITY 99% • FOR RESEARCH USE ONLY"

FONT_SANS = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_SANS_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_CONDENSED = "/System/Library/Fonts/Supplemental/DIN Condensed Bold.ttf"
FONT_THE = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

SKUS: list[dict] = [
    {
        "slug": "bpc-157-10mg",
        "productName": "BPC-157",
        "synonym": None,
        "strength": "10 MG",
        "accent": (20, 46, 93),
        "pale": (211, 224, 237),
        "print": True,
    },
    {
        "slug": "cjc-1295-no-dac-10mg",
        "productName": "CJC-1295 NO DAC",
        "synonym": "CJC-1295 (without DAC)",
        "strength": "10 MG",
        "accent": (195, 149, 54),
        "pale": (242, 234, 213),
        "print": True,
    },
    {
        "slug": "retatrutide-60mg",
        "productName": "RETATRUTIDE",
        "synonym": None,
        "strength": "60 MG",
        "accent": (158, 31, 34),
        "pale": (237, 209, 213),
        "print": True,
    },
    {
        "slug": "bacteriostatic-water-10ml",
        "productName": "BAC WATER",
        "synonym": None,
        "strength": "10 ML",
        "accent": (16, 94, 119),
        "pale": (250, 252, 253),
        "print": False,
        "footer": "FOR RESEARCH USE ONLY",
    },
    {
        "slug": "ghk-cu-50mg",
        "productName": "GHK-CU",
        "synonym": "Copper Peptide",
        "strength": "50 MG",
        "accent": (7, 40, 82),
        "pale": (210, 229, 242),
        "print": True,
    },
    {
        "slug": "pt-141-10mg",
        "productName": "PT-141",
        "synonym": "Bremelanotide",
        "strength": "10 MG",
        "accent": (180, 14, 28),
        "pale": (244, 215, 219),
        "print": True,
    },
    {
        "slug": "retatrutide-20mg",
        "productName": "RETATRUTIDE",
        "synonym": None,
        "strength": "20 MG",
        "accent": (180, 61, 102),
        "pale": (240, 218, 223),
        "print": True,
    },
    {
        "slug": "tb-500-10mg",
        "productName": "TB-500",
        "synonym": "Thymosin Beta-4",
        "strength": "10 MG",
        "accent": (160, 22, 26),
        "pale": (239, 206, 211),
        "print": True,
    },
    {
        "slug": "ipamorelin-10mg",
        "productName": "IPAMORELIN",
        "synonym": None,
        "strength": "10 MG",
        "accent": (160, 23, 27),
        "pale": (239, 205, 209),
        "print": True,
    },
    {
        "slug": "glow-up-80mg",
        "productName": "GLOW UP",
        "synonym": "KLOW80 • TB 10mg + BPC-157 10mg + GHK 50mg + KPV 10mg",
        "strength": "80 MG",
        "accent": (186, 143, 53),
        "pale": (244, 237, 222),
        "print": True,
    },
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def text_size(draw: ImageDraw.ImageDraw, text: str, fnt: ImageFont.ImageFont) -> tuple[int, int, tuple[int, int, int, int]]:
    bbox = draw.textbbox((0, 0), text, font=fnt)
    return bbox[2] - bbox[0], bbox[3] - bbox[1], bbox


def draw_centered_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    box: tuple[int, int, int, int],
    fnt: ImageFont.ImageFont,
    fill: tuple[int, ...],
    *,
    tracking: int = 0,
    optical_nudge_y: float = 0.0,
) -> None:
    """Vertically + horizontally center text in box using glyph bbox.

    optical_nudge_y: fraction of box height; negative shifts text up (helps all-caps
    read as optically centered in accent bars).
    """
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    nudge = int(round(bh * optical_nudge_y))

    if tracking <= 0:
        tw, th, bbox = text_size(draw, text, fnt)
        x = x0 + (bw - tw) // 2 - bbox[0]
        y = y0 + (bh - th) // 2 - bbox[1] + nudge
        draw.text((x, y), text, font=fnt, fill=fill)
        return

    # Manual tracking
    widths = []
    for ch in text:
        w, _, _ = text_size(draw, ch, fnt)
        widths.append(w)
    total = sum(widths) + tracking * (len(text) - 1)
    _, th, bbox = text_size(draw, text, fnt)
    x = x0 + (bw - total) // 2
    y = y0 + (bh - th) // 2 - bbox[1] + nudge
    for ch, w in zip(text, widths):
        cb = draw.textbbox((0, 0), ch, font=fnt)
        draw.text((x - cb[0], y), ch, font=fnt, fill=fill)
        x += w + tracking


def fit_font(path: str, text: str, max_w: int, max_h: int, start: int) -> ImageFont.FreeTypeFont:
    size = start
    probe = ImageDraw.Draw(Image.new("RGB", (8, 8)))
    while size > 8:
        fnt = font(path, size)
        tw, th, _ = text_size(probe, text, fnt)
        if tw <= max_w and th <= max_h:
            return fnt
        size -= 2
    return font(path, 8)


def render_logo(accent: tuple[int, int, int], target_w: int) -> Image.Image:
    """Render THE / rule / PROTOCOL mark on transparent canvas, scaled to target_w."""
    # Build at high res then scale
    W, H = 1200, 420
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    fill = (*accent, 255)

    prot_fnt = font(FONT_CONDENSED, 220)
    the_fnt = font(FONT_THE, 48)

    prot = "PROTOCOL"
    pw, ph, pb = text_size(d, prot, prot_fnt)
    tracking = 18
    the = "THE"
    the_widths = [text_size(d, ch, the_fnt)[0] for ch in the]
    the_w = sum(the_widths) + tracking * (len(the) - 1)
    _, the_h, the_b = text_size(d, the, the_fnt)

    top = 8
    the_x = (W - the_w) // 2
    the_y = top - the_b[1]
    x = the_x
    for ch, cw in zip(the, the_widths):
        cb = d.textbbox((0, 0), ch, font=the_fnt)
        d.text((x - cb[0], the_y), ch, font=the_fnt, fill=fill)
        x += cw + tracking

    line_y = top + the_h + 14
    line_w = int(pw * 1.0)
    line_x = (W - line_w) // 2
    d.rectangle([line_x, line_y, line_x + line_w, line_y + 4], fill=fill)

    prot_y = line_y + 12 - pb[1]
    prot_x = (W - pw) // 2 - pb[0]
    d.text((prot_x, prot_y), prot, font=prot_fnt, fill=fill)

    # Crop to ink
    arr = np.asarray(im)
    mask = arr[:, :, 3] > 0
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    cropped = im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))

    scale = target_w / cropped.width
    nh = max(1, int(round(cropped.height * scale)))
    nw = max(1, int(round(cropped.width * scale)))
    return cropped.resize((nw, nh), Image.Resampling.LANCZOS)


def blend_rgb(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(int(round(a[i] * (1 - t) + b[i] * t)) for i in range(3))  # type: ignore[return-value]


def draw_dna_watermark(
    base: Image.Image,
    box: tuple[int, int, int, int],
    accent: tuple[int, int, int],
    pale: tuple[int, int, int],
) -> None:
    """Soft diagonal DNA double-helix watermark in the middle band."""
    x0, y0, x1, y1 = box
    w, h = x1 - x0, y1 - y0
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    color = (*blend_rgb(pale, accent, 0.22), 90)

    # Parametric double helix across width
    amp = h * 0.28
    mid = h * 0.55
    steps = max(w, 200)
    r = max(2, int(h * 0.018))
    pts_a: list[tuple[float, float]] = []
    pts_b: list[tuple[float, float]] = []
    for i in range(steps + 1):
        t = i / steps
        x = t * (w + 40) - 20
        phase = t * math.pi * 5.2
        ya = mid + math.sin(phase) * amp
        yb = mid + math.sin(phase + math.pi) * amp
        pts_a.append((x, ya))
        pts_b.append((x, yb))

    def stroke(points: list[tuple[float, float]]) -> None:
        for i in range(len(points) - 1):
            d.line([points[i], points[i + 1]], fill=color, width=max(2, r))

    stroke(pts_a)
    stroke(pts_b)

    # Rungs
    for i in range(0, steps, max(1, steps // 28)):
        d.line([pts_a[i], pts_b[i]], fill=color, width=max(1, r - 1))

    base.paste(Image.alpha_composite(Image.new("RGBA", (w, h), (0, 0, 0, 0)), overlay), (x0, y0), overlay)


def compose_label(sku: dict, size: tuple[int, int]) -> Image.Image:
    W, H = size
    accent: tuple[int, int, int] = sku["accent"]
    pale: tuple[int, int, int] = sku["pale"]
    footer_text = sku.get("footer", FOOTER_TEXT)

    header_h = int(round(H * HEADER_FRAC))
    name_h = int(round(H * NAME_FRAC))
    footer_h = int(round(H * FOOTER_FRAC))
    name_y = header_h
    mid_y = name_y + name_h
    footer_y = H - footer_h
    mid_h = footer_y - mid_y

    im = Image.new("RGB", (W, H), pale)
    d = ImageDraw.Draw(im)

    # Accent bars
    d.rectangle([0, name_y, W, name_y + name_h], fill=accent)
    d.rectangle([0, footer_y, W, H], fill=accent)

    # DNA watermark in middle
    draw_dna_watermark(im, (0, mid_y, W, footer_y), accent, pale)
    d = ImageDraw.Draw(im)

    # Logo with generous top headroom (~4% of canvas)
    top_pad = int(round(H * 0.045))
    bottom_pad = int(round(H * 0.030))
    logo_max_h = header_h - top_pad - bottom_pad
    logo_target_w = int(round(min(W * 0.46, logo_max_h * (1024 / 407) * 1.05)))
    logo = render_logo(accent, logo_target_w)
    if logo.height > logo_max_h:
        scale = logo_max_h / logo.height
        logo = logo.resize(
            (max(1, int(logo.width * scale)), logo_max_h),
            Image.Resampling.LANCZOS,
        )
    lx = (W - logo.width) // 2
    # Prefer top padding; if leftover, split remainder below
    ly = top_pad + max(0, (logo_max_h - logo.height) // 2)
    im.paste(logo, (lx, ly), logo)

    # Product name — perfectly centered in accent bar
    name_pad_x = int(W * 0.04)
    name_fnt = fit_font(
        FONT_SANS_BOLD,
        sku["productName"],
        W - 2 * name_pad_x,
        int(name_h * 0.62),
        start=int(H * 0.11),
    )
    draw_centered_text(
        d,
        sku["productName"],
        (0, name_y, W, name_y + name_h),
        name_fnt,
        (255, 255, 255),
        optical_nudge_y=-0.04,
    )

    # Middle: synonym + dosage box
    syn = sku.get("synonym")
    box_h = int(round(H * 0.105))
    box_w = int(round(min(W * 0.30, H * 0.42)))
    stroke = max(2, int(round(H * 0.007)))

    if syn:
        syn_fnt = fit_font(
            FONT_SANS_BOLD if len(syn) < 40 else FONT_SANS,
            syn,
            int(W * 0.92),
            int(mid_h * 0.18),
            start=int(H * (0.038 if len(syn) < 40 else 0.028)),
        )
        syn_box_h = int(mid_h * 0.28)
        draw_centered_text(
            d,
            syn,
            (0, mid_y, W, mid_y + syn_box_h),
            syn_fnt,
            accent,
        )
        # Dosage box below synonym
        box_y = mid_y + int(mid_h * 0.42)
    else:
        # Center dosage box in middle band
        box_y = mid_y + (mid_h - box_h) // 2

    # Keep box clear of footer
    box_y = min(box_y, footer_y - box_h - int(H * 0.02))
    box_x = (W - box_w) // 2
    # White fill + accent stroke, slight radius
    radius = max(2, int(H * 0.008))
    d.rounded_rectangle(
        [box_x, box_y, box_x + box_w, box_y + box_h],
        radius=radius,
        fill=(255, 255, 255),
        outline=accent,
        width=stroke,
    )
    str_fnt = fit_font(
        FONT_SANS_BOLD,
        sku["strength"],
        int(box_w * 0.85),
        int(box_h * 0.62),
        start=int(H * 0.07),
    )
    draw_centered_text(
        d,
        sku["strength"],
        (box_x, box_y, box_x + box_w, box_y + box_h),
        str_fnt,
        accent,
    )

    # Footer — perfectly centered
    foot_fnt = fit_font(
        FONT_SANS_BOLD,
        footer_text,
        int(W * 0.92),
        int(footer_h * 0.48),
        start=int(H * 0.038),
    )
    draw_centered_text(
        d,
        footer_text,
        (0, footer_y, W, H),
        foot_fnt,
        (255, 255, 255),
        tracking=1,
        optical_nudge_y=-0.06,
    )

    return im


def backup_existing() -> None:
    """Back up pre-fix masters once (do not clobber first backup on re-runs)."""
    BACKUP_WEB.mkdir(parents=True, exist_ok=True)
    BACKUP_PRINT.mkdir(parents=True, exist_ok=True)
    for sku in SKUS:
        slug = sku["slug"]
        src = WEB_DIR / f"{slug}.png"
        dst = BACKUP_WEB / f"{slug}.png"
        if src.exists() and not dst.exists():
            shutil.copy2(src, dst)
        if sku["print"]:
            src_p = PRINT_DIR / f"{slug}.png"
            dst_p = BACKUP_PRINT / f"{slug}.png"
            if src_p.exists() and not dst_p.exists():
                shutil.copy2(src_p, dst_p)


def main() -> None:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    backup_existing()
    written: list[str] = []

    for sku in SKUS:
        web = compose_label(sku, WEB_SIZE)
        web_path = WEB_DIR / f"{sku['slug']}.png"
        web.save(web_path, "PNG", optimize=True)
        written.append(str(web_path.relative_to(ROOT)))

        # QA crops
        qa = WORK_DIR / sku["slug"]
        qa.mkdir(parents=True, exist_ok=True)
        web.crop((0, 0, WEB_SIZE[0], int(WEB_SIZE[1] * HEADER_FRAC))).save(qa / "header.png")
        web.crop((0, WEB_SIZE[1] - int(WEB_SIZE[1] * FOOTER_FRAC), WEB_SIZE[0], WEB_SIZE[1])).save(
            qa / "footer.png"
        )
        web.save(qa / "full-web.png")

        if sku["print"]:
            pr = compose_label(sku, PRINT_SIZE)
            pr_path = PRINT_DIR / f"{sku['slug']}.png"
            pr.save(pr_path, "PNG", optimize=True)
            written.append(str(pr_path.relative_to(ROOT)))

    print(f"Wrote {len(written)} files")
    for p in written:
        print(" ", p)
    print("Backups:", BACKUP_WEB, BACKUP_PRINT)


if __name__ == "__main__":
    main()
