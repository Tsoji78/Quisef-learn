// lib/certificateUtils.ts
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GenerateCertificateParams {
  userId: string;
  courseId: string;
  courseName: string;
  studentName: string;
  completionDate?: Date | Timestamp;
}

/**
 * Generates a certificate for a completed course
 * @param params Certificate generation parameters
 * @returns The generated certificate ID or null if failed
 */
export async function generateCertificate(params: GenerateCertificateParams): Promise<string | null> {
  const { userId, courseId, courseName, studentName, completionDate } = params;

  try {
    // Use consistent ID pattern
    const certificateId = `${userId}_${courseId}`;
    const certificateRef = doc(db, 'certificates', certificateId);
    
    // Check if certificate already exists
    const existingCert = await getDoc(certificateRef);

    if (existingCert.exists()) {
      console.log('Certificate already exists for this course');
      return existingCert.id;
    }

    // Create new certificate with proper timestamps
    const certificateData = {
      userId,
      courseId,
      courseName,
      studentName,
      completionDate: completionDate || serverTimestamp(),
      issuedDate: serverTimestamp(),
      certificateGenerated: true,
      createdAt: serverTimestamp(),
    };

    await setDoc(certificateRef, certificateData);
    console.log('Certificate created successfully:', certificateId);

    // Update course progress to mark certificate as generated
    try {
      const progressRef = doc(db, 'users', userId, 'courseProgress', courseId);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        await updateDoc(progressRef, {
          certificateGenerated: true,
          certificateId: certificateId,
          certificateGeneratedAt: serverTimestamp(),
        });
        console.log('Course progress updated with certificate info');
      } else {
        console.warn('Course progress document not found for:', courseId);
      }
    } catch (progressError) {
      console.error('Error updating progress, but certificate was created:', progressError);
      // Don't fail the whole operation if progress update fails
    }

    return certificateId;
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
      const data = certSnap.data();
      return {
        id: certSnap.id,
        ...data,
        completionDate: data.completionDate?.toDate?.() || new Date(),
        issuedDate: data.issuedDate?.toDate?.() || new Date(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting certificate:', error);
    return null;
  }
}

/**
 * Force refresh/regenerate certificate
 */
export async function regenerateCertificate(params: GenerateCertificateParams): Promise<string | null> {
  const { userId, courseId } = params;
  
  try {
    // Delete existing certificate if any
    const certificateRef = doc(db, 'certificates', `${userId}_${courseId}`);
    const existingCert = await getDoc(certificateRef);
    
    if (existingCert.exists()) {
      console.log('Deleting existing certificate to regenerate');
    }
    
    // Generate new certificate
    return await generateCertificate(params);
  } catch (error) {
    console.error('Error regenerating certificate:', error);
    return null;
  }
}