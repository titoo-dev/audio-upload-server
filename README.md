# Makefile for Demucs Audio Source Separation

This Makefile provides commands to run the Facebook Demucs audio source separation tool in a Docker container.
It supports both CPU and GPU processing, with various configuration options.

## Options

| Option     | Description                                        | Default    |
|------------|----------------------------------------------------|------------|
| gpu        | Set to 'true' to enable GPU acceleration           | false      |
| mp3output  | Set to 'true' to output MP3 files instead of WAV   | false      |
| model      | Specify the Demucs model to use                    | htdemucs   |
| shifts     | Number of predictions to average                   | 1          |
| overlap    | Overlap between prediction windows                 | 0.25       |
| jobs       | Number of parallel jobs                            | 1          |
| splittrack | Optional parameter to split into two stems only    |            |
| track      | Input track filename (required for 'run' target)   |            |

## Targets

- **help** - Display available targets
- **run** - Process a specific track from the input folder
- **run-interactive** - Start an interactive Docker shell for manual Demucs commands
- **build** - Build the Demucs Docker image

## Example Usage

```bash
make run track=mysong.mp3 gpu=true
make run-interactive
```