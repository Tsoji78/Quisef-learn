import Link from 'next/link';
import { Course } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';

interface CourseCardProps {
  course: Course;
  isEnrolled: boolean;
  userId: string | null;
}

export default function CourseCard({ course, isEnrolled, userId }: CourseCardProps) {
  const { isDark } = useTheme();
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500 text-white';
      case 'intermediate':
        return 'bg-yellow-500 text-white';
      case 'advanced':
        return 'bg-red-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="group h-full">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden 
                    transition-all duration-300 hover:shadow-2xl transform hover:-translate-y-1 
                    border border-gray-100 dark:border-gray-700 h-full flex flex-col
                    group-hover:border-blue-300 dark:group-hover:border-blue-600">
        
        {/* Image Section with Enhanced Overlay */}
        <div className="relative overflow-hidden">
          {!imageError ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-48 object-cover transition-transform duration-300 
                       group-hover:scale-110"
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 
                          flex items-center justify-center text-white">
              <div className="text-center p-4">
                <svg className="w-12 h-12 mx-auto mb-2 opacity-80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17l-3-3 1.5-1.5L9 14l6.5-6.5L17 9l-8 8z"/>
                </svg>
                <h3 className="font-medium text-sm leading-tight">{course.title}</h3>
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 
                        group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Level Badge */}
          <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold 
                          shadow-lg backdrop-blur-sm ${getLevelColor(course.level)}
                          transform transition-all duration-300 group-hover:scale-105`}>
            {course.level}
          </div>
          
          {/* Enrollment Badge */}
          {isEnrolled && (
            <div className="absolute top-3 left-3 bg-emerald-500 text-white px-3 py-1 
                          rounded-full text-xs font-bold shadow-lg backdrop-blur-sm
                          transform transition-all duration-300 group-hover:scale-105
                          flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Enrolled
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-800/90 
                        text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-xs 
                        font-medium backdrop-blur-sm shadow-sm">
            {course.category}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title */}
          <Link href={`/${course.id}`} className="group/title">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 
                         group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 
                         transition-colors duration-200 line-clamp-2 leading-tight">
              {course.title}
            </h2>
          </Link>

          {/* Description */}
          {course.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 
                        leading-relaxed flex-1">
              {course.description}
            </p>
          )}

          {/* Course Meta Information */}
          <div className="space-y-3 mb-4">
            {/* Instructor and Duration */}
            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{course.instructor}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">{course.duration}</span>
              </div>
            </div>

            {/* Additional Course Stats */}
            <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
              <div className="flex items-center gap-4">
                {course.studentsCount && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                    <span>{course.studentsCount} students</span>
                  </div>
                )}
                {course.rating && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                    </svg>
                    <span>{course.rating}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                {course.price ? (
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ${course.price}
                  </span>
                ) : (
                  <span className="font-bold text-green-600 dark:text-green-400">Free</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="mt-auto">
            {userId ? (
              isEnrolled ? (
                <div className="space-y-3">
                  <Link href={`/${course.id}/learn`}>
                    <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 
                                     hover:from-emerald-600 hover:to-emerald-700 
                                     text-white font-bold py-3 px-4 rounded-lg 
                                     transition-all duration-200 transform hover:scale-105
                                     shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Continue Learning
                    </button>
                  </Link>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                    <div className="relative">
                      <div
                        className={`${getProgressColor(course.progress ?? 0)} rounded-full h-2 
                                   transition-all duration-500 ease-out relative overflow-hidden`}
                        style={{ width: `${course.progress ?? 0}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent 
                                      to-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Progress
                      </span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        {course.progress}%
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <Link href={`/${course.id}`}>
                  <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 
                                   hover:from-blue-600 hover:to-blue-700 
                                   text-white font-bold py-3 px-4 rounded-lg 
                                   transition-all duration-200 transform hover:scale-105
                                   shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Enroll Now
                  </button>
                </Link>
              )
            ) : (
              <div className="space-y-3">
                <Link href={`/${course.id}`}>
                  <button className="w-full bg-gradient-to-r from-gray-600 to-gray-700 
                                   hover:from-gray-700 hover:to-gray-800 
                                   text-white font-bold py-3 px-4 rounded-lg 
                                   transition-all duration-200 transform hover:scale-105
                                   shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                    Preview Course
                  </button>
                </Link>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 
                              dark:to-orange-900/20 rounded-lg p-3 text-center border 
                              border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                    🔐 Sign in to enroll and track your progress
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}