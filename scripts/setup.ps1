# filepath: c:\Users\titos\dev\express-karaoke-milay\setup.ps1

# Create directories
New-Item -ItemType Directory -Path "input", "models", "output", "downloads" -Force

# Print success message
Write-Host "Directories 'input/', 'models/', 'output/' and 'downloads/' have been created successfully."

# Build Docker image
docker build -t xserrat/facebook-demucs:latest .