This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
export interface Module {
  id: string;
  title: string;
  content: string;
  duration?: string;
  type: 'video' | 'document' | 'text' | 'quiz';
  order: number;
  resources?: CourseResource[];
  videoUrl?: string;
  isCompleted?: boolean;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  description?: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  price?: number;
  originalPrice?: number;
  thumbnail: string;
  category: string;
  modules: Module[];
  rating?: number;
  totalStudents?: number;
  lastUpdated?: string;
  language?: string;
  certificate?: boolean;
  requirements?: string[];
  whatYouLearn?: string[];
  targetAudience?: string[];
  instructor_bio?: string;
  instructor_image?: string;
  preview_video?: string;
  groupId?: string;
  progress?: number;
  studentsCount?: number;


}
export interface CourseResource {
  title: string;
  url: string;
  type: 'pdf' | 'video' | 'link' | 'document';
}


export interface CourseEnrollment {
  courseId: string;
  userId: string;
  enrolledAt: Date;
  progress: number;
  completedModules: string[];
  lastAccessed?: Date;
  certificateIssued?: boolean;
}
///


// Interface definitions
export interface Module {
  id:string;
  title: string;
  description?: string;
  content: any;
  lastModified?: any;
}

export interface Course {
  id?: string;
  title: string;
  description?: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  thumbnail: string;
  modules: Module[];
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
  isDraft?: boolean;
}

export interface ModalState {
  isOpen: boolean;
  status: 'success' | 'error' | 'uploading' | null;
  message: string;
}

export interface DeleteModalState {
  isOpen: boolean;
}

export interface ValidationErrors {
  [key: string]: string;
}

// types/index.ts
export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Instructor' | 'Teaching Assistant';
  profileImage?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

export interface Assignment {
  id: number;
  title: string;
  dueDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed';
}

export interface CourseGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  courseTitle: string;
  members: Member[];
  assignments: Assignment[];
  createdAt?: Date;
}


