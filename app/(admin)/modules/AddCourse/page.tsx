"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Save, X, HelpCircle, Plus, Trash, Loader, Trash2, Maximize2, Minimize2 } from "lucide-react"
import Link from "next/link"
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { v4 as uuidv4 } from "uuid"
import { Editor, EditorState, RichUtils, AtomicBlockUtils, Modifier, convertFromHTML, ContentState } from "draft-js"
import { stateToHTML } from "draft-js-export-html"

// Type definitions
interface Module {
  id: string
  title: string
  content: string
}

interface Course {
  title: string
  instructor: string
  level: string
  duration: string
  thumbnail: string
  modules: Module[]
}

interface ModalState {
  isOpen: boolean
  status: "success" | "error" | null
  message: string
}

interface DeleteModalState {
  isOpen: boolean
}

// Custom block renderer for images and videos
const blockRendererFn = (contentBlock: import("draft-js").ContentBlock) => {
  const type = contentBlock.getType()
  if (type === "atomic") {
    const entityKey = contentBlock.getEntityAt(0)
    if (entityKey) {
      const entity = contentBlock.getData().get("entity")
      if (entity && entity.type === "IMAGE") {
        return {
          component: (props: any) => (
            <img
              src={props.blockProps.src || "/placeholder.svg"}
              alt={props.blockProps.alt || ""}
              style={{
                width: props.blockProps.width || "auto",
                height: props.blockProps.height || "auto",
                display: "block",
                margin:
                  props.blockProps.align === "left"
                    ? "0 auto 0 0"
                    : props.blockProps.align === "right"
                      ? "0 0 0 auto"
                      : "0 auto",
              }}
            />
          ),
          editable: false,
          props: entity.data,
        }
      } else if (entity && entity.type === "VIDEO") {
        return {
          component: (props: any) => (
            <iframe
              src={props.blockProps.src}
              width={props.blockProps.width || "100%"}
              height={props.blockProps.height || "auto"}
              frameBorder="0"
              allowFullScreen
              style={{
                display: "block",
                margin:
                  props.blockProps.align === "left"
                    ? "0 auto 0 0"
                    : props.blockProps.align === "right"
                      ? "0 0 0 auto"
                      : "0 auto",
                maxWidth: "100%",
              }}
            />
          ),
          editable: false,
          props: entity.data,
        }
      }
    }
  }
  return null
}

