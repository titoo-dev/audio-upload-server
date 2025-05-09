# Express Audio Upload & Demucs Separation Server

This project is an Express-based web application that handles audio file uploads and processes them using the Demucs source separation tool. It separates vocals and instruments from audio files by leveraging a Dockerized Demucs model.

## Features

- Upload standard audio files (MP3, WAV) up to 10MB.
- Trigger audio separation processing via a web API endpoint.
- Docker integration for running Demucs with the following configuration:

    ```bash
    python -m demucs.separate \
        --mp3 \
        --mp3-bitrate 320 \
        -n htdemucs \
        --two-stems=vocals \
        --clip-mode rescale \
        --overlap 0.25 \
        <input_file_path> \
        -o outputs
    ```

- Serve separated audio files (vocals and instrumental tracks) through dedicated endpoints.
- Temporary server storage for uploaded and processed files.

## Installation

1. Clone the repository.
2. Install Node.js dependencies:

     ```bash
     npm install
     ```

3. (Optional) Run the setup script to install platform-specific dependencies:

     ```bash
     npm run setup
     ```

## Usage

### Running the Server

Start the Express server:

```bash
npm start
```

For development with hot-reloading (using nodemon):

```bash
npm run dev
```

## Docker Integration

The audio processing is executed inside a Docker container using the Demucs image. The Docker command mounts the necessary directories and executes the Demucs separation script with configured options.

For more details on the Demucs model and usage, refer to the [Demucs GitHub repository](https://github.com/facebookresearch/demucs) and [model documentation](https://github.com/facebookresearch/demucs#separation).

## Example Usage

1. Upload an audio file via the `/upload` endpoint.
2. Call `/separate/<storedFilename>` to process the file.
3. Access the separated tracks at the URLs provided in the JSON response, and use the download buttons in your web interface as needed.
