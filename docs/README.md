# Image → ASCII Art Converter (Python, Computer Vision)

## One-liner

A Python tool that ingests an image and outputs a stylized ASCII art rendering, using basic computer vision to preserve structure, contrast, and detail.

## Problem

ASCII art is fun—but most “naive” converters just map brightness to characters and ignore edges, contrast, and aspect ratio. The result looks muddy. This project aims for readable, high-fidelity ASCII with a simple, reproducible pipeline.

## Inputs & Outputs

* **Input:** PNG/JPG image path or URL.
* **Output:**

  * Plain-text ASCII (monochrome).
  * Optional colored ANSI ASCII in the terminal.
  * Optional image render (ASCII drawn onto a canvas, export as PNG).

## Core Pipeline

1. **Preprocess:** Load → convert to linear luminance → optional denoise → auto-contrast.
2. **Rescale:** Resize with respect to character aspect ratio (e.g., pixels: 1×2 per char cell).
3. **Structure cues:** Edge map (e.g., Canny) to boost edges; optional saliency/face box to keep critical details.
4. **Tone mapping:** Quantize to a **character ramp** (e.g., “ .:-=+\*#%@”) by local average luminance; blend with edge weight.
5. **Layout:** Place characters on a fixed grid; line wrap.
6. **Export:** Text/ANSI/PNG.

## Key Features

* Character sets: default ramp + custom sets (dense, sparse, block-drawing).
* Contrast/edge weighting knob (0–1).
* Adaptive scaling to target width/height or terminal size.
* Invert/threshold modes for high-contrast posters.
* Batch mode.


## Tech Stack

* **Python 3.11+**
* **OpenCV** (image I/O, filtering, edges)
* **NumPy** (array ops)
* **Pillow** (optional export)
* **Typer/argparse** (CLI), **FastAPI** (optional API), **Jinja2** (optional web)

## Configuration (example)
All parameters are defined as **global variables** at the top of the script for easy modification.

```python
# Output dimensions (set one, auto-preserve aspect ratio)
OUTPUT_WIDTH = 120        # int or None
OUTPUT_HEIGHT = None      # int or None

# Character set options
CHARSET = "dense"         # "dense", "sparse", "blocks", or path to custom set file

# Edge enhancement weight
EDGE_WEIGHT = 0.3         # float between 0.0 and 1.0

# Color mode
COLOR_MODE = "ansi"       # "none", "ansi", or "truecolor"

# Output format
OUTPUT_FORMAT = "txt"     # "txt", "png", or "ansi"

# Image processing options
INVERT = False            # True to invert brightness mapping
CONTRAST = "auto"         # "auto" or float between 0 and 2
DENOISE_LEVEL = 1         # int between 0 and 3
```

These variables can be adjusted before running the script to control how the ASCII art is generated.

## Example CLI

```
asciiart input.jpg --width 120 --edge-weight 0.3 --charset dense --color ansi --output txt
```

If you want, I can turn this into a skeleton repo layout (folders, starter code, and a README) next.
