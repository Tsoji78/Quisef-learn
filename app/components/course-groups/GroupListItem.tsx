// components/GroupListItem.tsx
import React from 'react';
import { CourseGroup } from '@/types';

interface GroupListItemProps {
  group: CourseGroup;
  isSelected: boolean;
  onClick: () => void;
}

export const GroupListItem = React.memo<GroupListItemProps>(({ group, isSelected, onClick }) => (
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

GroupListItem.displayName = 'GroupListItem';