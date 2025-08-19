import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { Course, ModalState } from '../types';
import { uploadToCloudinary } from '@/utils/cloudinary';
import { validateForm } from '@/utils/validation';

export const useCourse = (user: any, courseId: string | null) => {
  const router = useRouter();
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
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, status: null, message: '' });
  const [loading, setLoading] = useState(true);

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
  };

  const removeModule = (index: number) => {
    if (formData.modules.length <= 1) return;
    const updatedModules = [...formData.modules];
    updatedModules.splice(index, 1);
    setFormData({ ...formData, modules: updatedModules });
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

  const saveCourse = async () => {
    const newErrors = validateForm(formData);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      window.scrollTo(0, 0);
      return;
    }
    setSaving(true);
    try {
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailFile) {
        thumbnailUrl = await uploadToCloudinary(thumbnailFile, 'image');
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
    }
  };

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    thumbnailFile,
    setThumbnailFile,
    saving,
    modal,
    setModal,
    loading,
    isEditing,
    handleInputChange,
    handleModuleInputChange,
    addModule,
    removeModule,
    handleFileChange,
    clearThumbnail,
    saveCourse,
    deleteCourse,
  };
};