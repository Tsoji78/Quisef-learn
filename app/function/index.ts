// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

export const createCourseGroup = functions.firestore.onDocumentCreated("courses/{courseId}", async (event) => {
  const snap = event.data;
  const context = event.params;
    if (!snap) {
      console.error("Snapshot is undefined");
      return;
    }
    const course = snap.data();
    const courseId = context.courseId;

    // Ensure course has necessary fields
    if (!course.name) {
      console.error("Missing course name");
      return;
    }

    // Create a new group
    const groupData = {
      name: `${course.name} Group`,
      description: `Group for ${course.name} course`,
      courseId: courseId,
      members: course.enrolledStudents || [], // Prepopulate with enrolled students
      chatForums: [
        {
          id: 1,
          title: "General Discussion",
          description: "Course-wide chat for general topics",
          memberCount: course.enrolledStudents?.length || 0,
          lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
          messages: [],
        },
      ],
      assignments: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Add group to Firestore
    try {
      await admin.firestore().collection("groups").add(groupData);
      console.log(`Group created for course ${courseId}`);
    } catch (error) {
      console.error("Error creating group:", error);
    }
  });