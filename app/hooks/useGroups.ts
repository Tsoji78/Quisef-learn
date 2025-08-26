// hooks/useGroups.ts
import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  onSnapshot,
  query,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CourseGroup, Member } from '@/types';

export const useGroups = (user: User | null) => {
  const [groups, setGroups] = useState<CourseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return { groups, loading, error };
};