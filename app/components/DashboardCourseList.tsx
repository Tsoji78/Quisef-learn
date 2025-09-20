import { useState, useMemo, useCallback } from 'react';
import { Course } from '@/types/course';
import CourseCard from './CourseCard';
import Pagination from './Pagination';

interface DashboardCourseListProps {
  courses: Course[];
  enrollmentStatus: Record<string, boolean>;
  userId: string | null;
}

export default function DashboardCourseList({ courses, enrollmentStatus, userId }: DashboardCourseListProps) {
  const [filter, setFilter] = useState('All');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  const categories = useMemo(() => 
    ['All', ...new Set(courses.map((course) => course.category))], 
    [courses]
  );

  const filteredCourses = useMemo(() => {
    let filtered = courses;

    // Filter by category
    if (filter !== 'All') {
      filtered = filtered.filter((course) => course.category === filter);
    }

    // Filter by keyword search
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      filtered = filtered.filter((course) =>
        course.title.toLowerCase().includes(keyword) ||
        course.description?.toLowerCase().includes(keyword) ||
        course.instructor?.toLowerCase().includes(keyword) ||
        course.category.toLowerCase().includes(keyword)
      );
    }

    return filtered;
  }, [courses, filter, searchKeyword]);

  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const currentCourses = useMemo(() => 
    filteredCourses.slice(
      (currentPage - 1) * coursesPerPage,
      currentPage * coursesPerPage
    ), 
    [filteredCourses, currentPage, coursesPerPage]
  );

  const handleFilterChange = useCallback((category: string) => {
    setFilter(category);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilter('All');
    setSearchKeyword('');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = filter !== 'All' || searchKeyword.trim();

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search courses, instructors, or keywords..."
              value={searchKeyword}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
                       placeholder-gray-500 dark:placeholder-gray-400
                       focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       transition-colors duration-200"
            />
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleFilterChange(category)}
                className={`px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium
                  ${filter === category
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:shadow-sm'
                  }`}
              >
                {category}
                {category !== 'All' && (
                  <span className="ml-2 text-xs opacity-75">
                    ({courses.filter(c => c.category === category).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 
                       hover:text-gray-800 dark:hover:text-gray-200 
                       border border-gray-300 dark:border-gray-600 rounded-lg
                       hover:bg-gray-50 dark:hover:bg-gray-700 
                       transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear filters
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active filters:</span>
              {filter !== 'All' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  Category: {filter}
                  <button
                    onClick={() => setFilter('All')}
                    className="ml-1.5 -mr-1 w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              )}
              {searchKeyword.trim() && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Search: "{searchKeyword}"
                  <button
                    onClick={() => setSearchKeyword('')}
                    className="ml-1.5 -mr-1 w-4 h-4 rounded-full hover:bg-green-200 dark:hover:bg-green-800 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Course Grid */}
      {currentCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentCourses.map((course) => (
            <CourseCard 
              key={course.id}
              course={course} 
              isEnrolled={enrollmentStatus[course.id]} 
              userId={userId} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              No courses found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasActiveFilters 
                ? "Try adjusting your filters or search terms to find more courses."
                : "No courses are available at the moment. Check back later for new content!"
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 
                         text-white font-medium rounded-lg transition-colors duration-200 
                         shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}