#!/usr/bin/env python3
"""
Demo script showing different ways to use the ASCII converter.
"""

from main import ascii_convert

def demo_image_conversion():
    """Demonstrate image conversion with different parameters."""
    print("=== Image ASCII Conversion Demo ===\n")
    
    # Basic conversion
    print("1. Basic conversion:")
    try:
        ascii_art = ascii_convert(
            input_path="../src/assets/images/test.jpg",
            detail_level=0.8,
            charset_preset='standard',
            output_format='text'
        )
        print(ascii_art[:500] + "...\n")  # Show first 500 characters
    except Exception as e:
        print(f"Error: {e}\n")
    
    # High detail conversion
    print("2. High detail conversion:")
    try:
        ascii_art = ascii_convert(
            input_path="../src/assets/images/test.jpg",
            detail_level=2.0,
            charset_preset='standard',
            output_format='text',
            output_path="high_detail_demo.txt"
        )
        print("Generated high-detail ASCII art (saved to file)\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Block character set
    print("3. Block character set:")
    try:
        ascii_art = ascii_convert(
            input_path="../src/assets/images/test.jpg",
            detail_level=1.0,
            charset_preset='block',
            output_format='text'
        )
        print(ascii_art[:400] + "...\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Image output format
    print("4. Image output format:")
    try:
        result_path = ascii_convert(
            input_path="../src/assets/images/test.jpg",
            detail_level=1.0,
            charset_preset='detailed',
            output_format='image',
            output_path="demo_ascii_image.png"
        )
        print(f"ASCII image created: {result_path}\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # High sensitivity conversion
    print("5. High sensitivity conversion:")
    try:
        ascii_art = ascii_convert(
            input_path="../src/assets/images/test.jpg",
            detail_level=1.0,
            charset_preset='minimal',
            output_format='text',
            sensitivity=2.0
        )
        print(ascii_art[:400] + "...\n")
    except Exception as e:
        print(f"Error: {e}\n")

def demo_function_usage():
    """Show how to use the main conversion function."""
    print("=== Function Usage Examples ===\n")
    
    print("Example function calls:")
    print("""
# Basic image conversion
ascii_art = ascii_convert("image.jpg")

# High detail image
ascii_art = ascii_convert(
    "image.jpg", 
    detail_level=3.0,
    charset_preset='detailed'
)

# Block character set
ascii_art = ascii_convert(
    "image.jpg",
    charset_preset="block"
)

# Create ASCII image
image_path = ascii_convert(
    "image.jpg",
    output_format="image",
    output_path="ascii_art.png"
)

# Video conversion
frames = ascii_convert(
    "video.mp4",
    detail_level=1.2,
    frame_rate=15.0,
    output_path="ascii_video.txt"
)

# Save to file
ascii_art = ascii_convert(
    "image.jpg",
    output_path="output.txt"
)

# Available charset presets:
# 'standard', 'block', 'simple', 'detailed', 'minimal', 'dots'
""")

if __name__ == "__main__":
    demo_function_usage()
    demo_image_conversion()
