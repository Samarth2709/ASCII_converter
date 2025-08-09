"""
FastAPI ASCII Art Converter
Web API for converting images and videos to ASCII art.
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Form, Response
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import tempfile
import os
import io
import shutil
from pathlib import Path

# Import our existing ASCII converter
from main import ascii_convert, ASCIIConverter

app = FastAPI(
    title="ASCII Art Converter API",
    description="Convert images and videos to ASCII art with customizable parameters",
    version="1.0.0"
)

# Add CORS middleware to allow web frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class ConversionRequest(BaseModel):
    detail_level: float = 1.0
    charset_preset: str = "standard"
    output_format: str = "text"
    sensitivity: float = 1.0
    frame_rate: float = 10.0

class ConversionResponse(BaseModel):
    success: bool
    message: str
    ascii_art: Optional[str] = None
    image_url: Optional[str] = None
    frame_count: Optional[int] = None

class HealthResponse(BaseModel):
    status: str
    version: str

class PresetsResponse(BaseModel):
    presets: dict
    description: str

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return HealthResponse(
        status="ASCII Art Converter API is running!",
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check"""
    return HealthResponse(
        status="healthy",
        version="1.0.0"
    )

@app.get("/presets", response_model=PresetsResponse)
async def get_charset_presets():
    """Get available character set presets"""
    return PresetsResponse(
        presets=ASCIIConverter.CHARSET_PRESETS,
        description="Available character set presets for ASCII conversion"
    )

@app.post("/convert/image", response_model=ConversionResponse)
async def convert_image(
    file: UploadFile = File(...),
    detail_level: float = Form(1.0),
    charset_preset: str = Form("standard"),
    output_format: str = Form("text"),
    sensitivity: float = Form(1.0)
):
    """
    Convert an uploaded image to ASCII art.
    
    Parameters:
    - file: Image file (jpg, png, bmp, etc.)
    - detail_level: Level of detail (0.1 to 5.0)
    - charset_preset: Character set preset (standard, block, simple, detailed, minimal, dots)
    - output_format: Output format (text or image)
    - sensitivity: Sensitivity factor for luminance adjustment
    """
    
    # Validate parameters
    if charset_preset not in ASCIIConverter.CHARSET_PRESETS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid charset preset. Available: {list(ASCIIConverter.CHARSET_PRESETS.keys())}"
        )
    
    if output_format not in ["text", "image"]:
        raise HTTPException(status_code=400, detail="Output format must be 'text' or 'image'")
    
    if not (0.1 <= detail_level <= 5.0):
        raise HTTPException(status_code=400, detail="Detail level must be between 0.1 and 5.0")
    
    # Check file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Save uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix)
        with temp_file as f:
            shutil.copyfileobj(file.file, f)
        temp_path = temp_file.name
        
        # Convert to ASCII
        if output_format == "image":
            # Generate unique filename for output image
            output_filename = f"ascii_{Path(file.filename).stem}_{hash(temp_path) % 10000}.png"
            output_path = OUTPUT_DIR / output_filename
            
            result = ascii_convert(
                input_path=temp_path,
                detail_level=detail_level,
                charset_preset=charset_preset,
                output_format=output_format,
                output_path=str(output_path),
                sensitivity=sensitivity
            )
            
            # Clean up temp file
            os.unlink(temp_path)
            
            return ConversionResponse(
                success=True,
                message="Image converted to ASCII image successfully",
                image_url=f"/outputs/{output_filename}"
            )
        else:
            # Text output
            result = ascii_convert(
                input_path=temp_path,
                detail_level=detail_level,
                charset_preset=charset_preset,
                output_format=output_format,
                sensitivity=sensitivity
            )
            
            # Clean up temp file
            os.unlink(temp_path)
            
            return ConversionResponse(
                success=True,
                message="Image converted to ASCII text successfully",
                ascii_art=result
            )
            
    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@app.post("/convert/video", response_model=ConversionResponse)
