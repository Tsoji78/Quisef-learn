// Core Course and Module Interfaces
export interface CourseResource {
  title: string;
  url: string;
  type: 'pdf' | 'video' | 'link' | 'document';
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  content: any;
  rawContent?: any; // Keep for compatibility
  duration?: string;
  type: 'video' | 'document' | 'text' | 'quiz';
  order: number;
  resources?: CourseResource[];
    lessons: Lesson[];

  videoUrl?: string;
  isCompleted?: boolean;
   estimatedTime?: number;
  lastModified?: any;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string; // HTML content for display
  rawContent?: any; // Original Draft.js content
  type: 'video' | 'text' | 'quiz';
  duration: number;
  order: number;
  moduleId: string;
  completed: boolean;
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
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
  isDraft?: boolean;
}

// Enrollment and Progress Management
export interface CourseEnrollment {
  courseId: string;
  userId: string;
  enrolledAt: Date;
  progress: number;
  completedModules: string[];
  lastAccessed?: Date;
  certificateIssued?: boolean;
}

// Group and Social Features
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

// UI State Management
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