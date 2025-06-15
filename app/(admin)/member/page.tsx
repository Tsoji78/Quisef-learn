'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Users, MessageCircle, FileText, Edit2, Trash2, Search, Send, Loader } from 'lucide-react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  query,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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
  content: string;
  timestamp: Date;
}

interface ChatForum {
  id: string;
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
  id: string;
  name: string;
  description: string;
  courseId: string;
  courseTitle?: string;
  members: Member[];
  chatForums: ChatForum[];
  assignments: Assignment[];
  createdAt?: Date;
}

const CourseGroupManagementPage = () => {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CourseGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'forums' | 'assignments'>('members');
  const [selectedForum, setSelectedForum] = useState<ChatForum | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Authentication and admin check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const adminRef = doc(db, 'admins', currentUser.uid);
          const adminSnap = await getDoc(adminRef);
          if (adminSnap.exists()) {
            setIsAdmin(true);
          } else {
            setError('You do not have admin privileges.');
            router.push('/');
          }
        } catch (err: any) {
          console.error('Error checking admin status:', err);
          setError('Failed to verify admin privileges.');
          router.push('/');
        }
      } else {
        setUser(null);
        router.push('/login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch all groups and their forums
  useEffect(() => {
    if (!isAdmin) return;

    setLoading(true);
    const q = query(collection(db, 'groups'));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const groupsData: CourseGroup[] = await Promise.all(
            snapshot.docs.map(async (groupDoc) => {
              const data = groupDoc.data();

              let courseTitle = 'No Course';
              if (data.courseId) {
                const courseRef = doc(db, 'courses', data.courseId);
                const courseSnap = await getDoc(courseRef);
                if (courseSnap.exists()) {
                  const courseData = courseSnap.data();
                  courseTitle = courseData.title || 'Untitled Course';
                }
              }

              const forumsQuery = query(collection(db, 'groups', groupDoc.id, 'chatForums'));
              const forumsSnapshot = await getDocs(forumsQuery);
              const chatForums: ChatForum[] = forumsSnapshot.docs.map((forumDoc) => {
                const forumData = forumDoc.data();
                return {
                  id: forumDoc.id,
                  title: forumData.title || 'Untitled Forum',
                  description: forumData.description || '',
                  memberCount: typeof forumData.memberCount === 'number' ? forumData.memberCount : data.members?.length || 0,
                  lastMessageAt: forumData.lastMessageAt?.toDate() || new Date(),
                  messages: [],
                };
              });

              return {
                id: groupDoc.id,
                name: data.name || 'Untitled Group',
                description: data.description || '',
                courseId: data.courseId || '',
                courseTitle,
                members: Array.isArray(data.members) ? data.members : [],
                chatForums,
                assignments: Array.isArray(data.assignments) ? data.assignments : [],
                createdAt: data.createdAt?.toDate(),
              };
            })
          );

          setGroups(groupsData);
          setError(groupsData.length === 0 ? 'No groups found. Create a course to add groups.' : null);
          setLoading(false);

          if (groupsData.length > 0 && !selectedGroup) {
            setSelectedGroup(groupsData[0]);
          }
        } catch (err: any) {
          console.error('Error fetching groups:', err);
          setError(`Failed to load groups: ${err.message}`);
          toast.error(`Failed to load groups: ${err.message}`);
        }
      },
      (err) => {
        console.error('Firestore snapshot error:', err);
        setError(`Failed to load groups: ${err.message}`);
        toast.error(`Failed to load groups: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  // Fetch messages for selected forum
  useEffect(() => {
    if (!selectedGroup || !selectedForum) return;

    setMessagesLoading(true);
    const messagesQuery = query(
      collection(db, 'groups', selectedGroup.id, 'chatForums', selectedForum.id, 'messages')
    );
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => {
          const msgData = doc.data();
          return {
            id: doc.id,
            senderId: msgData.senderId || '',
            content: msgData.content || '',
            timestamp: msgData.timestamp?.toDate() || new Date(),
          };
        }) as Message[];

        setSelectedForum((prev) =>
          prev ? { ...prev, messages: messagesData } : null
        );
        setMessagesLoading(false);
      },
      (err) => {
        console.error('Error fetching messages:', err);
        toast.error('Failed to load messages.');
        setMessagesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedGroup, selectedForum]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedForum?.messages]);

  // Edit member role
  const editMemberRole = async (
    groupId: string,
    memberId: string,
    newRole: 'Student' | 'Instructor' | 'Teaching Assistant'
  ) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const currentGroup = groups.find((g) => g.id === groupId);
      if (!currentGroup) throw new Error('Group not found');

      const memberToUpdate = currentGroup?.members.find((m) => m.id === memberId);
      if (!memberToUpdate) {
        toast.error('Member not found.');
        return;
      }

      await updateDoc(groupRef, {
        members: arrayRemove(memberToUpdate),
      });
      await updateDoc(groupRef, {
        members: arrayUnion({ ...memberToUpdate, role: newRole }),
      });
      toast.success('Member role updated successfully.');
    } catch (error: any) {
      console.error('Error updating member role:', error);
      toast.error(`Failed to update role: ${error.message}`);
    }
  };

  // Remove member from group
  const removeMember = async (groupId: string, memberId: string) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const currentGroup = groups.find((g) => g.id === groupId);
      if (!currentGroup) throw new Error('Group not found');

      const memberToRemove = currentGroup.members.find((m) => m.id === memberId);
      if (!memberToRemove) {
        toast.error('Member not found.');
        return;
      }

      await updateDoc(groupRef, {
        members: arrayRemove(memberToRemove),
      });

      const forumsQuery = query(collection(db, 'groups', groupId, 'chatForums'));
      const forumsSnapshot = await getDocs(forumsQuery);
      for (const forumDoc of forumsSnapshot.docs) {
        const forumRef = doc(db, 'groups', groupId, 'chatForums', forumDoc.id);
        await updateDoc(forumRef, {
          memberCount: Math.max(0, currentGroup.members.length - 1),
        });
      }

      toast.success('Member removed successfully.');
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(`Failed to remove member: ${error.message}`);
    }
  };

  // Add member to group
  const addMemberToGroup = async (groupId: string, userId: string, userData: Partial<Member>) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const currentGroup = groups.find((g) => g.id === groupId);
      if (!currentGroup) throw new Error('Group not found');

      const newMember: Member = {
        id: userId,
        name: userData.name || 'Unknown',
        email: userData.email || '',
        role: userData.role || 'Student',
        profileImage: userData.profileImage || '/api/placeholder/50/50',
      };

      await updateDoc(groupRef, {
        members: arrayUnion(newMember),
      });

      const forumsQuery = query(collection(db, 'groups', groupId, 'chatForums'));
      const forumsSnapshot = await getDocs(forumsQuery);
      for (const forumDoc of forumsSnapshot.docs) {
        const forumRef = doc(db, 'groups', groupId, 'chatForums', forumDoc.id);
        await updateDoc(forumRef, {
          memberCount: currentGroup.members.length + 1,
        });
      }

      toast.success('Member added successfully.');
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(`Failed to add member: ${error.message}`);
    }
  };

  // Send message
  const sendMessage = async (forumId: string) => {
    if (!newMessage.trim() || !selectedGroup || !selectedForum || !user) {
      toast.error('Please select a forum and enter a message.');
      return;
    }

    const messageData = {
      senderId: user.uid,
      content: newMessage,
      timestamp: new Date(),
    };

    try {
      await addDoc(
        collection(db, 'groups', selectedGroup.id, 'chatForums', forumId, 'messages'),
        messageData
      );
      const forumRef = doc(db, 'groups', selectedGroup.id, 'chatForums', forumId);
      await updateDoc(forumRef, { lastMessageAt: new Date() });
      setNewMessage('');
      toast.success('Message sent successfully.');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message}`);
    }
  };

  // Render functions are unchanged here for brevity — see original code or below

  // Return JSX is unchanged here — see original code or below

  // -- RENDER FUNCTIONS --

  const renderMembersList = () => {
    if (!selectedGroup) return null;

    return (
      <div className="bg-white shadow-md rounded-lg">
        <div className="p-4 border-b">
          <h3 className="text-xl font-semibold flex items-center text-gray-800">
            <Users className="mr-2 text-blue-600" /> Members
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
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-800"
              />
              <Search className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="space-y-4">
            {selectedGroup.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition rounded-lg"
              >
                <div className="flex items-center">
                  <img
                    src={member.profileImage || '/api/placeholder/50/50'}
                    alt={member.name}
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-800">{member.name}</div>
                    <div className="text-sm text-gray-600">{member.email}</div>
                    <div
                      className={`
                        text-xs px-2 py-1 rounded-full inline-block mt-1
                        ${
                          member.role === 'Instructor'
                            ? 'bg-green-100 text-green-800'
                            : member.role === 'Teaching Assistant'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }
                      `}
                    >
                      {member.role}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      editMemberRole(
                        selectedGroup.id,
                        member.id,
                        e.target.value as 'Student' | 'Instructor' | 'Teaching Assistant'
                      )
                    }
                    className="text-blue-600 text-sm p-2 rounded-lg border-gray-300 focus:border-blue-500"
                  >
                    <option value="Student">Student</option>
                    <option value="Instructor">Instructor</option>
                    <option value="Teaching Assistant">Teaching Assistant</option>
                  </select>
                  <button
                    onClick={() => removeMember(selectedGroup.id, member.id)}
                    className="text-red-600 hover:bg-red-100 p-2 rounded-full transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
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
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg h-[calc(100vh-200px)] flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-xl font-semibold flex items-center text-gray-800 dark:text-white">
            <MessageCircle className="mr-2 text-blue-600 dark:text-blue-400" /> Chat Forums
            <span className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
              {selectedGroup.chatForums.length}
            </span>
          </h3>
        </div>
        {selectedForum ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b">
              <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{selectedForum.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{selectedForum.description}</p>
              <button
                onClick={() => setSelectedForum(null)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
              >
                Back to Forums
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {messagesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader className="animate-spin mr-2 text-blue-500" />
                  <span>Loading messages...</span>
                </div>
              ) : selectedForum.messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No messages yet.</div>
              ) : (
                selectedForum.messages.map((message) => (
                  <div
                    key={`message-${message.id}`}
                    className={`flex mb-4 ${
                      message.senderId === user?.uid ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === user?.uid
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <img
                          src={
                            selectedGroup.members.find((m) => m.id === message.senderId)?.profileImage ||
                            '/api/placeholder/50/50?text=Avatar'
                          }
                          alt="Avatar"
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                          {selectedGroup.members.find((m) => m.id === message.senderId)?.name || 'Anonymous'}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-800 dark:text-gray-300">{message.content}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                        {message.timestamp?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(selectedForum.id)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => sendMessage(selectedForum.id)} className="btn-primary p-2">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {selectedGroup.chatForums.map((forum) => (
              <div
                key={forum.id}
                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer flex justify-between items-center"
                onClick={() => setSelectedForum(forum)}
              >
                <div>
                  <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{forum.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{forum.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{forum.memberCount} Members</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Last Active: {forum.lastMessageAt?.toLocaleDateString()}
                  </span>
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
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center text-gray-800 dark:text-white">
            <FileText className="mr-2 text-blue-600 dark:text-blue-400" /> Assignments
            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
              {selectedGroup.assignments?.length || 0}
            </span>
          </h3>
        </div>
        <div className="p-4 space-y-2">
          {selectedGroup.assignments?.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No assignments available.</div>
          ) : (
            selectedGroup.assignments.map((assignment) => (
              <div
                className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center justify-between cursor-pointer"
                key={assignment.id}
              >
                <div>
                  <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{assignment.title}</h4>
                  <div
                    className={`
                      text-xs px-2 py-1 rounded-full inline-block mt-2
                      ${
                        assignment.status === 'Completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : assignment.status === 'In Progress'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }
                    `}
                  >
                    {assignment.status}
                  </div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Due: {assignment.dueDate?.toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <Loader className="animate-spin mr-2 text-blue-500 dark:text-blue-400" />
        <span>Loading groups...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Course Groups</h2>
          </div>
          <div className="divide-y overflow-y-auto flex-grow">
            {groups.length > 0 ? (
              groups.map((group) => (
                <div
                  key={group.id}
                  className={`
                    p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition
                    ${selectedGroup?.id === group.id ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' : ''}
                  `}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedForum(null);
                  }}
                >
                  <h3 className="font-semibold text-gray-800 dark:text-white">{group.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Course: {group.courseTitle}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                      {group.members.length} members
                    </span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                      {group.assignments.length} assignments
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No groups available. Create a course to add a group.
              </div>
            )}
          </div>
        </div>
        <div className="col-span-2">
          {selectedGroup ? (
            <>
              <div className="flex flex-col sm:flex-row mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                {[
                  { key: 'members', label: 'Members', icon: Users },
                  { key: 'forums', label: 'Chat Forums', icon: MessageCircle },
                  { key: 'assignments', label: 'Assignments', icon: FileText },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 flex items-center justify-center py-3 transition-colors ${
                      activeTab === tab.key
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="mr-2" size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab === 'members' && renderMembersList()}
              {activeTab === 'forums' && renderChatForums()}
              {activeTab === 'assignments' && renderAssignments()}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Welcome to Course Group Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Select a group to view details.</p>
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .btn-primary {
          @apply bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-2 transition-all duration-200 ease-in-out;
        }
        .btn-primary:hover {
          @apply bg-gradient-to-r from-blue-700 to-blue-800 transform -translate-y-0.5;
        }
      `}</style>
    </div>
  );
};

export default CourseGroupManagementPage;