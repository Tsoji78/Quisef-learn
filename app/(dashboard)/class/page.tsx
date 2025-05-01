"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { db } from '@/lib/firebase'; // Adjust path as needed
import { collection, getDocs, query, where } from 'firebase/firestore';

interface Activity {
  id: string;
  title: string;
  time: string;
  location: string;
  className?: string;
  date: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  description: string;
  isPublic: boolean;
}

const PublicSchedulePage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch activities and public events from Firestore
  useEffect(() => {
    const fetchData = async () => {
      // Fetch activities
      const activitiesSnapshot = await getDocs(collection(db, 'activities'));
      const activitiesData = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
      setActivities(activitiesData);

      // Fetch public upcoming events
      const eventsQuery = query(collection(db, 'upcomingEvents'), where('isPublic', '==', true));
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UpcomingEvent[];
      setUpcomingEvents(eventsData);
    };

    fetchData();
  }, []);

  // Calendar setup
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Navigation and handlers
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Filter activities for selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedActivities = activities.filter(activity => activity.date === selectedDateKey);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative">
      <h1 className="text-3xl font-bold text-white mb-6">Class Schedule</h1>

      {/* Floating Dropdown Menu */}
      <div className="fixed top-20 right-4 z-50">
        <button
          onClick={toggleDropdown}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm flex items-center"
        >
          Upcoming Events
          <svg
            className="ml-2 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={isDropdownOpen ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
            ></path>
          </svg>
        </button>
        {isDropdownOpen && (
          <div className="mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Upcoming Events</h3>
              {upcomingEvents.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingEvents.map(event => (
                    <li key={event.id} className="border-b border-gray-200 pb-2">
                      <div className="font-semibold text-sm text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-600">{event.date} at {event.time}</div>
                      <div className="text-xs text-gray-600">{event.location}</div>
                      <div className="text-xs text-gray-600 capitalize">Frequency: {event.frequency}</div>
                      <div className="text-xs text-gray-600 mt-1">{event.description}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No upcoming events.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="flex justify-between items-center bg-gray-100 p-4">
            <button onClick={() => changeMonth('prev')} className="text-gray-600 hover:text-gray-800 transition">← Previous</button>
            <h2 className="text-2xl font-bold text-gray-800">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button onClick={() => changeMonth('next')} className="text-gray-600 hover:text-gray-800 transition">Next →</button>
          </div>
          <div className="grid grid-cols-7 gap-2 p-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 uppercase text-sm">{day}</div>
            ))}
            {calendarDays.map((day: Date) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const dayActivities = activities.filter(activity => activity.date === dateKey);

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
                    <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayActivities.map(activity => (
                      <div
                        key={activity.id}
                        className={`rounded px-2 py-1 text-xs ${activity.className || 'bg-gray-100'}`}
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
    </div>
  );
};

export default PublicSchedulePage;