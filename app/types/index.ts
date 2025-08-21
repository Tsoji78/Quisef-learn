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


