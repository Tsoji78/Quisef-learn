import React, { memo, useState, useEffect } from 'react';
import { Course } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Users, Star, CheckCircle, PlayCircle, BookOpen, Award, Shield, Calendar, Globe, Download } from 'lucide-react';
import parse from 'html-react-parser';

interface CourseEnrollmentProps {
  course: Course;
  isEnrolled: boolean;
  lastModuleId: string | null;
  handleEnrollment: () => Promise<boolean>;
  enrolling: boolean;
  error?: string | null;
}

const CourseEnrollment = memo(({ 
  course, 
  isEnrolled, 
  lastModuleId, 
  handleEnrollment, 
  enrolling,
  error 
}: CourseEnrollmentProps) => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');
  const [localIsEnrolled, setLocalIsEnrolled] = useState(isEnrolled);

  // Update local state when prop changes
  React.useEffect(() => {
    setLocalIsEnrolled(isEnrolled);
  }, [isEnrolled]);

  // Helper function to get safe image URL
  const getSafeImageUrl = (url: string | undefined, fallbackText: string, size: string = '400/250') => {
    if (!url || url.includes('/api/placeholder/')) {
      return `https://via.placeholder.com/${size}/e2e8f0/6b7280?text=${encodeURIComponent(fallbackText)}`;
    }
    return url;
  };

  // Handle image load errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackText: string, size: string = '400/250') => {
    const target = e.target as HTMLImageElement;
    target.src = `https://via.placeholder.com/${size}/e2e8f0/6b7280?text=${encodeURIComponent(fallbackText)}`;
  };

  const calculateTotalDuration = () => {
    if (!course.modules || course.modules.length === 0) {
      return course.duration || 'Unknown';
    }

    let totalMinutes = 0;
    course.modules.forEach((module) => {
      const match = module.duration?.match(/(\d+)/);
      if (match) totalMinutes += parseInt(match[1]);
    });

    if (totalMinutes === 0) return course.duration || 'Unknown';

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const handleConfirmEnrollment = async () => {
    const success = await handleEnrollment();
    if (success) {
      setEnrollmentSuccess(true);
      setLocalIsEnrolled(true);
    }
  };

  const handleStartLearning = () => {
    // Fixed: Use correct route structure
    const learnUrl = `/${course.id}/learn${lastModuleId ? `?module=${lastModuleId}` : ''}`;
    router.push(learnUrl);
  };

  return (
    <>
      {/* Left Column - Course Details */}
      <div className="lg:col-span-2">
        {/* Course Hero */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6 lg:mb-8">
          <div className="relative">
            <img
              src={getSafeImageUrl(course.thumbnail, course.title)}
              alt={course.title}
              className="w-full h-48 sm:h-64 object-cover"
              onError={(e) => handleImageError(e, course.title)}
            />
            {course.preview_video && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-black bg-opacity-50 rounded-full p-3 sm:p-4 hover:bg-opacity-70 transition-opacity">
                  <PlayCircle className="text-white" size={32} />
                </button>
              </div>
            )}
            {localIsEnrolled && (
              <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                Enrolled
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{course.category}</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  course.level === 'Beginner'
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                    : course.level === 'Intermediate'
                    ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300'
                    : 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300'
                }`}
              >
                {course.level}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-4">{course.title}</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">{course.description}</p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Star className="text-yellow-500" size={16} />
                <span>{course.rating !== undefined ? course.rating.toFixed(1) : 'N/A'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span>{(course.totalStudents ?? 0).toLocaleString()} students</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>{calculateTotalDuration()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Updated {course.lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {['overview', 'curriculum', 'instructor', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8">
                {course.whatYouLearn && course.whatYouLearn.length > 0 && (
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">What you'll learn</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {course.whatYouLearn.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={16} />
                          <span className="text-gray-700 dark:text-gray-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {course.requirements && course.requirements.length > 0 && (
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Requirements</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                      {course.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.targetAudience && course.targetAudience.length > 0 && (
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Who this course is for</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                      {course.targetAudience.map((audience, index) => (
                        <li key={index}>{audience}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                  Course Curriculum ({course.modules?.length || 0} modules)
                </h3>
                {course.modules && course.modules.length > 0 ? (
                  <div className="space-y-4">
                    {course.modules.map((module, index) => (
                      <div
                        key={module.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{index + 1}.</span>
                          <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
                          <span className="font-medium text-gray-800 dark:text-white flex-1">{module.title}</span>
                          {module.duration && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">{module.duration}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No modules available</p>
                )}
              </div>
            )}

            {activeTab === 'instructor' && (
              <div>
                <div className="flex items-start gap-4 mb-6">
                  <img
                    src={getSafeImageUrl(course.instructor_image, course.instructor, '80/80')}
                    alt={course.instructor}
                    className="w-16 sm:w-20 h-16 sm:h-20 rounded-full object-cover"
                    onError={(e) => handleImageError(e, course.instructor, '80/80')}
                  />
                  <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white">{course.instructor}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">Course Instructor</p>
                  </div>
                </div>
                {course.instructor_bio && (
                  <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                    {parse(course.instructor_bio)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Student Reviews</h3>
                <div className="text-center py-8">
                  <Star className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500 dark:text-gray-400">Reviews will be available after enrollment</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Enrollment Card */}
      <div className="lg:col-span-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 sticky top-8">
          {/* Price */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              {course.originalPrice && course.originalPrice > (course.price ?? 0) && (
                <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500 line-through">
                  ${course.originalPrice}
                </span>
              )}
              <span className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
                {(course.price ?? 0) === 0 ? 'Free' : `$${course.price ?? 0}`}
              </span>
            </div>
            {course.originalPrice && course.originalPrice > (course.price ?? 0) && (
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                {Math.round((1 - (course.price ?? 0) / course.originalPrice) * 100)}% off
              </span>
            )}
          </div>

          {/* Action Button */}
          {localIsEnrolled ? (
            <button 
              onClick={handleStartLearning}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition-colors mb-4"
            >
              {lastModuleId ? 'Resume Course' : 'Start Course'}
            </button>
          ) : (
            <button
              onClick={() => setShowEnrollmentModal(true)}
              disabled={enrolling}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enrolling ? 'Enrolling...' : 'Enroll Now'}
            </button>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mt-4">
              {error}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">30-day money-back guarantee</p>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 dark:text-white">This course includes:</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{calculateTotalDuration()} on-demand video</span>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen size={16} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{course.modules?.length || 0} modules</span>
              </div>
              <div className="flex items-center gap-3">
                <Download size={16} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Downloadable resources</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe size={16} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Full lifetime access</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-gray-400 dark:text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Access on mobile and TV</span>
              </div>
              {course.certificate && (
                <div className="flex items-center gap-3">
                  <Award size={16} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Certificate of completion</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md sm:max-w-lg">
            {enrollmentSuccess ? (
              <>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-green-600 dark:text-green-400">Enrollment Successful!</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You have successfully enrolled in <strong>{course.title}</strong>. You can now start learning and access all course materials!
                </p>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">What's next?</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Access all course modules and materials</li>
                    <li>• Track your progress as you learn</li>
                    <li>• Join the course study group anytime</li>
                    <li>• Earn your completion certificate</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={handleStartLearning}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Start Learning
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">Confirm Enrollment</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You are about to enroll in <strong>{course.title}</strong>.
                  {(course.price ?? 0) > 0 && ` This will charge $${course.price ?? 0} to your account.`}
                </p>
                {error && (
                  <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
                    {error}
                  </div>
                )}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">What happens next?</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Immediate access to all course materials</li>
                    <li>• Progress tracking and completion certificates</li>
                    <li>• Join the course study group</li>
                    <li>• 30-day money-back guarantee</li>
                  </ul>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmEnrollment}
                    disabled={enrolling}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Processing...' : 'Confirm Enrollment'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
});

CourseEnrollment.displayName = 'CourseEnrollment';

export default CourseEnrollment;