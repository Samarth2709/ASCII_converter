"""
ASCII Art Converter - Python Implementation
Converts images and videos to ASCII art with customizable parameters.
"""

import cv2
import numpy as np
from PIL import Image
import io
import os
from typing import Union, Tuple, Optional, List
import argparse


class ASCIIConverter:
    """
    A class to convert images and videos to ASCII art.
    """
    
    # Predefined character sets
    CHARSET_PRESETS = {
        'standard': '@%#*+=-:. ',
        'block': '█▉▊▋▌▍▎▏ ',
        'simple': '##++--.. ',
        'detailed': '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ',
        'minimal': '@*. ',
        'dots': '●◐◑◒◓◔◕○ '
    }
    
    def __init__(self, charset_preset: str = 'standard'):
        """
        Initialize the ASCII converter.
        
        Args:
            charset_preset (str): Preset name for character set
        """
        self.set_charset_preset(charset_preset)
        self.sensitivity_factor = 1.0
    
    def set_charset_preset(self, preset: str) -> None:
        """Set the character set using a preset name."""
        if preset in self.CHARSET_PRESETS:
            self.charset = self.CHARSET_PRESETS[preset]
        else:
            available = ', '.join(self.CHARSET_PRESETS.keys())
            raise ValueError(f"Unknown charset preset '{preset}'. Available presets: {available}")
    
    def set_charset(self, charset: str) -> None:
        """Set the character set for conversion (direct)."""
        self.charset = charset
    
    def set_sensitivity(self, factor: float) -> None:
        """Set the sensitivity factor for luminance adjustment."""
        self.sensitivity_factor = factor
    
    def calculate_luminance(self, r: int, g: int, b: int) -> float:
        """
        Calculate luminance from RGB values using standard sRGB formula.
        
        Args:
            r, g, b: RGB values (0-255)
            
        Returns:
            float: Luminance value (0-1)
        """
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    
    def get_char_for_luminance(self, luminance: float) -> str:
        """
        Convert luminance value to ASCII character.
        
        Args:
            luminance (float): Luminance value (0-1)
            
        Returns:
            str: ASCII character
        """
        # Apply sensitivity adjustment
        adjusted_lum = max(0, min(1, (luminance - 0.5) * self.sensitivity_factor + 0.5))
        # Map dark (0) -> densest char at start of charset, bright (1) -> lightest char at end
        index = int(adjusted_lum * (len(self.charset) - 1))
        return self.charset[index] if index < len(self.charset) else ' '
    
    def resize_image(self, image: np.ndarray, cols: int, rows: int) -> np.ndarray:
        """
        Resize image to specified dimensions.
        
        Args:
            image: Input image as numpy array
            cols: Target width
            rows: Target height
            
        Returns:
            np.ndarray: Resized image
        """
        return cv2.resize(image, (cols, rows), interpolation=cv2.INTER_AREA)
    
    def image_to_ascii(self, image: np.ndarray, cols: int, rows: int) -> str:
        """
        Convert image to ASCII string.
        
        Args:
            image: Input image as numpy array (BGR format)
            cols: Number of columns in ASCII output
            rows: Number of rows in ASCII output
            
        Returns:
            str: ASCII representation
        """
        # Resize image to target dimensions
        resized = self.resize_image(image, cols, rows)
        
        # Convert BGR to RGB
        rgb_image = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        
        ascii_str = ''
        for y in range(rows):
            row_str = ''
            for x in range(cols):
                r, g, b = rgb_image[y, x]
                luminance = self.calculate_luminance(r, g, b)
                char = self.get_char_for_luminance(luminance)
                row_str += char
            ascii_str += row_str + '\n'
        
        return ascii_str


