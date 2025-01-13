// CreatorProfile.js
import React, { useState } from 'react';
import { 
  ExternalLink, Grid, PlayCircle, Heart, MessageCircle, 
  Share2, Check, Mail, LinkedinIcon, YoutubeIcon 
} from 'lucide-react';

const CreatorProfile = ({ creatorData, onBack, setStage }) => {
  const [activeTab, setActiveTab] = useState('videos');
  const [isFollowing, setIsFollowing] = useState(false);

  // Destructure from props
  const {
    name,
    username,
    avatar,
    bio,
    stats,
    links,
    tags,
    videos
  } = creatorData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple "Back" button at top */}
      <button 
        onClick={onBack} 
        className="m-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
      >
        ← Back to Search
      </button>

      {/* Profile Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar and Stats */}
            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full overflow-hidden">
                <img 
                  src={avatar} 
                  alt={name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex space-x-6 text-center">
                <div>
                  <div className="font-bold">{stats.following}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
                <div>
                  <div className="font-bold">{stats.followers}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
                <div>
                  <div className="font-bold">{stats.likes}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">{name}</h1>
              <p className="text-gray-600 mb-4">{username}</p>
              <p className="text-gray-800 mb-4">{bio}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-6 py-2 rounded-lg font-semibold ${
                    isFollowing
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {isFollowing ? (
                    <span className="flex items-center">
                      <Check size={16} className="mr-1" />
                      Following
                    </span>
                  ) : (
                    'Follow'
                  )}
                </button>
                <a
                  href={`mailto:${links.email}`}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Mail size={20} />
                </a>
                <a
                  href={links.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <YoutubeIcon size={20} />
                </a>
                <a
                  href={links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <LinkedinIcon size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-8 py-4 font-medium border-b-2 transition-colors ${
                activeTab === 'videos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid size={20} className="inline-block mr-2" />
              Videos
            </button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      {activeTab === 'videos' && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div 
                key={video.id} 
                className="group relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="text-sm font-medium mb-2 line-clamp-2">
                      {video.title}
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <PlayCircle size={16} className="mr-1" />
                        {video.views}
                      </div>
                      <div className="flex items-center">
                        <Heart size={16} className="mr-1" />
                        {video.likes}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle size={16} className="mr-1" />
                        {video.comments}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorProfile;
