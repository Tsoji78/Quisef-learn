'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Users, MessageCircle, FileText, Edit2, Trash2, Search, Send, Loader } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, doc, updateDoc, arrayUnion, arrayRemove, addDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

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
  id: number;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch groups from Firestore in real-time
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'groups'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const groupsData: CourseGroup[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name || 'Untitled Group',
            description: doc.data().description || '',
            courseId: doc.data().courseId || '',
            members: doc.data().members || [],
            chatForums: doc.data().chatForums || [],
            assignments: doc.data().assignments || [],
            createdAt: doc.data().createdAt?.toDate(),
          })) as CourseGroup[];

          setGroups(groupsData);
          setError(groupsData.length === 0 ? 'No groups found. Create a course to add groups.' : null);
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
  }, []);

  // Fetch messages for selected forum in real-time
  useEffect(() => {
    if (!selectedGroup || !selectedForum) return;

    const messagesQuery = query(
      collection(db, 'groups', selectedGroup.id, 'chatForums', selectedForum.id.toString(), 'messages')
    );
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        })) as Message[];
        setSelectedForum((prev) => (prev ? { ...prev, messages: messagesData } : prev));
      },
      (err) => {
        console.error('Error fetching messages:', err);
        toast.error('Failed to load messages.');
      }
    );

    return () => unsubscribe();
  }, [selectedGroup, selectedForum]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedForum?.messages]);

  // Edit member role
  const editMemberRole = async (groupId: string, memberId: string, newRole: 'Student' | 'Instructor' | 'Teaching Assistant') => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const memberToUpdate = selectedGroup!.members.find((m) => m.id === memberId);
      if (!memberToUpdate) return;

      await updateDoc(groupRef, {
        members: arrayRemove(memberToUpdate),
      });
      await updateDoc(groupRef, {
        members: arrayUnion({ ...memberToUpdate, role: newRole }),
      });
      toast.success('Member role updated successfully.');
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role.');
    }
  };

  // Remove member from group
  const removeMember = async (groupId: string, memberId: string) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
