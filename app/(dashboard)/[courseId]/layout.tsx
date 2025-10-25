// app/[courseId]/layout.tsx
import { ReactNode } from 'react';

// IMPORTANT: Remove generateStaticParams from layout
// It should be in page.tsx files instead

// Enable dynamic rendering for new courses
export const dynamicParams = true;

// Optional: Set revalidation for ISR
export const revalidate = 3600; // Revalidate every hour

export default function CourseLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}