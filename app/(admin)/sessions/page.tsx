"use client";

import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { db, auth } from '@/lib/firebase'; // Adjust path as needed
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

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

const ClassSchedulePage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState({ title: '', time: '', location: '' });
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [newEvent, setNewEvent] = useState<Omit<UpcomingEvent, 'id'>>({
    title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', location: '',
    frequency: 'once', description: '', isPublic: true,
  });
  const [showEventForm, setShowEventForm] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // Check authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login'); // Redirect to login page if not authenticated
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch activities and events from Firestore
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Fetch activities
      const activitiesSnapshot = await getDocs(collection(db, 'activities'));
      const activitiesData = activitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Activity[];
      setActivities(activitiesData);

      // Fetch upcoming events
      const eventsSnapshot = await getDocs(collection(db, 'upcomingEvents'));
      const eventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UpcomingEvent[];
      setUpcomingEvents(eventsData);
    };

    fetchData();
  }, [user]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewActivity((prev) => ({ ...prev, [name]: value }));
  };

  const handleEventInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const updatedValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setNewEvent((prev) => ({ ...prev, [name]: updatedValue }));
  };

  // Add activity to Firestore
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.title || !newActivity.time || !newActivity.location) return;

    const activityColors = [
      'bg-green-100 text-green-800', 'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800', 'bg-yellow-100 text-yellow-800',
    ];
    const randomColor = activityColors[Math.floor(Math.random() * activityColors.length)];

    const newEntry: Activity = {
      id: '',
      title: newActivity.title,
      time: newActivity.time,
      location: newActivity.location,
      className: randomColor,
      date: format(selectedDate, 'yyyy-MM-dd'),
    };

    const docRef = await addDoc(collection(db, 'activities'), newEntry);
    setActivities((prev) => [...prev, { ...newEntry, id: docRef.id }]);
    setNewActivity({ title: '', time: '', location: '' });
  };

  // Add event to Firestore
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.time) return;

    const newEventEntry: UpcomingEvent = { id: '', ...newEvent };
    const docRef = await addDoc(collection(db, 'upcomingEvents'), newEventEntry);
    setUpcomingEvents((prev) => [...prev, { ...newEventEntry, id: docRef.id }]);
    setNewEvent({
      title: '', date: format(new Date(), 'yyyy-MM-dd'), time: '', location: '',
      frequency: 'once', description: '', isPublic: true,
    });
    setShowEventForm(false);
  };

  // Delete event
  const handleDeleteEvent = async (eventId: string) => {
    await deleteDoc(doc(db, 'upcomingEvents', eventId));
    setUpcomingEvents((prev) => prev.filter(event => event.id !== eventId));
  };

  // Toggle event visibility
  const toggleEventVisibility = async (eventId: string) => {
    const event = upcomingEvents.find(e => e.id === eventId);
    if (!event) return;

    const updatedEvent = { ...event, isPublic: !event.isPublic };
    await updateDoc(doc(db, 'upcomingEvents', eventId), { isPublic: !event.isPublic });
    setUpcomingEvents(prev =>
      prev.map(e => e.id === eventId ? updatedEvent : e)
    );
  };

  // Sign out
  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  // Filter activities for selected date
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedActivities = activities.filter(activity => activity.date === selectedDateKey);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Schedule Activity</h1>
        
      </div>

      {/* Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Schedule and Activity Input */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Schedule for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {selectedActivities.length > 0 ? (
            <ul className="space-y-4 mb-6 ">
              {selectedActivities.map(activity => (
                <li
                  key={activity.id}
                  className={`rounded-lg p-3 ${activity.className || 'bg-gray-100 text-black'}`}
                >
                  <div className="font-semibold text-sm text-black">{activity.title}</div>
                  <div className="text-xs text-black">{activity.time}</div>
                  <div className="text-xs text-black">{activity.location}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-black text-sm mb-6">No activities scheduled for this day.</p>
          )}
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Add New Activity</h4>
          <form onSubmit={handleAddActivity} className="space-y-3 text-black">
            <div>
              <label className="block text-sm font-medium text-blue-400">Title</label>
              <input
                type="text"
                name="title"
                value={newActivity.title}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border rounded-lg text-sm"
                placeholder="e.g., course Lecture"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-400">Time</label>
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
              <label className="block text-sm font-medium text-blue-400">Location</label>
              <input
                type="text"
                name="location"
                value={newActivity.location}
                onChange={handleInputChange}
                className="mt-1 w-full p-2 border  rounded-lg text-sm"
                placeholder="e.g., online"
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

      {/* Upcoming Events Management */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Upcoming Events Management</h3>
          <button
            onClick={() => setShowEventForm(!showEventForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
          >
            {showEventForm ? 'Hide Form' : 'Add New Event'}
          </button>
        </div>
        {showEventForm && (
          <form onSubmit={handleAddEvent} className="bg-gray-50 p-4 rounded-lg text-black mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-blue-400">Event Title*</label>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleEventInputChange}
                  className="mt-1 w-full p-2 border rounded-lg text-sm"
                  placeholder="e.g., End of Term Exam"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-400">Date*</label>
                <input
                  type="date"
                  name="date"
                  value={newEvent.date}
                  onChange={handleEventInputChange}
                  className="mt-1 w-full p-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-400">Time*</label>
                <input
                  type="time"
                  name="time"
                  value={newEvent.time}
                  onChange={handleEventInputChange}
                  className="mt-1 w-full p-2 border rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-400">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newEvent.location}
                  onChange={handleEventInputChange}
                  className="mt-1 w-full p-2 border rounded-lg text-sm"
                  placeholder="e.g., Main Hall"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-400">Frequency</label>
                <select
                  name="frequency"
                  value={newEvent.frequency}
                  onChange={handleEventInputChange}
                  className="mt-1 w-full p-2 border rounded-lg text-sm"
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-400">Public</label>
                <div className="mt-2">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={newEvent.isPublic}
                    onChange={handleEventInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Show on public site</span>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-blue-400">Description</label>
              <textarea
                name="description"
                value={newEvent.description}
                onChange={handleEventInputChange}
                className="mt-1 w-full p-2 border rounded-lg text-sm"
                rows={3}
                placeholder="Brief description of the event"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Add Event
              </button>
            </div>
          </form>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Public</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(event => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{event.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.date} at {event.time}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.location}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{event.frequency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => toggleEventVisibility(event.id)}
                        className={`px-3 py-1 rounded-full text-xs ${
                          event.isPublic ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.isPublic ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No upcoming events added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassSchedulePage;