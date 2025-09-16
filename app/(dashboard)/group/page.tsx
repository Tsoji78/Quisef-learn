'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Users, MessageCircle, FileText, Search, Send } from 'lucide-react';
import debounce from 'lodash/debounce';
import { useAuth } from '@/hooks/useAuth';
import { useGroups } from '@/hooks/useGroups';
import { useMessages } from '@/hooks/useMessages';
import { GroupService } from '@/services/groupService';
import { GroupListItem } from '@/components/course-groups/GroupListItem';
import { MemberItem } from '@/components/course-groups/MemberItem';
import { MessageItem } from '@/components/course-groups/MessageItem';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { CourseGroup } from '@/types';
import { useTheme } from '@/context/ThemeContext';

const CourseGroupManagementPage: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedGroup, setSelectedGroup] = useState<CourseGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'chat' | 'assignments'>('members');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { groups, loading: groupsLoading, error: groupsError } = useGroups(user);
  const { messages, messagesEndRef } = useMessages(selectedGroup, user);

  React.useEffect(() => {
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

  const handleSearch = useCallback(
    debounce((term: string) => {
      setSearchTerm(term);
    }, 300),
    []
  );

  const filteredMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedGroup, searchTerm]);

  const handleEditMemberRole = async (
    groupId: string,
    memberId: string,
    newRole: 'Student' | 'Instructor' | 'Teaching Assistant'
  ) => {
    const currentGroup = groups.find((g) => g.id === groupId);
    if (!currentGroup) return;
    await GroupService.editMemberRole(groupId, memberId, newRole, currentGroup.members);
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    const currentGroup = groups.find((g) => g.id === groupId);
    if (!currentGroup) return;
    await GroupService.removeMember(groupId, memberId, currentGroup.members);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !user || sendingMessage) return;
    const messageContent = newMessage.trim();
    setNewMessage('');
    setSendingMessage(true);
    try {
      await GroupService.sendMessage(
        selectedGroup.id,
        user.uid,
        user.displayName || 'Unknown User',
        messageContent,
        selectedGroup.members
      );
    } catch (error) {
      setNewMessage(messageContent);
    } finally {
      setSendingMessage(false);
    }
  };

  const renderMembersList = () => {
    if (!selectedGroup) return null;
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg sm:text-xl font-semibold flex items-center text-gray-800 dark:text-white">
            <Users className="mr-2 text-blue-600 dark:text-blue-400" /> Members
            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 rounded-full text-sm">
              {selectedGroup.members.length}
            </span>
          </h3>
        </div>
        <div className="p-4 sm:p-6">
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
                  onRoleChange={handleEditMemberRole}
                  onRemove={handleRemoveMember}
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
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg sm:text-xl font-semibold flex items-center text-gray-800 dark:text-white">
            <MessageCircle className="mr-2 text-blue-600 dark:text-blue-400" /> Group Chat
            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
              {selectedGroup.members.length} members
            </span>
          </h3>
        </div>
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
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
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !sendingMessage && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={sendingMessage}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50"
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
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg sm:text-xl font-semibold flex items-center text-gray-800 dark:text-white">
            <FileText className="mr-2 text-blue-600 dark:text-blue-400" /> Assignments
            <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm">
              {selectedGroup.assignments.length}
            </span>
          </h3>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          {selectedGroup.assignments.length > 0 ? (
            selectedGroup.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition flex justify-between items-center"
              >
                <div>
                  <h4 className="font-semibold text-base sm:text-lg text-gray-800 dark:text-white">{assignment.title}</h4>
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

  if (authLoading || groupsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {groupsError && <ErrorMessage message={groupsError} />}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg flex flex-col">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Course Groups</h2>
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
              <div className="p-4 sm:p-6 text-center text-gray-500 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-lg shadow-md text-center">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Welcome to Course Group Management
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Select a group to manage its details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseGroupManagementPage;