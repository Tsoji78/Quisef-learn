'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Activity {
  id: string;
  title: string;
  time: string;
  location: string;
  className?: string;
  date: string; // Format: 'yyyy-MM-dd'
}

interface UpcomingEvent {
  id: string;
  title: string;
  date: string; // Format: 'yyyy-MM-dd'
  time: string;
  location: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  description: string;
  isPublic: boolean;
}

const PublicSchedulePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to get friendly error messages
  const getFriendlyErrorMessage = (error: any): string => {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to view this schedule. Please log in or contact support.';
      case 'not-found':
        return 'Schedule data not found.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  };

  // Fetch activities and public events from Firestore
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch activities
      const activitiesSnapshot = await getDocs(collection(db, 'activities'));
      const activitiesData: Activity[] = activitiesSnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || 'Untitled Activity',
        time: doc.data().time || 'Unknown Time',
        location: doc.data().location || 'Unknown Location',
        className: doc.data().className || 'bg-gray-100',
        date: doc.data().date || format(new Date(), 'yyyy-MM-dd'),
      }));
      setActivities(activitiesData);

      // Fetch public upcoming events
      const eventsQuery = query(collection(db, 'upcomingEvents'), where('isPublic', '==', true));
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData: UpcomingEvent[] = eventsSnapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title || 'Untitled Event',
        date: doc.data().date || format(new Date(), 'yyyy-MM-dd'),
        time: doc.data().time || 'Unknown Time',
        location: doc.data().location || 'Unknown Location',
        frequency: ['once', 'daily', 'weekly', 'monthly', 'yearly'].includes(doc.data().frequency)
          ? doc.data().frequency
          : 'once',
        description: doc.data().description || 'No description available.',
        isPublic: doc.data().isPublic || false,
      }));
      setUpcomingEvents(eventsData);
    } catch (err: any) {
      console.error('Error fetching schedule data:', err);
      setError(getFriendlyErrorMessage(err));
      toast.error(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle authentication and data fetching
  useEffect(() => {
    if (authLoading) return;

    // Redirect to login if user is not authenticated and Firestore rules require it
    if (!user) {
      router.push('/login?redirect=/schedule');
      return;
    }

    fetchData();
  }, [user, authLoading, router, fetchData]);

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
    setIsDropdownOpen((prev) => !prev);
  };

  // Filter activities for selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedActivities = activities.filter((activity) => activity.date === selectedDateKey);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading schedule...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center items-center">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded max-w-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl bg-gray-100 dark:bg-gray-900">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Class Schedule</h1>

      {/* Floating Dropdown Menu */}
      <div className="fixed top-20 right-4 z-50">
        <button
          onClick={toggleDropdown}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center"
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
            />
          </svg>
        </button>
        {isDropdownOpen && (
          <div className="mt-2 w-80 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Upcoming Events</h3>
              {upcomingEvents.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <li key={event.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{event.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {event.date} at {event.time}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{event.location}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">Frequency: {event.frequency}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{event.description}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Calendar and Activities Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
          <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 p-4">
            <button
              onClick={() => changeMonth('prev')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition"
            >
              ← Previous
            </button>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button
              onClick={() => changeMonth('next')}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition"
            >
              Next →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-2 p-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-600 dark:text-gray-300 uppercase text-sm">
                {day}
              </div>
            ))}
            {calendarDays.map((day: Date) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const dayActivities = activities.filter((activity) => activity.date === dateKey);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`
                    border rounded-lg p-2 min-h-[120px] cursor-pointer transition
                    ${isCurrentMonth ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500'}
                    ${isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-sm font-semibold ${
                        isCurrentMonth ? 'text-gray-800 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {dayActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className={`rounded px-2 py-1 text-xs ${activity.className || 'bg-gray-100 dark:bg-gray-700'}`}
                      >
                        <div className="font-semibold text-gray-800 dark:text-gray-100">{activity.title}</div>
                        <div className="text-gray-600 dark:text-gray-400">{activity.time}</div>
                        <div className="text-gray-600 dark:text-gray-400">{activity.location}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Activities */}
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Activities for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {selectedActivities.length > 0 ? (
            <ul className="space-y-3">
              {selectedActivities.map((activity) => (
                <li key={activity.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{activity.title}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{activity.time}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{activity.location}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No activities scheduled for this date.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicSchedulePage;