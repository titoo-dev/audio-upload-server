from pytubefix import YouTube
import argparse

def download_youtube_audio(video_url, output_path="."):
    try:
        yt = YouTube(video_url)
        audio_stream = yt.streams.get_audio_only()
        
        print(f"Downloading: {yt.title}")
        filename = yt.title.replace(" ", "_") + ".mp3"
        audio_stream.download(output_path=output_path, filename=filename)
        print("Download complete!")
        print(f"Audio saved to: {output_path}/{filename}")
        return True
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Download YouTube video audio')
    parser.add_argument('url', help='YouTube video URL')
    parser.add_argument('--output', '-o', default=".", help='Output directory path')
    
    args = parser.parse_args()
    
    download_youtube_audio(args.url, args.output)

if __name__ == "__main__":
    main()
