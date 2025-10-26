// lib/certificateUtils.ts
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GenerateCertificateParams {
  userId: string;
  courseId: string;
  courseName: string;
  studentName: string;
  completionDate?: Date;
}

/**
 * Generates a certificate for a completed course
 * @param params Certificate generation parameters
 * @returns The generated certificate ID or null if failed
 */
export async function generateCertificate(params: GenerateCertificateParams): Promise<string | null> {
  const { userId, courseId, courseName, studentName, completionDate } = params;

  try {
    // Check if certificate already exists
    const certificateRef = doc(db, 'certificates', `${userId}_${courseId}`);
    const existingCert = await getDoc(certificateRef);

    if (existingCert.exists()) {
      console.log('Certificate already exists for this course');
      return existingCert.id;
    }

    // Create new certificate
    const certificateData = {
      userId,
      courseId,
      courseName,
      studentName,
      completionDate: completionDate || new Date(),
      issuedDate: serverTimestamp(),
      certificateGenerated: true,
    };

    await setDoc(certificateRef, certificateData);

    // Update course progress to mark certificate as generated
    const progressRef = doc(db, 'users', userId, 'courseProgress', courseId);
    await updateDoc(progressRef, {
      certificateGenerated: true,
      certificateId: certificateRef.id,
    });

    console.log('Certificate generated successfully:', certificateRef.id);
    return certificateRef.id;
  } catch (error) {
    console.error('Error generating certificate:', error);
    return null;
  }
}

/**
 * Checks if a certificate exists for a user and course
 */
export async function checkCertificateExists(userId: string, courseId: string): Promise<boolean> {
  try {
    const certificateRef = doc(db, 'certificates', `${userId}_${courseId}`);
    const certSnap = await getDoc(certificateRef);
    return certSnap.exists();
  } catch (error) {
    console.error('Error checking certificate:', error);
    return false;
  }
}

/**
 * Gets a certificate for a user and course
 */
export async function getCertificate(userId: string, courseId: string) {
  try {
    const certificateRef = doc(db, 'certificates', `${userId}_${courseId}`);
    const certSnap = await getDoc(certificateRef);
    
    if (certSnap.exists()) {
      return {
        id: certSnap.id,
        ...certSnap.data(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting certificate:', error);
    return null;
  }
}