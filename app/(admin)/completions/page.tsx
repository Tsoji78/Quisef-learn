'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

type CourseCompletion = { name: string; value: number };
type CourseCompletionDetail = { course: string; completed: number; inProgress: number; notStarted: number };

export default function CompletionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courseCompletionData, setCourseCompletionData] = useState<CourseCompletion[]>([]);
  const [completionDetails, setCompletionDetails] = useState<CourseCompletionDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  // Authentication check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setLoading(false);
          router.push('/login');
          return;
        }
        setUser(currentUser);
        setLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setLoading(false);
        router.push('/login');
      }
    );
    return () => unsubscribe();
  }, [router]);

  // Fetch completion data
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

        // Fetch Completions
        const completionsSnapshot = await getDocs(collection(db, 'completions'));
        const completions = completionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as { id: string; status: string; courseId: string; userId: string }[];

        // Aggregate Completion Data
        const courseCompletion: CourseCompletion[] = [
          { name: 'Completed', value: 0 },
          { name: 'In Progress', value: 0 },
          { name: 'Not Started', value: 0 },
        ];

        completions.forEach((completion) => {
          if (completion.status.toLowerCase() === 'completed') {
            courseCompletion[0].value += 1;
          } else if (completion.status.toLowerCase() === 'in_progress') {
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

        // Completion Details by Course
        const completionByCourse = courses.map((course) => {
          const courseCompletions = completions.filter((c) => c.courseId === course.id);
          return {
            course: course.title || 'Untitled Course',
            completed: courseCompletions.filter((c) => c.status.toLowerCase() === 'completed').length,
            inProgress: courseCompletions.filter((c) => c.status.toLowerCase() === 'in_progress').length,
            notStarted: courseCompletions.filter((c) => c.status.toLowerCase() !== 'completed' && c.status.toLowerCase() !== 'in_progress').length,
          };
        });
        setCompletionDetails(completionByCourse);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching completions:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading completions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Course Completions</h1>
        <button
          onClick={() => router.push('/homePage')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Completion Pie Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Completion Status</h2>
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

      {/* Completion Details by Course */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Completion by Course</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={completionDetails}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#0088FE" />
              <Bar dataKey="inProgress" stackId="a" fill="#00C49F" />
              <Bar dataKey="notStarted" stackId="a" fill="#FFBB28" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}