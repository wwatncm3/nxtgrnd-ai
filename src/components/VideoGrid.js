// components/VideoGrid.js
import React from 'react';
import { Clock } from 'lucide-react';

const VideoGrid = ({ videos, layout = 'grid' }) => {
  if (layout === 'list') {
    return (
      <div className="space-y-4">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-lg shadow-sm overflow-hidden flex">
            <div className="w-64 h-36 relative flex-shrink-0">
              <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
              <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-semibold text-gray-900">{video.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{video.description}</p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock size={16} className="mr-1" />
                  {video.date}
                </div>
                <div className="flex gap-2">
                  {video.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <div key={video.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="aspect-video relative">
            <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
              {video.duration}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{video.title}</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {video.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Clock size={16} className="mr-1" />
                {video.date}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;