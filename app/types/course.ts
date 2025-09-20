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
