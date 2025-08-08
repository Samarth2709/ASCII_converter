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
    
    def __init__(self, charset: str = '@%#*+=-:. '):
        """
        Initialize the ASCII converter.
        
        Args:
            charset (str): Character set for ASCII conversion, ordered from darkest to lightest
        """
        self.charset = charset
        self.sensitivity_factor = 1.0
    
    def set_charset(self, charset: str) -> None:
        """Set the character set for conversion."""
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
    detail_level: float = 1.0,
    max_width: int = 120,
    max_height: int = 60
) -> Tuple[int, int]:
    """
    Calculate optimal ASCII dimensions based on image aspect ratio and detail level.
    
    Args:
        image_width: Original image width
        image_height: Original image height
        detail_level: Detail factor (higher = more characters)
        max_width: Maximum ASCII width
        max_height: Maximum ASCII height
        
    Returns:
        Tuple[int, int]: (cols, rows) for ASCII output
    """
    aspect_ratio = image_width / image_height
    
    # Scale dimensions based on detail level
    base_cols = int(max_width * detail_level)
    base_rows = int(max_height * detail_level)
    
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
    charset: str = '@%#*+=-:. ',
    output_path: Optional[str] = None,
    max_width: int = 120,
    max_height: int = 60,
    sensitivity: float = 1.0,
    frame_rate: float = 10.0
) -> Union[str, List[str]]:
    """
    Main function to convert images or videos to ASCII art.
    
    Args:
        input_path (str): Path to input image or video file
        detail_level (float): Level of detail (0.1 to 5.0, higher = more detail)
        charset (str): Character set for ASCII conversion
        output_path (Optional[str]): Path to save output (optional)
        max_width (int): Maximum width for ASCII output
        max_height (int): Maximum height for ASCII output
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
    
    # Initialize converter
    converter = ASCIIConverter(charset)
    converter.set_sensitivity(sensitivity)
    
    # Check if input is image or video
    file_extension = os.path.splitext(input_path)[1].lower()
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
    video_extensions = {'.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm'}
    
    if file_extension in image_extensions:
        return _convert_image(
            input_path, converter, detail_level, max_width, max_height, output_path
        )
    elif file_extension in video_extensions:
        return _convert_video(
            input_path, converter, detail_level, max_width, max_height, 
            output_path, frame_rate
        )
    else:
        raise ValueError(f"Unsupported file format: {file_extension}")


def _convert_image(
    input_path: str,
    converter: ASCIIConverter,
    detail_level: float,
    max_width: int,
    max_height: int,
    output_path: Optional[str]
) -> str:
    """Convert a single image to ASCII art."""
    # Load image
    image = cv2.imread(input_path)
    if image is None:
        raise ValueError(f"Could not load image: {input_path}")
    
    height, width = image.shape[:2]
    cols, rows = calculate_optimal_dimensions(
        width, height, detail_level, max_width, max_height
    )
    
    # Convert to ASCII
    ascii_art = converter.image_to_ascii(image, cols, rows)
    
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
    max_width: int,
    max_height: int,
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
    cols, rows = calculate_optimal_dimensions(
        width, height, detail_level, max_width, max_height
    )
    
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


def main():
    """Command line interface for ASCII converter."""
    parser = argparse.ArgumentParser(description='Convert images and videos to ASCII art')
    parser.add_argument('input', help='Input image or video file path')
    parser.add_argument('-d', '--detail', type=float, default=1.0,
                       help='Detail level (0.1-5.0, default: 1.0)')
    parser.add_argument('-c', '--charset', default='@%#*+=-:. ',
                       help='Character set for ASCII conversion')
    parser.add_argument('-o', '--output', help='Output file path')
    parser.add_argument('-w', '--width', type=int, default=120,
                       help='Maximum ASCII width (default: 120)')
    parser.add_argument('--height', type=int, default=60,
                       help='Maximum ASCII height (default: 60)')
    parser.add_argument('-s', '--sensitivity', type=float, default=1.0,
                       help='Sensitivity factor (default: 1.0)')
    parser.add_argument('-f', '--framerate', type=float, default=10.0,
                       help='Frame rate for video processing (default: 10.0)')
    
    args = parser.parse_args()
    
    try:
        result = ascii_convert(
            input_path=args.input,
            detail_level=args.detail,
            charset=args.charset,
            output_path=args.output,
            max_width=args.width,
            max_height=args.height,
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
