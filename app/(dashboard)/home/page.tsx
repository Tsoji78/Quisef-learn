// app/dashboard/page.tsx


export default function Dashboard() {
  // This will be rendered inside the Layout component from dashboard/layout.tsx

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Welcome Card */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Welcome Back!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          You have 3 new courses to review and 5 pending assignments.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Courses</h3>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">12</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Active Courses</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
        <h3 className="text-lg font-medium text-gray-800 dark:text-white">Courses</h3>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">245</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Available</p>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md md:col-span-2 lg:col-span-3">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[
            { action: 'Completed Course: React Basics', time: '2 hours ago' },
            { action: 'Submitted Assignment: CSS Grid', time: 'Yesterday' },
            { action: 'Started Course: TypeScript', time: '2 days ago' },
            { action: 'Joined Discussion: JavaScript Performance', time: '3 days ago' },
            { action: 'Uploaded Resource: UI Design Guidelines', time: '5 days ago' },
          ].map((activity, index) => (
            <div
              key={index}
              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2"
            >
              <span className="text-gray-600 dark:text-gray-300">{activity.action}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Quick Links
        </h2>
        <div className="space-y-2">
          {[
            { name: 'Create Course', icon: '➕' },
            { name: 'Grade Assignments', icon: '✅' },
            { name: 'View Analytics', icon: '📈' },
            { name: 'Message Students', icon: '💬' }
          ].map((link, index) => (
            <button
              key={index}
              className="w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 
                dark:hover:bg-gray-700 rounded-md transition-colors flex items-center"
            >
              <span className="mr-2">{link.icon}</span>
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
            { task: 'Final Project Reviews', date: 'Tomorrow, 11:59 PM' },
            { task: 'Quiz: JavaScript Basics', date: 'Mar 23, 2025' },
            { task: 'Midterm Grading', date: 'Mar 25, 2025' }
          ].map((item, index) => (
            <li key={index} className="flex justify-between">
              <span className="text-gray-700 dark:text-gray-300">{item.task}</span>
              <span className="text-sm font-medium text-red-500">{item.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
