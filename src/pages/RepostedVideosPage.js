// pages/RepostedVideosPage.js
import React, { useState } from 'react';
import { ArrowLeft, Search, Filter, Grid, List, Share2 } from 'lucide-react';
import VideoGrid from '../components/VideoGrid';

// Sample data - replace with your actual data
const sampleVideos = [
  {
    id: 1,
    title: 'Transitioning to Tech Career',
    thumbnail: '/api/placeholder/400/225',
    duration: '15:45',
    date: '2024-03-14',
    tags: ['Career Change', 'Tech Industry', 'Professional Development'],
    description: 'A comprehensive guide on transitioning to a tech career from other industries.'
  },
  // Add more videos...
];

const RepostedVideosPage = ({ setStage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [layout, setLayout] = useState('grid');
  const [sortBy, setSortBy] = useState('recent');

  const filteredVideos = sampleVideos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.date) - new Date(a.date);
    }
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setStage(4)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="ml-4 text-2xl font-bold text-gray-900">Reposted Videos</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setLayout('grid')}
                  className={`p-2 rounded-lg ${
                    layout === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid size={20} />
                </button>
                <button
                  onClick={() => setLayout('list')}
                  className={`p-2 rounded-lg ${
                    layout === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List size={20} />
                </button>
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search reposted videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sortedVideos.length > 0 ? (
          <VideoGrid videos={sortedVideos} layout={layout} />
        ) : (
          <div className="text-center py-12">
            <Share2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No reposted videos yet</p>
            <button
              onClick={() => setStage(4)}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Find videos to share
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RepostedVideosPage;