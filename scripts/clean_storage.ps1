# Script to clean MP3 files from storage directories

# Base directory path
$BASE_DIR = Split-Path -Parent $PSScriptRoot
$INPUT_DIR = Join-Path $BASE_DIR "storage\input"
$OUTPUT_DIR = Join-Path $BASE_DIR "storage\output"

# Function to safely remove MP3 files from a directory
function Clean-Directory {
    param(
        [string]$Directory,
        [string]$Name
    )

    if (Test-Path $Directory) {
        Write-Host "Cleaning $Name directory and its subdirectories..."
        try {
            if ($Name -eq "output") {
                # Remove all contents including subdirectories for output
                Get-ChildItem -Path $Directory -Recurse | Remove-Item -Force -Recurse
                Write-Host "✓ Removed all contents from $Name directory"
            }
            else {
                # Only remove MP3 files for other directories
                Get-ChildItem -Path $Directory -Filter "*.mp3" -Recurse | Remove-Item -Force
                Write-Host "✓ Removed MP3 files from $Name and its subdirectories"
            }
        }
        catch {
            Write-Host "❌ Error: $($_.Exception.Message)"
            exit 1
        }
    }
    else {
        Write-Host "⚠️  Warning: $Name directory not found at $Directory"
    }
}

# Main execution
Write-Host "Starting storage cleanup..."

# Clean input directory
Clean-Directory -Directory $INPUT_DIR -Name "input"

# Clean output directory
Clean-Directory -Directory $OUTPUT_DIR -Name "output"

Write-Host "Storage cleanup completed!"
