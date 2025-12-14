// Dashboard Header Component
import React from 'react';
import { Menu, Search, UserCircle, X, Filter, User, Settings, LogOut } from 'lucide-react';
import NotificationBell from '../NotificationSystem';

const DashboardHeader = ({
  isSidebarOpen,
  setIsSidebarOpen,
  searchQuery,
  setSearchQuery,
  showSearchFilters,
  setShowSearchFilters,
  searchFilters,
  setSearchFilters,
  showUserMenu,
  setShowUserMenu,
  setStage,
  handleLogout,
  clearSearch
}) => {
  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="flex items-center px-4 h-16">
        <button
          id="mobile-menu-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg lg:hidden transition-all duration-200 active:scale-95"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center ml-2 lg:ml-4">
          <img
            src="/nxtgrnd_full_logo_2.png"
            alt="NxtGrnd AI Logo"
            className="h-32 sm:h-40 lg:h-48 w-auto"
          />
        </div>

        {/* Enhanced Search - Hidden on small mobile, shown on tablet+ */}
        <div className="hidden sm:flex flex-1 max-w-2xl mx-4">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search learning paths, jobs, goals, or milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-20 bg-gray-100 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white
                       border border-transparent focus:border-blue-300 transition-all duration-300
                       focus:shadow-lg focus:shadow-blue-500/10"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />

            {/* Search Controls */}
            <div className="absolute right-2 top-1.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 hover:bg-gray-200 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
                  title="Clear search"
                >
                  <X size={16} className="text-gray-400" />
                </button>
              )}
              <button
                onClick={() => setShowSearchFilters(!showSearchFilters)}
                className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${
                  showSearchFilters || searchQuery
                    ? 'bg-blue-100 text-blue-600'
                    : 'hover:bg-gray-200 text-gray-400'
                }`}
                title="Search filters"
              >
                <Filter size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
          {/* Mobile Search Icon */}
          <button
            onClick={() => {
              const searchInput = document.querySelector('input[placeholder*="Search"]');
              if (searchInput) {
                searchInput.focus();
              } else {
                setSearchQuery('');
                setShowSearchFilters(true);
              }
            }}
            className="p-2 hover:bg-gray-100 rounded-full sm:hidden"
          >
            <Search size={20} />
          </button>

          <NotificationBell setStage={setStage} />

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <UserCircle size={24} />
            </button>
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 animate-slide-down border border-gray-100">
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center transition-colors duration-200"
                  onClick={() => {
                    setShowUserMenu(false);
                    setStage(7);
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Creator Profile
                </button>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center transition-colors duration-200"
                  onClick={() => {
                    setShowUserMenu(false);
                    setStage(8);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
                <div className="border-t my-1"></div>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-red-50 text-sm flex items-center text-red-600 transition-colors duration-200"
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Filters Panel */}
      {showSearchFilters && (
        <div className="border-t bg-white px-4 py-3 animate-slide-down">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
            {Object.entries({
              learningPaths: 'Learning Paths',
              opportunities: 'Opportunities',
              goals: 'Goals',
              events: 'Events'
            }).map(([key, label], index) => (
              <label
                key={key}
                className="flex items-center cursor-pointer group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <input
                  type="checkbox"
                  checked={searchFilters[key]}
                  onChange={(e) => setSearchFilters(prev => ({
                    ...prev,
                    [key]: e.target.checked
                  }))}
                  className="mr-2 rounded text-blue-600 transition-transform duration-200 group-hover:scale-110"
                />
                <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors duration-200">{label}</span>
              </label>
            ))}

            <button
              onClick={() => setSearchFilters({
                learningPaths: true,
                opportunities: true,
                goals: true,
                events: true
              })}
              className="text-sm text-blue-600 hover:text-blue-700 ml-auto transition-colors duration-200 hover:underline"
            >
              Select All
            </button>
          </div>
        </div>
      )}

      {/* Mobile Search Bar */}
      <div className="sm:hidden px-4 py-3 border-t bg-gray-50">
        <div className="relative">
          <input
            type="text"
            placeholder="Search dashboard content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-10 bg-white border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
