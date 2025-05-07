'use client';

import { useState, useEffect } from 'react';
import { Save, X, Upload, HelpCircle, Plus, Trash, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { collection, addDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import TipTapLink from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Typography from '@tiptap/extension-typography';
import { createLowlight } from 'lowlight'; // Import createLowlight
// Optional: Import specific languages for syntax highlighting
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import css from 'highlight.js/lib/languages/css';

// Create lowlight instance and register languages
const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('python', python);
lowlight.register('css', css);

// Custom Toolbar Component for TipTap
const Toolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-t-md border-b border-gray-300 dark:border-gray-600">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 rounded ${editor.isActive('bold') ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        title="Bold"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.96-1.7 3.96-3.91 0-1.39-.76-2.62-1.94-3.3zM9 6h4c1.1 0 2 .9 2 2s-.9 2-2 2H9V6zm6 8H9v-4h6c1.1 0 2 .9 2 2s-.9 2-2 2z" />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 rounded ${editor.isActive('italic') ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        title="Italic"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 rounded ${editor.isActive('underline') ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        title="Underline"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        title="Bullet List"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 rounded ${editor.isActive('orderedList') ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        title="Ordered List"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1 rounded ${editor.isActive('codeBlock') ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        title="Code Block"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.7 15.9L4.8 12l3.9-3.9c.39-.39.39-1.01 0-1.4-.39-.39-1.01-.39-1.4 0l-4.59 4.59c-.39.39-.39 1.02 0 1.41l4.59 4.6c.39.39 1.01.39 1.4 0 .39-.39.39-1.01 0-1.4zm6.6-1.4c-.39.39-1.01.39-1.4 0-.39-.39-.39-1.01 0-1.4l3.9-3.9-3.9-3.9c-.39-.39-.39-1.01 0-1.4.39-.39 1.01-.39 1.4 0l4.59 4.59c.39.39.39 1.02 0 1.41l-4.59 4.6z" />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleLink({ href: prompt('Enter URL') || '' }).run()}
        className={`p-1 rounded ${editor.isActive('link') ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
        title="Link"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
        </svg>
      </button>
      <button
        onClick={() => {
          const src = prompt('Enter image URL');
          if (src) editor.chain().focus().setImage({ src }).run();
        }}
        className="p-1 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        title="Image"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      </button>
      <button
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        className="p-1 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        title="Table"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 3v18h18V3H3zm16 2v2h-6V5h6zm-8 0v2H5V5h6zm-8 0h2v2H3V5zm2 4h6v2H5V9zm8 0h6v2h-6V9zm-8 4h6v2H5v-2zm8 0h6v2h-6v-2zm0 4h6v2h-6v-2zm-8 0h6v2H5v-2z" />
        </svg>
      </button>
    </div>
  );
};

interface Module {
  id: string;
  title: string;
  content: string;
}

interface Course {
  id?: string;
  title: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  thumbnail: string;
  modules: Module[];
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface ModalState {
  isOpen: boolean;
  status: 'success' | 'error' | null;
  message: string;
}

interface DeleteModalState {
  isOpen: boolean;
}

export default function CourseManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  const [formData, setFormData] = useState<Course>({
    title: '',
    instructor: '',
    level: 'Beginner',
    duration: '',
    thumbnail: '/api/placeholder/400/250?text=Course',
    modules: [{ id: uuidv4(), title: '', content: '' }],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, status: null, message: '' });
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false });

  // Initialize TipTap editor for the current module
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      Underline,
      Image,
      TipTapLink.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }), // Pass lowlight instance
      Typography,
    ],
    content: formData.modules[currentModuleIndex].content,
    onUpdate: ({ editor }) => {
      handleModuleContentChange(editor.getHTML(), currentModuleIndex);
    },
  });

  // Update editor content when module index changes
  useEffect(() => {
    if (editor) {
      editor.commands.setContent(formData.modules[currentModuleIndex].content);
    }
  }, [currentModuleIndex, editor]);

  // Fetch existing course data if editing
  useEffect(() => {
    const fetchCourse = async () => {
      if (courseId) {
        setLoading(true);
        try {
          const docRef = doc(db, 'courses', courseId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const courseData = docSnap.data() as Course;
            const modulesWithIds = courseData.modules.map((module) => ({
              ...module,
              id: module.id || uuidv4(),
            }));
            setFormData({
              ...courseData,
              id: docSnap.id,
              modules: modulesWithIds.length > 0 ? modulesWithIds : [{ id: uuidv4(), title: '', content: '' }],
            });
            setErrors({});
          } else {
            setErrors({ general: 'Course not found' });
          }
        } catch (err: any) {
          console.error('Error fetching course:', err);
          setErrors({ general: `Failed to load course: ${err.message || 'Unknown error'}` });
        } finally {
          setLoading(false);
        }
      }
    };
    fetchCourse();
  }, [courseId]);

  // Redirect to modules page after successful save
  useEffect(() => {
    if (modal.isOpen && modal.status === 'success') {
      const timer = setTimeout(() => {
        setModal({ isOpen: false, status: null, message: '' });
        router.push('/modules');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [modal, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleModuleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
    const { name, value } = e.target;
    const updatedModules = [...formData.modules];
    updatedModules[index] = { ...updatedModules[index], [name]: value };
    setFormData({ ...formData, modules: updatedModules });
    const errorKey = `module_${index}_${name}`;
    if (errors[errorKey]) {
      setErrors({ ...errors, [errorKey]: '' });
    }
  };

  const handleModuleContentChange = (newContent: string, index: number) => {
    const updatedModules = [...formData.modules];
    updatedModules[index] = { ...updatedModules[index], content: newContent };
    setFormData({ ...formData, modules: updatedModules });
  };

  const addModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, { id: uuidv4(), title: '', content: '' }],
    });
    setCurrentModuleIndex(formData.modules.length);
  };

  const removeModule = (index: number) => {
    if (formData.modules.length > 1) {
      const updatedModules = [...formData.modules];
      updatedModules.splice(index, 1);
      setFormData({ ...formData, modules: updatedModules });
      if (currentModuleIndex >= updatedModules.length) {
        setCurrentModuleIndex(updatedModules.length - 1);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit.');
        return;
      }
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData({ ...formData, thumbnail: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const clearThumbnail = () => {
    setThumbnailFile(null);
    setFormData({ ...formData, thumbnail: '/api/placeholder/400/250?text=Course' });
  };

  const uploadThumbnail = async (): Promise<string> => {
    if (!thumbnailFile) return formData.thumbnail;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing.');
    }
    const uploadData = new FormData();
    uploadData.append('file', thumbnailFile);
    uploadData.append('upload_preset', uploadPreset);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: uploadData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to upload image: ${errorData.error?.message || 'Unknown error'}`);
      }
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw error;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Course title is required';
    if (!formData.instructor) newErrors.instructor = 'Instructor name is required';
    formData.modules.forEach((module, index) => {
      if (!module.title) {
        newErrors[`module_${index}_title`] = `Module ${index + 1} title is required`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCourse = async () => {
    if (!validateForm()) {
      window.scrollTo(0, 0);
      return;
    }

    try {
      setSaving(true);
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail();
      }

      const courseData = {
        ...formData,
        thumbnail: thumbnailUrl,
        createdBy: formData.instructor,
        updatedAt: serverTimestamp(),
        createdAt: formData.createdAt || serverTimestamp(),
      };

      let newCourseId = courseId;
      if (courseId) {
        await setDoc(doc(db, 'courses', courseId), courseData, { merge: true });
        setModal({
          isOpen: true,
          status: 'success',
          message: 'Course updated successfully!',
        });
      } else {
        const courseRef = await addDoc(collection(db, 'courses'), courseData);
        newCourseId = courseRef.id;

        const groupData = {
          name: courseData.title,
          description: `Group for ${courseData.title}`,
          courseId: newCourseId,
          members: [
            {
              id: uuidv4(),
              name: courseData.instructor,
              email: `${courseData.instructor.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              role: 'Instructor',
              profileImage: '/api/placeholder/50/50',
            },
          ],
          chatForums: [
            {
              id: 1,
              title: 'General Discussion',
              description: 'Course-wide chat for general topics',
              memberCount: 1,
              lastMessageAt: new Date(),
              messages: [],
            },
          ],
          assignments: [],
          createdAt: serverTimestamp(),
        };
        await addDoc(collection(db, 'groups'), groupData);

        setModal({
          isOpen: true,
          status: 'success',
          message: 'Course and group created successfully!',
        });
      }
    } catch (error) {
      console.error('Error saving course:', error);
      setModal({
        isOpen: true,
        status: 'error',
        message: `Failed to save course: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteModal({ isOpen: true });
  };

  const deleteCourse = async () => {
    if (!courseId) return;
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      setModal({
        isOpen: true,
        status: 'success',
        message: 'Course deleted successfully!',
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      setModal({
        isOpen: true,
        status: 'error',
        message: `Failed to delete course: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, status: null, message: '' });
  };

  const goToNextStep = () => {
    if (step === 1 && !formData.title) {
      setErrors({ title: 'Course title is required' });
      return;
    }
    setStep(step + 1);
  };

  const goToPreviousStep = () => {
    setStep(step - 1);
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          {courseId ? 'Edit the basic course information.' : 'Start by adding the basic course information.'} Fields marked with * are required.
        </p>
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Title*
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          required
          className={`mt-1 block w-full px-3 py-2 border ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Instructor*
        </label>
        <input
          type="text"
          id="instructor"
          name="instructor"
          value={formData.instructor}
          onChange={handleInputChange}
          required
          className={`mt-1 block w-full px-3 py-2 border ${errors.instructor ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
        />
        {errors.instructor && <p className="mt-1 text-sm text-red-500">{errors.instructor}</p>}
      </div>
    </div>
  );

  const renderModulesSection = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          {courseId ? 'Edit or add modules to your course.' : 'Add modules to your course.'} Each module should have a title and content.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Modules</h3>
            <button onClick={addModule} className="flex items-center text-blue-500 hover:text-blue-700">
              <Plus size={16} className="mr-1" />
              <span className="text-sm">Add</span>
            </button>
          </div>
          <div className="space-y-2 overflow-auto max-h-96 pr-2">
            {formData.modules.map((module, index) => (
              <div
                key={module.id}
                className={`flex justify-between p-3 rounded-md cursor-pointer ${
                  currentModuleIndex === index ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => setCurrentModuleIndex(index)}
              >
                <div className="truncate flex-1">
                  <span className="text-sm font-medium">{module.title || `Module ${index + 1}`}</span>
                </div>
                {formData.modules.length > 1 && (
                  <button onClick={(e) => { e.stopPropagation(); removeModule(index); }} className="text-gray-500 hover:text-red-500">
                    <Trash size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="md:w-3/4">
          <div>
            <label htmlFor={`module-title-${currentModuleIndex}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Module Title*
            </label>
            <input
              type="text"
              id={`module-title-${currentModuleIndex}`}
              name="title"
              value={formData.modules[currentModuleIndex].title}
              onChange={(e) => handleModuleInputChange(e, currentModuleIndex)}
              required
              className={`mt-1 block w-full px-3 py-2 border ${
                errors[`module_${currentModuleIndex}_title`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
              placeholder="Enter module title"
            />
            {errors[`module_${currentModuleIndex}_title`] && (
              <p className="mt-1 text-sm text-red-500">{errors[`module_${currentModuleIndex}_title`]}</p>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={`module-content-${currentModuleIndex}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Module Content
              </label>
              <button onClick={() => setShowHelp(!showHelp)} className="text-blue-500 hover:text-blue-700 text-sm flex items-center">
                <HelpCircle size={16} className="mr-1" />
                Editor Help
              </button>
            </div>
            {showHelp && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                <h4 className="font-semibold mb-2">Editor Tips:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use the toolbar to format text (bold, italic, headings)</li>
                  <li>Add images by entering a URL</li>
                  <li>Create tables to organize data</li>
                  <li>Use code blocks for code snippets</li>
                  <li>Add links by selecting text and entering a URL</li>
                </ul>
              </div>
            )}
            <div className="border border-gray-300 dark:border-gray-600 rounded-md">
              <Toolbar editor={editor} />
              <EditorContent
                editor={editor}
                className="prose prose-sm max-w-none p-4 min-h-[400px] bg-white dark:bg-white text-black focus:outline-none"
              />
            </div>
            <style jsx global>{`
              .prose {
                color: #000000 !important;
              }
              .prose p, .prose div, .prose span, .prose a,
              .prose h1, .prose h2, .prose h3, .prose h4,
              .prose h5, .prose h6, .prose li, .prose td,
              .prose th, .prose pre, .prose code {
                color: #000000 !important;
              }
              .dark .prose {
                background-color: white !important;
                color: #000000 !important;
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailsSection = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          {courseId ? 'Edit additional details about your course.' : 'Add additional details about your course.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Level
          </label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Duration
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleInputChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 6 weeks"
          />
        </div>
      </div>
      <div>
        <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Thumbnail Image
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="file"
            id="thumbnail"
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600"
            onChange={handleFileChange}
          />
          {thumbnailFile && (
            <button onClick={clearThumbnail} className="flex items-center space-x-1 text-red-500 hover:text-red-700">
              <Trash size={16} />
              <span>Clear</span>
            </button>
          )}
        </div>
        {formData.thumbnail && (
          <div className="mt-2 h-32 w-48 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <img src={formData.thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{courseId ? 'Edit Course' : 'Add New Course'}</h1>
        <div className="flex space-x-4">
          {courseId && (
            <button onClick={openDeleteModal} className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Trash2 size={18} />
              <span>Delete Course</span>
            </button>
          )}
          <Link href="/modules">
            <button className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
              <X size={18} />
              <span>Back to List</span>
            </button>
          </Link>
        </div>
      </div>
      {errors.general && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{errors.general}</div>
      )}
      <div className="flex mb-8">
        <div className="flex-1">
          <div className={`h-2 ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'} rounded-l-full`}></div>
          <p className={`text-center text-sm mt-2 ${step === 1 ? 'font-semibold text-blue-500' : 'text-gray-500'}`}>Course Info</p>
        </div>
        <div className="flex-1">
          <div className={`h-2 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
          <p className={`text-center text-sm mt-2 ${step === 2 ? 'font-semibold text-blue-500' : 'text-gray-500'}`}>Modules</p>
        </div>
        <div className="flex-1">
          <div className={`h-2 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'} rounded-r-full`}></div>
          <p className={`text-center text-sm mt-2 ${step === 3 ? 'font-semibold text-blue-500' : 'text-gray-500'}`}>Details</p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {Object.keys(errors).length > 0 && !errors.general && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <h3 className="text-red-800 dark:text-red-300 font-medium">Please fix the following errors:</h3>
            <ul className="list-disc ml-5 mt-2">
              {Object.values(errors).map((error, index) => (
                <li key={index} className="text-red-700 dark:text-red-400 text-sm">{error}</li>
              ))}
            </ul>
          </div>
        )}
        {step === 1 && renderBasicInfo()}
        {step === 2 && renderModulesSection()}
        {step === 3 && renderDetailsSection()}
        <div className="flex justify-between pt-6 border-t mt-8">
          <div>
            {step > 1 && (
              <button onClick={goToPreviousStep} disabled={saving} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/modules">
              <button disabled={saving} className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50">
                Cancel
              </button>
            </Link>
            {step < 3 ? (
              <button onClick={goToNextStep} disabled={saving} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors disabled:opacity-50">
                Next
              </button>
            ) : (
              <button onClick={saveCourse} disabled={saving} className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors disabled:opacity-50">
                {saving ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{courseId ? 'Update Course' : 'Save Course'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={modal.status === 'error' ? closeModal : undefined}>
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${modal.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {modal.status === 'success' ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {modal.status === 'success' ? (courseId ? 'Course Updated' : 'Course Created') : 'Operation Failed'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{modal.message}</p>
                    </div>
                  </div>
                </div>
              </div>
              {modal.status === 'error' && (
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={closeModal}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setDeleteModal({ isOpen: false })}>
              <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Delete Course</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete the course "{formData.title}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={deleteCourse}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeleteModal({ isOpen: false })}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}