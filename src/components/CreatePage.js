import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  Upload, Camera, ArrowLeft, X
} from 'lucide-react';
import { UserContext } from '../App';  // <-- Import your context here

const CreatePage = () => {
  const { setStage } = useContext(UserContext); // <-- useContext for setStage

  const [file, setFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const liveVideoRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type.startsWith('video/')) {
      setFile(URL.createObjectURL(uploadedFile));
    } else {
      alert('Please upload a valid video file (MP4, WebM, etc.)');
    }
  };

  const startRecording = async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(userStream);

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = userStream;
        liveVideoRef.current.play();
      }

      const recorder = new MediaRecorder(userStream, {
        mimeType: 'video/webm; codecs=vp9',
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        setRecordedVideo(URL.createObjectURL(blob));
        userStream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing webcam:', err);
      alert('Could not access your camera. Please allow permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleTagAdd = (e) => {
    e.preventDefault();
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // Publish (simulate upload)
  const handlePublish = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    // Go back to main content
    setStage(4);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Go back to main content (stage 4) */}
              <button
                onClick={() => setStage(4)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={24} className="text-gray-600" />
              </button>
              <h1 className="ml-4 text-xl font-bold text-gray-900">Create New Video</h1>
            </div>
            <button
              onClick={handlePublish}
              disabled={isProcessing || (!file && !recordedVideo)}
              className={`px-4 py-2 rounded-lg font-semibold ${
                isProcessing || (!file && !recordedVideo)
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } transition-colors`}
            >
              {isProcessing ? 'Processing...' : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm">
          {/* Tabs */}
          <div className="border-b px-6 pt-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('upload')}
                className={`pb-4 relative ${
                  activeTab === 'upload'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Upload size={20} />
                  <span>Upload Video</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('record')}
                className={`pb-4 relative ${
                  activeTab === 'record'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Camera size={20} />
                  <span>Record Video</span>
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Video Preview Section */}
              <div className="space-y-6">
                {activeTab === 'upload' ? (
                  <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    {file ? (
                      <video
                        src={file}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        <Upload size={48} className="text-gray-400 mb-4" />
                        <p className="text-gray-600">Click to upload video</p>
                        <p className="text-sm text-gray-500 mt-2">MP4 or WebM, max 1GB</p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="video/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                    {recordedVideo ? (
                      <video
                        src={recordedVideo}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        ref={liveVideoRef}
                        className="w-full h-full object-cover"
                        muted
                      />
                    )}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      {isRecording ? (
                        <button
                          onClick={stopRecording}
                          className="px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors flex items-center space-x-2"
                        >
                          <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                          <span>Stop Recording</span>
                        </button>
                      ) : (
                        !recordedVideo && (
                          <button
                            onClick={startRecording}
                            className="px-6 py-3 bg-blue-500 text-white rounded-full font-semibold hover:bg-blue-600 transition-colors flex items-center space-x-2"
                          >
                            <Camera size={20} />
                            <span>Start Recording</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={videoTitle}
                    onChange={(e) => setVideoTitle(e.target.value)}
                    placeholder="Enter a title for your video"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={videoDescription}
                    onChange={(e) => setVideoDescription(e.target.value)}
                    placeholder="Tell viewers about your video"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <form onSubmit={handleTagAdd} className="mb-3">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add tags to help viewers find your video"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          onClick={() => removeTag(tag)}
                          className="w-4 h-4 flex items-center justify-center hover:text-red-500"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  );
};

export default CreatePage;
