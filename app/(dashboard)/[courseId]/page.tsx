// app/courses/[courseId]/enroll/page.tsx (SERVER COMPONENT)
import CourseEnrollmentClient from './CourseEnrollmentClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CourseEnrollmentPage() {
  return <CourseEnrollmentClient />;
}
