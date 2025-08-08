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
            max_width=60,
            max_height=30
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
            max_width=80,
            max_height=40
        )
        print("Generated high-detail ASCII art (saved to file)\n")
        with open("high_detail_demo.txt", "w") as f:
            f.write(ascii_art)
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Custom character set
    print("3. Custom character set (Unicode blocks):")
    try:
        ascii_art = ascii_convert(
            input_path="../src/assets/images/test.jpg",
            detail_level=1.0,
            charset="█▉▊▋▌▍▎▏ ",
            max_width=50,
            max_height=25
        )
        print(ascii_art[:400] + "...\n")
    except Exception as e:
        print(f"Error: {e}\n")
    
    # Different sensitivity
    print("4. High sensitivity conversion:")
    try:
        ascii_art = ascii_convert(
            input_path="../src/assets/images/test.jpg",
            detail_level=1.0,
            sensitivity=2.0,
            max_width=50,
            max_height=25
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
    max_width=200,
    max_height=100
)

# Custom character set
ascii_art = ascii_convert(
    "image.jpg",
    charset="@#*+=-:. "
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
""")

if __name__ == "__main__":
    demo_function_usage()
    demo_image_conversion()
