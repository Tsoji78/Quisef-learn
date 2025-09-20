'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface Course {
  id: string;
  title: string;
}

interface Group {
  id: string;
  name: string;
  courseId: string;
  members: { id: string; name: string; email: string; role: string; profileImage?: string }[];
  assignments: { id: number; title: string; dueDate: any; status: string }[];
}

interface User {
  id: string;
  displayName: string;
  email: string;
}

interface CourseCompletion {
  name: string;
  value: number;
}

interface Engagement {
  course: string;
  engagement: number;
}

interface Notification {
  message: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'error';
}

interface Instructor {
  name: string;
  courses: number;
  rating: number;
  students: number;
  completion: number;
}

interface Activity {
  icon: string;
  action: string;
  user: string;
  time: string;
}

interface Deadline {
  task: string;
  date: string;
  urgent: boolean;
  color: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const { isDark } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [courseCompletionData, setCourseCompletionData] = useState<CourseCompletion[]>([]);
  const [engagementData, setEngagementData] = useState<Engagement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Helper to get friendly error messages
  const getFriendlyErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to access this data.';
      case 'not-found':
        return 'Requested data not found.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  // Fetch and process dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch courses
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const fetchedCourses: Course[] = coursesSnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || 'Untitled Course',
      }));
      setCourses(fetchedCourses);

      // Fetch groups
      const groupsSnapshot = await getDocs(collection(db, 'groups'));
      const fetchedGroups: Group[] = groupsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Group',
        courseId: doc.data().courseId || '',
        members: doc.data().members || [],
        assignments: doc.data().assignments || [],
      }));
      setGroups(fetchedGroups);

      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers: User[] = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        displayName: doc.data().displayName || doc.data().email?.split('@')[0] || 'Unknown User',
        email: doc.data().email || '',
      }));
      setUsers(fetchedUsers);

      // Course completion data
      const courseCompletion: CourseCompletion[] = fetchedCourses.map((course) => {
        const courseGroups = fetchedGroups.filter((g) => g.courseId === course.id);
        const totalMembers = courseGroups.reduce((sum, g) => sum + g.members.length, 0);
        const completedMembers = courseGroups.reduce(
          (sum, g) => sum + g.members.filter((m) => g.assignments.some((a) => a.status === 'Completed' && m.id === user.uid)).length,
          0
        );
        const completionRate = totalMembers > 0 ? (completedMembers / totalMembers) * 100 : 0;
        return { name: course.title, value: Math.round(completionRate) };
      });
      setCourseCompletionData(courseCompletion);

      // Engagement data
      const engagement: Engagement[] = await Promise.all(
        fetchedCourses.map(async (course) => {
          const courseGroups = fetchedGroups.filter((g) => g.courseId === course.id);
          const totalMessages = await Promise.all(
            courseGroups.map(async (group) => {
              const messagesSnapshot = await getDocs(collection(db, 'groups', group.id, 'chatForums', '1', 'messages'));
              return messagesSnapshot.size;
            })
          );
          return {
            course: course.title,
            engagement: totalMessages.reduce((sum, count) => sum + count, 0),
          };
        })
      );
      setEngagementData(engagement);

      // Notifications
      const notificationsData: Notification[] = fetchedGroups
        .flatMap((group) =>
          group.assignments.map((assignment) => ({
            message: `Assignment "${assignment.title}" in group "${group.name}" is ${assignment.status.toLowerCase()}`,
            time: assignment.dueDate?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
            type:
              assignment.status === 'Pending'
                ? 'warning'
                : assignment.status === 'Completed'
                ? 'success'
                : 'info',
          } as Notification))
        )
        .slice(0, 5);
      setNotifications(notificationsData);

      // Instructors
      const instructorsData: Instructor[] = fetchedUsers
        .filter((u) => fetchedGroups.some((g) => g.members.some((m) => m.id === u.id && m.role === 'Instructor')))
        .map((user) => {
          const instructorGroups = fetchedGroups.filter((g) => g.members.some((m) => m.id === user.id && m.role === 'Instructor'));
          const coursesCount = new Set(instructorGroups.map((g) => g.courseId)).size;
          const totalStudents = instructorGroups.reduce((sum, g) => sum + g.members.length, 0);
          const completedAssignments = instructorGroups.reduce((sum, g) => sum + g.assignments.filter((a) => a.status === 'Completed').length, 0);
          const totalAssignments = instructorGroups.reduce((sum, g) => sum + g.assignments.length, 0);
          const completion = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
          return {
            name: user.displayName,
            courses: coursesCount,
            rating: 4.5, // Placeholder; replace with actual data if available
            students: totalStudents,
            completion,
          };
        });
      setInstructors(instructorsData);

      // Recent activity
      const recentActivity: Activity[] = await Promise.all(
        fetchedGroups.slice(0, 5).map(async (group) => {
          const messagesSnapshot = await getDocs(collection(db, 'groups', group.id, 'chatForums', '1', 'messages'));
          const latestMessage = messagesSnapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                senderId: data.senderId,
                timestamp: data.timestamp,
                ...data,
              };
            })
            .sort((a, b) => (b.timestamp?.toDate?.()?.getTime() || 0) - (a.timestamp?.toDate?.()?.getTime() || 0))[0];
          const sender = fetchedUsers.find((u) => u.id === latestMessage?.senderId);
          return {
            icon: '💬',
            action: latestMessage ? `Sent a message in "${group.name}"` : `No recent messages in "${group.name}"`,
            user: sender?.displayName || 'Unknown',
            time: latestMessage?.timestamp?.toDate?.()?.toLocaleString() || new Date().toLocaleString(),
          };
        })
      );
      setRecentActivity(recentActivity);

      // Deadlines
      const deadlinesData: Deadline[] = fetchedGroups
        .flatMap((group) =>
          group.assignments.map((assignment) => {
            const dueDate = assignment.dueDate?.toDate?.() || new Date();
            const isUrgent = dueDate < new Date(Date.now() + 24 * 60 * 60 * 1000);
            return {
              task: `${assignment.title} (Group: ${group.name})`,
              date: dueDate.toLocaleDateString(),
              urgent: isUrgent,
              color: isUrgent ? 'text-red-500' : 'text-gray-600 dark:text-gray-400',
            };
          })
        )
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
      setDeadlines(deadlinesData);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle authentication and data fetching
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, authLoading, router, fetchDashboardData]);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded max-w-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-8 max-w-7xl mx-auto bg-gray-100 dark:bg-gray-900">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Students</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {groups.reduce((sum, g) => sum + g.members.length, 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-500 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Active Courses</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{courses.length}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-500 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
                {courseCompletionData.length > 0
                  ? Math.round(courseCompletionData.reduce((sum, c) => sum + c.value, 0) / courseCompletionData.length) + '%'
                  : '0%'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
              <svg className="w-6 h-6 text-yellow-500 dark:text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Course Completion Status</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={courseCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {courseCompletionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Course Engagement (Messages)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4b5563' : '#e5e7eb'} />
                <XAxis dataKey="course" stroke={isDark ? '#d1d5db' : '#374151'} />
                <YAxis stroke={isDark ? '#d1d5db' : '#374151'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                  }}
                />
                <Legend />
                <Bar dataKey="engagement" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Instructor Performance and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Top Instructor Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {['Instructor', 'Courses', 'Rating', 'Students', 'Completion %'].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {instructors.map((instructor, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-800 dark:text-white font-medium">{instructor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{instructor.courses}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-yellow-500 mr-1">★</span>
                        <span className="text-gray-600 dark:text-gray-300">{instructor.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{instructor.students}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${instructor.completion}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{instructor.completion}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Notifications</h2>
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
              {notifications.length} new
            </span>
          </div>
          <div className="space-y-4 max-h-80 overflow-auto">
            {notifications.map((notification, index) => {
              const colorClass =
                notification.type === 'error'
                  ? 'border-red-500'
                  : notification.type === 'warning'
                  ? 'border-yellow-500'
                  : notification.type === 'success'
                  ? 'border-green-500'
                  : 'border-blue-500';
              return (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${colorClass} bg-gray-50 dark:bg-gray-700`}>
                  <p className="text-gray-700 dark:text-gray-300">{notification.message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                </div>
              );
            })}
          </div>
          <button className="mt-4 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
            View All Notifications
          </button>
        </div>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                <div className="text-2xl mr-3">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{activity.action}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{activity.user}</p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
            View All Activity
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Courses', icon: '📚', color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
              { name: 'Users', icon: '👤', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
              { name: 'Analytics', icon: '📊', color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
              { name: 'Settings', icon: '⚙️', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
            ].map((link, index) => (
              <button
                key={index}
                className={`p-3 rounded-lg ${link.color} font-medium flex flex-col items-center justify-center h-24 hover:scale-105 transition-transform`}
              >
                <span className="text-2xl mb-2">{link.icon}</span>
                {link.name}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Upcoming Deadlines</h2>
          <ul className="space-y-3">
            {deadlines.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex items-center">
                  {item.urgent && <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />}
                  <span className="text-gray-700 dark:text-gray-300">{item.task}</span>
                </div>
                <span className={`text-sm font-medium ${item.color}`}>{item.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}