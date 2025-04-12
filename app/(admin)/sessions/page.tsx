"use client";

import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

// Sample activity type
interface Activity {
  id: number;
  title: string;
  time: string;
  location: string;
  className?: string;
}

// Sample data - initial activities
const initialActivities: { [key: string]: Activity[] } = {
  '2024-03-26': [
    {
      id: 1,
      title: 'Morning Yoga',
      time: '07:00 AM',
      location: 'Fitness Studio',
      className: 'bg-green-100 text-green-800',
    },
    {
      id: 2,
      title: 'Calculus Lecture',
      time: '10:00 AM',
      location: 'Math Building, Room 205',
      className: 'bg-blue-100 text-blue-800',
    },
  ],
  '2024-03-27': [
    {
      id: 3,
      title: 'Computer Science Workshop',
      time: '02:00 PM',
      location: 'Tech Center',
      className: 'bg-purple-100 text-purple-800',
    },
  ],
};

const ClassSchedulePage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState<{ [key: string]: Activity[] }>(initialActivities);
  const [newActivity, setNewActivity] = useState({
    title: '',
    time: '',
    location: '',
  });

  // Calculate days to display in the calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Navigate between months
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  // Handle day selection
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  // Handle activity form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewActivity((prev) => ({ ...prev, [name]: value }));
  };

  // Add new activity
  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title || !newActivity.time || !newActivity.location) return;

    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const newId = Date.now(); // Simple ID generation
    const activityColors = [
      'bg-green-100 text-green-800',
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-yellow-100 text-yellow-800',
    ];
    const randomColor = activityColors[Math.floor(Math.random() * activityColors.length)];

    const newEntry: Activity = {
      id: newId,
      title: newActivity.title,
      time: newActivity.time,
      location: newActivity.location,
      className: randomColor,
    };

    setActivities((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newEntry],
    }));

    // Reset form
    setNewActivity({ title: '', time: '', location: '' });
  };

  // Get activities for the selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedActivities = activities[selectedDateKey] || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Month Navigation */}
          <div className="flex justify-between items-center bg-gray-100 p-4">
            <button
              onClick={() => changeMonth('prev')}
              className="text-gray-600 hover:text-gray-800 transition"
            >
              ← Previous
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button
              onClick={() => changeMonth('next')}
              className="text-gray-600 hover:text-gray-800 transition"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2 p-4">
            {/* Weekday Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-600 uppercase text-sm"
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day: Date) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected =
                format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const dayActivities = activities[dateKey] || [];

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`
                    border rounded-lg p-2 min-h-[120px] cursor-pointer
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`
                        text-sm font-semibold
                        ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}
                      `}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Activities for the day */}
                  <div className="space-y-1">
                    {dayActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className={`
                          rounded px-2 py-1 text-xs
                          ${activity.className || 'bg-gray-100'}
                        `}
                      >
                        <div className="font-semibold">{activity.title}</div>
                        <div className="text-xs opacity-75">{activity.time}</div>
                        <div className="text-xs opacity-75">{activity.location}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Schedule and Activity Input Section */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          {/* Schedule Display */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Schedule for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {selectedActivities.length > 0 ? (
            <ul className="space-y-4 mb-6">
              {selectedActivities.map((activity) => (
                <li
                  key={activity.id}
                  className={`
                    rounded-lg p-3
                    ${activity.className || 'bg-gray-100 text-gray-800'}
                  `}
                >
                  <div className="font-semibold text-sm">{activity.title}</div>
                  <div className="text-xs text-gray-600">{activity.time}</div>
                  <div className="text-xs text-gray-600">{activity.location}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm mb-6">No activities scheduled for this day.</p>
          )}

          {/* Add Activity Form */}
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Add New Activity</h4>
          <form onSubmit={handleAddActivity} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                name="title"
                value={newActivity.title}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border rounded-lg text-sm"
                placeholder="e.g., Physics Lecture"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Time</label>
              <input
                type="text"
                name="time"
                value={newActivity.time}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border rounded-lg text-sm"
                placeholder="e.g., 09:00 AM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={newActivity.location}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border rounded-lg text-sm"
                placeholder="e.g., Lecture Hall A"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm"
            >
              Add Activity
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClassSchedulePage;