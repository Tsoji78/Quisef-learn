'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

type Enrollment = { month: string; students: number };
type CourseCompletion = { name: string; value: number };
type Engagement = { course: string; engagement: number };
type Revenue = { month: string; revenue: number };
type Notification = { message: string; time: string; type: string };
type Instructor = { name: string; courses: number; rating: number; students: number; completion: number };
type Activity = { action: string; user: string; time: string; icon: string };
type Deadline = { task: string; date: string; color: string; urgent: boolean };

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<Enrollment[]>([]);
  const [courseCompletionData, setCourseCompletionData] = useState<CourseCompletion[]>([]);
  const [engagementData, setEngagementData] = useState<Engagement[]>([]);
  const [revenueData, setRevenueData] = useState<Revenue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [totalDrafts, setTotalDrafts] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  // Navigation functions
  const navigateToStudents = () => router.push('/students');
  const navigateToCourses = () => router.push('/modules');
  const navigateToCompletions = () => router.push('/completions');
  const navigateToRevenue = () => router.push('/revenue');
  const navigateToDrafts = () => router.push('/drafts');

  // Authentication check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setLoading(false);
          window.location.href = '/login';
          return;
        }
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setLoading(false);
        window.location.href = '/login';
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch data from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Courses
        const coursesSnapshot = await getDocs(collection(db, 'courses'));
        const courses = coursesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as { id: string; title: string }[];

        // Fetch Course Drafts
        const draftsSnapshot = await getDocs(collection(db, 'courseDrafts'));
        setTotalDrafts(draftsSnapshot.size);

        // Fetch Revenue
        const revenueSnapshot = await getDocs(collection(db, 'revenue'));
        const revenueRecords = revenueSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as { id: string; amount: number; date: any }[];
        
        const totalRevenueAmount = revenueRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
        setTotalRevenue(totalRevenueAmount);

        // Fetch Users (Students)
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as { id: string; displayName: string; email: string; createdAt?: any }[];

        // Fetch Course Completions
        const completionsSnapshot = await getDocs(collection(db, 'completions'));
        const completions = completionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as { id: string; status: string; courseId: string; userId: string }[];

        // Fetch Groups for additional data
        const groupsSnapshot = await getDocs(collection(db, 'groups'));
        const groups = groupsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as {
          id: string;
          name: string;
          courseId: string;
          members: { id: string; name: string; email: string; role: string; profileImage?: string }[];
          assignments: { id: number; title: string; dueDate: any; status: string }[];
          createdAt?: any;
        }[];

        // Derive Enrollment Data (based on users collection)
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const enrollmentByMonth = users.reduce((acc, user) => {
          // Assuming users have a createdAt field, otherwise use current date
          const createdAt = user.createdAt?.toDate?.() || new Date();
          const month = months[createdAt.getMonth()];
          const year = createdAt.getFullYear();
          const key = `${month} ${year}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const enrollmentData: Enrollment[] = Object.entries(enrollmentByMonth)
          .map(([month, students]) => ({ month, students }))
          .sort((a, b) => {
            const [aMonth, aYear] = a.month.split(' ');
            const [bMonth, bYear] = b.month.split(' ');
            return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
          })
          .slice(-5); // Last 5 months
        setEnrollmentData(enrollmentData);

        // Derive Course Completion Data from completions collection
        const courseCompletion: CourseCompletion[] = [
          { name: 'Completed', value: 0 },
          { name: 'In Progress', value: 0 },
          { name: 'Not Started', value: 0 },
        ];
        
        completions.forEach((completion) => {
          if (completion.status === 'Completed' || completion.status === 'completed') {
            courseCompletion[0].value += 1;
          } else if (completion.status === 'In Progress' || completion.status === 'in_progress') {
            courseCompletion[1].value += 1;
          } else {
            courseCompletion[2].value += 1;
          }
        });
        
        const totalCompletions = courseCompletion.reduce((sum, c) => sum + c.value, 0);
        if (totalCompletions > 0) {
          courseCompletion.forEach((c) => {
            c.value = Math.round((c.value / totalCompletions) * 100);
          });
        }
        setCourseCompletionData(courseCompletion);

        // Derive Engagement Data
        const engagement: Engagement[] = await Promise.all(
          courses.map(async (course) => {
            const courseGroups = groups.filter((g) => g.courseId === course.id);
            const totalMessages = await Promise.all(
              courseGroups.map(async (group) => {
                try {
                  const messagesSnapshot = await getDocs(
                    collection(db, 'groups', group.id, 'chatForums', '1', 'messages')
                  );
                  return messagesSnapshot.size;
                } catch (error) {
                  return 0;
                }
              })
            );
            const engagementScore = totalMessages.reduce((sum, count) => sum + count, 0);
            return {
              course: course.title || 'Untitled Course',
              engagement: engagementScore,
            };
          })
        );
        setEngagementData(engagement);

        // Derive Revenue Data from revenue collection
        const revenueByMonth = revenueRecords.reduce((acc, record) => {
          const date = record.date?.toDate?.() || new Date();
          const month = months[date.getMonth()];
          const year = date.getFullYear();
          const key = `${month} ${year}`;
          acc[key] = (acc[key] || 0) + (record.amount || 0);
          return acc;
        }, {} as Record<string, number>);

        const revenueData: Revenue[] = Object.entries(revenueByMonth)
          .map(([month, revenue]) => ({ month, revenue }))
          .sort((a, b) => {
            const [aMonth, aYear] = a.month.split(' ');
            const [bMonth, bYear] = b.month.split(' ');
            return new Date(`${aMonth} 1, ${aYear}`).getTime() - new Date(`${bMonth} 1, ${bYear}`).getTime();
          })
          .slice(-5); // Last 5 months
        setRevenueData(revenueData);

        // Derive Notifications from completions
        const notifications: Notification[] = completions
          .slice(0, 4)
          .map((completion) => {
            const course = courses.find(c => c.id === completion.courseId);
            const user = users.find(u => u.id === completion.userId);
            return {
              message: `${user?.displayName || 'User'} ${completion.status.toLowerCase()} course "${course?.title || 'Unknown Course'}"`,
              time: new Date().toLocaleString(),
              type: completion.status === 'completed' ? 'success' : completion.status === 'in_progress' ? 'info' : 'warning',
            };
          });
        setNotifications(notifications);

        // Derive Instructors
        const instructors: Instructor[] = users
          .filter((u) => groups.some((g) => g.members?.some((m) => m.id === u.id && m.role === 'Instructor')))
          .map((user) => {
            const instructorGroups = groups.filter((g) => g.members?.some((m) => m.id === user.id && m.role === 'Instructor'));
            const courses = new Set(instructorGroups.map((g) => g.courseId)).size;
            const totalStudents = instructorGroups.reduce((sum, g) => sum + (g.members?.length || 0), 0);
            const userCompletions = completions.filter(c => c.userId === user.id && c.status === 'completed');
            const completion = completions.length > 0 ? Math.round((userCompletions.length / completions.length) * 100) : 0;
            return {
              name: user.displayName || user.email || 'Unknown Instructor',
              courses,
              rating: 4.5, // Placeholder (no rating data)
              students: totalStudents,
              completion,
            };
          });
        setInstructors(instructors);

        // Derive Recent Activity
        const recentActivity: Activity[] = completions
          .slice(0, 5)
          .map((completion) => {
            const course = courses.find(c => c.id === completion.courseId);
            const user = users.find(u => u.id === completion.userId);
            return {
              icon: completion.status === 'completed' ? '✅' : completion.status === 'in_progress' ? '📚' : '⏳',
              action: `${completion.status === 'completed' ? 'Completed' : completion.status === 'in_progress' ? 'Started working on' : 'Enrolled in'} "${course?.title || 'Unknown Course'}"`,
              user: user?.displayName || user?.email || 'Unknown User',
              time: new Date().toLocaleString(),
            };
          });
        setRecentActivity(recentActivity);

        // Derive Deadlines from groups assignments
        const deadlines: Deadline[] = groups
          .flatMap((group) =>
            (group.assignments || []).map((assignment) => {
              const dueDate = assignment.dueDate?.toDate?.() || new Date();
              const isUrgent = dueDate < new Date(Date.now() + 24 * 60 * 60 * 1000); // Due within 24 hours
              return {
                task: `${assignment.title} (Group: ${group.name})`,
                date: dueDate.toLocaleDateString(),
                urgent: isUrgent,
                color: isUrgent ? 'text-red-500' : 'text-amber-500',
              };
            })
          )
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3); // Limit to 3 deadlines
        setDeadlines(deadlines);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data from Firestore:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header Section with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Students Card */}
        <div 
          onClick={navigateToStudents}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg border-l-4 border-blue-500 cursor-pointer hover:scale-105"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Students</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {enrollmentData.reduce((sum, e) => sum + e.students, 0)}
              </p>
              <p className="text-sm text-green-500 font-medium mt-2">From users collection</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-500 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Active Courses Card */}
        <div 
          onClick={navigateToCourses}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg border-l-4 border-green-500 cursor-pointer hover:scale-105"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Active Courses</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{engagementData.length}</p>
              <p className="text-sm text-green-500 font-medium mt-2">From courses collection</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-500 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Course Drafts Card */}
        <div 
          onClick={navigateToDrafts}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg border-l-4 border-orange-500 cursor-pointer hover:scale-105"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Course Drafts</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{totalDrafts}</p>
              <p className="text-sm text-orange-500 font-medium mt-2">From courseDrafts collection</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <svg className="w-6 h-6 text-orange-500 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Completion Rate Card */}
        <div 
          onClick={navigateToCompletions}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg border-l-4 border-purple-500 cursor-pointer hover:scale-105"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {courseCompletionData.find((c) => c.name === 'Completed')?.value || 0}%
              </p>
              <p className="text-sm text-purple-500 font-medium mt-2">From completions collection</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <svg className="w-6 h-6 text-purple-500 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div 
          onClick={navigateToRevenue}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg border-l-4 border-yellow-500 cursor-pointer hover:scale-105"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                ${totalRevenue.toLocaleString()}
              </p>
              <p className="text-sm text-yellow-500 font-medium mt-2">From revenue collection</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-6 h-6 text-yellow-500 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Enrollment Trend Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Student Enrollment Trend
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="students" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course Completion Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Course Completion Status
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={courseCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {courseCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Engagement Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Course Engagement (Messages)
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="course" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="engagement" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Notifications Area */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Notifications
            </h2>
            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs font-medium rounded-full">
              {notifications.length} new
            </span>
          </div>
          <div className="space-y-4 max-h-80 overflow-auto">
            {notifications.map((notification, index) => {
              let colorClass = 'border-gray-200';
              if (notification.type === 'error') colorClass = 'border-red-500';
              else if (notification.type === 'warning') colorClass = 'border-yellow-500';
              else if (notification.type === 'success') colorClass = 'border-green-500';
              else if (notification.type === 'info') colorClass = 'border-blue-500';

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${colorClass} bg-gray-50 dark:bg-gray-700`}
                >
                  <p className="text-gray-700 dark:text-gray-300">{notification.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                </div>
              );
            })}
          </div>
          <button className="mt-4 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-center">
            View All Notifications
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Revenue Growth
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`$${value}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Instructor Performance Table */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Top Instructor Performance
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Completion %
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {instructors.map((instructor, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-800 dark:text-white">{instructor.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {instructor.courses}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-gray-600 dark:text-gray-300">{instructor.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {instructor.students}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-green-600 dark:bg-green-500 h-2.5 rounded-full"
                          style={{ width: `${instructor.completion}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{instructor.completion}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start border-b border-gray-200 dark:border-gray-700 pb-3"
              >
                <div className="text-2xl mr-3">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{activity.action}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{activity.user}</p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-center">
            View All Activity
          </button>
        </div>

        {/* Quick Access & Upcoming Deadlines */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { 
                  name: 'Create Course', 
                  icon: '➕', 
                  color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
                  onClick: () => router.push('/courses/create')
                },
                { 
                  name: 'Add Users', 
                  icon: '👤', 
                  color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
                  onClick: () => router.push('/users/add')
                },
                { 
                  name: 'Analytics', 
                  icon: '📊', 
                  color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
                  onClick: () => router.push('/analytics')
                },
                { 
                  name: 'Settings', 
                  icon: '⚙️', 
                  color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                  onClick: () => router.push('/settings')
                },
              ].map((link, index) => (
                <button
                  key={index}
                  onClick={link.onClick}
                  className={`p-3 rounded-lg ${link.color} font-medium flex flex-col items-center justify-center text-center h-24 hover:scale-105 transition-transform duration-200`}
                >
                  <span className="text-2xl mb-2">{link.icon}</span>
                  {link.name}
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Upcoming Deadlines
            </h2>
            <ul className="space-y-3">
              {deadlines.length > 0 ? deadlines.map((item, index) => (
                <li key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    {item.urgent && <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>}
                    <span className="text-gray-700 dark:text-gray-300">{item.task}</span>
                  </div>
                  <span className={`text-sm font-medium ${item.color}`}>{item.date}</span>
                </li>
              )) : (
                <li className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No upcoming deadlines
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}