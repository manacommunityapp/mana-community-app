import React from "react";
import { EventsGallery } from "../EventsGallery";

interface GalleryMediaViewProps {
  isDark?: boolean;
}

export const GalleryMediaView: React.FC<GalleryMediaViewProps> = () => {
  return (
    <div className="w-full">
      <EventsGallery />
    </div>
  );
};
