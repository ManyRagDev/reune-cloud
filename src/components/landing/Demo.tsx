import { useRef, useState } from "react";
import { Play } from "lucide-react";
import videoPromo from "@/assets/video_promo.mp4";

export const Demo = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section id="demo" className="py-24 px-4 bg-muted/30">
      <div className="container max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-4xl md:text-5xl font-bold">Por que o ReUNE?</h2>
          <p className="text-xl text-muted-foreground">
            Veja como organização e IA podem transformar sua experiência de eventos.
          </p>
        </div>

        <div
          className="relative rounded-3xl overflow-hidden shadow-floating bg-black aspect-video flex items-center justify-center group cursor-pointer"
          onClick={handlePlayClick}
        >
          <video
            ref={videoRef}
            src={videoPromo}
            className="w-full h-full object-cover"
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />

          {!isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-colors group-hover:bg-black/50">
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <Play className="w-10 h-10 text-primary ml-1" />
                </div>
                <span className="text-white text-lg font-medium">
                  Demonstração
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
