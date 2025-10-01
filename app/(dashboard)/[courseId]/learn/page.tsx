// app/courses/[courseId]/learn/page.tsx (SERVER COMPONENT)
import CourseLearnClient from './CourseLearnClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CourseLearnPage() {
  return <CourseLearnClient />;
}