const memberToRemove = selectedGroup!.members.find((m) => m.id === memberId);
      if (!memberToRemove) return;

      await updateDoc(groupRef, {
        members: arrayRemove(memberToRemove),
      });
      toast.success('Member removed successfully.');
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member.');
    }
  };

  // Get sender ID dynamically (use first member, typically instructor)
  const getSenderId = () => {
    return selectedGroup?.members[0]?.id || 'default-user';
  };

  const sendMessage = async (forumId: number) => {
    if (!newMessage.trim() || !selectedGroup || !selectedForum) {
      toast.error('Please select a forum and enter a message.');
      return;
    }

    const messageData = {
      senderId: getSenderId(),
      content: newMessage,
      timestamp: new Date(),
    };

    try {
      await addDoc(
        collection(db, 'groups', selectedGroup.id, 'chatForums', forumId.toString(), 'messages'),
        messageData
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message.');
    }
  };

  const renderMembersList = () => {
    if (!selectedGroup) return null;

    return (
      <div className="bg-white shadow-md rounded-lg">
        <div className="p-4 border-b">
          <h3 className="text-xl font-semibold flex items-center text-black">
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
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-black"
              />
              <Search className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="space-y-4">
            {selectedGroup.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 transition rounded-lg cursor-pointer"
              >
                <div className="flex items-center">
                  <img
                    src={member.profileImage || '/api/placeholder/50/50'}
                    alt={member.name}
                    className="w-10 h-10 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-black">{member.name}</div>
                    <div className="text-sm text-black">{member.email}</div>
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
                    className="text-blue-600 p-2 rounded-lg border"
                  >
                    <option value="Student">Student</option>
                    <option value="Instructor">Instructor</option>
                    <option value="Teaching Assistant">Teaching Assistant</option>
                  </select>
                  <button
                    onClick={() => removeMember(selectedGroup.id, member.id)}
                    className="text-red-600 hover:bg-red-100 p-2 rounded-full transition"
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
      <div className="bg-white shadow-md rounded-lg h-[calc(100vh-200px)] flex flex-col">
        <div className="p-4 border-b">
          <h3 className="text-xl font-semibold flex items-center text-black">
            <MessageCircle className="mr-2 text-blue-600" /> Chat Forums
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 rounded-full text-sm">
              {selectedGroup.chatForums.length}
            </span>
          </h3>
        </div>

        {selectedForum ? (
          <div className="flex-1 flex flex-col">
            <div className="p-4 bg-blue-50 border-b">
              <h4 className="font-semibold text-lg text-black">{selectedForum.title}</h4>
              <p className="text-sm text-black">{selectedForum.description}</p>
              <button
                onClick={() => setSelectedForum(null)}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                Back to Forums
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              {selectedForum.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${message.senderId === getSenderId() ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.senderId === getSenderId() ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-black'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={
                          selectedGroup.members.find((m) => m.id === message.senderId)?.profileImage ||
                          '/api/placeholder/50/50'
                        }
                        alt="avatar"
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-semibold text-sm text-black">
                        {selectedGroup.members.find((m) => m.id === message.senderId)?.name || 'Anonymous'}
                      </span>
                    </div>
                    <p className="mt-1 text-black">{message.content}</p>
                    <span className="text-xs text-black block mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t bg-blue-50">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage(selectedForum.id)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => sendMessage(selectedForum.id)} className="btn-primary p-2">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto">
            {selectedGroup.chatForums.map((forum) => (
              <div
                key={forum.id}
                className="border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                onClick={() => setSelectedForum(forum)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-lg text-black">{forum.title}</h4>
                    <p className="text-sm text-black">{forum.description}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-black">{forum.memberCount} Members</div>
                    <div className="text-sm text-black">
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
        <div className="p-4 border-b">
          <h3 className="text-xl font-semibold flex items-center text-black">
            <FileText className="mr-2 text-blue-600" /> Assignments
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 rounded-full text-sm">
              {selectedGroup.assignments.length}
            </span>
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {selectedGroup.assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition cursor-pointer flex justify-between items-center"
            >
              <div>
                <h4 className="font-semibold text-lg text-black">{assignment.title}</h4>
                <div
                  className={`
                    text-xs px-2 py-1 rounded-full inline-block mt-2
                    ${
                      assignment.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : assignment.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }
                  `}
                >
                  {assignment.status}
                </div>
              </div>
              <div className="text-sm text-black">Due: {assignment.dueDate.toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <Loader className="animate-spin mr-2 text-blue-500" />
        <span>Loading groups...</span>
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
        <div className="bg-white shadow-md rounded-lg flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-2xl font-bold text-black">Course Groups</h2>
          </div>
          <div className="divide-y overflow-y-auto flex-grow">
            {groups.length > 0 ? (
              groups.map((group) => (
                <div
                  key={group.id}
                  className={`
                    p-4 cursor-pointer hover:bg-blue-50 transition
                    ${selectedGroup?.id === group.id ? 'bg-blue-100 border-l-4 border-blue-500' : ''}
                  `}
                  onClick={() => {
                    setSelectedGroup(group);
                    setSelectedForum(null);
                  }}
                >
                  <h3 className="font-semibold text-black">{group.name}</h3>
                  <p className="text-sm text-black">{group.description}</p>
                  <div className="flex space-x-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {group.members.length} members
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {group.assignments.length} assignments
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No groups available. Create a course to add a group.
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
                  { key: 'assignments', label: 'Assignments', icon: FileText },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`
                      flex-1 flex items-center justify-center py-3 transition text-black
                      ${activeTab === tab.key ? 'bg-blue-500 text-white' : 'hover:bg-blue-100'}
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
              <h3 className="text-xl font-semibold mb-4 text-black">Welcome to Course Group Management</h3>
              <p className="text-black">Select a group to view details</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .btn-primary {
          background: linear-gradient(to right, #3b82f6, #2563eb);
          color: white;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          background: linear-gradient(to right, #2563eb, #1d4ed8);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default CourseGroupManagementPage;