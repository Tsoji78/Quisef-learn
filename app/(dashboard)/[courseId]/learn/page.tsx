// app/courses/[courseId]/learn/page.tsx (SERVER COMPONENT)
import CourseLearnClient from './CourseLearnClient';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Adjust path to your Firebase config

// Generate static params for all courses at build time
export async function generateStaticParams() {
  try {
    const coursesRef = collection(db, 'courses');
    const coursesSnapshot = await getDocs(coursesRef);
    
    const params = coursesSnapshot.docs.map((doc) => ({
      courseId: doc.id,
    }));

    // Return array of params for static generation
    return params;
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return empty array to fall back to dynamic rendering
    return [];
  }
}

// Opt into dynamic rendering for authenticated/personalized content
// This allows static generation but still supports dynamic data fetching
export const dynamic = 'force-dynamic';

// Alternatively, use ISR (Incremental Static Regeneration)
// Uncomment the line below to revalidate every 3600 seconds (1 hour)
// export const revalidate = 3600;

export default function CourseLearnPage() {
  return <CourseLearnClient />;
}