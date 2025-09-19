'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Award, Download, Calendar, BookOpen, Star, User as LucideUser, ArrowLeft, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { User } from 'firebase/auth';

interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  studentName: string;
  completionDate: Date;
  issuedDate: Date;
  certificateUrl?: string;
}

export default function CertificatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isDark } = useTheme();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'course'>('newest');
  const [filterBy, setFilterBy] = useState<'all' | 'thisYear' | 'lastYear'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get friendly error messages
  const getFriendlyErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to access certificates. Please log in or contact support.';
      case 'not-found':
        return 'Certificates or course data not found.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  // Download certificate function with dark mode support
  const downloadCertificate = useCallback(
    (cert: Certificate) => {
      if (!cert) {
        toast.error('Certificate data not available');
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          toast.error('Unable to generate certificate: Canvas not supported');
          return;
        }

        canvas.width = 1600;
        canvas.height = 900;

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, isDark ? '#1f2937' : '#f8fafc');
        gradient.addColorStop(1, isDark ? '#374151' : '#e2e8f0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Outer border
        ctx.strokeStyle = isDark ? '#a78bfa' : '#d4af37';
        ctx.lineWidth = 12;
        ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

        // Inner border
        ctx.strokeStyle = isDark ? '#60a5fa' : '#1e40af';
        ctx.lineWidth = 4;
        ctx.strokeRect(90, 90, canvas.width - 180, canvas.height - 180);

        // Corner decorations
        const cornerSize = 80;
        ctx.fillStyle = isDark ? '#a78bfa' : '#d4af37';
        ctx.fillRect(90, 90, cornerSize, 8);
        ctx.fillRect(90, 90, 8, cornerSize);
        ctx.fillRect(canvas.width - 170, 90, cornerSize, 8);
        ctx.fillRect(canvas.width - 98, 90, 8, cornerSize);
        ctx.fillRect(90, canvas.height - 98, cornerSize, 8);
        ctx.fillRect(90, canvas.height - 170, 8, cornerSize);
        ctx.fillRect(canvas.width - 170, canvas.height - 98, cornerSize, 8);
        ctx.fillRect(canvas.width - 98, canvas.height - 170, 8, cornerSize);

        ctx.textAlign = 'center';

        // Title
        ctx.fillStyle = isDark ? '#93c5fd' : '#1e40af';
        ctx.font = 'bold 64px serif';
        ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 200);

        // Decorative line
        ctx.strokeStyle = isDark ? '#a78bfa' : '#d4af37';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 300, 230);
        ctx.lineTo(canvas.width / 2 + 300, 230);
        ctx.stroke();

        // Certificate text
        ctx.font = '28px serif';
        ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
        ctx.fillText('This is to certify that', canvas.width / 2, 300);

        // Student name
        ctx.font = 'bold 56px serif';
        ctx.fillStyle = isDark ? '#a78bfa' : '#d4af37';
        const studentName = cert.studentName || 'Student';
        ctx.fillText(studentName.toUpperCase(), canvas.width / 2, 380);

        // Underline for student name
        ctx.strokeStyle = isDark ? '#a78bfa' : '#d4af37';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const nameWidth = ctx.measureText(studentName.toUpperCase()).width;
        ctx.moveTo(canvas.width / 2 - nameWidth / 2 - 20, 400);
        ctx.lineTo(canvas.width / 2 + nameWidth / 2 + 20, 400);
        ctx.stroke();

        // Course completion text
        ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
        ctx.font = '28px serif';
        ctx.fillText('has successfully completed the course', canvas.width / 2, 460);

        // Course name
        ctx.font = 'bold 42px serif';
        ctx.fillStyle = isDark ? '#93c5fd' : '#1e40af';
        const courseName = cert.courseName || 'Course';
        ctx.fillText(courseName, canvas.width / 2, 530);

        // Completion date
        ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
        ctx.font = '24px serif';
        ctx.fillText(
          `Completed on ${cert.completionDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
          canvas.width / 2,
          600
        );

        // Quisef Learn branding
        ctx.fillStyle = isDark ? '#93c5fd' : '#1e40af';
        ctx.font = 'bold 32px serif';
        ctx.fillText('QUISEF LEARN', canvas.width / 2, 720);

        // Issue date
        ctx.fillStyle = isDark ? '#d1d5db' : '#64748b';
        ctx.font = '20px serif';
        ctx.fillText(
          `Issued on ${cert.issuedDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
          canvas.width / 2,
          760
        );

        // Download
        const link = document.createElement('a');
        link.download = `${studentName.replace(/\s+/g, '_')}_${courseName.replace(/\s+/g, '_')}_Certificate.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Certificate downloaded successfully!');
      } catch (error) {
        console.error('Error generating certificate:', error);
        toast.error('Failed to generate certificate');
      }
    },
    [isDark]
  );

  // Load user certificates with transaction support
  const loadUserCertificates = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch existing certificates
      const certificatesRef = collection(db, 'certificates');
      const certQuery = query(certificatesRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(certQuery);
      const userCertificates: Certificate[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId || userId,
          courseId: data.courseId || '',
          courseName: data.courseName || 'Untitled Course',
          studentName: data.studentName || user?.displayName || user?.email?.split('@')[0] || 'Student',
          completionDate: data.completionDate?.toDate() || new Date(),
          issuedDate: data.issuedDate?.toDate() || new Date(),
          certificateUrl: data.certificateUrl,
        };
      });

      // Fetch completed courses and generate missing certificates
      const progressRef = collection(db, 'users', userId, 'courseProgress');
      const progressQuery = query(progressRef, where('completed', '==', true));
      const progressSnapshot = await getDocs(progressQuery);

      for (const progressDoc of progressSnapshot.docs) {
        const progressData = progressDoc.data();
        const existingCert = userCertificates.find((cert) => cert.courseId === progressData.courseId);

        if (!existingCert && !progressData.certificateGenerated) {
          await runTransaction(db, async (transaction) => {
            // Read course data
            const courseRef = doc(db, 'courses', progressData.courseId);
            const courseSnap = await transaction.get(courseRef);

            if (!courseSnap.exists()) {
              console.warn(`Course ${progressData.courseId} not found for certificate generation`);
              return;
            }

            const courseData = courseSnap.data();
            const certificateData: Certificate = {
              id: '',
              userId,
              courseId: progressData.courseId,
              courseName: courseData.title || 'Untitled Course',
              studentName: user?.displayName || user?.email?.split('@')[0] || 'Student',
              completionDate: progressData.completionDate?.toDate() || new Date(),
              issuedDate: new Date(),
            };

            // Write new certificate
            const certificateRef = doc(collection(db, 'certificates'));
            transaction.set(certificateRef, certificateData);

            // Update progress with certificate details
            transaction.update(progressDoc.ref, {
              certificateGenerated: true,
              certificateId: certificateRef.id,
            });

            // Add to local state
            userCertificates.push({ ...certificateData, id: certificateRef.id });
            toast.success(`Certificate generated for ${courseData.title}`);
          });
        }
      }

      // Sort certificates (default: newest first)
      setCertificates(userCertificates.sort((a, b) => b.issuedDate.getTime() - a.issuedDate.getTime()));
    } catch (err: any) {
      console.error('Error loading certificates:', err);
      setError(getFriendlyErrorMessage(err));
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Authentication check and load certificates
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login?redirect=/certificates');
      return;
    }

    loadUserCertificates(user.uid);
  }, [user, authLoading, router, loadUserCertificates]);

  // Filter and sort certificates
  const getFilteredAndSortedCertificates = useCallback(() => {
    let filtered = certificates;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (cert) =>
          cert.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cert.studentName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const currentYear = new Date().getFullYear();
    if (filterBy === 'thisYear') {
      filtered = filtered.filter((cert) => cert.issuedDate.getFullYear() === currentYear);
    } else if (filterBy === 'lastYear') {
      filtered = filtered.filter((cert) => cert.issuedDate.getFullYear() === currentYear - 1);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.issuedDate.getTime() - a.issuedDate.getTime();
        case 'oldest':
          return a.issuedDate.getTime() - b.issuedDate.getTime();
        case 'course':
          return a.courseName.localeCompare(b.courseName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [certificates, searchTerm, filterBy, sortBy]);

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your certificates...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded max-w-md">
          {error}
        </div>
      </div>
    );
  }

  const filteredCertificates = getFilteredAndSortedCertificates();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/courses"
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Courses
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Certificates</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {certificates.length} certificate{certificates.length !== 1 ? 's' : ''} earned
                  </p>
                </div>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <LucideUser className="h-4 w-4" />
                  <span>{user.displayName || user.email}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900 focus:border-blue-500 transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                aria-label="Search certificates by course or student name"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as 'all' | 'thisYear' | 'lastYear')}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  aria-label="Filter certificates by date"
                >
                  <option value="all">All Time</option>
                  <option value="thisYear">This Year</option>
                  <option value="lastYear">Last Year</option>
                </select>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'course')}
                className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                aria-label="Sort certificates"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="course">Course Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Certificates Grid */}
        {filteredCertificates.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Award className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {searchTerm ? 'No certificates found' : 'No certificates yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {searchTerm
                  ? `No certificates match "${searchTerm}". Try a different search term.`
                  : certificates.length === 0
                    ? 'Complete your first course to earn a certificate and showcase your achievements!'
                    : 'Certificates are missing for some completed courses. Contact support or try refreshing.'
                }
              </p>
              {!searchTerm && (
                <Link href="/courses">
                  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
                    Browse Courses
                  </button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCertificates.map((certificate) => (
              <div
                key={certificate.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Certificate Preview */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 border-b-4 border-amber-400 dark:border-amber-600">
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                        <Star className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-2">
                      CERTIFICATE OF COMPLETION
                    </h3>
                    <div className="w-16 h-0.5 bg-amber-400 dark:bg-amber-600 mx-auto mb-3"></div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">This certifies that</p>
                    <h4 className="text-base font-bold text-amber-800 dark:text-amber-200 mb-2">
                      {certificate.studentName}
                    </h4>
                    <p className="text-sm text-amber-600 dark:text-amber-400">has completed</p>
                    <h5 className="text-sm font-bold text-amber-800 dark:text-amber-200 line-clamp-2">
                      {certificate.courseName}
                    </h5>
                  </div>
                </div>

                {/* Certificate Details */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {certificate.completionDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Course</p>
                        <p
                          className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1"
                          title={certificate.courseName}
                        >
                          {certificate.courseName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Issued</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {certificate.issuedDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => downloadCertificate(certificate)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 transform hover:scale-105"
                      aria-label={`Download certificate for ${certificate.courseName}`}
                    >
                      <Download className="h-5 w-5" />
                      Download Certificate
                    </button>
                    <Link href={`/courses/${certificate.courseId}`}>
                      <button
                        className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                        aria-label={`View course ${certificate.courseName}`}
                      >
                        <BookOpen className="h-5 w-5" />
                        View Course
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {certificates.length > 0 && (
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
              Your Learning Journey
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {certificates.length}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Certificate{certificates.length !== 1 ? 's' : ''} Earned
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {new Set(certificates.map((cert) => cert.courseId)).size}
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Course{new Set(certificates.map((cert) => cert.courseId)).size !== 1 ? 's' : ''} Completed
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                  {certificates.length > 0
                    ? Math.round(
                        (certificates.filter((cert) => cert.issuedDate.getFullYear() === new Date().getFullYear())
                          .length /
                          certificates.length) *
                          100
                      )
                    : 0}
                  %
                </div>
                <p className="text-gray-600 dark:text-gray-400">This Year</p>
              </div>
            </div>
            {certificates.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Most Recent Achievement</p>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 inline-block">
                    <p className="font-bold text-amber-800 dark:text-amber-200">
                      {certificates[0].courseName}
                    </p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      Completed{' '}
                      {certificates[0].completionDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Learn More?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Continue your learning journey with Quisef Learn. Explore new courses and add more certificates to your
            collection.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses">
              <button className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105">
                Browse All Courses
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}