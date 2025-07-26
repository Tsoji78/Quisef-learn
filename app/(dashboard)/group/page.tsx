'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, MessageCircle, FileText, Search, Send, Loader2 } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  doc,
  getDoc,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Instructor' | 'Teaching Assistant';
  profileImage?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed';
}

interface CourseGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  courseTitle?: string;
  members: Member[];
  assignments: Assignment[];
  createdAt?: Date;
}

// Memoized Group List Item
const GroupListItem = React.memo(({ 
  group, 
  isSelected, 
  onClick 
}: { 
  group: CourseGroup; 
  isSelected: boolean; 
  onClick: () => void; 
}) => (
  <div
    className={`
      p-4 cursor-pointer rounded-lg transition-colors duration-200
      ${isSelected ? 'bg-blue-100 border-l-4 border-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
    `}
    onClick={onClick}
  >
    <h3 className="font-semibold text-gray-800 dark:text-white truncate">{group.name}</h3>
    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">Course: {group.courseTitle || 'No Course'}</p>
    <div className="flex items-center gap-2 mt-2">
      <Users size={16} className="text-gray-500" />
      <span className="text-xs text-gray-600 dark:text-gray-400">{group.members.length} members</span>
    </div>
  </div>
));

// Memoized Member Item
const MemberItem = React.memo(({ member }: { member: Member }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div className="flex items-center gap-3">
      <img
        src={member.profileImage || '/api/placeholder/40/40?text=User'}
        alt={member.name}
        className="w-10 h-10 rounded-full object-cover"
      />
      <div>
        <p className="font-medium text-gray-800 dark:text-white">{member.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
        <span className={`
          text-xs px-2 py-1 rounded-full mt-1 inline-block
          ${member.role === 'Instructor' ? 'bg-green-100 text-green-800' :
            member.role === 'Teaching Assistant' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'}
        `}>
          {member.role}
        </span>
      </div>
    </div>
  </div>
));

// Memoized Message Item
const MessageItem = React.memo(({ 
  message, 
  senderName, 
  senderImage, 
  isCurrentUser 
}: { 
  message: Message; 
  senderName: string; 
  senderImage: string; 
  isCurrentUser: boolean; 
}) => (
  <div className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-[70%] p-3 rounded-lg ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
      {!isCurrentUser && (
        <div className="flex items-center gap-2 mb-1">
          <img src={senderImage} alt={senderName} className="w-6 h-6 rounded-full" />
          <span className="text-sm font-medium">{senderName}</span>
        </div>
      )}
      <p className="text-sm">{message.content}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {message.timestamp.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
      </p>
    </div>
  </div>
));

// Memoized Assignment Item
const AssignmentItem = React.memo(({ assignment }: { assignment: Assignment }) => (
  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <h4 className="font-medium text-gray-800 dark:text-white">{assignment.title}</h4>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{assignment.description}</p>
    <div className="flex items-center justify-between mt-2">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Due: {assignment.dueDate.toLocaleDateString()}
      </p>
      <span className={`
        text-xs px-2 py-1 rounded-full
        ${assignment.status === 'Completed' ? 'bg-green-100 text-green-800' :
          assignment.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'}
      `}>
        {assignment.status}
      </span>
    </div>
  </div>
));

const CourseGroupManagementPage: React.FC = () => {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CourseGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'chat' | 'assignments'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get friendly error message
  const getFriendlyErrorMessage = (error: any) => {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to access this group. Please enroll in the course.';
      case 'not-found':
        return 'Group not found.';
      default:
        return `An error occurred: ${error.message || 'Unknown error'}`;
    }
  };

  // Authentication check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setError('Please log in to access study groups.');
        router.push('/login');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch groups for enrolled courses
  useEffect(() => {
    if (!user || authLoading) return;

    setLoading(true);
    const fetchEnrolledGroups = async () => {
      try {
        // Fetch enrolled course IDs
        const enrollmentsRef = collection(db, 'users', user.uid, 'enrollments');
        const enrollmentsSnapshot = await getDocs(enrollmentsRef);
        const enrolledCourseIds = enrollmentsSnapshot.docs.map((doc) => doc.id);

        if (enrolledCourseIds.length === 0) {
          setError('You are not enrolled in any courses. Enroll in a course to join a study group.');
          setGroups([]);
          setSelectedGroup(null);
          setLoading(false);
          return;
        }

        // Fetch groups where user is a member
        const groupsQuery = query(
          collection(db, 'groups'),
          where('members', 'array-contains', {
            id: user.uid,
            name: user.displayName || 'Anonymous User',
            email: user.email || '',
            role: 'Student',
            profileImage: user.photoURL || '',
          })
        );

        const unsubscribe = onSnapshot(
          groupsQuery,
          async (snapshot) => {
            try {
              const groupsData: CourseGroup[] = [];
              for (const groupDoc of snapshot.docs) {
                const data = groupDoc.data();
                // Fetch course title
                let courseTitle = 'No Course';
                if (data.courseId) {
                  const courseRef = doc(db, 'courses', data.courseId);
                  const courseSnap = await getDoc(courseRef);
                  if (courseSnap.exists()) {
                    courseTitle = courseSnap.data()?.title || 'Untitled Course';
                  }
                }

                groupsData.push({
                  id: groupDoc.id,
                  name: data.name || 'Untitled Group',
                  description: data.description || 'No description available.',
                  courseId: data.courseId || '',
                  courseTitle,
                  members: Array.isArray(data.members) ? data.members : [],
                  assignments: Array.isArray(data.assignments)
                    ? data.assignments.map((a: any) => ({
                        ...a,
                        dueDate: a.dueDate?.toDate() || new Date(),
                      }))
                    : [],
                  createdAt: data.createdAt?.toDate(),
                });
              }

              setGroups(groupsData);
              setError(groupsData.length === 0 ? 'No study groups found for your enrolled courses.' : null);
              setLoading(false);
            } catch (err: any) {
              console.error('Error processing groups:', err.code, err.message, err);
              setError(getFriendlyErrorMessage(err));
              setGroups([]);
              setLoading(false);
            }
          },
          (err) => {
            console.error('Snapshot error:', err);
            setError(getFriendlyErrorMessage(err));
            setGroups([]);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (err: any) {
        console.error('Error fetching enrollments:', err.code, err.message, err);
        setError(getFriendlyErrorMessage(err));
        setGroups([]);
        setLoading(false);
      }
    };

    fetchEnrolledGroups();
  }, [user, authLoading]);

  // Auto-select group from query parameter
  useEffect(() => {
    if (!selectedGroup && groups.length > 0) {
      const groupId = searchParams.get('groupId');
      const groupToSelect = groups.find((g) => g.id === groupId) || groups[0];
      setSelectedGroup(groupToSelect);
      setActiveTab('chat'); // Default to chat tab
    }
  }, [groups, searchParams, selectedGroup]);

  // Fetch messages for selected group
  useEffect(() => {
    if (!selectedGroup || !user) return;

    const messagesQuery = query(
      collection(db, 'groups', selectedGroup.id, 'chatForums', 'default', 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          senderId: doc.data().senderId,
          senderName: doc.data().senderName || 'Unknown',
          content: doc.data().content,
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        }));
        setMessages(messagesData);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        toast.error('Failed to load messages.');
      }
    );

    return () => unsubscribe();
  }, [selectedGroup, user]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debounced search handler
  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Filtered members
  const filteredMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedGroup, searchTerm]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !user || sendingMessage) {
      toast.error('Please enter a message or ensure you are logged in.');
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      // Validate group membership
      const groupRef = doc(db, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) {
        throw new Error('Group does not exist.');
      }
      if (!groupSnap.data().members.some((m: Member) => m.id === user.uid)) {
        throw new Error('You are not a member of this group.');
      }

      // Add message
      await addDoc(
        collection(db, 'groups', selectedGroup.id, 'chatForums', 'default', 'messages'),
        {
          senderId: user.uid,
          senderName: user.displayName || 'Anonymous',
          content: messageContent,
          timestamp: serverTimestamp(),
        }
      );

      // Update forum metadata
      await updateDoc(doc(db, 'groups', selectedGroup.id, 'chatForums', 'default'), {
        lastMessageAt: serverTimestamp(),
      });

      toast.success('Message sent!');
    } catch (err: any) {
      console.error('Error sending message:', err.code, err.message, err);
      toast.error(getFriendlyErrorMessage(err));
      setNewMessage(messageContent); // Restore message on failure
    } finally {
      setSendingMessage(false);
    }
  };

  // Render members tab
  const renderMembersTab = () => {
    if (!selectedGroup) return null;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <Users className="mr-2 text-blue-500" /> Members ({filteredMembers.length})
        </h3>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search members..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => handleSearch(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => <MemberItem key={member.id} member={member} />)
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No members found matching "{searchTerm}"
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render chat tab
  const renderChatTab = () => {
    if (!selectedGroup) return null;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col h-[calc(100vh-200px)]">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white p-4 border-b dark:border-gray-700 flex items-center">
          <MessageCircle className="mr-2 text-blue-500" /> Group Chat
        </h3>
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length > 0 ? (
            messages.map((message) => {
              const sender = selectedGroup.members.find((m) => m.id === message.senderId);
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  senderName={sender?.name || message.senderName}
                  senderImage={sender?.profileImage || '/api/placeholder/40/40?text=User'}
                  isCurrentUser={message.senderId === user?.uid}
                />
              );
            })
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No messages yet. Start the conversation!
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sendingMessage && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sendingMessage}
            />
            <button
              onClick={sendMessage}
              disabled={sendingMessage || !newMessage.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {sendingMessage ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render assignments tab
  const renderAssignmentsTab = () => {
    if (!selectedGroup) return null;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <FileText className="mr-2 text-blue-500" /> Assignments ({selectedGroup.assignments.length})
        </h3>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedGroup.assignments.length > 0 ? (
            selectedGroup.assignments.map((assignment) => (
              <AssignmentItem key={assignment.id} assignment={assignment} />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No assignments available.
            </p>
          )}
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Study Groups</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Groups List */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white p-4 border-b dark:border-gray-700">
              Your Groups
            </h2>
            <div className="max-h-[80vh] overflow-y-auto">
              {groups.length > 0 ? (
                groups.map((group) => (
                  <GroupListItem
                    key={group.id}
                    group={group}
                    isSelected={selectedGroup?.id === group.id}
                    onClick={() => {
                      setSelectedGroup(group);
                      setActiveTab('chat');
                      setSearchTerm('');
                    }}
                  />
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No groups found. Enroll in a course to join a study group.
                </p>
              )}
            </div>
          </div>
          {/* Group Details */}
          <div className="lg:col-span-3">
            {selectedGroup ? (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedGroup.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{selectedGroup.description}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Course: {selectedGroup.courseTitle || 'No Course'}
                  </p>
                </div>
                <div className="flex border-b dark:border-gray-700 mb-6">
                  <button
                    onClick={() => setActiveTab('members')}
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'members'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Members
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'chat'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('assignments')}
                    className={`px-4 py-2 font-medium ${
                      activeTab === 'assignments'
                        ? 'border-b-2 border-blue-500 text-blue-500'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Assignments
                  </button>
                </div>
                {activeTab === 'members' && renderMembersTab()}
                {activeTab === 'chat' && renderChatTab()}
                {activeTab === 'assignments' && renderAssignmentsTab()}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  Select a group to view details or enroll in a course to join a study group.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseGroupManagementPage;