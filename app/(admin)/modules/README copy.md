'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';

interface Course {
  id: string;
  title: string;
  instructor: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  thumbnail: string;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [coursesPerPage] = useState(10);

  // Handle authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch courses from Firebase
  useEffect(() => {
    if (!user) return;

    const fetchCourses = async () => {
      setLoading(true);
      try {
        const coursesCollection = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesCollection);
        const coursesList = coursesSnapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              title: data.title || '',
              instructor: data.instructor || '',
              level: ['Beginner', 'Intermediate', 'Advanced'].includes(data.level) ? data.level : 'Beginner',
              duration: data.duration || '',
              thumbnail: data.thumbnail || '/api/placeholder/400/250?text=No+Image',
            } as Course;
          })
          .filter((course): course is Course => {
            return (
              typeof course.id === 'string' &&
              typeof course.title === 'string' &&
              typeof course.instructor === 'string' &&
              ['Beginner', 'Intermediate', 'Advanced'].includes(course.level) &&
              typeof course.duration === 'string' &&
              typeof course.thumbnail === 'string'
            );
          });

        console.log('Fetched courses:', coursesList);
        setCourses(coursesList);
        setError(null);
        setCurrentPage(1);
      } catch (err: any) {
        console.error('Error fetching courses:', err);
        setError(`Failed to load courses: ${err.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const openDeleteModal = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const deleteCourse = async () => {
    if (!courseToDelete || !courseToDelete.id) {
      setError('No course selected for deletion');
      setIsDeleteModalOpen(false);
      return;
    }

    try {
      await deleteDoc(doc(db, 'courses', courseToDelete.id));
      setCourses(courses.filter((course) => course.id !== courseToDelete.id));
      setError(null);
      const filteredCourses = courses.filter(
        (course) =>
          course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const totalPages = Math.ceil((filteredCourses.length - 1) / coursesPerPage);
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      } else if (totalPages === 0) {
        setCurrentPage(1);
      }
    } catch (err: any) {
      console.error('Error deleting course:', err);
      setError(`Failed to delete course: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };

  // Filter courses client-side
  const filteredCourses = courses.filter(
    (course) =>
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination data
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  // Generate page numbers for display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage === totalPages) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Course Management</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <Link href="/modules/AddCourse">
            <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              <Plus size={18} />
              <span>Add Course</span>
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {filteredCourses.length === 0 && !loading ? (
          <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
            No courses found. Try a different search or add a new course.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Thumbnail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Instructor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {currentCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={course.thumbnail || '/api/placeholder/400/250?text=No+Image'}
                          alt={course.title}
                          className="h-12 w-20 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/modules/AddCourse/edit?id=${course.id}`}>
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer">
                            {course.title}
                          </div>
                        </Link>
                        <div className="text-xs text-gray-500 dark:text-gray-400">ID: {course.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.instructor}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            course.level === 'Beginner'
                              ? 'bg-green-100 text-green-800'
                              : course.level === 'Intermediate'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {course.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{course.duration}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <Link href={`/modules/AddCourse/edit?id=${course.id}`}>
                            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                              <Pencil size={18} />
                            </button>
                          </Link>
                          <button
                            onClick={() => openDeleteModal(course)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {indexOfFirstCourse + 1} to {Math.min(indexOfLastCourse, filteredCourses.length)} of {filteredCourses.length} courses
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} className="mr-1" />
                    Previous
                  </button>

                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded ${
                        currentPage === page
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight size={18} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isDeleteModalOpen && courseToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setIsDeleteModalOpen(false)}>
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
                        Are you sure you want to delete the course "{courseToDelete.title}"? This action cannot be undone.
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
                  onClick={() => setIsDeleteModalOpen(false)}
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

'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, X, HelpCircle, Plus, Trash, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Custom Video Blot
import { BlockEmbed } from 'quill/blots/block'; // Corrected import

class VideoBlot extends BlockEmbed {
  static blotName = 'video';
  static tagName = 'video';
  static create(value: { src: string; title?: string }) {
    const node = super.create() as HTMLElement;
    node.setAttribute('src', value.src);
    node.setAttribute('controls', 'controls');
    if (value.title) {
      node.setAttribute('title', value.title);
    }
    node.className = 'max-w-full h-auto my-2';
    return node;
  }

  static value(node: HTMLElement) {
    return {
      src: node.getAttribute('src'),
      title: node.getAttribute('title') || null,
    };
  }
}
Quill.register('formats/video', VideoBlot);

// No CustomImageBlot needed, as we use Quill's default image format for multiple images

interface Module {
  id: string;
  title: string;
  content: any; // Quill Delta content
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
  status: 'success' | 'error' | 'uploading' | null;
  message: string;
}

interface DeleteModalState {
  isOpen: boolean;
}

export default function CourseManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  const isEditing = !!courseId;

  const [formData, setFormData] = useState<Course>({
    title: '',
    instructor: '',
    level: 'Beginner',
    duration: '',
    thumbnail: '/api/placeholder/400/250?text=Course',
    modules: [{ id: uuidv4(), title: '', content: { ops: [] } }],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, status: null, message: '' });
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false });

  const quillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quillInstances = useRef<(Quill | null)[]>([]);

  // Cloudinary Upload Handler
  const uploadToCloudinary = async (file: File, type: 'image' | 'video'): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing');
    }
    const validTypes = type === 'image' ? ['image/jpeg', 'image/png', 'image/gif'] : ['video/mp4', 'video/webm', 'video/mov'];
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      throw new Error(`Only ${type === 'image' ? 'JPEG, PNG, or GIF images' : 'MP4, WebM, or MOV videos'} are allowed`);
    }
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${type === 'image' ? '5MB' : '10MB'} limit`);
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(`${type} upload response:`, text);
        throw new Error(`Failed to upload ${type}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.secure_url) throw new Error('No URL returned from upload');
      return data.secure_url;
    } catch (error: any) {
      console.error(`${type} upload error:`, error);
      throw error;
    }
  };

  // Initialize Quill editors
  useEffect(() => {
    quillRefs.current = formData.modules.map(() => null);
    quillInstances.current = formData.modules.map((module, index) => {
      if (quillRefs.current[index] && !quillInstances.current[index]) {
        const quill = new Quill(quillRefs.current[index]!, {
          theme: 'snow',
          modules: {
            toolbar: {
              container: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ align: [] }, { indent: '-1' }, { indent: '+1' }],
                ['link', 'image', 'video'],
                ['blockquote', 'code-block'],
                ['clean'],
              ],
              handlers: {
                image: () => {
                  const input = document.createElement('input');
                  input.setAttribute('type', 'file');
                  input.setAttribute('accept', 'image/jpeg,image/png,image/gif');
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const quill = quillInstances.current[index];
                    if (!quill) return;
                    try {
                      setModal({ isOpen: true, status: 'uploading', message: 'Uploading image...' });
                      const url = await uploadToCloudinary(file, 'image');
                      const range = quill.getSelection(true);
                      quill.insertEmbed(range.index, 'image', url);
                      quill.setSelection(range.index + 1, 0);
                      setModal({ isOpen: false, status: null, message: '' });
                    } catch (error: any) {
                      setModal({ isOpen: true, status: 'error', message: `Failed to upload image: ${error.message}` });
                    }
                  };
                  input.click();
                },
                video: () => {
                  const input = document.createElement('input');
                  input.setAttribute('type', 'file');
                  input.setAttribute('accept', 'video/mp4,video/webm,video/mov');
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const quill = quillInstances.current[index];
                    if (!quill) return;
                    try {
                      setModal({ isOpen: true, status: 'uploading', message: 'Uploading video...' });
                      const url = await uploadToCloudinary(file, 'video');
                      const range = quill.getSelection(true);
                      quill.insertEmbed(range.index, 'video', { src: url, title: 'Course Video' });
                      quill.setSelection(range.index + 1, 0);
                      setModal({ isOpen: false, status: null, message: '' });
                    } catch (error: any) {
                      setModal({ isOpen: true, status: 'error', message: `Failed to upload video: ${error.message}` });
                    }
                  };
                  input.click();
                },
              },
            },
          },
          placeholder: 'Enter module content...',
        });

        // Set initial content
        quill.setContents(module.content || { ops: [] });

        // Ensure editor is editable and focused
        quill.enable(true);
        quill.focus();

        // Update formData on content change
        quill.on('text-change', () => {
          const updatedModules = [...formData.modules];
          updatedModules[index].content = quill.getContents();
          setFormData({ ...formData, modules: updatedModules });
        });

        return quill;
      }
      return quillInstances.current[index] || null;
    });

    // Cleanup on unmount
    return () => {
      quillInstances.current.forEach((quill) => {
        if (quill) {
          quill.off('text-change');
        }
      });
    };
  }, [formData.modules.length]);

  // Handle authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch course data if editing
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId || !user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const courseData = docSnap.data() as Course;
          const modulesWithIds = courseData.modules.map((module) => ({
            ...module,
            id: module.id || uuidv4(),
            content: typeof module.content === 'string'
              ? { ops: [{ insert: module.content + '\n' }] }
              : module.content || { ops: [] },
          }));
          setFormData({
            ...courseData,
            id: docSnap.id,
            modules: modulesWithIds.length > 0 ? modulesWithIds : [{ id: uuidv4(), title: '', content: { ops: [] } }],
          });
          setErrors({});
        } else {
          setModal({ isOpen: true, status: 'error', message: 'Course not found' });
        }
      } catch (error: any) {
        console.error('Error fetching course:', error);
        setModal({ isOpen: true, status: 'error', message: `Failed to load course: ${error.message || 'Unknown error'}` });
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, user]);

  // Redirect on successful save
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

  const addModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, { id: uuidv4(), title: '', content: { ops: [] } }],
    });
    setCurrentModuleIndex(formData.modules.length);
  };

  const removeModule = (index: number) => {
    if (formData.modules.length <= 1) return;
    const updatedModules = [...formData.modules];
    updatedModules.splice(index, 1);
    setFormData({ ...formData, modules: updatedModules });
    if (currentModuleIndex >= updatedModules.length) {
      setCurrentModuleIndex(updatedModules.length - 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        setErrors({ ...errors, thumbnail: 'Only JPEG, PNG, or GIF images are allowed' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, thumbnail: 'Thumbnail size exceeds 5MB limit' });
        return;
      }
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData({ ...formData, thumbnail: reader.result });
          setErrors({ ...errors, thumbnail: '' });
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
    return uploadToCloudinary(thumbnailFile, 'image');
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
    setSaving(true);
    try {
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail();
      }
      const courseData = {
        ...formData,
        thumbnail: thumbnailUrl,
        createdBy: user?.uid,
        updatedAt: serverTimestamp(),
        createdAt: formData.createdAt || serverTimestamp(),
      };
      if (isEditing) {
        await setDoc(doc(db, 'courses', courseId!), courseData, { merge: true });
        setModal({ isOpen: true, status: 'success', message: 'Course updated successfully!' });
      } else {
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        await setDoc(doc(db, 'enrollments', user.uid, 'courses', docRef.id), {
          enrolledAt: serverTimestamp(),
        });
        setModal({ isOpen: true, status: 'success', message: 'Course created successfully!' });
      }
    } catch (error: any) {
      console.error('Save course error:', error);
      setModal({
        isOpen: true,
        status: 'error',
        message: `Failed to save course: ${error.message || 'Unknown error'}`,
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
      setModal({ isOpen: true, status: 'success', message: 'Course deleted successfully!' });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      setModal({
        isOpen: true,
        status: 'error',
        message: `Failed to delete course: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, status: null, message: '' });
  };

  const goToNextStep = () => {
    if (step === 1 && (!formData.title || !formData.instructor)) {
      setErrors({
        ...errors,
        title: !formData.title ? 'Course title is required' : '',
        instructor: !formData.instructor ? 'Instructor name is required' : '',
      });
      return;
    }
    if (step === 2) {
      const moduleErrors: Record<string, string> = {};
      formData.modules.forEach((module, index) => {
        if (!module.title) {
          moduleErrors[`module_${index}_title`] = `Module ${index + 1} title is required`;
        }
      });
      if (Object.keys(moduleErrors).length > 0) {
        setErrors(moduleErrors);
        return;
      }
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
          {isEditing ? 'Edit the basic course information.' : 'Start by adding the basic course information.'} Fields marked with * are required.
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
          {isEditing ? 'Edit or add modules to your course.' : 'Add modules to your course.'} Each module should have a title and content. Use the editor toolbar to format text and insert multiple images or videos inline.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Modules</h3>
            <button
              onClick={addModule}
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <Plus size={16} className="mr-1" />
              <span className="text-sm">Add</span>
            </button>
          </div>
          <div className="space-y-2 overflow-auto max-h-96 pr-2">
            {formData.modules.map((module, index) => (
              <div
                key={module.id}
                className={`flex justify-between p-3 rounded-md cursor-pointer ${
                  currentModuleIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => setCurrentModuleIndex(index)}
              >
                <div className="truncate flex-1">
                  <span className="text-sm font-medium">{module.title || `Module ${index + 1}`}</span>
                </div>
                {formData.modules.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeModule(index);
                    }}
                    className="text-gray-500 hover:text-red-500"
                  >
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Module Content
              </label>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
              >
                <HelpCircle size={16} className="mr-1" />
                Editor Help
              </button>
            </div>
            {showHelp && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Editor Tips:</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Format text using bold, italic, headings, lists, alignment, quotes, or code blocks.</li>
                  <li>Insert multiple images (max 5MB each) or videos (max 10MB each) using the toolbar buttons.</li>
                  <li>Media is uploaded to Cloudinary for secure storage.</li>
                </ul>
              </div>
            )}
            <div
              ref={(el) => { quillRefs.current[currentModuleIndex] = el; }}
              className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-800 min-h-[200px]"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailsSection = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          {isEditing ? 'Edit additional details about your course.' : 'Add additional details about your course.'}
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
            accept="image/jpeg,image/png,image/gif"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600"
            onChange={handleFileChange}
          />
          {thumbnailFile && (
            <button
              onClick={clearThumbnail}
              className="flex items-center space-x-1 text-red-500 hover:text-red-700"
            >
              <Trash size={16} />
              <span>Clear</span>
            </button>
          )}
        </div>
        {errors.thumbnail && <p className="mt-1 text-sm text-red-500">{errors.thumbnail}</p>}
        {formData.thumbnail && (
          <div className="mt-2 h-32 w-48 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <img
              src={formData.thumbnail}
              alt="Thumbnail preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-700 dark:text-gray-300">
        <Loader className="animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          {isEditing ? 'Edit Course' : 'Add New Course'}
        </h1>
        <div className="flex space-x-4">
          {isEditing && (
            <button
              onClick={openDeleteModal}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.general}
        </div>
      )}

      <div className="flex mb-8">
        {['Course Info', 'Modules', 'Details'].map((label, index) => (
          <div key={label} className="flex-1">
            <div
              className={`h-2 ${step >= index + 1 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'} ${
                index === 0 ? 'rounded-l-full' : index === 2 ? 'rounded-r-full' : ''
              }`}
            ></div>
            <p className={`text-center text-sm mt-2 ${step === index + 1 ? 'font-semibold text-blue-500' : 'text-gray-500'}`}>
              {label}
            </p>
          </div>
        ))}
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
              <button
                onClick={goToPreviousStep}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/modules">
              <button
                disabled={saving}
                className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </Link>
            {step < 3 ? (
              <button
                onClick={goToNextStep}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={saveCourse}
                disabled={saving}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{isEditing ? 'Update Course' : 'Save Course'}</span>
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
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${modal.status === 'success' ? 'bg-green-100' : modal.status === 'uploading' ? 'bg-blue-100' : 'bg-red-100'}`}>
                    {modal.status === 'success' ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : modal.status === 'uploading' ? (
                      <Loader className="h-6 w-6 text-blue-600 animate-spin" />
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {modal.status === 'success' ? (isEditing ? 'Course Updated' : 'Course Created') : modal.status === 'uploading' ? 'Uploading' : 'Operation Failed'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{modal.message}</p>
                    </div>
                  </div>
                </div>
              </div>
              {(modal.status === 'error' || modal.status === 'uploading') && (
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={closeModal}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {modal.status === 'uploading' ? 'Cancel' : 'Close'}
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

'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, X, HelpCircle, Plus, Trash, Loader, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getFirestore, collection, addDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Custom Video Blot
import { BlockEmbed } from 'quill/blots/block'; // Corrected import

class VideoBlot extends BlockEmbed {
  static blotName = 'video';
  static tagName = 'video';
  static create(value: { src: string; title?: string }) {
    const node = super.create();
    (node as HTMLElement).setAttribute('src', value.src);
    (node as HTMLElement).setAttribute('controls', 'controls');
    if (value.title) {
      (node as HTMLElement).setAttribute('title', value.title);
    }
    (node as HTMLElement).className = 'max-w-full h-auto my-2';
    return node;
  }

  static value(node: HTMLElement) {
    return {
      src: node.getAttribute('src'),
      title: node.getAttribute('title') || null,
    };
  }
}
Quill.register('formats/video', VideoBlot);

interface Module {
  id: string;
  title: string;
  content: any; // Quill Delta content
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
  status: 'success' | 'error' | 'uploading' | null;
  message: string;
}

interface DeleteModalState {
  isOpen: boolean;
}

export default function CourseManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('id');
  const isEditing = !!courseId;

  const [formData, setFormData] = useState<Course>({
    title: '',
    instructor: '',
    level: 'Beginner',
    duration: '',
    thumbnail: '/api/placeholder/400/250?text=Course',
    modules: [{ id: uuidv4(), title: '', content: { ops: [] } }],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, status: null, message: '' });
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false });

  const quillRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quillInstances = useRef<(Quill | null)[]>([]);

  // Cloudinary Upload Handler
  const uploadToCloudinary = async (file: File, type: 'image' | 'video'): Promise<string> => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration is missing');
    }
    const validTypes = type === 'image' ? ['image/jpeg', 'image/png', 'image/gif'] : ['video/mp4', 'video/webm', 'video/mov'];
    const maxSize = type === 'image' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!validTypes.includes(file.type)) {
      throw new Error(`Only ${type === 'image' ? 'JPEG, PNG, or GIF images' : 'MP4, WebM, or MOV videos'} are allowed`);
    }
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${type === 'image' ? '5MB' : '10MB'} limit`);
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(`${type} upload response:`, text);
        throw new Error(`Failed to upload ${type}: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data.secure_url) throw new Error('No URL returned from upload');
      return data.secure_url;
    } catch (error: any) {
      console.error(`${type} upload error:`, error);
      throw error;
    }
  };

  // Initialize Quill editors
  useEffect(() => {
    quillRefs.current = formData.modules.map(() => null);
    quillInstances.current = formData.modules.map((module, index) => {
      if (quillRefs.current[index] && !quillInstances.current[index]) {
        const quill = new Quill(quillRefs.current[index]!, {
          theme: 'snow',
          modules: {
            toolbar: {
              container: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ align: [] }, { indent: '-1' }, { indent: '+1' }],
                ['link', 'image', 'video'],
                ['blockquote', 'code-block'],
                ['clean'],
              ],
              handlers: {
                image: () => {
                  const input = document.createElement('input');
                  input.setAttribute('type', 'file');
                  input.setAttribute('accept', 'image/jpeg,image/png,image/gif');
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const quill = quillInstances.current[index];
                    if (!quill) return;
                    try {
                      setModal({ isOpen: true, status: 'uploading', message: 'Uploading image...' });
                      const url = await uploadToCloudinary(file, 'image');
                      const range = quill.getSelection(true);
                      quill.insertEmbed(range.index, 'image', url);
                      quill.setSelection(range.index + 1, 0);
                      setModal({ isOpen: false, status: null, message: '' });
                    } catch (error: any) {
                      setModal({ isOpen: true, status: 'error', message: `Failed to upload image: ${error.message}` });
                    }
                  };
                  input.click();
                },
                video: () => {
                  const input = document.createElement('input');
                  input.setAttribute('type', 'file');
                  input.setAttribute('accept', 'video/mp4,video/webm,video/mov');
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const quill = quillInstances.current[index];
                    if (!quill) return;
                    try {
                      setModal({ isOpen: true, status: 'uploading', message: 'Uploading video...' });
                      const url = await uploadToCloudinary(file, 'video');
                      const range = quill.getSelection(true);
                      quill.insertEmbed(range.index, 'video', { src: url, title: 'Course Video' });
                      quill.setSelection(range.index + 1, 0);
                      setModal({ isOpen: false, status: null, message: '' });
                    } catch (error: any) {
                      setModal({ isOpen: true, status: 'error', message: `Failed to upload video: ${error.message}` });
                    }
                  };
                  input.click();
                },
              },
            },
          },
          placeholder: 'Enter module content...',
        });

        // Set initial content
        quill.setContents(module.content || { ops: [] });

        // Ensure editor is editable and focused
        quill.enable(true);
        quill.focus();

        // Update formData on content change
        quill.on('text-change', () => {
          const updatedModules = [...formData.modules];
          updatedModules[index].content = quill.getContents();
          setFormData({ ...formData, modules: updatedModules });
        });

        return quill;
      }
      return quillInstances.current[index] || null;
    });

    // Cleanup on unmount
    return () => {
      quillInstances.current.forEach((quill) => {
        if (quill) {
          quill.off('text-change');
        }
      });
    };
  }, [formData.modules.length]);

  // Handle authentication state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Fetch course data if editing
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId || !user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const courseData = docSnap.data() as Course;
          const modulesWithIds = courseData.modules.map((module) => ({
            ...module,
            id: module.id || uuidv4(),
            content: typeof module.content === 'string'
              ? { ops: [{ insert: module.content + '\n' }] }
              : module.content || { ops: [] },
          }));
          setFormData({
            ...courseData,
            id: docSnap.id,
            modules: modulesWithIds.length > 0 ? modulesWithIds : [{ id: uuidv4(), title: '', content: { ops: [] } }],
          });
          setErrors({});
        } else {
          setModal({ isOpen: true, status: 'error', message: 'Course not found' });
        }
      } catch (error: any) {
        console.error('Error fetching course:', error);
        setModal({ isOpen: true, status: 'error', message: `Failed to load course: ${error.message || 'Unknown error'}` });
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId, user]);

  // Redirect on successful save
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

  const addModule = () => {
    setFormData({
      ...formData,
      modules: [...formData.modules, { id: uuidv4(), title: '', content: { ops: [] } }],
    });
    setCurrentModuleIndex(formData.modules.length);
  };

  const removeModule = (index: number) => {
    if (formData.modules.length <= 1) return;
    const updatedModules = [...formData.modules];
    updatedModules.splice(index, 1);
    setFormData({ ...formData, modules: updatedModules });
    if (currentModuleIndex >= updatedModules.length) {
      setCurrentModuleIndex(updatedModules.length - 1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        setErrors({ ...errors, thumbnail: 'Only JPEG, PNG, or GIF images are allowed' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, thumbnail: 'Thumbnail size exceeds 5MB limit' });
        return;
      }
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormData({ ...formData, thumbnail: reader.result });
          setErrors({ ...errors, thumbnail: '' });
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
    return uploadToCloudinary(thumbnailFile, 'image');
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
    setSaving(true);
    try {
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail();
      }
      const courseData = {
        ...formData,
        thumbnail: thumbnailUrl,
        createdBy: user?.uid,
        updatedAt: serverTimestamp(),
        createdAt: formData.createdAt || serverTimestamp(),
      };
      if (isEditing) {
        await setDoc(doc(db, 'courses', courseId!), courseData, { merge: true });
        setModal({ isOpen: true, status: 'success', message: 'Course updated successfully!' });
      } else {
        const docRef = await addDoc(collection(db, 'courses'), courseData);
        await setDoc(doc(db, 'enrollments', user.uid, 'courses', docRef.id), {
          enrolledAt: serverTimestamp(),
        });
        setModal({ isOpen: true, status: 'success', message: 'Course created successfully!' });
      }
    } catch (error: any) {
      console.error('Save course error:', error);
      setModal({
        isOpen: true,
        status: 'error',
        message: `Failed to save course: ${error.message || 'Unknown error'}`,
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
      setModal({ isOpen: true, status: 'success', message: 'Course deleted successfully!' });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      setModal({
        isOpen: true,
        status: 'error',
        message: `Failed to delete course: ${error.message || 'Unknown error'}`,
      });
    } finally {
      setDeleteModal({ isOpen: false });
    }
  };

  const closeModal = () => {
    setModal({ isOpen: false, status: null, message: '' });
  };

  const goToNextStep = () => {
    if (step === 1 && (!formData.title || !formData.instructor)) {
      setErrors({
        ...errors,
        title: !formData.title ? 'Course title is required' : '',
        instructor: !formData.instructor ? 'Instructor name is required' : '',
      });
      return;
    }
    if (step === 2) {
      const moduleErrors: Record<string, string> = {};
      formData.modules.forEach((module, index) => {
        if (!module.title) {
          moduleErrors[`module_${index}_title`] = `Module ${index + 1} title is required`;
        }
      });
      if (Object.keys(moduleErrors).length > 0) {
        setErrors(moduleErrors);
        return;
      }
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
          {isEditing ? 'Edit the basic course information.' : 'Start by adding the basic course information.'} Fields marked with * are required.
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
          {isEditing ? 'Edit or add modules to your course.' : 'Add modules to your course.'} Each module should have a title and content. Use the editor toolbar to format text and insert multiple images or videos inline.
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-700 dark:text-gray-300">Modules</h3>
            <button
              onClick={addModule}
              className="flex items-center text-blue-500 hover:text-blue-700"
            >
              <Plus size={16} className="mr-1" />
              <span className="text-sm">Add</span>
            </button>
          </div>
          <div className="space-y-2 overflow-auto max-h-96 pr-2">
            {formData.modules.map((module, index) => (
              <div
                key={module.id}
                className={`flex justify-between p-3 rounded-md cursor-pointer ${
                  currentModuleIndex === index
                    ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                onClick={() => setCurrentModuleIndex(index)}
              >
                <div className="truncate flex-1">
                  <span className="text-sm font-medium">{module.title || `Module ${index + 1}`}</span>
                </div>
                {formData.modules.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeModule(index);
                    }}
                    className="text-gray-500 hover:text-red-500"
                  >
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Module Content
              </label>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
              >
                <HelpCircle size={16} className="mr-1" />
                Editor Help
              </button>
            </div>
            {showHelp && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm">
                <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Editor Tips:</h4>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Format text using bold, italic, headings, lists, alignment, quotes, or code blocks.</li>
                  <li>Insert multiple images (max 5MB each) or videos (max 10MB each) using the toolbar buttons.</li>
                  <li>Media is uploaded to Cloudinary for secure storage.</li>
                </ul>
              </div>
            )}
            <div
              ref={(el) => { quillRefs.current[currentModuleIndex] = el; }}
              className="border border-gray-300 dark:border-gray-600 rounded-md p-4 bg-white dark:bg-gray-800 min-h-[200px]"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDetailsSection = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          {isEditing ? 'Edit additional details about your course.' : 'Add additional details about your course.'}
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
            accept="image/jpeg,image/png,image/gif"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600"
            onChange={handleFileChange}
          />
          {thumbnailFile && (
            <button
              onClick={clearThumbnail}
              className="flex items-center space-x-1 text-red-500 hover:text-red-700"
            >
              <Trash size={16} />
              <span>Clear</span>
            </button>
          )}
        </div>
        {errors.thumbnail && <p className="mt-1 text-sm text-red-500">{errors.thumbnail}</p>}
        {formData.thumbnail && (
          <div className="mt-2 h-32 w-48 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <img
              src={formData.thumbnail}
              alt="Thumbnail preview"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-700 dark:text-gray-300">
        <Loader className="animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
          {isEditing ? 'Edit Course' : 'Add New Course'}
        </h1>
        <div className="flex space-x-4">
          {isEditing && (
            <button
              onClick={openDeleteModal}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.general}
        </div>
      )}

      <div className="flex mb-8">
        {['Course Info', 'Modules', 'Details'].map((label, index) => (
          <div key={label} className="flex-1">
            <div
              className={`h-2 ${step >= index + 1 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'} ${
                index === 0 ? 'rounded-l-full' : index === 2 ? 'rounded-r-full' : ''
              }`}
            ></div>
            <p className={`text-center text-sm mt-2 ${step === index + 1 ? 'font-semibold text-blue-500' : 'text-gray-500'}`}>
              {label}
            </p>
          </div>
        ))}
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
              <button
                onClick={goToPreviousStep}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/modules">
              <button
                disabled={saving}
                className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </Link>
            {step < 3 ? (
              <button
                onClick={goToNextStep}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={saveCourse}
                disabled={saving}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>{isEditing ? 'Update Course' : 'Save Course'}</span>
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
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${modal.status === 'success' ? 'bg-green-100' : modal.status === 'uploading' ? 'bg-blue-100' : 'bg-red-100'}`}>
                    {modal.status === 'success' ? (
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : modal.status === 'uploading' ? (
                      <Loader className="h-6 w-6 text-blue-600 animate-spin" />
                    ) : (
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                      {modal.status === 'success' ? (isEditing ? 'Course Updated' : 'Course Created') : modal.status === 'uploading' ? 'Uploading' : 'Operation Failed'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{modal.message}</p>
                    </div>
                  </div>
                </div>
              </div>
              {(modal.status === 'error' || modal.status === 'uploading') && (
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={closeModal}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {modal.status === 'uploading' ? 'Cancel' : 'Close'}
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

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  AtomicBlockUtils,
  convertFromRaw,
  convertToRaw,
  ContentState,
  ContentBlock,
  convertFromHTML,
  RawDraftContentState,
} from 'draft-js';
import { Course, ModalState } from '../types';
import { uploadToCloudinary } from '../utils/cloudinary';

// Custom block renderer for media
const mediaBlockRenderer = (block: ContentBlock) => {
  if (block.getType() === 'atomic') {
    return {
      component: MediaComponent,
      editable: false,
    };
  }
  return null;
};

// Media component for images and videos
interface MediaComponentProps {
  block: ContentBlock;
  contentState: ContentState;
}

const MediaComponent: React.FC<MediaComponentProps> = ({ block, contentState }) => {
  const entity = block.getEntityAt(0);
  if (!entity) return null;

  const { src, type, title } = contentState.getEntity(entity).getData();

  if (type === 'IMAGE') {
    return (
      <img
        src={src}
        alt={title || 'Course image'}
        style={{
          maxWidth: '100%',
          height: 'auto',
          margin: '16px 0',
          borderRadius: '8px',
        }}
      />
    );
  }

  if (type === 'VIDEO') {
    return (
      <video
        src={src}
        controls
        preload="metadata"
        title={title}
        style={{
          maxWidth: '100%',
          height: 'auto',
          margin: '16px 0',
          borderRadius: '8px',
        }}
      />
    );
  }

  return null;
};

// Helper function to create editor state from content
const createEditorStateFromContent = (content: any): EditorState => {
  if (!content) {
    return EditorState.createEmpty();
  }

  try {
    if (typeof content === 'object' && content !== null && 'blocks' in content && Array.isArray(content.blocks)) {
      return EditorState.createWithContent(convertFromRaw(content as RawDraftContentState));
    }
    
    if (typeof content === 'string' && content.trim()) {
      const blocksFromHTML = convertFromHTML(content);
      const contentState = ContentState.createFromBlockArray(
        blocksFromHTML.contentBlocks,
        blocksFromHTML.entityMap
      );
      return EditorState.createWithContent(contentState);
    }
  } catch (error) {
    console.warn('Failed to convert content:', error);
  }

  return EditorState.createEmpty();
};

export const useDraftEditor = (
  formData: Course,
  setFormData: React.Dispatch<React.SetStateAction<Course>>,
  setModal: (modal: ModalState) => void
) => {
  const [editorStatesMap, setEditorStatesMap] = useState<Map<number, EditorState>>(new Map());
  const editorRefs = useRef<Map<number, Editor | null>>(new Map());
  const [isUploading, setIsUploading] = useState<Map<number, boolean>>(new Map());

  // Memoize modules to prevent unnecessary re-renders
  const modules = useMemo(() => {
    return Array.isArray(formData.modules) ? formData.modules : [];
  }, [formData.modules]);

  // Initialize editor states when modules change
  useEffect(() => {
    const newStatesMap = new Map<number, EditorState>();
    const newRefsMap = new Map<number, Editor | null>();

    modules.forEach((module, index) => {
      const existingState = editorStatesMap.get(index);
      if (existingState && module.content === getEditorContent(index)) {
        newStatesMap.set(index, existingState);
      } else {
        newStatesMap.set(index, createEditorStateFromContent(module.content));
      }
      newRefsMap.set(index, editorRefs.current.get(index) || null);
    });

    // Clean up removed modules
    editorStatesMap.forEach((_, index) => {
      if (!modules[index]) {
        newStatesMap.delete(index);
        newRefsMap.delete(index);
      }
    });

    setEditorStatesMap(newStatesMap);
    editorRefs.current = newRefsMap;
  }, [modules, editorStatesMap]);

  // Get editor state for a specific module
  const getEditorState = useCallback((moduleIndex: number): EditorState => {
    return editorStatesMap.get(moduleIndex) || EditorState.createEmpty();
  }, [editorStatesMap]);

  // Handle editor state change
  const handleEditorStateChange = useCallback(
    (moduleIndex: number, newEditorState: EditorState) => {
      setEditorStatesMap(prev => {
        const newMap = new Map(prev);
        newMap.set(moduleIndex, newEditorState);
        return newMap;
      });

      const contentState = newEditorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);

      setFormData((prevFormData: Course) => {
        const updatedModules = [...prevFormData.modules];
        updatedModules[moduleIndex] = {
          ...updatedModules[moduleIndex],
          content: rawContent,
        };
        return { ...prevFormData, modules: updatedModules };
      });
    },
    [setFormData]
  );

  // Toolbar handlers
  const handleInlineStyleChange = useCallback(
    (moduleIndex: number, inlineStyle: string) => {
      const currentState = getEditorState(moduleIndex);
      if (currentState) {
        const newState = RichUtils.toggleInlineStyle(currentState, inlineStyle);
        handleEditorStateChange(moduleIndex, newState);
      }
    },
    [getEditorState, handleEditorStateChange]
  );

  const handleBlockTypeChange = useCallback(
    (moduleIndex: number, blockType: string) => {
      const currentState = getEditorState(moduleIndex);
      if (currentState) {
        const newState = RichUtils.toggleBlockType(currentState, blockType);
        handleEditorStateChange(moduleIndex, newState);
      }
    },
    [getEditorState, handleEditorStateChange]
  );

  const handleKeyCommand = useCallback(
    (moduleIndex: number, command: string) => {
      const currentState = getEditorState(moduleIndex);
      if (currentState) {
        const newState = RichUtils.handleKeyCommand(currentState, command);
        if (newState) {
          handleEditorStateChange(moduleIndex, newState);
          return 'handled' as const;
        }
      }
      return 'not-handled' as const;
    },
    [getEditorState, handleEditorStateChange]
  );

  // Media upload handlers
  const createMediaUploadHandler = useCallback(
    (mediaType: 'image' | 'video') => async (moduleIndex: number) => {
      const isImage = mediaType === 'image';
      const accept = isImage 
        ? 'image/jpeg,image/png,image/gif,image/webp'
        : 'video/mp4,video/webm,video/mov,video/avi';
      const maxSize = isImage ? 5 * 1024 * 1024 : 100 * 1024 * 1024;
      const entityType = isImage ? 'IMAGE' : 'VIDEO';

      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', accept);

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        if (file.size > maxSize) {
          setModal({
            isOpen: true,
            status: 'error',
            message: `${mediaType} size must be less than ${isImage ? '5MB' : '100MB'}`,
          });
          return;
        }

        try {
          setIsUploading(prev => {
            const newMap = new Map(prev);
            newMap.set(moduleIndex, true);
            return newMap;
          });

          const url = await uploadToCloudinary(file, mediaType);
          const currentState = getEditorState(moduleIndex);

          if (currentState) {
            const contentState = currentState.getCurrentContent();
            const contentStateWithEntity = contentState.createEntity(
              entityType,
              'IMMUTABLE',
              { src: url, type: entityType, title: file.name }
            );
            const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
            const newEditorState = AtomicBlockUtils.insertAtomicBlock(
              EditorState.set(currentState, { currentContent: contentStateWithEntity }),
              entityKey,
              ' '
            );
            handleEditorStateChange(moduleIndex, newEditorState);
          }

          setModal({ isOpen: false, status: null, message: '' });
        } catch (error) {
          setModal({
            isOpen: true,
            status: 'error',
            message: `Failed to upload ${mediaType}: ${(error as Error).message}`,
          });
        } finally {
          setIsUploading(prev => {
            const newMap = new Map(prev);
            newMap.set(moduleIndex, false);
            return newMap;
          });
        }
      };

      input.click();
    },
    [getEditorState, handleEditorStateChange, setModal]
  );

  const handleImageUpload = useMemo(
    () => createMediaUploadHandler('image'),
    [createMediaUploadHandler]
  );

  const handleVideoUpload = useMemo(
    () => createMediaUploadHandler('video'),
    [createMediaUploadHandler]
  );

  // Link handler
  const handleLinkToggle = useCallback(
    (moduleIndex: number) => {
      const currentState = getEditorState(moduleIndex);
      if (!currentState) return;

      const selection = currentState.getSelection();
      if (selection.isCollapsed()) return;

      const contentState = currentState.getCurrentContent();
      const startKey = selection.getStartKey();
      const startOffset = selection.getStartOffset();
      const blockWithLinkAtBeginning = contentState.getBlockForKey(startKey);
      const linkKey = blockWithLinkAtBeginning.getEntityAt(startOffset);

      let newState: EditorState;
      if (linkKey) {
        newState = RichUtils.toggleLink(currentState, selection, null);
      } else {
        const linkURL = prompt('Enter a URL:');
        if (!linkURL) return;

        try {
          new URL(linkURL);
        } catch {
          setModal({
            isOpen: true,
            status: 'error',
            message: 'Please enter a valid URL',
          });
          return;
        }

        const contentStateWithEntity = contentState.createEntity(
          'LINK',
          'MUTABLE',
          { url: linkURL }
        );
        const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
        newState = RichUtils.toggleLink(
          EditorState.set(currentState, { currentContent: contentStateWithEntity }),
          selection,
          entityKey
        );
      }

      handleEditorStateChange(moduleIndex, newState);
    },
    [getEditorState, handleEditorStateChange, setModal]
  );

  // Utility methods
  const focusEditor = useCallback((moduleIndex: number) => {
    const editor = editorRefs.current.get(moduleIndex);
    if (editor && typeof editor.focus === 'function') {
      editor.focus();
    }
  }, []);

  const getEditorContent = useCallback(
    (moduleIndex: number): RawDraftContentState | null => {
      const editorState = getEditorState(moduleIndex);
      if (editorState) {
        return convertToRaw(editorState.getCurrentContent());
      }
      return null;
    },
    [getEditorState]
  );

  const setEditorContent = useCallback(
    (moduleIndex: number, content: RawDraftContentState) => {
      try {
        const contentState = convertFromRaw(content);
        const newEditorState = EditorState.createWithContent(contentState);
        handleEditorStateChange(moduleIndex, newEditorState);
      } catch (error) {
        console.error('Failed to set editor content:', error);
      }
    },
    [handleEditorStateChange]
  );

  const getEditorText = useCallback(
    (moduleIndex: number): string => {
      const editorState = getEditorState(moduleIndex);
      return editorState.getCurrentContent().getPlainText();
    },
    [getEditorState]
  );

  const hasInlineStyle = useCallback(
    (moduleIndex: number, style: string): boolean => {
      const editorState = getEditorState(moduleIndex);
      return editorState.getCurrentInlineStyle().has(style);
    },
    [getEditorState]
  );

  const getCurrentBlockType = useCallback(
    (moduleIndex: number): string => {
      const editorState = getEditorState(moduleIndex);
      const selection = editorState.getSelection();
      return editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();
    },
    [getEditorState]
  );

  const setEditorRef = useCallback((moduleIndex: number, ref: Editor | null) => {
    editorRefs.current.set(moduleIndex, ref);
  }, []);

  return {
    editorStates: useMemo(() => {
      return modules.map((_, index) => getEditorState(index));
    }, [modules, getEditorState]),
    editorRefs,
    mediaBlockRenderer,
    handleEditorStateChange,
    handleInlineStyleChange,
    handleBlockTypeChange,
    handleKeyCommand,
    handleImageUpload,
    handleVideoUpload,
    handleLinkToggle,
    focusEditor,
    getEditorContent,
    setEditorContent,
    getEditorText,
    hasInlineStyle,
    getCurrentBlockType,
    getEditorState,
    setEditorRef,
    isUploading: (moduleIndex: number) => isUploading.get(moduleIndex) || false,
  };
};