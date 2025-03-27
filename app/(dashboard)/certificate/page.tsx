"use client"
import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  Award, 
  Calendar, 
  FileText, 
  Star,
  CheckCircle2
} from 'lucide-react';

// Certificate Interface
interface Certificate {
  id: number;
  courseName: string;
  issueDate: Date;
  completionPercentage: number;
  instructors: string[];
  certificateUrl: string;
  skills: string[];
  courseDescription: string;
}

const CourseCertificatesPage: React.FC = () => {
  // Sample Certificates Data
  const [certificates, setCertificates] = useState<Certificate[]>([
    {
      id: 1,
      courseName: 'Advanced Web Development',
      issueDate: new Date('2023-12-15'),
      completionPercentage: 95,
      instructors: ['Dr. Emily Chen', 'Michael Rodriguez'],
      certificateUrl: '/path/to/certificate1.pdf',
      skills: ['React', 'TypeScript', 'Node.js', 'Docker'],
      courseDescription: 'Comprehensive course covering modern web development technologies and best practices.'
    },
    {
      id: 2,
      courseName: 'Data Science Fundamentals',
      issueDate: new Date('2024-02-20'),
      completionPercentage: 88,
      instructors: ['Prof. Alex Johnson'],
      certificateUrl: '/path/to/certificate2.pdf',
      skills: ['Python', 'Machine Learning', 'Data Analysis', 'Pandas'],
      courseDescription: 'In-depth exploration of data science concepts and practical applications.'
    }
  ]);

  // Selected Certificate for Modal View
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);

  // Certificate Preview Modal
  const CertificatePreviewModal = () => {
    if (!selectedCertificate) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl w-[800px] max-h-[90vh] overflow-y-auto">
          {/* Certificate Header */}
          <div className="bg-blue-600 text-white p-6 rounded-t-2xl">
            <h2 className="text-2xl font-bold">{selectedCertificate.courseName}</h2>
            <div className="flex items-center mt-2">
              <Calendar className="mr-2" size={18} />
              <span>
                Issued: {selectedCertificate.issueDate.toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="p-6 grid grid-cols-2 gap-6">
            {/* Left Side */}
            <div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Award className="mr-2 text-blue-600" size={24} />
                  <h3 className="font-semibold">Certificate of Completion</h3>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between">
                    <span>Course Completion</span>
                    <span className="font-bold">
                      {selectedCertificate.completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{width: `${selectedCertificate.completionPercentage}%`}}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Star className="mr-2 text-yellow-500" size={18} />
                  Skills Acquired
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCertificate.skills.map(skill => (
                    <span 
                      key={skill} 
                      className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <FileText className="mr-2 text-purple-600" size={18} />
                  Course Description
                </h4>
                <p className="text-gray-600">
                  {selectedCertificate.courseDescription}
                </p>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold mb-2 flex items-center">
                  <CheckCircle2 className="mr-2 text-green-600" size={18} />
                  Instructors
                </h4>
                {selectedCertificate.instructors.map(instructor => (
                  <div 
                    key={instructor} 
                    className="bg-gray-100 p-3 rounded-lg mt-2"
                  >
                    {instructor}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t flex justify-between items-center">
            <div className="flex space-x-4">
              <button 
                className="btn-primary flex items-center"
                onClick={() => {
                  // Trigger download of certificate
                  const link = document.createElement('a');
                  link.href = selectedCertificate.certificateUrl;
                  link.download = `${selectedCertificate.courseName}_Certificate.pdf`;
                  link.click();
                }}
              >
                <Download className="mr-2" /> Download Certificate
              </button>
              <button className="btn-secondary flex items-center">
                <Share2 className="mr-2" /> Share Certificate
              </button>
            </div>
            <button 
              className="text-red-600 hover:bg-red-50 p-2 rounded"
              onClick={() => setSelectedCertificate(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">My Course Certificates</h1>
        <p className="text-gray-600">
          Showcase your learning achievements and skills acquired through completed courses.
        </p>
      </div>

      {/* Certificates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificates.map(certificate => (
          <div 
            key={certificate.id} 
            className="bg-white border rounded-lg shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  {certificate.courseName}
                </h3>
                <span 
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${certificate.completionPercentage >= 90 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'}
                  `}
                >
                  {certificate.completionPercentage}%
                </span>
              </div>
              <div className="text-gray-600 mb-4">
                Issued: {certificate.issueDate.toLocaleDateString()}
              </div>
              <button 
                onClick={() => setSelectedCertificate(certificate)}
                className="w-full btn-primary"
              >
                View Certificate Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Certificate Preview Modal */}
      {selectedCertificate && <CertificatePreviewModal />}
    </div>
  );
};

export default CourseCertificatesPage;