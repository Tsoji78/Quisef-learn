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


