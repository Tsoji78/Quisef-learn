'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  FileText, 
  Plus, 
  Search,
  Send,
  X
} from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  arrayUnion, 
  addDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Interfaces for data structures
interface Member {
  id: string; // Changed to string for Firestore compatibility
  name: string;
  email: string;
  role: 'Student' | 'Instructor' | 'Teaching Assistant';
  profileImage?: string;
}

interface Message {
  id: string; // Changed to string for Firestore document IDs
  senderId: string;
  content: string;
  timestamp: Date;
}

interface ChatForum {
  id: number; // Kept as number to match previous group creation logic
  title: string;
  description: string;
  memberCount: number;
  lastMessageAt: Date;
  messages: Message[];
}

interface Assignment {
  id: number;
  title: string;
  dueDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed';
}

interface CourseGroup {
  id: string; // Changed to string for Firestore document IDs
  name: string;
  description: string;
  courseId: string;
  members: Member[];
  chatForums: ChatForum[];
  assignments: Assignment[];
  createdAt?: Date;
}

const CourseGroupManagementPage: React.FC = () => {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CourseGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'forums' | 'assignments'>('members');
  const [selectedForum, setSelectedForum] = useState<ChatForum | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Modal states
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [showNewForumModal, setShowNewForumModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');

  // Authentication check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        router.push('/login'); // Redirect to login if not authenticated
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch groups where the user is a member
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, 'groups'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const groupsData: CourseGroup[] = snapshot.docs
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.name || 'Untitled Group',
                description: data.description || '',
                courseId: data.courseId || '',
                members: data.members || [],
                chatForums: data.chatForums || [],
                assignments: data.assignments || [],
                createdAt: data.createdAt?.toDate(),
              } as CourseGroup;
            })
            .filter((group) =>
              group.members.some((member) => member.id === user.uid)
            );

          setGroups(groupsData);
          setError(groupsData.length === 0 ? 'No groups found. Enroll in a course to join groups.' : null);
          setLoading(false);
          if (groupsData.length > 0 && !selectedGroup) {
            setSelectedGroup(groupsData[0]);
          }
        } catch (err: any) {
          console.error('Error fetching groups:', err);
          setError(`Failed to load groups: ${err.message || 'Unknown error'}`);
          setGroups([]);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Snapshot error:', err);
        setError(`Failed to load groups: ${err.message || 'Unknown error'}`);
        setGroups([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Fetch messages for selected forum in real-time
  useEffect(() => {
    if (!selectedGroup || !selectedForum || !user) return;

    const messagesQuery = query(
      collection(db, 'groups', selectedGroup.id, 'chatForums', selectedForum.id.toString(), 'messages')
    );
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          senderId: doc.data().senderId,
          content: doc.data().content,
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as Message[];
        setSelectedForum((prev) => (prev ? { ...prev, messages: messagesData } : prev));
      },
      (err) => {
        console.error('Error fetching messages:', err);
        setError('Failed to load messages.');
      }
    );

    return () => unsubscribe();
  }, [selectedGroup, selectedForum, user]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedForum?.messages]);

  const handleCreateNewGroup = async () => {
    if (!newGroupName.trim() || !user) return;

    try {
      const newGroup: Omit<CourseGroup, 'id'> = {
        name: newGroupName,
        description: newGroupDescription,
        courseId: '', // Student-created groups may not be tied to a course
        members: [
          {
            id: user.uid,
            name: user.displayName || 'Student',
            email: user.email || '',
            role: 'Student',
            profileImage: user.photoURL || '/api/placeholder/50/50',
          },
        ],
        chatForums: [],
        assignments: [],
        createdAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'groups'), newGroup);
      setNewGroupName('');
      setNewGroupDescription('');
      setShowNewGroupModal(false);
      // Updated group will be fetched via onSnapshot
    } catch (err: any) {
      console.error('Error creating group:', err);
      setError(`Failed to create group: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCreateNewForum = async () => {
    if (!selectedGroup || !newForumTitle.trim() || !user) return;

    try {
      const newForum: ChatForum = {
        id: Math.max(...selectedGroup.chatForums.map(f => f.id), 0) + 1,
        title: newForumTitle,
        description: newForumDescription,
        memberCount: selectedGroup.members.length,
        lastMessageAt: new Date(),
        messages: [],
      };

      const groupRef = doc(db, 'groups', selectedGroup.id);
      await updateDoc(groupRef, {
        chatForums: arrayUnion(newForum),
      });

      setNewForumTitle('');
      setNewForumDescription('');
      setShowNewForumModal(false);
      setSelectedForum(newForum);
    } catch (err: any) {
      console.error('Error creating forum:', err);
      setError(`Failed to create forum: ${err.message || 'Unknown error'}`);
    }
  };

  const sendMessage = async (forumId: number) => {
    if (!newMessage.trim() || !selectedGroup || !selectedForum || !user) return;

    const messageData: Omit<Message, 'id'> = {
      senderId: user.uid,
      content: newMessage,
      timestamp: new Date(),
    };

    try {
      await addDoc(
        collection(db, 'groups', selectedGroup.id, 'chatForums', forumId.toString(), 'messages'),
        messageData
      );
      // Update lastMessageAt
      const groupRef = doc(db, 'groups', selectedGroup.id);
      const updatedForums = selectedGroup.chatForums.map((forum) =>
        forum.id === forumId ? { ...forum, lastMessageAt: new Date() } : forum
      );
      await updateDoc(groupRef, { chatForums: updatedForums });
      setNewMessage('');
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError(`Failed to send message: ${err.message || 'Unknown error'}`);
    }
  };

  const renderMembersList = () => {
    if (!selectedGroup) return null;

    return (
      <div className="bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl text-gray-500 font-semibold flex items-center">
            <Users className="mr-2 text-blue-800" /> Members 
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 rounded-full text-sm">
              {selectedGroup.members.length}
            </span>
          </h3>
        </div>
        <div className="p-4">
          <div className="flex mb-4">
            <div className="relative flex-grow">
              <input 
                type="text" 
                placeholder="Search members..." 
                className="w-full text-black pl-10 pr-4 py-2 border rounded-lg"
              />
              <Search className="absolute left-3 top-3 text-black" />
            </div>
          </div>
          <div className="space-y-4">
            {selectedGroup.members.map(member => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
              >
                <div className="flex items-center">
                  <img 
                    src={member.profileImage || '/api/placeholder/50/50'} 
                    alt={member.name} 
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-black">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                    <div 
                      className={`
                        text-xs px-2 py-1 rounded-full inline-block mt-1
                        ${member.role === 'Instructor' ? 'bg-green-100 text-green-800' : 
                          member.role === 'Teaching Assistant' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-blue-100 text-blue-800'}
                      `}
                    >
                      {member.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderChatForums = () => {
    if (!selectedGroup) return null;

    return (
      <div className="bg-white shadow-md rounded-lg h-[calc(100vh-200px)] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl text-gray-500 font-semibold flex items-center">
            <MessageCircle className="mr-2 text-blue-600" /> Chat Forums
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 rounded-full text-sm">
              {selectedGroup.chatForums.length}
            </span>
          </h3>
          <button
            onClick={() => setShowNewForumModal(true)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <Plus size={16} className="mr-1" />
            New Forum
          </button>
        </div>

        {selectedForum ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 bg-gray-50 border-b">
              <h4 className="font-semibold text-blue-800 text-lg">{selectedForum.title}</h4>
              <p className="text-sm text-gray-600">{selectedForum.description}</p>
              <button
                onClick={() => setSelectedForum(null)}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                Back to Forums
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {selectedForum.messages.map(message => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${
                    message.senderId === user?.uid ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.senderId === user?.uid
                        ? 'bg-blue-100 text-black'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          selectedGroup.members.find(m => m.id === message.senderId)
                            ?.profileImage || '/api/placeholder/50/50'
                        }
                        alt="avatar"
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-semibold text-sm">
                        {selectedGroup.members.find(m => m.id === message.senderId)?.name || 'Unknown'}
                      </span>
                    </div>
                    <p className="mt-1">{message.content}</p>
                    <span className="text-xs text-gray-500 block mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-white">
              <div className="flex text-blue-800 items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(selectedForum.id)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => sendMessage(selectedForum.id)}
                  className="btn-primary p-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto">
            {selectedGroup.chatForums.map(forum => (
              <div 
                key={forum.id} 
                className="border rounded-lg p-4 hover:bg-gray-300 transition cursor-pointer"
                onClick={() => setSelectedForum(forum)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-600 text-lg">{forum.title}</h4>
                    <p className="text-gray-600 text-sm">{forum.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-500">
                      {forum.memberCount} Members
                    </div>
                    <div className="text-sm text-gray-500">
                      Last Active: {forum.lastMessageAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderAssignments = () => {
    if (!selectedGroup) return null;

    return (
      <div className="bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl text-gray-500 font-semibold flex items-center">
            <FileText className="mr-2 text-blue-600" /> Assignments
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 rounded-full text-sm">
              {selectedGroup.assignments.length}
            </span>
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {selectedGroup.assignments.map(assignment => (
            <div 
              key={assignment.id} 
              className="border rounded-lg p-4 hover:bg-gray-50 transition flex justify-between items-center"
            >
              <div>
                <h4 className="font-semibold text-gray-800 text-lg">{assignment.title}</h4>
                <div 
                  className={`
                    text-xs px-2 py-1 rounded-full inline-block mt-2
                    ${assignment.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                      assignment.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-800'}
                  `}
                >
                  {assignment.status}
                </div>
              </div>
              <div className="text-sm text-gray-600">
                Due: {assignment.dueDate.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow-md rounded-lg">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-2xl text-blue-800 font-bold">Course Groups</h2>
           
          </div>
          <div className="divide-y max-h-[calc(100vh-150px)] overflow-y-auto">
            {groups.length > 0 ? (
              groups.map(group => (
                <div 
                  key={group.id} 
                  className={`
                    p-4 cursor-pointer hover:bg-gray-50 transition
                    ${selectedGroup?.id === group.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}
                  `}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedForum(null);
                  }}
                >
                  <h3 className="font-semibold text-gray-800">{group.name}</h3>
                  <p className="text-sm text-gray-600">{group.description}</p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No groups available. Create or join a group.
              </div>
            )}
          </div>
        </div>

        <div className="col-span-2">
          {selectedGroup ? (
            <>
              <div className="flex flex-col sm:flex-row mb-6 bg-white rounded-lg shadow-sm">
                {[
                  { key: 'members', label: 'Members', icon: Users },
                  { key: 'forums', label: 'Chat Forums', icon: MessageCircle },
                  { key: 'assignments', label: 'Assignments', icon: FileText }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`
                      flex-1 flex items-center justify-center py-3 
                      ${activeTab === tab.key 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-600 hover:bg-gray-100'}
                    `}
                  >
                    <tab.icon className="mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'members' && renderMembersList()}
              {activeTab === 'forums' && renderChatForums()}
              {activeTab === 'assignments' && renderAssignments()}
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <p className="text-gray-600">Select a group to view details</p>
            </div>
          )}
        </div>
      </div>

    

      {/* New Forum Modal */}
      {showNewForumModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Create New Forum</h3>
              <button onClick={() => setShowNewForumModal(false)}>
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Forum Title</label>
                <input
                  type="text"
                  value={newForumTitle}
                  onChange={(e) => setNewForumTitle(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter forum title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newForumDescription}
                  onChange={(e) => setNewForumDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Enter forum description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowNewForumModal(false)}
                  className="px-4 py-2 text-gray-600 border rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewForum}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .btn-primary {
          background: linear-gradient(to right, rgb(28, 31, 202), rgb(43, 40, 217));
          color: white;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          background: linear-gradient(to right, rgb(58, 76, 237), rgb(33, 35, 182));
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default CourseGroupManagementPage;