def calculate_optimal_dimensions(
    image_width: int, 
    image_height: int, 
    detail_level: float = 1.0
) -> Tuple[int, int]:
    """
    Calculate optimal ASCII dimensions based on image aspect ratio and detail level.
    
    Args:
        image_width: Original image width
        image_height: Original image height
        detail_level: Detail factor (higher = more characters)
        
    Returns:
        Tuple[int, int]: (cols, rows) for ASCII output
    """
    aspect_ratio = image_width / image_height
    
    # Base dimensions for standard output
    base_cols = int(120 * detail_level)
    base_rows = int(60 * detail_level)
    
    # Maintain aspect ratio
    if base_cols / aspect_ratio <= base_rows:
        cols = base_cols
        rows = int(base_cols / aspect_ratio)
    else:
        rows = base_rows
        cols = int(base_rows * aspect_ratio)
    
    # Ensure minimum dimensions
    cols = max(20, cols)
    rows = max(15, rows)
    
    return cols, rows


def ascii_convert(
    input_path: str,
    detail_level: float = 1.0,
    charset_preset: str = 'standard',
    output_format: str = 'text',
    output_path: Optional[str] = None,
    sensitivity: float = 1.0,
    frame_rate: float = 10.0
) -> Union[str, List[str]]:
    """
    Main function to convert images or videos to ASCII art.
    
    Args:
        input_path (str): Path to input image or video file
        detail_level (float): Level of detail (0.1 to 5.0, higher = more detail)
        charset_preset (str): Character set preset ('standard', 'block', 'simple', 'detailed', 'minimal', 'dots')
        output_format (str): Output format ('text' or 'image')
        output_path (Optional[str]): Path to save output (optional)
        sensitivity (float): Sensitivity factor for luminance adjustment
        frame_rate (float): Frame rate for video processing (frames per second)
        
    Returns:
        Union[str, List[str]]: ASCII art string for images, list of ASCII frames for videos
        
    Raises:
        FileNotFoundError: If input file doesn't exist
        ValueError: If file format is not supported
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")
    
    # Validate output format
    if output_format not in ['text', 'image']:
        raise ValueError(f"Invalid output format '{output_format}'. Must be 'text' or 'image'.")
    
    # Initialize converter
    converter = ASCIIConverter(charset_preset)
    converter.set_sensitivity(sensitivity)
    
    # Check if input is image or video
    file_extension = os.path.splitext(input_path)[1].lower()
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'}
    
    if file_extension in image_extensions:
        return _convert_image(
            input_path, converter, detail_level, output_format, output_path
        )
    elif file_extension in video_extensions:
        return _convert_video(
            input_path, converter, detail_level, output_format, output_path, frame_rate
        )
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")


def _convert_image(
    input_path: str,
    converter: ASCIIConverter,
    detail_level: float,
    output_format: str,
    output_path: Optional[str]
) -> str:
    """Convert a single image to ASCII art."""
    # Load image
    image = cv2.imread(input_path)
    if image is None:
        raise ValueError(f"Could not load image: {input_path}")
    
    height, width = image.shape[:2]
    cols, rows = calculate_optimal_dimensions(width, height, detail_level)
    
    # Convert to ASCII
    ascii_art = converter.image_to_ascii(image, cols, rows)
    
    # Handle output format
    if output_format == 'image':
        return _create_ascii_image(ascii_art, output_path)
    else:  # text format
        # Save output if path provided
        if output_path:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(ascii_art)
            print(f"ASCII art saved to: {output_path}")
        
        return ascii_art


def _convert_video(
    input_path: str,
    converter: ASCIIConverter,
    detail_level: float,
    output_format: str,
    output_path: Optional[str],
    frame_rate: float
) -> List[str]:
    """Convert a video to ASCII art frames."""
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {input_path}")
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Calculate dimensions
    cols, rows = calculate_optimal_dimensions(width, height, detail_level)
    
    # Calculate frame skip based on desired frame rate
    frame_skip = max(1, int(fps / frame_rate))
    
    ascii_frames = []
    frame_count = 0
    processed_frames = 0
    
    print(f"Processing video: {total_frames} frames at {fps} FPS")
    print(f"Output: {cols}x{rows} characters, {frame_rate} FPS")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Skip frames to achieve desired frame rate
        if frame_count % frame_skip == 0:
            ascii_frame = converter.image_to_ascii(frame, cols, rows)
            ascii_frames.append(ascii_frame)
            processed_frames += 1
            
            if processed_frames % 10 == 0:
                print(f"Processed {processed_frames} frames...")
        
        frame_count += 1
    
    cap.release()
    
    print(f"Video conversion complete: {len(ascii_frames)} ASCII frames")
    
    # Save output if path provided
    if output_path:
        if output_path.endswith('.txt'):
            # Save as single text file with frame separators
            with open(output_path, 'w', encoding='utf-8') as f:
                for i, frame in enumerate(ascii_frames):
                    f.write(f"=== FRAME {i+1} ===\n")
                    f.write(frame)
                    f.write("\n")
        else:
            # Save as individual frame files
            base_name = os.path.splitext(output_path)[0]
            for i, frame in enumerate(ascii_frames):
                frame_path = f"{base_name}_frame_{i+1:04d}.txt"
                with open(frame_path, 'w', encoding='utf-8') as f:
                    f.write(frame)
        
        print(f"ASCII video saved to: {output_path}")
    
    return ascii_frames


def _create_ascii_image(ascii_text: str, output_path: Optional[str] = None) -> str:
    """
    Create an image from ASCII text.
    
    Args:
        ascii_text (str): The ASCII art text
        output_path (Optional[str]): Path to save the image
        
    Returns:
        str: Path to the created image or the ASCII text if no path provided
    """
    from PIL import Image, ImageDraw, ImageFont
    import io
    
    lines = ascii_text.strip().split('\n')
    if not lines:
        return ascii_text
    
    # Use a monospace font
    try:
        # Try to use a system monospace font
        font_size = 10
        font = ImageFont.truetype("/System/Library/Fonts/Monaco.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("Courier New", font_size)
        except:
            font = ImageFont.load_default()
    
    # Calculate image dimensions
    max_width = max(len(line) for line in lines) if lines else 1
    char_width = font.getbbox('M')[2] - font.getbbox('M')[0]  # Width of 'M'
    char_height = font.getbbox('M')[3] - font.getbbox('M')[1]  # Height of 'M'
    
    img_width = max_width * char_width + 20  # Add padding
    img_height = len(lines) * char_height + 20  # Add padding
    
    # Create image
    img = Image.new('RGB', (img_width, img_height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw text
    y = 10
    for line in lines:
        draw.text((10, y), line, fill='black', font=font)
        y += char_height
    
    # Save or return
    if output_path:
        if not output_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            output_path += '.png'
        img.save(output_path)
        print(f"ASCII image saved to: {output_path}")
        return output_path
    else:
        # Save to temporary location and return path
        temp_path = "ascii_output.png"
        img.save(temp_path)
        print(f"ASCII image created: {temp_path}")
        return temp_path


def main():
    """Command line interface for ASCII converter."""
    parser = argparse.ArgumentParser(description='Convert images and videos to ASCII art')
    parser.add_argument('input', help='Input image or video file path')
    parser.add_argument('-d', '--detail', type=float, default=1.0,
                       help='Detail level (0.1-5.0, default: 1.0)')
    parser.add_argument('-c', '--charset', default='standard',
                       help='Character set preset (standard, block, simple, detailed, minimal, dots)')
    parser.add_argument('-o', '--output', help='Output file path')
    parser.add_argument('--format', choices=['text', 'image'], default='text',
                       help='Output format: text or image (default: text)')
    parser.add_argument('-s', '--sensitivity', type=float, default=1.0,
                       help='Sensitivity factor (default: 1.0)')
    parser.add_argument('-f', '--framerate', type=float, default=10.0,
                       help='Frame rate for video processing (default: 10.0)')
    
    args = parser.parse_args()
    
    try:
        result = ascii_convert(
            input_path=args.input,
            detail_level=args.detail,
            charset_preset=args.charset,
            output_format=args.format,
            output_path=args.output,
            sensitivity=args.sensitivity,
            frame_rate=args.framerate
        )
        
        # Print result if it's an image (string) and no output file specified
        if isinstance(result, str) and not args.output:
            print(result)
            
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
