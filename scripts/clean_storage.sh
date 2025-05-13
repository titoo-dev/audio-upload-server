#!/bin/bash

# Script to clean MP3 files from storage directories

# Base directory path
BASE_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")"
INPUT_DIR="$BASE_DIR/storage/input"
OUTPUT_DIR="$BASE_DIR/storage/output"
DOWNLOAD_DIR="$BASE_DIR/storage/download"

# Function to safely remove MP3 files from a directory
clean_directory() {
    local dir="$1"
    local name="$2"
    
    if [ -d "$dir" ]; then
        echo "Cleaning $name directory and its subdirectories..."
        if [ "$name" = "output" ] || [ "$name" = "download" ]; then
            # Remove all contents including subdirectories for output and download
            if ! sudo rm -rf "${dir:?}"/*; then
                echo "❌ Error: Permission denied. Try running the script with sudo."
                exit 1
            fi
            echo "✓ Removed all contents from $name directory"
        else
            # Only remove MP3 files for other directories
            if ! sudo find "$dir" -type f -name "*.mp3" -delete; then
                echo "❌ Error: Permission denied. Try running the script with sudo."
                exit 1
            fi
            echo "✓ Removed MP3 files from $name and its subdirectories"
        fi
    else
        echo "⚠️  Warning: $name directory not found at $dir"
    fi
}

# Main execution
echo "Starting storage cleanup..."

# Clean input directory
clean_directory "$INPUT_DIR" "input"

# Clean output directory
clean_directory "$OUTPUT_DIR" "output"

# Clean download directory
clean_directory "$DOWNLOAD_DIR" "download"

echo "Storage cleanup completed!"
