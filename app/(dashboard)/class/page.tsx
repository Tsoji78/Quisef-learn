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

// Sample data - in a real app, this would come from an API or database
const sampleActivities: { [key: string]: Activity[] } = {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
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
            const activities = sampleActivities[dateKey] || [];

            return (
              <div
                key={day.toISOString()}
                className={`
                  border rounded-lg p-2 min-h-[120px]
                  ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
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
                  {activities.map((activity) => (
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
    </div>
  );
};

export default ClassSchedulePage;