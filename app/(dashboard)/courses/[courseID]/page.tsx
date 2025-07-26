'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, addDoc, arrayUnion, increment, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { ArrowLeft, Clock, Users, Star, CheckCircle, PlayCircle, BookOpen, Award, Shield, Calendar, Globe, Download } from 'lucide-react';
import Link from 'next/link';
import parse from 'html-react-parser';
import { toast } from 'react-hot-toast';
import { Timestamp } from 'firebase/firestore';

interface Module {
  id: string;
  title: string;
  content: string;
  duration?: string;
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  price: number;
  originalPrice?: number;
  thumbnail: string;
  category: string;
  modules: Module[];
  rating: number;
  totalStudents: number;
  lastUpdated: string;
  language: string;
  certificate: boolean;
  requirements: string[];
  whatYouLearn: string[];
  targetAudience: string[];
  instructor_bio?: string;
  instructor_image?: string;
  preview_video?: string;
  groupId?: string;
}

interface Enrollment {
  courseId: string;
  userId: string;
  enrolledAt: Date;
  status: 'active' | 'completed' | 'paused';
}

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Instructor' | 'Teaching Assistant';
  profileImage?: string;
}

export default function CourseEnrollmentPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');

  // Handle authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser && courseId) {
        checkEnrollmentStatus(currentUser.uid, courseId);
      }
    });
    return () => unsubscribe();
  }, [courseId]);

  // Check enrollment status
  const checkEnrollmentStatus = async (userId: string, courseId: string) => {
    try {
      const enrollmentRef = doc(db, 'users', userId, 'enrollments', courseId);
      const enrollmentSnap = await getDoc(enrollmentRef);
      setIsEnrolled(enrollmentSnap.exists());
    } catch (err) {
      console.error('Error checking enrollment:', err);
      setError('Failed to check enrollment status');
    }
  };

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError('No course ID provided');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCourse({
            id: docSnap.id,
            title: data.title || 'Untitled Course',
            instructor: data.instructor || 'Unknown Instructor',
            description: data.description || 'No description available.',
            level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level) ? data.level : 'Beginner',
            duration: data.duration || 'Unknown',
            price: data.price || 0,
            originalPrice: data.originalPrice,
            thumbnail: data.thumbnail || '/api/placeholder/400/250?text=No+Image',
            category: data.category || 'Uncategorized',
            modules: Array.isArray(data.modules) ? data.modules : [],
            rating: data.rating || 4.5,
            totalStudents: data.totalStudents || 0,
            lastUpdated: data.lastUpdated || 'Recently',
            language: data.language || 'English',
            certificate: data.certificate || false,
            requirements: data.requirements || [],
            whatYouLearn: data.whatYouLearn || [],
            targetAudience: data.targetAudience || [],
            instructor_bio: data.instructor_bio,
            instructor_image: data.instructor_image,
            preview_video: data.preview_video,
            groupId: data.groupId,
          });
          setError(null);
        } else {
          setError('Course not found');
        }
      } catch (err: any) {
        console.error('Error fetching course:', err);
        setError(`Failed to load course: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  // Handle enrollment with relaxed group membership logic
  const handleEnrollment = async () => {
    if (!user || !course) {
      router.push('/login');
      return;
    }
    setEnrolling(true);
    let groupId: string | null = course.groupId || null;

    try {
      // Check or create group outside transaction
      if (!groupId) {
        const groupsQuery = query(collection(db, 'groups'), where('courseId', '==', course.id));
        const groupsSnapshot = await getDocs(groupsQuery);
        if (!groupsSnapshot.empty) {
          groupId = groupsSnapshot.docs[0].id;
        } else {
          // Create new group
          const groupRef = doc(collection(db, 'groups'));
          const newGroup = {
            name: `${course.title} Study Group`,
            description: `Study group for ${course.title}`,
            courseId: course.id,
            members: [],
            assignments: [],
            createdAt: Timestamp.fromDate(new Date()),
          };
          await setDoc(groupRef, newGroup);
          groupId = groupRef.id;

          // Create default chat forum
          await setDoc(doc(db, 'groups', groupId, 'chatForums', 'default'), {
            id: 'default',
            title: 'General Discussion',
            description: 'General discussion for the course',
            memberCount: 0,
            lastMessageAt: Timestamp.fromDate(new Date()),
          });
        }
      }

      await runTransaction(db, async (transaction) => {
        // Check if already enrolled
        const enrollmentRef = doc(db, 'users', user.uid, 'enrollments', course.id);
        const enrollmentSnap = await transaction.get(enrollmentRef);
        if (enrollmentSnap.exists()) {
          throw new Error('You are already enrolled in this course.');
        }

        // Create enrollment
        const enrollmentData: Enrollment = {
          courseId: course.id,
          userId: user.uid,
          enrolledAt: new Date(),
          status: 'active',
        };
        transaction.set(enrollmentRef, enrollmentData);

        // Initialize progress
        const progressRef = doc(db, 'users', user.uid, 'courseProgress', course.id);
        transaction.set(progressRef, {
          readModules: {},
          scrollPositions: {},
          lastReadDate: new Date(),
          courseId: course.id,
          userId: user.uid,
          progress: 0,
        });

        // Update course total students and groupId
        const courseRef = doc(db, 'courses', course.id);
        transaction.update(courseRef, {
          totalStudents: increment(1),
          groupId: groupId,
        });

        // Add user to group
        const groupRef = doc(db, 'groups', groupId!);
        const groupSnap = await transaction.get(groupRef);
        if (!groupSnap.exists()) {
          throw new Error('Group not found.');
        }
        const groupData = groupSnap.data();
        const newMember: Member = {
          id: user.uid,
          name: user.displayName || 'Anonymous User',
          email: user.email || '',
          role: 'Student',
          profileImage: user.photoURL || '',
        };
        const isMember = groupData.members.some((m: Member) => m.id === user.uid);
        if (!isMember) {
          transaction.update(groupRef, {
            members: arrayUnion(newMember),
          });

          // Add welcome message
          const welcomeMessageRef = doc(collection(db, 'groups', groupId!, 'chatForums', 'default', 'messages'));
          transaction.set(welcomeMessageRef, {
            senderId: 'system',
            senderName: 'System',
            content: `Welcome ${user.displayName || 'new member'} to the ${course.title} study group!`,
            timestamp: serverTimestamp(),
          });
        }
      });

      setIsEnrolled(true);
      setEnrollmentSuccess(true);
      setError(null);
      toast.success('Enrolled successfully and added to course group!');
      router.push(`/groups?groupId=${groupId}`);
    } catch (err: any) {
      console.error('Enrollment error:', err);
      setError(`Failed to enroll: ${err.message || 'Unknown error'}`);
      toast.error(`Failed to enroll: ${err.message || 'Unknown error'}`);
    } finally {
      setEnrolling(false);
    }
  };

  // Calculate total duration
  const calculateTotalDuration = () => {
    if (!course?.modules) return course?.duration || 'Unknown';
    let totalMinutes = 0;
    course.modules.forEach((module) => {
      const match = module.duration?.match(/(\d+)/);
      if (match) totalMinutes += parseInt(match[1]);
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error || 'Course not found'}
          </div>
          <Link href="/courses" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/courses" className="flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft size={18} className="mr-2" />
            Back to Courses
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8">
              <div className="relative">
                <img src={course.thumbnail} alt={course.title} className="w-full h-64 object-cover" />
                {course.preview_video && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="bg-black bg-opacity-50 rounded-full p-4 hover:bg-opacity-70 transition-opacity">
                      <PlayCircle className="text-white" size={48} />
                    </button>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-blue-600 font-medium">{course.category}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                    course.level === 'Intermediate' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {course.level}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">{course.title}</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{course.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="text-yellow-500" size={16} />
                    <span>{course.rating}</span>
                  </div>
                  <p>{course.totalStudents.toLocaleString()} students</p>
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-gray-200 dark:border-b-gray-600">
                <nav className="flex">
                  {['overview', 'curriculum', 'instructor', 'reviews'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-6 py-4 text-sm font-medium capitalize ${
                        activeTab === tab
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {course.whatYouLearn.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">What you'll learn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {course.whatYouLearn.map((item, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={16} />
                              <span className="text-gray-700 dark:text-gray-300">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {course.requirements.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Requirements</h3>
                        <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                          {course.requirements.map((req, index) => (
                            <li key={index}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {course.targetAudience.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Who this course is for</h3>
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
                    <h3 className="text-xl font-semibold mb-4">Course Curriculum ({course.modules.length} modules)</h3>
                    <div className="space-y-4">
                      {course.modules.map((module, index) => (
                        <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 dark:text-gray-400">{index + 1}.</span>
                            <BookOpen size={16} className="text-gray-400" />
                            <span className="font-medium text-gray-800 dark:text-white">{module.title}</span>
                            {module.duration && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">{module.duration}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'instructor' && (
                  <div>
                    <div className="flex items-start gap-4 mb-6">
                      <img
                        src={course.instructor_image || '/api/placeholder/80/80?text=Instructor'}
                        alt={course.instructor}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{course.instructor}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">Course Instructor</p>
                      </div>
                    </div>
                    {course.instructor_bio && (
                      <div className="prose dark:prose-invert max-w-none">{parse(course.instructor_bio)}</div>
                    )}
                  </div>
                )}
                {activeTab === 'reviews' && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Student Reviews</h3>
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">Reviews will be available after enrollment</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 sticky top-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  {course.originalPrice && course.originalPrice > course.price && (
                    <span className="text-2xl font-bold text-gray-400 line-through">${course.originalPrice}</span>
                  )}
                  <span className="text-3xl font-bold text-gray-800 dark:text-white">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </span>
                </div>
                {course.originalPrice && course.originalPrice > course.price && (
                  <span className="text-sm text-red-600 font-medium">
                    {Math.round((1 - course.price / course.originalPrice) * 100)}% off
                  </span>
                )}
              </div>
              {isEnrolled ? (
                <Link href={`/courses/${course.id}/learn`}>
                  <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-4">
                    Resume Course
                  </button>
                </Link>
              ) : (
                <button
                  onClick={() => setShowEnrollmentModal(true)}
                  disabled={enrolling || authLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Enrolling...' : authLoading ? 'Loading...' : 'Enroll Now'}
                </button>
              )}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">{error}</div>
              )}
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">30-day money-back guarantee</p>
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 dark:text-white">This course includes:</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{calculateTotalDuration()} on-demand video</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{course.modules.length} modules</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Download size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Downloadable resources</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Access on mobile and TV</span>
                  </div>
                  {course.certificate && (
                    <div className="flex items-center gap-3">
                      <Award size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Certificate of completion</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEnrollmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            {enrollmentSuccess ? (
              <>
                <h3 className="text-xl font-semibold mb-4 text-green-600">Enrollment Successful!</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You have successfully enrolled in <strong>{course.title}</strong>. You can now start learning and join the study group!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <Link href={`/courses/${course.id}/learn`} className="flex-1">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                      Continue to Course
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold mb-4">Confirm Enrollment</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You are about to enroll in <strong>{course.title}</strong>.
                  {course.price > 0 && ` This will charge $${course.price} to your account.`}
                </p>
                {error && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>
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
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEnrollmentModal(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEnrollment}
                    disabled={enrolling}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {enrolling ? 'Processing...' : 'Confirm Enrollment'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}