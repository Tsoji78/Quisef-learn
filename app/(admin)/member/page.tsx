'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Users, MessageCircle, FileText, Edit2, Trash2, Search, Send, Loader } from 'lucide-react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
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
  setDoc,
  serverTimestamp,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';

// TypeScript interfaces
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
  courseTitle: string;
  members: Member[];
  assignments: Assignment[];
  createdAt?: Date;
}

// Component splitting for better readability
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
      p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 transition
      ${isSelected ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' : ''}
    `}
    onClick={onClick}
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
));

const MemberItem = React.memo(({ 
  member, 
  groupId, 
  editMemberRole, 
  removeMember 
}: { 
  member: Member; 
  groupId: string; 
  editMemberRole: (groupId: string, memberId: string, newRole: 'Student' | 'Instructor' | 'Teaching Assistant') => void; 
  removeMember: (groupId: string, memberId: string) => void; 
}) => (
  <>
    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition rounded-lg">
      <div className="flex items-center">
        <img
          src={member.profileImage || '/api/placeholder/50/50?text=Avatar'}
          alt={member.name}
          className="w-10 h-10 rounded-full mr-4"
        />
        <div>
          <div className="font-semibold text-gray-800 dark:text-white">{member.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{member.email}</div>
          <div
            className={`
              text-xs px-2 py-1 rounded-full inline-block mt-1
              ${
                member.role === 'Instructor'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : member.role === 'Teaching Assistant'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
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
          onChange={(e) => editMemberRole(groupId, member.id, e.target.value as 'Student' | 'Instructor' | 'Teaching Assistant')}
          className="text-blue-600 dark:text-blue-400 text-sm p-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
        >
          <option value="Student">Student</option>
          <option value="Instructor">Instructor</option>
          <option value="Teaching Assistant">Teaching Assistant</option>
        </select>
        <button
          onClick={() => removeMember(groupId, member.id)}
          className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  </>
));

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
      <div
        className={`max-w-[70%] p-3 rounded-lg ${
          isCurrentUser
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        {!isCurrentUser && (
          <div className="flex items-center gap-2 mb-1">
            <img src={senderImage} alt="Avatar" className="w-6 h-6 rounded-full" />
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{senderName}</span>
          </div>
        )}
        <p className="mt-1 text-gray-800 dark:text-gray-300">{message.content}</p>
        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  ));

const CourseGroupManagementPage: React.FC = () => {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CourseGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'chat' | 'assignments'>('members');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Authentication check
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        } else {
          setUser(null);
          router.push('/login');
        }
      },
      (err) => {
        console.error('Auth error:', err);
        setError(`Authentication error: ${err.message || 'Unknown error'}`);
        setLoading(false);
        router.push('/login');
      }
    );
    return () => unsubscribe();
  }, [router]);

  // Fetch groups
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const groupsQuery = query(collection(db, 'groups'));
    const unsubscribe = onSnapshot(
      groupsQuery,
      async (snapshot) => {
        try {
          const groupsData: CourseGroup[] = (
            await Promise.all(
              snapshot.docs.map(async (groupDoc) => {
                const data = groupDoc.data();

                // Check if user is a member
                const isMember = data.members.some((m: Member) => m.id === user.uid);
                if (!isMember) return null;

                // Get course title
                let courseTitle: string = 'No Course';
                if (data.courseId) {
                  const courseRef = doc(db, 'courses', data.courseId);
                  const courseSnap = await getDoc(courseRef);
                  if (courseSnap.exists()) {
                    const fetchedTitle = courseSnap.data()?.title;
                    courseTitle = typeof fetchedTitle === 'string' ? fetchedTitle : 'Untitled Course';
                  }
                }

                // Ensure default chat forum exists
                const defaultForumRef = doc(db, 'groups', groupDoc.id, 'chatForums', 'default');
                const defaultForumSnap = await getDoc(defaultForumRef);
                if (!defaultForumSnap.exists()) {
                  await setDoc(defaultForumRef, { lastMessageAt: serverTimestamp() });
                }

                return {
                  id: groupDoc.id,
                  name: data.name || 'Untitled Group',
                  description: data.description || '',
                  courseId: data.courseId || '',
                  courseTitle,
                  members: Array.isArray(data.members)
                    ? data.members.map((member: any) => ({
                        id: member.id || '',
                        name: member.name || 'Unknown User',
                        email: member.email || '',
                        role: ['Student', 'Instructor', 'Teaching Assistant'].includes(member.role)
                          ? member.role
                          : 'Student',
                        profileImage: member.profileImage || '',
                      }))
                    : [],
                  assignments: Array.isArray(data.assignments)
                    ? data.assignments.map((assignment: any) => ({
                        id: Number(assignment.id) || 0,
                        title: assignment.title || 'Untitled Assignment',
                        dueDate: assignment.dueDate?.toDate() || new Date(),
                        status: ['Pending', 'In Progress', 'Completed'].includes(assignment.status)
                          ? assignment.status
                          : 'Pending',
                      }))
                    : [],
                  createdAt: data.createdAt?.toDate(),
                };
              })
            )
          ).filter((group) => group !== null) as CourseGroup[];

          setGroups(groupsData);
          setError(groupsData.length === 0 ? 'No groups found. Enroll in a course to join groups.' : null);

          // Preserve selection or select first group
          if (groupsData.length > 0) {
            setSelectedGroup((prev) => {
              if (prev && groupsData.some((g) => g.id === prev.id)) {
                return prev;
              }
              return groupsData[0];
            });
          } else {
            setSelectedGroup(null);
          }

          setLoading(false);
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

  // Fetch messages for the default chat forum
  useEffect(() => {
    if (!selectedGroup || !user) return;

    const messagesQuery = query(
      collection(db, 'groups', selectedGroup.id, 'chatForums', 'default', 'messages'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messagesData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            senderId: doc.data().senderId,
            senderName: doc.data().senderName,
            content: doc.data().content,
            timestamp: doc.data().timestamp?.toDate() || new Date(),
          }))
          .reverse(); // Reverse to show newest at bottom

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

  // Debounced search
  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  // Filtered members based on search
  const filteredMembers = useMemo(() => {
    if (!selectedGroup) return [];

    return selectedGroup.members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedGroup, searchTerm]);

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

      const memberToUpdate = currentGroup.members.find((m) => m.id === memberId);
      if (!memberToUpdate) throw new Error('Member not found');

      await updateDoc(groupRef, {
        members: arrayRemove(memberToUpdate),
      });
      await updateDoc(groupRef, {
        members: arrayUnion({
          ...memberToUpdate,
          role: newRole,
          profileImage: memberToUpdate.profileImage || '',
        }),
      });
      toast.success('Member role updated successfully.');
    } catch (error: any) {
      console.error('Error updating member role:', error);
      toast.error(`Failed to update role: ${error.message || 'Unknown error'}`);
    }
  };

  // Remove member from group
  const removeMember = async (groupId: string, memberId: string) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const currentGroup = groups.find((g) => g.id === groupId);
      if (!currentGroup) throw new Error('Group not found');

      const memberToRemove = currentGroup.members.find((m) => m.id === memberId);
      if (!memberToRemove) throw new Error('Member not found');

      await updateDoc(groupRef, {
        members: arrayRemove(memberToRemove),
      });

      toast.success('Member removed successfully.');
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(`Failed to remove member: ${error.message || 'Unknown error'}`);
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
        name: userData.name || 'Unknown User',
        email: userData.email || '',
        role: userData.role || 'Student',
        profileImage: userData.profileImage || '',
      };

      await updateDoc(groupRef, {
        members: arrayUnion(newMember),
      });

      toast.success('Member added successfully.');
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast.error(`Failed to add member: ${error.message || 'Unknown error'}`);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !user || sendingMessage) {
      toast.error('Please enter a valid message or log in.');
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);

    try {
      // Validate group
      const groupRef = doc(db, 'groups', selectedGroup.id);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) {
        throw new Error('Group does not exist.');
      }
      if (!groupSnap.data().members.some((m: Member) => m.id === user.uid)) {
        throw new Error('User is not a member of this group.');
      }

      // Ensure default forum exists
      const defaultForumRef = doc(db, 'groups', selectedGroup.id, 'chatForums', 'default');
      const defaultForumSnap = await getDoc(defaultForumRef);
      if (!defaultForumSnap.exists()) {
        await setDoc(defaultForumRef, { lastMessageAt: serverTimestamp() });
      }

      // Send message
      const messageRef = await addDoc(
        collection(db, 'groups', selectedGroup.id, 'chatForums', 'default', 'messages'),
        {
          senderId: user.uid,
          senderName: user.displayName || 'Unknown User',
          content: messageContent,
          timestamp: serverTimestamp(),
        }
      );

      // Update default forum last message timestamp
      await updateDoc(defaultForumRef, { lastMessageAt: serverTimestamp() });

      // Verify message was written
      const sentMessageSnap = await getDoc(doc(db, 'groups', selectedGroup.id, 'chatForums', 'default', 'messages', messageRef.id));
      if (!sentMessageSnap.exists()) {
        throw new Error('Message was not saved to Firestore.');
      }

      console.log('Message sent successfully:', {
        messageId: messageRef.id,
        content: messageContent,
        groupId: selectedGroup.id,
        senderId: user.uid,
        senderName: user.displayName,
      });

      toast.success('Message sent!');
    } catch (err: any) {
      console.error('Error sending message:', {
        error: err.message,
        groupId: selectedGroup?.id,
        senderId: user?.uid,
        senderName: user?.displayName,
        messageContent,
      });
      toast.error(`Failed to send message: ${err.message || 'Unknown error'}`);
      setNewMessage(messageContent); // Revert message if failed
    } finally {
      setSendingMessage(false);
    }
  };

  const renderMembersList = () => {
    if (!selectedGroup) return null;

    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold flex items-center text-gray-800 dark:text-white">
            <Users className="mr-2 text-blue-600 dark:text-blue-400" /> Members
            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 rounded-full text-sm">
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
                className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Search className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <MemberItem
                  key={member.id}
                  member={member}
                  groupId={selectedGroup.id}
                  editMemberRole={editMemberRole}
                  removeMember={removeMember}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No members found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderChat = () => {
    if (!selectedGroup) return null;

    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg h-[calc(100vh-200px)] flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold flex items-center text-gray-800 dark:text-white">
            <MessageCircle className="mr-2 text-blue-600 dark:text-blue-400" /> Group Chat
            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
              {selectedGroup.members.length} members
            </span>
          </h3>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length > 0 ? (
            messages.map((message) => {
              const sender = selectedGroup.members.find((m) => m.id === message.senderId);
              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  senderName={message.senderName || 'Unknown User'}
                  senderImage={sender?.profileImage || '/api/placeholder/50/50?text=Avatar'}
                  isCurrentUser={message.senderId === user?.uid}
                />
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No messages yet. Be the first to start the conversation!
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sendingMessage && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sendingMessage}
            />
            <button
              onClick={sendMessage}
              className="btn-primary p-2 disabled:opacity-50"
              disabled={!newMessage.trim() || sendingMessage}
            >
              {sendingMessage ? (
                <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
              ) : (
                <Send size={18} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAssignments = () => {
    if (!selectedGroup) return null;

    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold flex items-center text-gray-800 dark:text-white">
            <FileText className="mr-2 text-blue-600 dark:text-blue-400" /> Assignments
            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
              {selectedGroup.assignments.length}
            </span>
          </h3>
        </div>
        <div className="p-4 space-y-4">
          {selectedGroup.assignments.length > 0 ? (
            selectedGroup.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition flex justify-between items-center"
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
                  Due: {assignment.dueDate.toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No assignments available for this group
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <Loader className="animate-spin mr-2 text-blue-500 dark:text-blue-400" />
        <span>Loading...</span>
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
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Course Groups</h2>
          </div>
          <div className="divide-y overflow-y-auto flex-grow">
            {groups.length > 0 ? (
              groups.map((group) => (
                <GroupListItem
                  key={group.id}
                  group={group}
                  isSelected={selectedGroup?.id === group.id}
                  onClick={() => setSelectedGroup(group)}
                />
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No groups available. Enroll in a course to join a group.
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
                  { key: 'chat', label: 'Chat', icon: MessageCircle },
                  { key: 'assignments', label: 'Assignments', icon: FileText },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`
                      flex-1 flex items-center justify-center py-3 transition-colors
                      ${
                        activeTab === tab.key
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    <tab.icon className="mr-2" size={18} />
                    {tab.label}
                  </button>
                ))}
              </div>
              {activeTab === 'members' && renderMembersList()}
              {activeTab === 'chat' && renderChat()}
              {activeTab === 'assignments' && renderAssignments()}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Welcome to Course Group Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Select a group to manage its details.</p>
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