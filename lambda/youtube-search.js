// YouTube Search Lambda Function
// Fetches real video recommendations from YouTube Data API v3

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// CORS headers
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export const handler = async (event) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { query, careerPath, skills = [], maxResults = 6 } = body;

    // Build search query
    const searchQuery = buildSearchQuery(careerPath, skills, query);
    console.log('Searching YouTube for:', searchQuery);

    // Search for videos
    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE}/search?` + new URLSearchParams({
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: maxResults,
        order: 'relevance',
        videoDuration: 'medium', // 4-20 minutes - good for tutorials
        relevanceLanguage: 'en',
        safeSearch: 'strict',
        key: YOUTUBE_API_KEY
      })
    );

    if (!searchResponse.ok) {
      const error = await searchResponse.text();
      console.error('YouTube API error:', error);
      throw new Error('YouTube API request failed');
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items.map(item => item.id.videoId).join(',');

    // Get video statistics (views, likes, duration)
    const statsResponse = await fetch(
      `${YOUTUBE_API_BASE}/videos?` + new URLSearchParams({
        part: 'statistics,contentDetails,snippet',
        id: videoIds,
        key: YOUTUBE_API_KEY
      })
    );

    const statsData = await statsResponse.json();

    // Format videos with all details
    const videos = statsData.items.map(video => ({
      id: video.id,
      title: video.snippet.title,
      channel: video.snippet.channelTitle,
      description: video.snippet.description.substring(0, 150) + '...',
      thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
      thumbnailHigh: video.snippet.thumbnails.high?.url,
      duration: formatDuration(video.contentDetails.duration),
      views: formatViews(video.statistics.viewCount),
      likes: formatLikes(video.statistics.likeCount),
      publishedAt: formatPublishedDate(video.snippet.publishedAt),
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      embedUrl: `https://www.youtube.com/embed/${video.id}`
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        query: searchQuery,
        videos,
        totalResults: searchData.pageInfo?.totalResults || videos.length
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        videos: [] // Return empty array so frontend can use fallback
      })
    };
  }
};

// Build optimized search query for career content
function buildSearchQuery(careerPath, skills, customQuery) {
  if (customQuery) return customQuery;

  const career = careerPath || 'career development';
  const topSkills = skills.slice(0, 2).join(' ');

  // Career-specific query modifiers for better results
  const queryModifiers = {
    'software': 'software developer tutorial roadmap',
    'data': 'data science machine learning tutorial',
    'product': 'product management PM career',
    'ux': 'UX design portfolio tutorial',
    'marketing': 'digital marketing strategy',
    'finance': 'finance career investment banking',
    'culinary': 'culinary chef cooking professional',
    'healthcare': 'healthcare nursing medical career',
    'education': 'teaching education career classroom',
    'creative': 'creative career freelance design'
  };

  // Find matching modifier
  const careerLower = career.toLowerCase();
  let modifier = 'career advice tips';
  for (const [key, value] of Object.entries(queryModifiers)) {
    if (careerLower.includes(key)) {
      modifier = value;
      break;
    }
  }

  return `${career} ${topSkills} ${modifier} 2024`.trim();
}

// Format ISO 8601 duration to readable format (PT15M42S -> 15:42)
function formatDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format view count (1234567 -> 1.2M views)
function formatViews(viewCount) {
  const views = parseInt(viewCount) || 0;
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(0)}K views`;
  }
  return `${views} views`;
}

// Format like count
function formatLikes(likeCount) {
  const likes = parseInt(likeCount) || 0;
  if (likes >= 1000000) {
    return `${(likes / 1000000).toFixed(1)}M`;
  }
  if (likes >= 1000) {
    return `${(likes / 1000).toFixed(0)}K`;
  }
  return likes.toString();
}

// Format published date to relative time
function formatPublishedDate(isoDate) {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
