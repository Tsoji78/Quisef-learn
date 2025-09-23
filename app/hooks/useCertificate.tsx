import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course } from '@/types';

interface UseCertificateProps {
  userId: string | undefined;
  course: Course | null;
  currentProgress: number;
}

export const useCertificate = ({ userId, course, currentProgress }: UseCertificateProps) => {
  const [certificateGenerated, setCertificateGenerated] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  const generateCertificate = async () => {
    if (!userId || !course?.id) return;
    
    try {
      const userProgressRef = doc(db, 'users', userId, 'enrollments', course.id);
      await updateDoc(userProgressRef, {
        certificateGenerated: true,
        certificateGeneratedAt: new Date()
      });
      
      setCertificateGenerated(true);
      setShowCertificateModal(true);
    } catch (error) {
      console.error('Error generating certificate:', error);
    }
  };

  const downloadCertificate = () => {
    const certificateData = {
      studentName: userId || 'Student',
      courseName: course?.title,
      instructor: course?.instructor,
      completionDate: new Date().toLocaleDateString(),
      certificateId: `CERT-${course?.id}-${userId?.substring(0, 8)}`
    };
    
    const dataStr = JSON.stringify(certificateData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${course?.title?.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareCertificate = async () => {
    const certificateUrl = `${window.location.origin}/certificates/${course?.id}/${userId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate of Completion - ${course?.title}`,
          text: `I just completed ${course?.title} course!`,
          url: certificateUrl
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(certificateUrl);
        alert('Certificate link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  useEffect(() => {
    if (currentProgress === 100 && !certificateGenerated) {
      generateCertificate();
    }
  }, [currentProgress, certificateGenerated]);

  return {
    certificateGenerated,
    setCertificateGenerated,
    showCertificateModal,
    setShowCertificateModal,
    downloadCertificate,
    shareCertificate
  };
};