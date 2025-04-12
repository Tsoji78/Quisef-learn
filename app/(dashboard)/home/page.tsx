// app/dashboard/page.tsx
'use client';

import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard() {
 

  const courseCompletionData = [
    { name: 'Completed', value: 68 },
    { name: 'In Progress', value: 25 },
    { name: 'Not Started', value: 7 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const engagementData = [
    { course: 'React Basics', engagement: 89 },
    { course: 'CSS Masters', engagement: 72 },
    { course: 'TypeScript', engagement: 95 },
    { course: 'UI Design', engagement: 63 },
    { course: 'JavaScript', engagement: 78 },
    { course: 'Node.js', engagement: 81 },
  ];

  const revenueData = [
    { month: 'Jan', revenue: 3200 },
    { month: 'Feb', revenue: 4100 },
    { month: 'Mar', revenue: 3800 },
    { month: 'Apr', revenue: 5200 },
    { month: 'May', revenue: 6100 },
  ];

  // Mock data for notifications
  const notifications = [
    { message: 'New course proposal from Anna Miller', time: '10 minutes ago', type: 'info' },
    { message: 'Server maintenance scheduled for tonight', time: '2 hours ago', type: 'warning' },
    { message: '15 new students registered today', time: '5 hours ago', type: 'success' },
    { message: 'Payment system outage reported', time: 'Yesterday', type: 'error' },
  ];

  // Instructor performance data
  const instructors = [
    { name: 'John Doe', courses: 5, rating: 4.8, students: 126, completion: 92 },
    { name: 'Sarah Kim', courses: 3, rating: 4.9, students: 84, completion: 95 },
    { name: 'Mark Johnson', courses: 4, rating: 4.5, students: 108, completion: 87 },
  ];

  return (
    <div className="space-y-8">
      {/* Header Section with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Total Students</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">245</p>
              <p className="text-sm text-green-500 font-medium mt-2">↑ 12% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <svg className="w-6 h-6 text-blue-500 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Active Courses</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">12</p>
              <p className="text-sm text-green-500 font-medium mt-2">↑ 2 new this month</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <svg className="w-6 h-6 text-green-500 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Completion Rate</h3>
              <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">78%</p>
              <p className="text-sm text-green-500 font-medium mt-2">↑ 5% from last month</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <svg className="w-6 h-6 text-purple-500 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            Course Engagement (%)
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
              4 new
            </span>
          </div>
          <div className="space-y-4 max-h-80 overflow-auto">
            {notifications.map((notification, index) => {
              // Define colors based on notification type
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
            {[
              { action: 'Completed Course: React Basics', user: 'Emily Johnson', time: '2 hours ago', icon: '🏆' },
              { action: 'New Feedback: UI Design Guidelines', user: 'Michael Chen', time: 'Yesterday', icon: '💬' },
              { action: 'Course Updated: TypeScript Advanced', user: 'Sandra Miller', time: '2 days ago', icon: '📝' },
              { action: 'Forum Discussion: JavaScript Performance', user: 'Kevin Rodriguez', time: '3 days ago', icon: '🔄' },
              { action: 'New Resource Uploaded: Design System Templates', user: 'Laura Wilson', time: '5 days ago', icon: '📁' },
            ].map((activity, index) => (
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
                { name: 'Course', icon: '📚', color: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' },
                { name: 'Users', icon: '👤', color: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' },
                { name: 'Analytics', icon: '📊', color: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' },
                { name: 'Settings', icon: '⚙️', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
              ].map((link, index) => (
                <button
                  key={index}
                  className={`p-3 rounded-lg ${link.color} font-medium flex flex-col items-center justify-center text-center h-24`}
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
              {[
                { task: 'Final Project Reviews', date: 'Tomorrow', color: 'text-red-500', urgent: true },
                { task: 'Quiz: JavaScript Basics', date: 'Mar 23, 2025', color: 'text-amber-500', urgent: false },
                { task: 'Midterm Grading', date: 'Mar 25, 2025', color: 'text-green-500', urgent: false }
              ].map((item, index) => (
                <li key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    {item.urgent && <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>}
                    <span className="text-gray-700 dark:text-gray-300">{item.task}</span>
                  </div>
                  <span className={`text-sm font-medium ${item.color}`}>{item.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}