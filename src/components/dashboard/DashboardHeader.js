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
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
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
            className="h-10 sm:h-14 w-auto"
          />
        </div>

        {/* Enhanced Search Bar - Brand Colors (Navy + Teal + Gold) */}
        <div className="flex flex-1 max-w-2xl mx-2 sm:mx-4">
          <div className="relative w-full group">
            {/* Gradient border effect on focus - using brand teal */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-900 via-teal-500 to-blue-900 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm ${searchQuery ? 'opacity-50' : ''}`}></div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-10 pr-12 sm:px-5 sm:py-3 sm:pl-12 sm:pr-24 bg-white rounded-xl text-sm
                         focus:outline-none border border-gray-200
                         transition-all duration-300 shadow-sm
                         focus:shadow-lg focus:border-transparent
                         placeholder:text-gray-400"
              />

              {/* Search Icon with brand navy background */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <div className="p-1.5 bg-blue-900 rounded-lg">
                  <Search className="text-white" size={16} />
                </div>
              </div>

              {/* Search Controls */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Clear search"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => setShowSearchFilters(!showSearchFilters)}
                  className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1 ${
                    showSearchFilters
                      ? 'bg-blue-900 text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-500'
                  }`}
                  title="Search filters"
                >
                  <Filter size={14} />
                </button>
              </div>
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

      {/* Search Filters Panel - Brand Colors */}
      {showSearchFilters && (
        <div className="border-t bg-gradient-to-r from-blue-50/50 via-teal-50/50 to-blue-50/50 px-4 py-4 animate-slide-down">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Filter size={14} className="text-teal-600" />
                Filter by:
              </span>
              {Object.entries({
                learningPaths: { label: 'Learning Paths', color: 'blue' },
                opportunities: { label: 'Opportunities', color: 'teal' },
                goals: { label: 'Goals', color: 'amber' },
                events: { label: 'Events', color: 'blue' }
              }).map(([key, { label, color }], index) => (
                <label
                  key={key}
                  className={`flex items-center cursor-pointer px-3 py-1.5 rounded-full transition-all duration-200 animate-fade-in ${
                    searchFilters[key]
                      ? `bg-${color}-100 text-${color}-700 shadow-sm`
                      : 'bg-white text-gray-500 hover:bg-gray-100'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <input
                    type="checkbox"
                    checked={searchFilters[key]}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="sr-only"
                  />
                  <span className={`w-2 h-2 rounded-full mr-2 ${searchFilters[key] ? `bg-${color}-500` : 'bg-gray-300'}`}></span>
                  <span className="text-sm font-medium">{label}</span>
                </label>
              ))}

              <button
                onClick={() => setSearchFilters({
                  learningPaths: true,
                  opportunities: true,
                  goals: true,
                  events: true
                })}
                className="text-sm text-blue-900 hover:text-blue-800 ml-auto px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium"
              >
                Select All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Search Bar - Brand Colors */}
      <div className="sm:hidden px-4 py-3 border-t bg-gradient-to-r from-blue-50/30 to-teal-50/30">
        <div className="relative">
          <input
            type="text"
            placeholder="Search your dashboard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-11 pr-10 bg-white border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <div className="p-1 bg-blue-900 rounded-lg">
              <Search className="text-white" size={14} />
            </div>
          </div>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
