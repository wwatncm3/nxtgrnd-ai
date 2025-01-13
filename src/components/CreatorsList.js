import React, { useState, useEffect } from 'react';
import { Search, X, ArrowLeft, Filter, Users, Bookmark, TrendingUp } from 'lucide-react';
import CreatorProfile from './CreatorProfile';

// Define creators data
const initialCreators = [
  {
    name: "Baxate Carter",
    username: "@baxate_carter",
    avatar: "/api/placeholder/150/150",
    bio: "Software Engineer & Content Creator 👨‍💻",
    tags: ["Software Engineering", "Career Growth", "Tech", "Life Advice"],
    stats: { followers: "492.3K", following: "245", likes: "18.1M" },
    links: {
      youtube: "https://youtube.com/@Baxate",
      linkedin: "#",
      email: "baxatecarter@withcontent.agency"
    },
    videos: [
      {
        id: 201,
        thumbnail: "/api/placeholder/300/533",
        views: "57K",
        likes: "2.4K",
        title: "How to Get a SWE Internship in 2024",
        comments: 145
      },
      {
        id: 202,
        thumbnail: "/api/placeholder/300/533",
        views: "42K",
        likes: "1.8K",
        title: "I Quit My $171K Engineering Job...",
        comments: 232
      }
    ]
  },
  {
    name: "Jane Smith",
    username: "@jane_smith",
    avatar: "/api/placeholder/150/150",
    bio: "Full Stack Dev & Tech Speaker",
    tags: ["Web Dev", "JavaScript", "React", "Tech"],
    stats: { followers: "3K", following: "100", likes: "1.2M" },
    links: {
      youtube: "https://youtube.com/@JaneSmith",
      linkedin: "https://linkedin.com/in/janesmith",
      email: "jane@smith.dev"
    },
    videos: [
      {
        id: 101,
        thumbnail: "/api/placeholder/300/533",
        views: "27K",
        likes: "5.2K",
        title: "Advanced React Hooks Tricks",
        comments: 40
      },
      {
        id: 102,
        thumbnail: "/api/placeholder/300/533",
        views: "18K",
        likes: "1.2K",
        title: "Deploying a Full Stack App in 10 Minutes",
        comments: 15
      }
    ]
  },
  {
    name: "Alex Chen",
    username: "@alexcodes",
    avatar: "/api/placeholder/150/150",
    bio: "Senior Software Engineer | Teaching Tech 🚀",
    tags: ["Software Architecture", "System Design", "Tech", "Career Growth"],
    stats: { followers: "125K", following: "312", likes: "4.5M" },
    links: {
      youtube: "#",
      linkedin: "#",
      email: "alex@chen.dev"
    },
    videos: [
      {
        id: 301,
        thumbnail: "/api/placeholder/300/533",
        views: "89K",
        likes: "7.2K",
        title: "System Design: Building a Social Network",
        comments: 234
      },
      {
        id: 302,
        thumbnail: "/api/placeholder/300/533",
        views: "65K",
        likes: "4.8K",
        title: "10 Architecture Patterns Every Dev Should Know",
        comments: 156
      }
    ]
  }
];

// Categories component
const Categories = ({ selectedCategory, onSelectCategory }) => {
  const categories = [
    { id: 'all', label: 'All Creators', icon: Users },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'recommended', label: 'Recommended', icon: Bookmark },
    { id: 'tech', label: 'Tech' },
    { id: 'career', label: 'Career Growth' },
    { id: 'lifestyle', label: 'Lifestyle' },
  ];

  return (
    <div className="flex overflow-x-auto py-4 scrollbar-hide">
      <div className="flex space-x-3">
        {categories.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelectCategory(id)}
            className={`flex items-center px-4 py-2 rounded-full whitespace-nowrap ${
              selectedCategory === id
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {Icon && <Icon size={16} className="mr-2" />}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Creator Card component
const CreatorCard = ({ creator, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
  >
    <div className="aspect-video relative">
      {creator.videos?.[0] && (
        <img
          src={creator.videos[0].thumbnail}
          alt={`Latest video by ${creator.name}`}
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center">
          <img
            src={creator.avatar}
            alt={creator.name}
            className="w-10 h-10 rounded-full border-2 border-white"
          />
          <div className="ml-3 text-white">
            <h3 className="font-semibold">{creator.name}</h3>
            <p className="text-sm opacity-90">{creator.username}</p>
          </div>
        </div>
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{creator.stats.followers}</span> followers
        </div>
        <div className="text-sm text-gray-600">
          <span className="font-semibold">{creator.stats.likes}</span> likes
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{creator.bio}</p>
      <div className="flex flex-wrap gap-2">
        {creator.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  </div>
);

// Main CreatorsList component
const CreatorsList = ({ setStage }) => {
  const [creators] = useState(initialCreators);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Filter creators based on search and category
  const filteredCreators = creators.filter((creator) => {
    const q = searchQuery.toLowerCase();
    const matchQuery = 
      creator.name.toLowerCase().includes(q) ||
      creator.username.toLowerCase().includes(q) ||
      creator.tags.some((tag) => tag.toLowerCase().includes(q));

    if (selectedCategory === 'all') return matchQuery;
    if (selectedCategory === 'trending') {
      // Example logic: maybe 'trending' means > 100K followers
      return matchQuery && parseInt(creator.stats.followers.replace(/[K,M]/g, '')) > 100;
    }
    // For categories like 'tech', 'career', 'lifestyle' etc.:
    return matchQuery && creator.tags.some(tag => 
      tag.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  // If the user selected a creator, show CreatorProfile
  if (selectedCreator) {
    return (
      <CreatorProfile 
        creatorData={selectedCreator} 
        onBack={() => setSelectedCreator(null)} 
        setStage={setStage} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            {/* Title and "Back to Main" on the same row */}
            <div className="flex items-center mb-4">
              <button
                onClick={() => setStage(4)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-4"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Discover Creators</h1>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search creators by name, username, or interests"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={`w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSearchFocused ? 'bg-white border border-gray-300' : ''
                }`}
              />
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                size={20} 
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              )}
            </div>

            {/* Categories */}
            <Categories 
              selectedCategory={selectedCategory} 
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredCreators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator) => (
              <CreatorCard
                key={creator.username}
                creator={creator}
                onClick={() => setSelectedCreator(creator)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No creators found</h3>
            <p className="text-gray-600">
              Try adjusting your search or browse different categories
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorsList;