async def convert_video(
    file: UploadFile = File(...),
    detail_level: float = Form(1.0),
    charset_preset: str = Form("standard"),
    frame_rate: float = Form(10.0),
    sensitivity: float = Form(1.0),
    output_format: str = Form("video")
):
    """
    Convert an uploaded video to ASCII art video.
    
    Parameters:
    - file: Video file (mp4, avi, mov, etc.)
    - detail_level: Level of detail (0.1 to 5.0)
    - charset_preset: Character set preset
    - frame_rate: Target frame rate for processing
    - sensitivity: Sensitivity factor for luminance adjustment
    - output_format: Output format (video or text)
    """
    
    # Validate parameters
    if charset_preset not in ASCIIConverter.CHARSET_PRESETS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid charset preset. Available: {list(ASCIIConverter.CHARSET_PRESETS.keys())}"
        )
    
    if not (0.1 <= detail_level <= 5.0):
        raise HTTPException(status_code=400, detail="Detail level must be between 0.1 and 5.0")
    
    if not (1.0 <= frame_rate <= 60.0):
        raise HTTPException(status_code=400, detail="Frame rate must be between 1.0 and 60.0")
    
    if output_format not in ["video", "text"]:
        raise HTTPException(status_code=400, detail="Output format must be 'video' or 'text'")
    
    # Check file type
    if not file.content_type or not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    try:
        # Save uploaded file temporarily
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=Path(file.filename).suffix)
        with temp_file as f:
            shutil.copyfileobj(file.file, f)
        temp_path = temp_file.name
        
        # Generate unique filename for output
        if output_format == "video":
            output_filename = f"ascii_video_{Path(file.filename).stem}_{hash(temp_path) % 10000}.mp4"
        else:
            output_filename = f"ascii_video_{Path(file.filename).stem}_{hash(temp_path) % 10000}.txt"
        output_path = OUTPUT_DIR / output_filename
        
        # Convert video to ASCII
        frames = ascii_convert(
            input_path=temp_path,
            detail_level=detail_level,
            charset_preset=charset_preset,
            output_format="text",  # Always get text frames first
            output_path=str(output_path),
            sensitivity=sensitivity,
            frame_rate=frame_rate
        )
        
        # Clean up temp file
        os.unlink(temp_path)
        
        return ConversionResponse(
            success=True,
            message=f"Video converted to ASCII {output_format} successfully",
            image_url=f"/outputs/{output_filename}",
            frame_count=len(frames)
        )
        
    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        raise HTTPException(status_code=500, detail=f"Video conversion failed: {str(e)}")

@app.get("/convert/url")
async def convert_from_url(
    url: str,
    detail_level: float = 1.0,
    charset_preset: str = "standard",
    output_format: str = "text",
    sensitivity: float = 1.0
):
    """
    Convert an image from URL to ASCII art.
    
    Parameters:
    - url: Image URL
    - detail_level: Level of detail (0.1 to 5.0)
    - charset_preset: Character set preset
    - output_format: Output format (text or image)
    - sensitivity: Sensitivity factor
    """
    
    import requests
    from urllib.parse import urlparse
    
    # Validate parameters
    if charset_preset not in ASCIIConverter.CHARSET_PRESETS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid charset preset. Available: {list(ASCIIConverter.CHARSET_PRESETS.keys())}"
        )
    
    if output_format not in ["text", "image"]:
        raise HTTPException(status_code=400, detail="Output format must be 'text' or 'image'")
    
    try:
        # Download image from URL
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        # Save to temporary file
        parsed_url = urlparse(url)
        filename = os.path.basename(parsed_url.path) or "image.jpg"
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=Path(filename).suffix)
        temp_file.write(response.content)
        temp_file.close()
        temp_path = temp_file.name
        
        # Convert to ASCII
        if output_format == "image":
            output_filename = f"ascii_url_{hash(url) % 10000}.png"
            output_path = OUTPUT_DIR / output_filename
            
            result = ascii_convert(
                input_path=temp_path,
                detail_level=detail_level,
                charset_preset=charset_preset,
                output_format=output_format,
                output_path=str(output_path),
                sensitivity=sensitivity
            )
            
            # Clean up temp file
            os.unlink(temp_path)
            
            return ConversionResponse(
                success=True,
                message="URL image converted to ASCII image successfully",
                image_url=f"/outputs/{output_filename}"
            )
        else:
            result = ascii_convert(
                input_path=temp_path,
                detail_level=detail_level,
                charset_preset=charset_preset,
                output_format=output_format,
                sensitivity=sensitivity
            )
            
            # Clean up temp file
            os.unlink(temp_path)
            
            return ConversionResponse(
                success=True,
                message="URL image converted to ASCII text successfully",
                ascii_art=result
            )
            
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image from URL: {str(e)}")
    except Exception as e:
        # Clean up temp file if it exists
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@app.get("/outputs/{filename}")
async def get_output_file(filename: str):
    """Serve generated output files"""
    file_path = OUTPUT_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    if filename.endswith('.png'):
        return FileResponse(file_path, media_type="image/png")
    elif filename.endswith('.txt'):
        return FileResponse(file_path, media_type="text/plain")
    elif filename.endswith('.mp4'):
        return FileResponse(file_path, media_type="video/mp4")
    elif filename.endswith('.avi'):
        return FileResponse(file_path, media_type="video/x-msvideo")
    else:
        return FileResponse(file_path)

@app.delete("/outputs/{filename}")
async def delete_output_file(filename: str):
    """Delete a generated output file"""
    file_path = OUTPUT_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        os.unlink(file_path)
        return {"success": True, "message": f"File {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@app.get("/outputs")
async def list_output_files():
    """List all generated output files"""
    try:
        files = []
        for file_path in OUTPUT_DIR.iterdir():
            if file_path.is_file():
                files.append({
                    "filename": file_path.name,
                    "size": file_path.stat().st_size,
                    "created": file_path.stat().st_ctime,
                    "url": f"/outputs/{file_path.name}"
                })
        
        return {"files": files, "count": len(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    
    print("Starting ASCII Art Converter API...")
    print("API Documentation available at: http://localhost:8000/docs")
    print("Alternative docs at: http://localhost:8000/redoc")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
