"use client"
import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  MessageCircle, 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Search,
  Send
} from 'lucide-react';

// Interfaces for data structures
interface Member {
  id: number;
  name: string;
  email: string;
  role: 'Student' | 'Instructor' | 'Teaching Assistant';
  profileImage?: string;
}

interface Message {
  id: number;
  senderId: number;
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
  id: number;
  name: string;
  description: string;
  members: Member[];
  chatForums: ChatForum[];
  assignments: Assignment[];
}

const CourseGroupManagementPage: React.FC = () => {
  const [groups, setGroups] = useState<CourseGroup[]>([
    {
      id: 1,
      name: 'Computer Science 101',
      description: 'Introductory Computer Science Course',
      members: [
        { 
          id: 1, 
          name: 'John Doe', 
          email: 'john@example.com', 
          role: 'Student',
          profileImage: '/api/placeholder/50/50'
        },
        { 
          id: 2, 
          name: 'Jane Smith', 
          email: 'jane@example.com', 
          role: 'Instructor',
          profileImage: '/api/placeholder/50/50'
        }
      ],
      chatForums: [
        {
          id: 1,
          title: 'General Discussion',
          description: 'Course-wide chat for general topics',
          memberCount: 25,
          lastMessageAt: new Date(),
          messages: [
            { id: 1, senderId: 1, content: 'Welcome to the course!', timestamp: new Date() }
          ]
        }
      ],
      assignments: [
        {
          id: 1,
          title: 'Midterm Project',
          dueDate: new Date('2024-04-15'),
          status: 'Pending'
        }
      ]
    }
  ]);

  const [selectedGroup, setSelectedGroup] = useState<CourseGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'forums' | 'assignments'>('members');
  const [selectedForum, setSelectedForum] = useState<ChatForum | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [newGroupData, setNewGroupData] = useState({ name: '', description: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedForum?.messages]);

  const addNewGroup = () => {
    if (!newGroupData.name) return;
    
    const newGroup: CourseGroup = {
      id: groups.length + 1,
      name: newGroupData.name,
      description: newGroupData.description,
      members: [],
      chatForums: [],
      assignments: []
    };
    
    setGroups([...groups, newGroup]);
    setNewGroupData({ name: '', description: '' });
    setShowNewGroupForm(false);
    setSelectedGroup(newGroup);
  };

  const renderMembersList = () => {
    if (!selectedGroup) return null;

    return (
      <div className="bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold flex items-center">
            <Users className="mr-2 text-blue-600" /> Members 
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 rounded-full text-sm">
              {selectedGroup.members.length}
            </span>
          </h3>
          <button className="btn-primary flex items-center">
            <Plus className="mr-2" /> Add Member
          </button>
        </div>
        <div className="p-4">
          <div className="flex mb-4">
            <div className="relative flex-grow">
              <input 
                type="text" 
                placeholder="Search members..." 
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
              <Search className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          <div className="space-y-4">
            {selectedGroup.members.map(member => (
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
                    <div className="font-semibold">{member.name}</div>
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
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:bg-blue-200 p-2 rounded-full transition">
                    <Edit2 size={18} />
                  </button>
                  <button className="text-red-600 hover:bg-red-100 p-2 rounded-full transition">
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

    const sendMessage = (forumId: number) => {
      if (!newMessage.trim()) return;

      const updatedGroups = groups.map(group => {
        if (group.id === selectedGroup.id) {
          return {
            ...group,
            chatForums: group.chatForums.map(forum => {
              if (forum.id === forumId) {
                return {
                  ...forum,
                  messages: [
                    ...forum.messages,
                    {
                      id: forum.messages.length + 1,
                      senderId: 1, // Assuming current user is ID 1
                      content: newMessage,
                      timestamp: new Date()
                    }
                  ],
                  lastMessageAt: new Date()
                };
              }
              return forum;
            })
          };
        }
        return group;
      });

      setGroups(updatedGroups);
      setNewMessage('');
    };

    return (
      <div className="bg-white shadow-md rounded-lg h-[calc(100vh-200px)] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-semibold flex items-center">
            <MessageCircle className="mr-2 text-blue-600" /> Chat Forums
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 rounded-full text-sm">
              {selectedGroup.chatForums.length}
            </span>
          </h3>
          <button className="btn-primary flex items-center">
            <Plus className="mr-2" /> Create Forum
          </button>
        </div>

        {selectedForum ? (
          <div className="flex-1 flex flex-col">
            {/* Forum Header */}
            <div className="p-4 bg-blue-50 border-b">
              <h4 className="font-semibold text-lg">{selectedForum.title}</h4>
              <p className="text-sm text-gray-600">{selectedForum.description}</p>
              <button
                onClick={() => setSelectedForum(null)}
                className="text-sm text-blue-600 hover:underline mt-1"
              >
                Back to Forums
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {selectedForum.messages.map(message => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${
                    message.senderId === 1 ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.senderId === 1
                        ? 'bg-blue-100 text-blue-900'
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
                        {selectedGroup.members.find(m => m.id === message.senderId)?.name}
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

            {/* Message Input */}
            <div className="p-4 border-t bg-blue-50">
              <div className="flex items-center gap-2">
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
                className="border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
                onClick={() => setSelectedForum(forum)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-lg">{forum.title}</h4>
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
          <h3 className="text-xl font-semibold flex items-center">
            <FileText className="mr-2 text-blue-600" /> Assignments
            <span className="ml-2 bg-blue-100 text-blue-800 px-2 rounded-full text-sm">
              {selectedGroup.assignments.length}
            </span>
          </h3>
          <button className="btn-primary flex items-center">
            <Plus className="mr-2" /> Create Assignment
          </button>
        </div>
        <div className="p-4 space-y-4">
          {selectedGroup.assignments.map(assignment => (
            <div 
              key={assignment.id} 
              className="border rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition cursor-pointer flex justify-between items-center"
            >
              <div>
                <h4 className="font-semibold text-lg">{assignment.title}</h4>
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

  const renderNewGroupForm = () => {
    return (
      <div className="p-4 bg-blue-50 border-t">
        <h3 className="font-medium mb-2">Create New Group</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={newGroupData.name}
              onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
              placeholder="Enter group name"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newGroupData.description}
              onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
              placeholder="Enter group description"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button 
              onClick={() => setShowNewGroupForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button 
              onClick={addNewGroup}
              className="btn-primary"
              disabled={!newGroupData.name}
            >
              Create Group
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Groups Sidebar */}
        <div className="bg-white shadow-md rounded-lg flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold">Course Groups</h2>
            <button 
              className="btn-primary flex items-center"
              onClick={() => setShowNewGroupForm(!showNewGroupForm)}
            >
              <Plus className="mr-2" /> New Group
            </button>
          </div>
          <div className="divide-y overflow-y-auto flex-grow">
            {groups.map(group => (
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
                <h3 className="font-semibold">{group.name}</h3>
                <p className="text-sm text-gray-600">{group.description}</p>
                <div className="flex space-x-2 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {group.members.length} members
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {group.assignments.length} assignments
                  </span>
                </div>
              </div>
            ))}
          </div>
          {showNewGroupForm && renderNewGroupForm()}
        </div>

        {/* Group Details */}
        <div className="col-span-2">
          {selectedGroup ? (
            <>
              {/* Tabs */}
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
                      flex-1 flex items-center justify-center py-3 transition
                      ${activeTab === tab.key 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-600 hover:bg-blue-100'}
                    `}
                  >
                    <tab.icon className="mr-2" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content based on active tab */}
              {activeTab === 'members' && renderMembersList()}
              {activeTab === 'forums' && renderChatForums()}
              {activeTab === 'assignments' && renderAssignments()}
            </>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-4">Welcome to Course Group Management</h3>
              <p className="text-gray-600 mb-6">Select an existing group or create a new one to get started</p>
              <button
                onClick={() => setShowNewGroupForm(true)}
                className="btn-primary flex items-center mx-auto"
              >
                <Plus className="mr-2" /> Create Your First Group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CSS for btn-primary */}
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