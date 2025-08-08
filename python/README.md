# ASCII Art Converter - Python Version

A Python implementation for converting images and videos to ASCII art with customizable parameters.

## Features

- **Image to ASCII**: Convert any image format (JPG, PNG, BMP, etc.) to ASCII art
- **Video to ASCII**: Convert videos (MP4, AVI, MOV, etc.) to ASCII animation frames
- **Customizable Parameters**: 
  - Detail level (resolution)
  - Character set
  - Sensitivity adjustment
  - Output dimensions
  - Frame rate (for videos)

## Installation

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### As a Python Module

```python
from main import ascii_convert

# Convert an image
ascii_art = ascii_convert(
    input_path="image.jpg",
    detail_level=1.5,
    charset="@%#*+=-:. ",
    output_path="output.txt"
)

# Convert a video
ascii_frames = ascii_convert(
    input_path="video.mp4",
    detail_level=1.0,
    charset="@%#*+=-:. ",
    frame_rate=15.0,
    output_path="video_ascii.txt"
)
```

### Command Line Interface

```bash
# Convert an image
python main.py image.jpg -d 1.5 -o output.txt

# Convert a video with custom parameters
python main.py video.mp4 -d 1.0 -f 15.0 -c "@#*+=-:. " -o video_ascii.txt

# View help for all options
python main.py --help
```

## Parameters

- **input_path**: Path to input image or video file
- **detail_level**: Detail level (0.1-5.0) - higher values = more detail/resolution
- **charset**: Character set for ASCII conversion (ordered from darkest to lightest)
- **output_path**: Optional path to save output file
- **max_width**: Maximum ASCII output width (default: 120)
- **max_height**: Maximum ASCII output height (default: 60)
- **sensitivity**: Sensitivity factor for luminance adjustment (default: 1.0)
- **frame_rate**: Frame rate for video processing (default: 10.0 FPS)

## Examples

### Basic Image Conversion
```python
ascii_art = ascii_convert("photo.jpg")
print(ascii_art)
```

### High Detail Image
```python
ascii_art = ascii_convert(
    "photo.jpg", 
    detail_level=3.0,
    max_width=200,
    max_height=100
)
```

### Custom Character Set
```python
ascii_art = ascii_convert(
    "photo.jpg",
    charset="█▉▊▋▌▍▎▏ "
)
```

### Video Processing
```python
frames = ascii_convert(
    "video.mp4",
    detail_level=1.2,
    frame_rate=20.0,
    output_path="ascii_video.txt"
)
```

## Supported Formats

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- TIFF (.tiff)
- WebP (.webp)

### Videos
- MP4 (.mp4)
- AVI (.avi)
- MOV (.mov)
- MKV (.mkv)
- WMV (.wmv)
- FLV (.flv)
- WebM (.webm)

## Output Formats

### Images
Returns a string containing the ASCII art representation.

### Videos
Returns a list of strings, where each string represents one frame of ASCII art.

When saving videos to file:
- `.txt` extension: All frames in one file with frame separators
- Other extensions: Individual frame files (e.g., `output_frame_0001.txt`)
