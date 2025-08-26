// services/groupService.ts
import {
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '../types';
import { toast } from 'react-hot-toast';

export class GroupService {
  static async editMemberRole(
    groupId: string,
    memberId: string,
    newRole: 'Student' | 'Instructor' | 'Teaching Assistant',
    currentMembers: Member[]
  ) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const memberToUpdate = currentMembers.find((m) => m.id === memberId);
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
      throw error;
    }
  }

  static async removeMember(groupId: string, memberId: string, currentMembers: Member[]) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const memberToRemove = currentMembers.find((m) => m.id === memberId);
      if (!memberToRemove) throw new Error('Member not found');

      await updateDoc(groupRef, {
        members: arrayRemove(memberToRemove),
      });

      toast.success('Member removed successfully.');
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error(`Failed to remove member: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }

  static async addMember(groupId: string, userId: string, userData: Partial<Member>) {
    try {
      const groupRef = doc(db, 'groups', groupId);
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
      throw error;
    }
  }

  static async sendMessage(
    groupId: string,
    userId: string,
    userName: string,
    content: string,
    members: Member[]
  ) {
    try {
      // Validate group and user membership
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) {
        throw new Error('Group does not exist.');
      }
      if (!groupSnap.data().members.some((m: Member) => m.id === userId)) {
        throw new Error('User is not a member of this group.');
      }

      // Ensure default forum exists
      const defaultForumRef = doc(db, 'groups', groupId, 'chatForums', 'default');
      const defaultForumSnap = await getDoc(defaultForumRef);
      if (!defaultForumSnap.exists()) {
        await setDoc(defaultForumRef, { lastMessageAt: serverTimestamp() });
      }

      // Send message
      const messageRef = await addDoc(
        collection(db, 'groups', groupId, 'chatForums', 'default', 'messages'),
        {
          senderId: userId,
          senderName: userName,
          content,
          timestamp: serverTimestamp(),
        }
      );

      // Update forum timestamp
      await updateDoc(defaultForumRef, { lastMessageAt: serverTimestamp() });

      // Verify message was saved
      const sentMessageSnap = await getDoc(
        doc(db, 'groups', groupId, 'chatForums', 'default', 'messages', messageRef.id)
      );
      if (!sentMessageSnap.exists()) {
        throw new Error('Message was not saved to Firestore.');
      }

      console.log('Message sent successfully:', {
        messageId: messageRef.id,
        content,
        groupId,
        senderId: userId,
        senderName: userName,
      });

      toast.success('Message sent!');
      return messageRef.id;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
      throw error;
    }
  }
}