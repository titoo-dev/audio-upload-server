#!/bin/bash

# Create directories
mkdir -p input models output downloads

# Print success message
echo "Directories 'input/', 'models/', 'output/' and 'downloads/' have been created successfully."

docker build -t xserrat/facebook-demucs:latest .