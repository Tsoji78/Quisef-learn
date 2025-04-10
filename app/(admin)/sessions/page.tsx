"use client"
import React, { useState, useEffect } from 'react';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';

// Initialize Firestore
const db = getFirestore();
import { format, parse, isValid } from 'date-fns';

// Activity type definition
interface Activity {
  id: string;
  title: string;
  time: string;
  location: string;
  className: string;
  date: string; // In 'yyyy-MM-dd' format
}

// Admin page component
const ScheduleAdminPage: React.FC = () => {
  // Activities state
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity>({
    id: '',
    title: '',
    time: '',
    location: '',
    className: 'bg-blue-100 text-blue-800',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  
  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [bulkImport, setBulkImport] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Color options for activities
  const colorOptions = [
    { value: 'bg-blue-100 text-blue-800', label: 'Blue' },
    { value: 'bg-green-100 text-green-800', label: 'Green' },
    { value: 'bg-purple-100 text-purple-800', label: 'Purple' },
    { value: 'bg-yellow-100 text-yellow-800', label: 'Yellow' },
    { value: 'bg-red-100 text-red-800', label: 'Red' },
    { value: 'bg-gray-100 text-gray-800', label: 'Gray' }
  ];

  // Load activities on component mount
  useEffect(() => {
    fetchActivities();
  }, []);

  // Fetch activities from Firestore
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const activitiesCollection = collection(db, 'activities');
      const activitiesSnapshot = await getDocs(activitiesCollection);
      
      const activitiesList: Activity[] = [];
      activitiesSnapshot.forEach((doc) => {
        const data = doc.data() as Omit<Activity, 'id'>;
        activitiesList.push({
          id: doc.id,
          ...data
        });
      });
      
      setActivities(activitiesList);
      applyFilters(activitiesList, searchTerm, dateFilter);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter activities based on search term and date
  const applyFilters = (activityList: Activity[], search: string, date: string) => {
    let filtered = [...activityList];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.title.toLowerCase().includes(searchLower) || 
        activity.location.toLowerCase().includes(searchLower)
      );
    }
    
    if (date) {
      filtered = filtered.filter(activity => activity.date === date);
    }
    
    // Sort by date
    filtered.sort((a, b) => {
      const dateComparison = a.date.localeCompare(b.date);
      if (dateComparison !== 0) return dateComparison;
      
      // If dates are the same, sort by time
      return a.time.localeCompare(b.time);
    });
    
    setFilteredActivities(filtered);
  };

  // Handle search and filter changes
  useEffect(() => {
    applyFilters(activities, searchTerm, dateFilter);
  }, [searchTerm, dateFilter, activities]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentActivity(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Clear form and prepare for adding new activity
  const handleAddNew = () => {
    setCurrentActivity({
      id: '',
      title: '',
      time: '',
      location: '',
      className: 'bg-blue-100 text-blue-800',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setIsEditing(false);
    setShowForm(true);
  };

  // Set up form for editing an existing activity
  const handleEdit = (activity: Activity) => {
    setCurrentActivity({...activity});
    setIsEditing(true);
    setShowForm(true);
  };

  // Save activity to Firestore
  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentActivity.title || !currentActivity.date) {
      alert('Title and date are required!');
      return;
    }
    
    try {
      let activityId = currentActivity.id;
      
      // Generate a new ID if adding, use existing ID if editing
      if (!isEditing) {
        activityId = `activity_${Date.now()}`;
      }
      
      const activityRef = doc(db, 'activities', activityId);
      
      if (isEditing) {
        // Update existing activity
        await updateDoc(activityRef, {
          title: currentActivity.title,
          time: currentActivity.time,
          location: currentActivity.location,
          className: currentActivity.className,
          date: currentActivity.date,
          updatedAt: Timestamp.now()
        });
      } else {
        // Add new activity
        await setDoc(activityRef, {
          title: currentActivity.title,
          time: currentActivity.time,
          location: currentActivity.location,
          className: currentActivity.className,
          date: currentActivity.date,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      // Refresh activities list
      fetchActivities();
      setShowForm(false);
      
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity. Please try again.');
    }
  };

  // Delete activity from Firestore
  const handleDeleteActivity = async (activityId: string) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await deleteDoc(doc(db, 'activities', activityId));
        fetchActivities();
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Failed to delete activity. Please try again.');
      }
    }
  };

  // Process bulk import of activities
  const handleBulkImport = async () => {
    if (!bulkImport.trim()) {
      alert('Please enter activities to import.');
      return;
    }
    
    try {
      // Split input by new lines
      const lines = bulkImport.trim().split('\n');
      const successfulImports = [];
      const failedImports = [];
      
      for (const line of lines) {
        // Parse line in format: YYYY-MM-DD Title @ Time | Location
        const match = line.match(/^(\d{4}-\d{2}-\d{2})\s+(.+?)(?:\s+@\s+(.+?))?(?:\s+\|\s+(.+))?$/);
        
        if (match) {
          const [, dateStr, title, time = '', location = ''] = match;
          const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
          
          if (isValid(parsedDate) && title) {
            // Create new activity
            const activityId = `activity_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            const activityRef = doc(db, 'activities', activityId);
            
            await setDoc(activityRef, {
              title,
              time,
              location,
              className: 'bg-blue-100 text-blue-800',
              date: dateStr,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            
            successfulImports.push(line);
          } else {
            failedImports.push({ line, reason: 'Invalid date or missing title' });
          }
        } else {
          failedImports.push({ line, reason: 'Invalid format' });
        }
      }
      
      // Show results
      if (successfulImports.length > 0) {
        alert(`Successfully imported ${successfulImports.length} activities!`);
        fetchActivities();
        setBulkImport('');
        setShowBulkImport(false);
      }
      
      if (failedImports.length > 0) {
        console.error('Failed imports:', failedImports);
        alert(`Failed to import ${failedImports.length} activities. Check console for details.`);
      }
      
    } catch (error) {
      console.error('Bulk import error:', error);
      alert('Error processing bulk import. Please check your input format.');
    }
  };

  // Export activities to CSV
  const handleExport = () => {
    // Create CSV content
    let csvContent = 'Date,Title,Time,Location,Color\n';
    
    filteredActivities.forEach(activity => {
      // Format as CSV row with quotes to handle commas in fields
      const row = [
        activity.date,
        `"${activity.title}"`,
        `"${activity.time}"`,
        `"${activity.location}"`,
        getColorLabel(activity.className)
      ].join(',');
      
      csvContent += row + '\n';
    });
    
    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `schedule_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    
    // Trigger download
    link.click();
    document.body.removeChild(link);
  };

  // Helper to get color label from className
  const getColorLabel = (className: string) => {
    const colorOption = colorOptions.find(option => option.value === className);
    return colorOption ? colorOption.label : 'Blue';
  };

  // Show loading indicator
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Main admin interface
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Schedule Admin</h1>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {/* Action buttons */}
        <div className="mb-6 flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={handleAddNew}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-lg flex items-center"
          >
            <span className="mr-1">+</span> Add Activity
          </button>
          
          <button
            onClick={() => setShowBulkImport(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-lg"
          >
            Bulk Import
          </button>
          
          <button
            onClick={handleExport}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 text-sm md:px-4 md:py-2 md:text-base rounded-lg"
            disabled={filteredActivities.length === 0}
          >
            Export CSV
          </button>
        </div>
        
        {/* Search and filter */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Filter Activities</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="Title or location..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </div>
        
        {/* Activities table/grid */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">
              Activities ({filteredActivities.length})
            </h2>
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Date Filter
              </button>
            )}
          </div>
          
          {filteredActivities.length > 0 ? (
            <>
              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Color
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredActivities.map((activity) => (
                      <tr key={activity.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {activity.date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {activity.title}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {activity.time}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {activity.location}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block rounded-full px-3 py-1 text-xs ${activity.className}`}>
                            {getColorLabel(activity.className)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(activity)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-gray-500">{activity.date}</div>
                      </div>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs ${activity.className}`}>
                        {getColorLabel(activity.className)}
                      </span>
                    </div>
                    
                    {(activity.time || activity.location) && (
                      <div className="text-sm text-gray-600 mb-3">
                        {activity.time && <div>{activity.time}</div>}
                        {activity.location && <div>{activity.location}</div>}
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEdit(activity)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center p-8 text-gray-500">
              No activities found. {searchTerm || dateFilter ? 'Try adjusting your filters.' : 'Add some activities to get started.'}
            </div>
          )}
        </div>
      </main>
      
      {/* Add/Edit Activity Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-4">
              {isEditing ? 'Edit Activity' : 'Add New Activity'}
            </h3>
            
            <form onSubmit={handleSaveActivity}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date*
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={currentActivity.date}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Title*
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={currentActivity.title}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    placeholder="Enter activity title"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    name="time"
                    value={currentActivity.time}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    placeholder="e.g., 09:00 AM"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={currentActivity.location}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                    placeholder="Enter location"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <select
                    name="className"
                    value={currentActivity.className}
                    onChange={handleInputChange}
                    className="w-full border rounded p-2"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-6 gap-2">
                <button
                  type="button"
                  className="px-3 py-2 border rounded hover:bg-gray-100"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isEditing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Bulk Import Activities</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter one activity per line:
              </label>
              <p className="text-sm text-gray-500 mb-2">
                YYYY-MM-DD Title @ Time | Location
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Example: 2024-04-10 Math Class @ 10:00 AM | Room 204
              </p>
              
              <textarea
                value={bulkImport}
                onChange={(e) => setBulkImport(e.target.value)}
                className="w-full border rounded p-2 h-40 sm:h-64"
                placeholder="Enter activities here..."
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 border rounded hover:bg-gray-100"
                onClick={() => setShowBulkImport(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleBulkImport}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleAdminPage;