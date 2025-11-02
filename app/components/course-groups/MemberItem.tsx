// components/MemberItem.tsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Member } from '@/types';

interface MemberItemProps {
  member: Member;
  groupId: string;
  onRoleChange: (groupId: string, memberId: string, newRole: 'Student' | 'Instructor' | 'Teaching Assistant') => void;
  onRemove: (groupId: string, memberId: string) => void;
}

export const MemberItem = React.memo<MemberItemProps>(({ member, groupId, onRoleChange, onRemove }) => (
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
        onChange={(e) => onRoleChange(groupId, member.id, e.target.value as any)}
        className="text-blue-600 dark:text-blue-400 text-sm p-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none"
      >
        <option value="Student">Student</option>
        <option value="Instructor">Instructor</option>
        <option value="Teaching Assistant">Teaching Assistant</option>
      </select>
    </div>
  </div>
));

MemberItem.displayName = 'MemberItem';