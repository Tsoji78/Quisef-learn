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
  // Helper function to update memberIds array alongside members array
  private static updateMemberIds(members: Member[]): string[] {
    return members.map(member => member.id);
  }

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

      // Update the member with new role
      const updatedMember = { ...memberToUpdate, role: newRole };
      const updatedMembers = currentMembers.map(m => 
        m.id === memberId ? updatedMember : m
      );

      // Update both members array and memberIds array
      await updateDoc(groupRef, {
        members: updatedMembers,
        memberIds: this.updateMemberIds(updatedMembers),
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
      const updatedMembers = currentMembers.filter((m) => m.id !== memberId);

      await updateDoc(groupRef, {
        members: updatedMembers,
        memberIds: this.updateMemberIds(updatedMembers),
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
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }

      const currentMembers = groupDoc.data().members || [];
      const newMember: Member = {
        id: userId,
        name: userData.name || 'Unknown User',
        email: userData.email || '',
        role: userData.role || 'Student',
        profileImage: userData.profileImage || '',
      };

      // Check if member already exists
      if (currentMembers.some((m: Member) => m.id === userId)) {
        toast('User is already a member of this group.');
        return;
      }

      const updatedMembers = [...currentMembers, newMember];

      await updateDoc(groupRef, {
        members: updatedMembers,
        memberIds: this.updateMemberIds(updatedMembers),
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

      const groupData = groupSnap.data();
      const memberIds = groupData.memberIds || [];
      
      if (!memberIds.includes(userId)) {
        throw new Error('User is not a member of this group.');
      }

      // Ensure default forum exists
      const defaultForumRef = doc(db, 'groups', groupId, 'chatForums', 'default');
      const defaultForumSnap = await getDoc(defaultForumRef);
      if (!defaultForumSnap.exists()) {
        await setDoc(defaultForumRef, { 
          id: 'default',
          title: 'General Discussion',
          description: 'General discussion for the group',
          memberCount: memberIds.length,
          lastMessageAt: serverTimestamp() 
        });
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

  // Helper method to sync existing groups with memberIds
  static async syncGroupMemberIds(groupId: string) {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupSnap = await getDoc(groupRef);
      
      if (groupSnap.exists()) {
        const data = groupSnap.data();
        const members = data.members || [];
        const memberIds = this.updateMemberIds(members);
        
        await updateDoc(groupRef, { memberIds });
        console.log(`Synced memberIds for group ${groupId}`);
      }
    } catch (error) {
      console.error(`Error syncing memberIds for group ${groupId}:`, error);
    }
  }
}