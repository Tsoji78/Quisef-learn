'use client';

import { useState, useEffect } from 'react';
import JoditEditor from 'jodit-react';
import { Save, X, Upload, HelpCircle, Plus, Trash, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { collection, addDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';

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

  const editorConfig = {
    readonly: false,
    height: 400,
    toolbarAdaptive: false,
    buttons: ['bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'font', 'fontsize', 'brush', 'paragraph', '|', 'image', 'video', 'table', 'link', '|', 'undo', 'redo'],
    theme: 'default',
    style: { color: '#000000' },
    colors: {
      greyscale: ['#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF'],
      palette: ['#980000', '#FF0000', '#FF9900', '#FFFF00', '#00F0F0', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF'],
      full: [
        '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
        '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
        '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
        '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
        '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
        '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130',
      ],
    },
    defaultStyle: { color: '#000000' },
    iframe: false,
    css: `
      .jodit-container { color: #000000 !important; }
      .jodit-wysiwyg { color: #000000 !important; }
      .jodit-wysiwyg p, .jodit-wysiwyg div, .jodit-wysiwyg span, .jodit-wysiwyg a { color: #000000 !important; }
    `,
  };

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
        createdBy: formData.instructor, // Use instructor name as identifier
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

        // Create a corresponding group in Firestore
        const groupData = {
          name: courseData.title,
          description: `Group for ${courseData.title}`,
          courseId: newCourseId,
          members: [
            {
              id: uuidv4(), // Generate unique ID for instructor
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
              lastMessageAt: new Date(), // Use client-side timestamp
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
                  <li>Use the formatting toolbar to style your content</li>
                  <li>Add images and videos using the media buttons</li>
                  <li>Create tables to organize information</li>
                  <li>Use headings to structure your content</li>
                </ul>
              </div>
            )}
            <div className="black-text-editor">
              <JoditEditor
                value={formData.modules[currentModuleIndex].content}
                config={editorConfig}
                onBlur={(content) => handleModuleContentChange(content, currentModuleIndex)}
              />
            </div>
            <style jsx global>{`
              .jodit-wysiwyg { color: #000000 !important; }
              .jodit-wysiwyg p, .jodit-wysiwyg div, .jodit-wysiwyg span, .jodit-wysiwyg a,
              .jodit-wysiwyg h1, .jodit-wysiwyg h2, .jodit-wysiwyg h3, .jodit-wysiwyg h4,
              .jodit-wysiwyg h5, .jodit-wysiwyg h6, .jodit-wysiwyg li, .jodit-wysiwyg td,
              .jodit-wysiwyg th, .jodit-wysiwyg pre, .jodit-wysiwyg code {
                color: #000000 !important;
              }
              .dark .jodit-wysiwyg { background-color: white; color: #000000 !important; }
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
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 24 24" stroke="currentColor">
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