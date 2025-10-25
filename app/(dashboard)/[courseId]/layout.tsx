// app/[courseId]/layout.tsx
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ReactNode } from 'react';

// Generate static paths for all courses at build time
export async function generateStaticParams() {
  try {
    console.log('Generating static params for courses...');
    const coursesCollection = collection(db, 'courses');
    const coursesSnapshot = await getDocs(coursesCollection);
    
    const params = coursesSnapshot.docs.map((doc) => ({
      courseId: doc.id,
    }));
    
    console.log(`Generated ${params.length} course routes:`, params);
    return params;
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return empty array on error to allow build to continue
    return [];
  }
}

// Enable dynamic rendering for courses created after build
// This allows new courses to work without rebuilding
export const dynamicParams = true;

// Optional: Control revalidation (ISR - Incremental Static Regeneration)
// Uncomment to regenerate pages every X seconds
// export const revalidate = 3600; // Revalidate every hour

export default function CourseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}