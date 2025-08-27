// utils/migrateGroups.ts
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Member } from '@/types';

export const migrateGroupsWithMemberIds = async () => {
  try {
    console.log('Starting migration of groups to include memberIds...');
    
    const groupsCollection = collection(db, 'groups');
    const groupsSnapshot = await getDocs(groupsCollection);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const groupDoc of groupsSnapshot.docs) {
      const data = groupDoc.data();
      
      // Check if memberIds already exists
      if (data.memberIds && Array.isArray(data.memberIds)) {
        console.log(`Group ${groupDoc.id} already has memberIds, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Extract member IDs from members array
      const members = data.members || [];
      const memberIds = members
        .filter((member: any) => member && member.id)
        .map((member: Member) => member.id);
      
      // Update the document with memberIds
      const groupRef = doc(db, 'groups', groupDoc.id);
      await updateDoc(groupRef, {
        memberIds: memberIds
      });
      
      console.log(`Migrated group ${groupDoc.id} with ${memberIds.length} memberIds`);
      migratedCount++;
    }
    
    console.log(`Migration completed! Migrated: ${migratedCount}, Skipped: ${skippedCount}`);
    return { migratedCount, skippedCount };
    
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  }
};

// Usage: Call this function once to migrate existing data
// migrateGroupsWithMemberIds();