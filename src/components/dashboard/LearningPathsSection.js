// Learning Paths Section Component
import React from 'react';
import { BookOpen, Search, ChevronRight } from 'lucide-react';
import { HighlightText } from './SearchComponents';

const LearningPathsSection = ({
  searchResults,
  searchFilters,
  debouncedSearchQuery,
  isLoading,
  personalizedLearningPaths,
  courseProgress,
  completedTasks,
  markTaskComplete
}) => {
  // Don't render if filtered out or no results
  if (!searchFilters.learningPaths) return null;
  if (searchResults.learningPaths.length === 0 && debouncedSearchQuery) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 animate-fade-in card-hover">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">
            Learning Paths
            {debouncedSearchQuery && searchResults.learningPaths.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 animate-fade-in-fast">
                ({searchResults.learningPaths.length} found)
              </span>
            )}
          </h2>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 group transition-all duration-200">
          View All
          <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : searchResults.learningPaths.length === 0 && debouncedSearchQuery ? (
          <NoResultsMessage type="learning paths" />
        ) : searchResults.learningPaths.length === 0 ? (
          <EmptyState />
        ) : (
          searchResults.learningPaths.map((course, index) => {
            const originalIndex = personalizedLearningPaths.findIndex(p => p.title === course.title);
            return (
              <LearningPathCard
                key={`${course.title}-${index}`}
                course={course}
                originalIndex={originalIndex}
                courseProgress={courseProgress}
                completedTasks={completedTasks}
                markTaskComplete={markTaskComplete}
                searchTerm={debouncedSearchQuery}
                animationDelay={index * 100}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-6 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-3">
            <div className="h-5 skeleton rounded w-3/4"></div>
            <div className="h-4 skeleton rounded w-1/3"></div>
            <div className="h-4 skeleton rounded w-full"></div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <div className="h-6 w-12 skeleton rounded"></div>
            <div className="h-4 w-16 skeleton rounded"></div>
          </div>
        </div>
        <div className="h-2.5 skeleton rounded-full w-full mb-4"></div>
        <div className="space-y-3">
          <div className="h-12 skeleton rounded-lg"></div>
          <div className="h-12 skeleton rounded-lg"></div>
        </div>
      </div>
    ))}
  </div>
);

const NoResultsMessage = ({ type }) => (
  <div className="text-center py-12 animate-scale-in">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="h-8 w-8 text-gray-400" />
    </div>
    <p className="text-gray-500 text-lg">No {type} match your search.</p>
    <p className="text-gray-400 text-sm mt-1">Try different keywords or filters</p>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-12 animate-scale-in">
    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
      <BookOpen className="h-8 w-8 text-blue-400" />
    </div>
    <p className="text-gray-500 text-lg">No learning paths available yet.</p>
    <p className="text-gray-400 text-sm mt-1">Check back soon for new content</p>
  </div>
);

const LearningPathCard = ({
  course,
  originalIndex,
  courseProgress,
  completedTasks,
  markTaskComplete,
  searchTerm,
  animationDelay = 0
}) => {
  const progress = courseProgress[originalIndex] || course.progress || 0;
  const totalTasks = (course.resources?.length || 0) + 1;
  const completedCount = Object.keys(completedTasks).filter(key =>
    key.startsWith(`${originalIndex}-`) && completedTasks[key]
  ).length;

  return (
    <div
      className="border rounded-lg p-4 sm:p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 ease-out animate-slide-up opacity-0 bg-white"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
        <div className="flex-1">
          <h3 className="font-medium text-base sm:text-lg mb-1">
            <HighlightText text={course.title} searchTerm={searchTerm} />
          </h3>
          <p className="text-sm text-gray-600 mb-2 sm:mb-3">
            <HighlightText text={course.provider} searchTerm={searchTerm} />
          </p>
          <p className="text-sm text-gray-700">
            <HighlightText text={course.description} searchTerm={searchTerm} />
          </p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
          <span className="text-lg font-semibold text-blue-600">{progress}%</span>
          <span className="text-sm text-gray-500">Complete</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-full h-2.5 transition-all duration-700 ease-out progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Interactive Task List */}
      <div className="space-y-3 mb-4">
        {/* Main Lesson Task */}
        <TaskItem
          taskKey={`${originalIndex}-main-lesson`}
          isCompleted={completedTasks[`${originalIndex}-main-lesson`]}
          onToggle={() => markTaskComplete(originalIndex, 'main-lesson')}
          label={<>Complete: <HighlightText text={course.nextLesson} searchTerm={searchTerm} /></>}
        />

        {/* Resource Tasks */}
        {course.resources && course.resources.map((resource, resIndex) => (
          <TaskItem
            key={resIndex}
            taskKey={`${originalIndex}-resource-${resIndex}`}
            isCompleted={completedTasks[`${originalIndex}-resource-${resIndex}`]}
            onToggle={() => markTaskComplete(originalIndex, `resource-${resIndex}`)}
            label={<>Study: <HighlightText text={resource.title} searchTerm={searchTerm} /></>}
            subLabel={<HighlightText text={resource.provider} searchTerm={searchTerm} />}
            href={resource.url}
          />
        ))}
      </div>

      {/* Progress Summary */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          {completedCount} of {totalTasks} tasks completed
        </div>

        {progress === 100 ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm animate-bounce-in">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Completed!
          </div>
        ) : (
          <button className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 hover:shadow-md active:scale-95 transition-all duration-200 text-sm font-medium">
            Continue Learning
          </button>
        )}
      </div>
    </div>
  );
};

const TaskItem = ({ taskKey, isCompleted, onToggle, label, subLabel, href }) => {
  const content = (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
      isCompleted ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
    }`}>
      <button
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
          isCompleted
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-blue-500'
        }`}
      >
        {isCompleted && (
          <svg className="w-3 h-3 text-white animate-scale-in" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      <div className="flex-1">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`text-sm hover:text-blue-600 transition-all duration-200 ${
              isCompleted ? 'text-green-700 line-through' : 'text-gray-700'
            }`}
          >
            {label}
          </a>
        ) : (
          <span className={`text-sm font-medium transition-all duration-200 ${
            isCompleted ? 'text-green-700 line-through' : 'text-gray-700'
          }`}>
            {label}
          </span>
        )}
        {subLabel && (
          <p className="text-xs text-gray-500 mt-1">{subLabel}</p>
        )}
      </div>
    </div>
  );

  return content;
};

export default LearningPathsSection;
