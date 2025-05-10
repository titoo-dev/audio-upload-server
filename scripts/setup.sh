#!/bin/bash

# Create directories
mkdir -p input models output

# Print success message
echo "Directories 'input/', 'models/', and 'output/' have been created successfully."

docker build -t xserrat/facebook-demucs:latest .