// Custom Toolbar Component for Draft.js
const Toolbar = ({
  editorState,
  setEditorState,
  isFullScreen,
  toggleFullScreen,
}: {
  editorState: EditorState
  setEditorState: (state: EditorState) => void
  isFullScreen: boolean
  toggleFullScreen: () => void
}) => {
  const handleStyle = (style: string) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, style))
  }

  const handleBlock = (blockType: string) => {
    setEditorState(RichUtils.toggleBlockType(editorState, blockType))
  }

  const handleLink = () => {
    const url = prompt("Enter URL")
    if (!url) return
    const contentState = editorState.getCurrentContent()
    const contentStateWithEntity = contentState.createEntity("LINK", "MUTABLE", { url })
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
    const selection = editorState.getSelection()
    const newContentState = Modifier.applyEntity(contentStateWithEntity, selection, entityKey)
    setEditorState(EditorState.push(editorState, newContentState, "apply-entity"))
  }

  const handleImage = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert("Image size should be less than 5MB")
          return
        }

        const reader = new FileReader()
        reader.onload = (event) => {
          const src = event.target?.result as string
          if (src) {
            const width = prompt("Enter width (e.g., 300px, 50%, auto)", "auto")
            const height = prompt("Enter height (e.g., 200px, auto)", "auto")
            const align = prompt("Enter alignment (left, center, right)", "center")
            const contentState = editorState.getCurrentContent()
            const contentStateWithEntity = contentState.createEntity("IMAGE", "IMMUTABLE", {
              src,
              width,
              height,
              align,
            })
            const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
            const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, " ")
            setEditorState(newEditorState)
          }
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  const handleVideo = () => {
    const src = prompt("Enter video URL (e.g., YouTube embed URL)")
    const width = prompt("Enter width (e.g., 560px, 100%)", "100%")
    const height = prompt("Enter height (e.g., 315px, auto)", "auto")
    const align = prompt("Enter alignment (left, center, right)", "center")
    if (src) {
      const contentState = editorState.getCurrentContent()
      const contentStateWithEntity = contentState.createEntity("VIDEO", "IMMUTABLE", { src, width, height, align })
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
      const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorState, entityKey, " ")
      setEditorState(newEditorState)
    }
  }

  const isActiveStyle = (style: string) => editorState.getCurrentInlineStyle().has(style)
  const isActiveBlock = (blockType: string) => RichUtils.getCurrentBlockType(editorState) === blockType

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-t-md border-b border-gray-300 dark:border-gray-600">
      <button
        onClick={() => handleStyle("BOLD")}
        className={`p-1 rounded ${isActiveStyle("BOLD") ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        title="Bold"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.96-1.7 3.96-3.91 0-1.39-.76-2.62-1.94-3.3zM9 6h4c1.1 0 2 .9 2 2s-.9 2-2 2H9V6zm6 8H9v-4h6c1.1 0 2 .9 2 2s-.9 2-2 2z" />
        </svg>
      </button>
      <button
        onClick={() => handleStyle("ITALIC")}
        className={`p-1 rounded ${isActiveStyle("ITALIC") ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        title="Italic"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4h-8z" />
        </svg>
      </button>
      <button
        onClick={() => handleStyle("UNDERLINE")}
        className={`p-1 rounded ${isActiveStyle("UNDERLINE") ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        title="Underline"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
        </svg>
      </button>
      <button
        onClick={() => handleBlock("header-one")}
        className={`p-1 rounded ${isActiveBlock("header-one") ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => handleBlock("header-two")}
        className={`p-1 rounded ${isActiveBlock("header-two") ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => handleBlock("unordered-list-item")}
        className={`p-1 rounded ${isActiveBlock("unordered-list-item") ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        title="Bullet List"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
        </svg>
      </button>
      <button
        onClick={() => handleBlock("ordered-list-item")}
        className={`p-1 rounded ${isActiveBlock("ordered-list-item") ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        title="Ordered List"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
        </svg>
      </button>
      <button
        onClick={() => handleBlock("code-block")}
        className={`p-1 rounded ${isActiveBlock("code-block") ? "bg-blue-500 text-white" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        title="Code Block"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8.7 15.9L4.8 12l3.9-3.9c.39-.39.39-1.01 0-1.4-.39-.39-1.01-.39-1.4 0l-4.59 4.59c-.39.39-.39 1.02 0 1.41l4.59 4.6c.39.39 1.01.39 1.4 0 .39-.39.39-1.01 0-1.4zm6.6-1.4c-.39.39-1.01.39-1.4 0-.39-.39-.39-1.01 0-1.4l3.9-3.9-3.9-3.9c-.39-.39-.39-1.01 0-1.4.39-.39 1.01-.39 1.4 0l4.59 4.59c.39.39.39 1.02 0 1.41l-4.59 4.6z" />
        </svg>
      </button>
      <button
        onClick={handleLink}
        className={`p-1 rounded ${(() => {
          const selection = editorState.getSelection()
          const contentState = editorState.getCurrentContent()
          const block = contentState.getBlockForKey(selection.getStartKey())
          const entityKey = block.getEntityAt(selection.getStartOffset())
          return entityKey && contentState.getEntity(entityKey).getType() === "LINK"
            ? "bg-blue-500 text-white"
            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        })()}`}
        title="Link"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
        </svg>
      </button>
      <button
        onClick={handleImage}
        className="p-1 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        title="Insert/Adjust Image"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      </button>
      <button
        onClick={handleVideo}
        className="p-1 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        title="Insert Video"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm13 10.5l-4-3v3H5v-8h7v3l4-3v7.5z" />
        </svg>
      </button>
      <button
        onClick={toggleFullScreen}
        className="p-1 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
      >
        {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  )
}

export default function CourseManagementPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get("id")
  const [formData, setFormData] = useState<Course>({
    title: "",
    instructor: "",
    level: "Beginner",
    duration: "",
    thumbnail: "/api/placeholder/400/250?text=Course",
    modules: [{ id: uuidv4(), title: "", content: "" }],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)
  const [showHelp, setShowHelp] = useState(false)
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<ModalState>({ isOpen: false, status: null, message: "" })
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false })
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [editorStates, setEditorStates] = useState<EditorState[]>(formData.modules.map(() => EditorState.createEmpty()))

  // Update editor state when module index or content changes
  useEffect(() => {
    if (courseId) {
      const fetchCourse = async () => {
        setLoading(true)
        try {
          const docRef = doc(db, "courses", courseId)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data() as Course
            setFormData(data)
            const newEditorStates = data.modules.map((module) => {
              const blocksFromHTML = convertFromHTML(module.content || "")
              const contentState = ContentState.createFromBlockArray(
                blocksFromHTML.contentBlocks,
                blocksFromHTML.entityMap,
              )
              return EditorState.createWithContent(contentState)
            })
            setEditorStates(newEditorStates)
          }
        } catch (error: any) {
          setErrors({ general: error.message || "Failed to load course." })
        }
        setLoading(false)
      }
      fetchCourse()
    }
  }, [courseId])

  // Handle editor state changes
  const handleEditorChange = (newState: EditorState, index: number) => {
    const newEditorStates = [...editorStates]
    newEditorStates[index] = newState
    setEditorStates(newEditorStates)
    const contentState = newState.getCurrentContent()
    const html = stateToHTML(contentState)
    setFormData((prev) => {
      const updatedModules = [...prev.modules]
      updatedModules[index] = { ...updatedModules[index], content: html }
      return { ...prev, modules: updatedModules }
    })
  }

  // Handle paste for images and videos
  const handlePaste = (e: React.ClipboardEvent, index: number) => {
    const items = (e.clipboardData || (window as any).clipboardData).items
    for (const item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile()
        if (file) {
          // Check file size (limit to 5MB)
          if (file.size > 5 * 1024 * 1024) {
            alert("Image size should be less than 5MB")
            return false
          }

          const reader = new FileReader()
          reader.onload = (event) => {
            const src = event.target?.result as string
            if (src) {
              const width = prompt("Enter width for pasted image (e.g., 300px, 50%, auto)", "auto")
              const height = prompt("Enter height for pasted image (e.g., 200px, auto)", "auto")
              const align = prompt("Enter alignment (left, center, right)", "center")
              const contentState = editorStates[index].getCurrentContent()
              const contentStateWithEntity = contentState.createEntity("IMAGE", "IMMUTABLE", {
                src,
                width,
                height,
                align,
              })
              const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
              const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorStates[index], entityKey, " ")
              handleEditorChange(newEditorState, index)
            }
          }
          reader.readAsDataURL(file)
          e.preventDefault()
          return true
        }
      } else if (item.type === "text/plain") {
        item.getAsString((text) => {
          const videoUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/.+$/
          if (videoUrlRegex.test(text)) {
            const confirmVideo = confirm("Pasted text appears to be a video URL. Insert as video?")
            if (confirmVideo) {
              const width = prompt("Enter width for pasted video (e.g., 560px, 100%)", "100%")
              const height = prompt("Enter height for pasted video (e.g., 315px, auto)", "auto")
              const align = prompt("Enter alignment for pasted video (left, center, right)", "center")
              const contentState = editorStates[index].getCurrentContent()
              const contentStateWithEntity = contentState.createEntity("VIDEO", "IMMUTABLE", {
                src: text,
                width,
                height,
                align,
              })
              const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
              const newEditorState = AtomicBlockUtils.insertAtomicBlock(editorStates[index], entityKey, " ")
              handleEditorChange(newEditorState, index)
              e.preventDefault()
              return true
            }
          }
        })
      }
    }
    return false
  }

  // Function to open the delete modal
  const openDeleteModal = () => setDeleteModal({ isOpen: true })

  // Function to add a new module
  const addModule = () => {
    setFormData((prev) => ({
      ...prev,
      modules: [...prev.modules, { id: uuidv4(), title: "", content: "" }],
    }))
    setEditorStates((prev) => [...prev, EditorState.createEmpty()])
    setCurrentModuleIndex(formData.modules.length)
  }

  // Function to handle module title input change
  const handleModuleInputChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target
    setFormData((prev) => {
      const updatedModules = [...prev.modules]
      updatedModules[index] = { ...updatedModules[index], title: value }
      return { ...prev, modules: updatedModules }
    })
  }

  // Function to remove a module
  const removeModule = (index: number) => {
    setFormData((prev) => {
      const updatedModules = prev.modules.filter((_, i) => i !== index)
      return { ...prev, modules: updatedModules }
    })
    setEditorStates((prev) => prev.filter((_, i) => i !== index))
    setCurrentModuleIndex((prevIndex) => {
      if (index === 0) return 0
      if (index >= formData.modules.length - 1) return formData.modules.length - 2
      return prevIndex > index ? prevIndex - 1 : prevIndex
    })
  }

  // Toggle full-screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="course-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Course Title*
        </label>
        <input
          type="text"
          id="course-title"
          name="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          required
          className={`mt-1 block w-full px-3 py-2 border ${
            errors.title ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
          placeholder="Enter course title"
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>
      <div>
        <label htmlFor="course-instructor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Instructor*
        </label>
        <input
          type="text"
          id="course-instructor"
          name="instructor"
          value={formData.instructor}
          onChange={(e) => setFormData((prev) => ({ ...prev, instructor: e.target.value }))}
          required
          className={`mt-1 block w-full px-3 py-2 border ${
            errors.instructor ? "border-red-500" : "border-gray-300 dark:border-gray-600"
          } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
          placeholder="Enter instructor name"
        />
        {errors.instructor && <p className="mt-1 text-sm text-red-500">{errors.instructor}</p>}
      </div>
    </div>
  )

  const renderModulesSection = () => (
    <div className="space-y-6">
      <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg mb-6">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          {courseId ? "Edit or add modules to your course." : "Add modules to your course."} Each module should have a
          title and content.
        </p>
      </div>
      <div className={`flex flex-col gap-4 ${isFullScreen ? "" : "lg:flex-row"}`}>
        <div className={`${isFullScreen ? "hidden" : "lg:w-1/4 w-full"}`}>
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
                className={`flex justify-between p-3 rounded-md cursor-pointer transition-colors ${
                  currentModuleIndex === index
                    ? "bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                onClick={() => setCurrentModuleIndex(index)}
              >
                <div className="truncate flex-1">
                  <span className="text-sm font-medium">{module.title || `Module ${index + 1}`}</span>
                </div>
                {formData.modules.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeModule(index)
                    }}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div
          className={`${isFullScreen ? "fixed inset-0 z-50 bg-white dark:bg-gray-800 p-4 overflow-auto" : "lg:w-3/4 w-full"}`}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor={`module-title-${currentModuleIndex}`}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Module Title*
              </label>
              <input
                type="text"
                id={`module-title-${currentModuleIndex}`}
                name="title"
                value={formData.modules[currentModuleIndex].title}
                onChange={(e) => handleModuleInputChange(e, currentModuleIndex)}
                required
                className={`block w-full px-3 py-2 border ${
                  errors[`module_${currentModuleIndex}_title`]
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors`}
                placeholder="Enter module title"
              />
              {errors[`module_${currentModuleIndex}_title`] && (
                <p className="mt-1 text-sm text-red-500">{errors[`module_${currentModuleIndex}_title`]}</p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor={`module-content-${currentModuleIndex}`}
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Module Content
                </label>
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-blue-500 hover:text-blue-700 text-sm flex items-center transition-colors"
                >
                  <HelpCircle size={16} className="mr-1" />
                  Editor Help
                </button>
              </div>
              {showHelp && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md text-sm border border-gray-200 dark:border-gray-600">
                  <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">Editor Tips:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
                    <li>Use the toolbar to format text (bold, italic, headings)</li>
                    <li>
                      <strong>Images:</strong> Click the image button to upload from your device, or paste images
                      directly
                    </li>
                    <li>
                      <strong>Videos:</strong> Add videos by entering a URL (e.g., YouTube embed) or pasting a video
                      link
                    </li>
                    <li>Create lists for better organization</li>
                    <li>Use code blocks for code snippets</li>
                    <li>Add links by selecting text and entering a URL</li>
                    <li>Click the full-screen button (⛶) to expand the editor for better focus</li>
                    <li>
                      <strong>File size limit:</strong> Images should be less than 5MB
                    </li>
                  </ul>
                </div>
              )}
              <div
                className={`border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden ${isFullScreen ? "h-[calc(100vh-200px)]" : ""}`}
              >
                <Toolbar
                  editorState={editorStates[currentModuleIndex]}
                  setEditorState={(state) => handleEditorChange(state, currentModuleIndex)}
                  isFullScreen={isFullScreen}
                  toggleFullScreen={toggleFullScreen}
                />
                <div
                  className={`p-4 bg-white dark:bg-white text-black ${isFullScreen ? "h-[calc(100vh-250px)] overflow-auto" : "min-h-[400px] max-h-[600px] overflow-auto"}`}
                >
                  <Editor
                    editorState={editorStates[currentModuleIndex]}
                    onChange={(state) => handleEditorChange(state, currentModuleIndex)}
                    handlePastedText={(text, html, editorState) => {
                      const result = handlePaste(
                        {
                          clipboardData: {
                            items: [{ type: "text/plain", getAsString: (cb: (text: string) => void) => cb(text) }],
                          },
                        } as any,
                        currentModuleIndex,
                      )
                      return result ? "handled" : "not-handled"
                    }}
                    blockRendererFn={blockRendererFn}
                    placeholder="Start writing your module content here..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Step navigation handlers
  const goToPreviousStep = () => {
    setStep((prev) => (prev > 1 ? prev - 1 : prev))
  }

  const goToNextStep = () => {
    setStep((prev) => (prev < 3 ? prev + 1 : prev))
  }

  // Save or update course handler
  const saveCourse = async () => {
    setSaving(true)
    setErrors({})
    try {
      // Validate required fields
      const newErrors: Record<string, string> = {}
      if (!formData.title.trim()) newErrors.title = "Course title is required."
      if (!formData.instructor.trim()) newErrors.instructor = "Instructor is required."
      formData.modules.forEach((mod, idx) => {
        if (!mod.title.trim()) newErrors[`module_${idx}_title`] = "Module title is required."
      })
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setSaving(false)
        return
      }

      if (courseId) {
        // Update existing course
        await setDoc(doc(db, "courses", courseId), {
          ...formData,
          updatedAt: serverTimestamp(),
        })
        setModal({ isOpen: true, status: "success", message: "Course updated successfully!" })
      } else {
        // Add new course
        await addDoc(collection(db, "courses"), {
          ...formData,
          createdAt: serverTimestamp(),
        })
        setModal({ isOpen: true, status: "success", message: "Course created successfully!" })
      }
      setSaving(false)
      router.push("/modules")
    } catch (error: any) {
      setErrors({ general: error.message || "Failed to save course." })
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin mr-2" />
        <span>Loading...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
          {courseId ? "Edit Course" : "Add New Course"}
        </h1>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          {courseId && (
            <button
              onClick={openDeleteModal}
              className="flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              <span>Delete Course</span>
            </button>
          )}
          <Link href="/modules">
            <button className="flex items-center justify-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors w-full sm:w-auto">
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
          <div className={`h-2 ${step >= 1 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"} rounded-l-full`}></div>
          <p className={`text-center text-sm mt-2 ${step === 1 ? "font-semibold text-blue-500" : "text-gray-500"}`}>
            Course Info
          </p>
        </div>
        <div className="flex-1">
          <div className={`h-2 ${step >= 2 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"}`}></div>
          <p className={`text-center text-sm mt-2 ${step === 2 ? "font-semibold text-blue-500" : "text-gray-500"}`}>
            Modules
          </p>
        </div>
        <div className="flex-1">
          <div className={`h-2 ${step >= 3 ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700"} rounded-r-full`}></div>
          <p className={`text-center text-sm mt-2 ${step === 3 ? "font-semibold text-blue-500" : "text-gray-500"}`}>
            Details
          </p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {Object.keys(errors).length > 0 && !errors.general && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <h3 className="text-red-800 dark:text-red-300 font-medium">Please fix the following errors:</h3>
            <ul className="list-disc ml-5 mt-2">
              {Object.values(errors).map((error, index) => (
                <li key={index} className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step === 1 && renderBasicInfo()}
        {step === 2 && renderModulesSection()}
        {step === 3 && renderModulesSection()}
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
                    <span>{courseId ? "Update Course" : "Save Course"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .align-left {
          display: block;
          margin: 0 auto 0 0;
        }
        .align-center {
          display: block;
          margin: 0 auto;
        }
        .align-right {
          display: block;
          margin: 0 0 0 auto;
        }
      `}</style>
    </div>
  )
}
