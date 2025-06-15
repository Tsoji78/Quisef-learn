"use client"
import React, { useState, useRef } from 'react';
import { Download, Award, Calendar, User, BookOpen, Star } from 'lucide-react';

const CertificateGenerator = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    courseName: '',
    instructorName: '',
    completionDate: '',
    duration: '',
    grade: ''
  });
  
  const [showCertificate, setShowCertificate] = useState(false);
  const certificateRef = useRef(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateCertificate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (Object.values(formData).every(field => field.trim() !== '')) {
      setShowCertificate(true);
    }
  };

  const downloadCertificate = () => {
    const certificate = certificateRef.current;
    if (certificate) {
      // Create a canvas to render the certificate
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 1200;
      canvas.height = 800;
      
      if (!ctx) {
        alert('Unable to generate certificate: Canvas context not available.');
        return;
      }
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
      
      // Add inner border
      ctx.strokeStyle = '#f0f0f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
      
      // Set text properties
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      // Title
      ctx.font = 'bold 48px serif';
      ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 150);
      
      // Subtitle
      ctx.font = '24px sans-serif';
      ctx.fillText('This is to certify that', canvas.width / 2, 220);
      
      // Student name
      ctx.font = 'bold 42px serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(formData.studentName.toUpperCase(), canvas.width / 2, 300);
      
      // Course completion text
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.fillText('has successfully completed the course', canvas.width / 2, 360);
      
      // Course name
      ctx.font = 'bold 36px serif';
      ctx.fillStyle = '#ffd700';
      ctx.fillText(formData.courseName, canvas.width / 2, 420);
      
      // Details
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Duration: ${formData.duration} | Grade: ${formData.grade}`, canvas.width / 2, 480);
      ctx.fillText(`Completion Date: ${new Date(formData.completionDate).toLocaleDateString()}`, canvas.width / 2, 520);
      
      // Instructor
      ctx.font = '18px sans-serif';
      ctx.fillText('Instructor', canvas.width / 2 - 200, 620);
      ctx.fillText(formData.instructorName, canvas.width / 2 - 200, 650);
      
      // Date
      ctx.fillText('Date', canvas.width / 2 + 200, 620);
      ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2 + 200, 650);
      
      // Signature lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 280, 670);
      ctx.lineTo(canvas.width / 2 - 120, 670);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 + 120, 670);
      ctx.lineTo(canvas.width / 2 + 280, 670);
      ctx.stroke();
      
      // Download the certificate
      const link = document.createElement('a');
      link.download = `${formData.studentName}_Certificate.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const resetForm = () => {
    setFormData({
      studentName: '',
      courseName: '',
      instructorName: '',
      completionDate: '',
      duration: '',
      grade: ''
    });
    setShowCertificate(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-gold-600 to-yellow-700 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Award className="h-12 w-12 text-yellow-400" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Generate  Certificate
            </h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <User className="h-6 w-6" />
              Course Details
            </h2>
            
            <form onSubmit={generateCertificate} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Enter student's full name"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Enter course name"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Instructor Name *
                </label>
                <input
                  type="text"
                  name="instructorName"
                  value={formData.instructorName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="Enter instructor's name"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-medium mb-2">
                    Completion Date *
                  </label>
                  <input
                    type="date"
                    name="completionDate"
                    value={formData.completionDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">
                    Duration *
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    placeholder="e.g., 8 weeks"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Grade/Score *
                </label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  placeholder="e.g., A+, 95%, Excellent"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Award className="h-5 w-5" />
                  Generate Certificate
                </button>
                
                {showCertificate && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Certificate Preview */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Certificate Preview
            </h2>

            {showCertificate ? (
              <div className="space-y-6">
                <div 
                  ref={certificateRef}
                  className="bg-gradient-to-br from-blue-800 to-purple-900 p-6 md:p-8 rounded-xl border-4 border-yellow-400 shadow-2xl"
                >
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <Star className="h-12 w-12 text-yellow-400" />
                    </div>
                    
                    <h3 className="text-2xl md:text-3xl font-bold text-white">
                      CERTIFICATE OF COMPLETION
                    </h3>
                    
                    <p className="text-blue-200 text-sm md:text-base">
                      This is to certify that
                    </p>
                    
                    <h4 className="text-xl md:text-2xl font-bold text-yellow-400 uppercase">
                      {formData.studentName}
                    </h4>
                    
                    <p className="text-blue-200 text-sm md:text-base">
                      has successfully completed the course
                    </p>
                    
                    <h5 className="text-lg md:text-xl font-bold text-yellow-400">
                      {formData.courseName}
                    </h5>
                    
                    <div className="text-blue-200 text-xs md:text-sm space-y-1">
                      <p>Duration: {formData.duration} | Grade: {formData.grade}</p>
                      <p>Completion Date: {new Date(formData.completionDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex justify-between items-end pt-6 text-xs md:text-sm">
                      <div className="text-center">
                        <div className="border-b border-white w-24 md:w-32 mb-1"></div>
                        <p className="text-blue-200">Instructor</p>
                        <p className="text-white font-medium">{formData.instructorName}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="border-b border-white w-24 md:w-32 mb-1"></div>
                        <p className="text-blue-200">Date</p>
                        <p className="text-white font-medium">{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={downloadCertificate}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Download Certificate
                </button>
              </div>
            ) : (
              <div className="text-center text-blue-200 py-12">
                <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Fill out the form to generate your certificate</p>
                <p className="text-sm mt-2">All fields are required</p>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <Download className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-bold mb-2">Instant Download</h3>
            <p className="text-blue-200 text-sm">Download high-quality PNG certificates</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20">
            <Calendar className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-bold mb-2">Course Tracking</h3>
            <p className="text-blue-200 text-sm">Track completion dates and grades</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;