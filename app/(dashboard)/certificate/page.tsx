"use client"
import React, { useState, useRef } from 'react';
import { Download, Award, Calendar, User, BookOpen, Star, Sun, Moon } from 'lucide-react';

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const certificateRef = useRef(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
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
      
      // White background (certificates should remain light for printing)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add gold border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
      
      // Add inner blue border
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
      
      // Set text properties
      ctx.fillStyle = '#1e40af';
      ctx.textAlign = 'center';
      
      // Title
      ctx.font = 'bold 48px serif';
      ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 150);
      
      // Subtitle
      ctx.font = '24px sans-serif';
      ctx.fillText('This is to certify that', canvas.width / 2, 220);
      
      // Student name
      ctx.font = 'bold 42px serif';
      ctx.fillStyle = '#d4af37';
      ctx.fillText(formData.studentName.toUpperCase(), canvas.width / 2, 300);
      
      // Course completion text
      ctx.fillStyle = '#1e40af';
      ctx.font = '24px sans-serif';
      ctx.fillText('has successfully completed the course', canvas.width / 2, 360);
      
      // Course name
      ctx.font = 'bold 36px serif';
      ctx.fillStyle = '#d4af37';
      ctx.fillText(formData.courseName, canvas.width / 2, 420);
      
      // Details
      ctx.fillStyle = '#1e40af';
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
      ctx.strokeStyle = '#1e40af';
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

  // Theme classes
  const themeClasses = {
    background: isDarkMode ? 'bg-gray-900' : 'bg-white',
    cardBg: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200',
    titleText: isDarkMode ? 'text-white' : 'text-blue-800',
    bodyText: isDarkMode ? 'text-gray-300' : 'text-blue-600',
    inputBg: isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-blue-200 text-blue-900 placeholder-blue-400',
    inputFocus: isDarkMode ? 'focus:ring-yellow-400 focus:border-yellow-400' : 'focus:ring-yellow-500 focus:border-yellow-500',
    labelText: isDarkMode ? 'text-gray-200' : 'text-blue-800',
    buttonPrimary: isDarkMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-yellow-600 hover:bg-yellow-700',
    buttonSecondary: isDarkMode ? 'bg-gray-600 hover:bg-gray-700 text-gray-200 border-gray-500' : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300',
    featureCardBg: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200',
    featureText: isDarkMode ? 'text-gray-300' : 'text-blue-600',
    iconColor: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
    certificateBg: 'bg-white', // Certificate always stays white for printing
    certificateText: 'text-blue-800',
    certificateAccent: 'text-yellow-600'
  };

  return (
    <div className={`min-h-screen ${themeClasses.background} py-8 px-4 transition-colors duration-300`}>
      <div className="max-w-6xl mx-auto">
        {/* Header with Dark Mode Toggle */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex justify-center items-center gap-3 flex-1">
              <Award className={`h-12 w-12 ${themeClasses.iconColor}`} />
              <h1 className={`text-4xl md:text-5xl font-bold ${themeClasses.titleText}`}>
                Certificate Generator
              </h1>
            </div>
            
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-5 w-5" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>
          </div>
          <p className={`${themeClasses.bodyText} text-lg transition-colors duration-300`}>
            Create professional certificates instantly
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className={`${themeClasses.cardBg} rounded-2xl p-6 md:p-8 shadow-lg transition-colors duration-300`}>
            <h2 className={`text-2xl font-bold ${themeClasses.titleText} mb-6 flex items-center gap-2`}>
              <User className="h-6 w-6" />
              Course Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className={`block ${themeClasses.labelText} font-medium mb-2`}>
                  Student Name *
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border-2 ${themeClasses.inputBg} focus:outline-none focus:ring-2 ${themeClasses.inputFocus} transition-colors`}
                  placeholder="Enter student's full name"
                />
              </div>

              <div>
                <label className={`block ${themeClasses.labelText} font-medium mb-2`}>
                  Course Name *
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border-2 ${themeClasses.inputBg} focus:outline-none focus:ring-2 ${themeClasses.inputFocus} transition-colors`}
                  placeholder="Enter course name"
                />
              </div>

              <div>
                <label className={`block ${themeClasses.labelText} font-medium mb-2`}>
                  Instructor Name *
                </label>
                <input
                  type="text"
                  name="instructorName"
                  value={formData.instructorName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border-2 ${themeClasses.inputBg} focus:outline-none focus:ring-2 ${themeClasses.inputFocus} transition-colors`}
                  placeholder="Enter instructor's name"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={`block ${themeClasses.labelText} font-medium mb-2`}>
                    Completion Date *
                  </label>
                  <input
                    type="date"
                    name="completionDate"
                    value={formData.completionDate}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg border-2 ${themeClasses.inputBg} focus:outline-none focus:ring-2 ${themeClasses.inputFocus} transition-colors`}
                  />
                </div>

                <div>
                  <label className={`block ${themeClasses.labelText} font-medium mb-2`}>
                    Duration *
                  </label>
                  <input
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 rounded-lg border-2 ${themeClasses.inputBg} focus:outline-none focus:ring-2 ${themeClasses.inputFocus} transition-colors`}
                    placeholder="e.g., 8 weeks"
                  />
                </div>
              </div>

              <div>
                <label className={`block ${themeClasses.labelText} font-medium mb-2`}>
                  Grade/Score *
                </label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-4 py-3 rounded-lg border-2 ${themeClasses.inputBg} focus:outline-none focus:ring-2 ${themeClasses.inputFocus} transition-colors`}
                  placeholder="e.g., A+, 95%, Excellent"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (Object.values(formData).every(field => field.trim() !== '')) {
                      setShowCertificate(true);
                    }
                  }}
                  className={`flex-1 ${themeClasses.buttonPrimary} text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md`}
                >
                  <Award className="h-5 w-5" />
                  Generate Certificate
                </button>
                
                {showCertificate && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={`px-6 py-3 ${themeClasses.buttonSecondary} font-medium rounded-lg transition-colors duration-200 border`}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Certificate Preview */}
          <div className={`${themeClasses.cardBg} rounded-2xl p-6 md:p-8 shadow-lg transition-colors duration-300`}>
            <h2 className={`text-2xl font-bold ${themeClasses.titleText} mb-6 flex items-center gap-2`}>
              <BookOpen className="h-6 w-6" />
              Certificate Preview
            </h2>

            {showCertificate ? (
              <div className="space-y-6">
                <div 
                  ref={certificateRef}
                  className={`${themeClasses.certificateBg} p-6 md:p-8 rounded-xl border-4 border-yellow-500 shadow-2xl`}
                >
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <Star className={`h-12 w-12 ${themeClasses.certificateAccent}`} />
                    </div>
                    
                    <h3 className={`text-2xl md:text-3xl font-bold ${themeClasses.certificateText}`}>
                      CERTIFICATE OF COMPLETION
                    </h3>
                    
                    <p className={`${themeClasses.certificateText} opacity-75 text-sm md:text-base`}>
                      This is to certify that
                    </p>
                    
                    <h4 className={`text-xl md:text-2xl font-bold ${themeClasses.certificateAccent} uppercase`}>
                      {formData.studentName}
                    </h4>
                    
                    <p className={`${themeClasses.certificateText} opacity-75 text-sm md:text-base`}>
                      has successfully completed the course
                    </p>
                    
                    <h5 className={`text-lg md:text-xl font-bold ${themeClasses.certificateAccent}`}>
                      {formData.courseName}
                    </h5>
                    
                    <div className={`${themeClasses.certificateText} text-xs md:text-sm space-y-1`}>
                      <p>Duration: {formData.duration} | Grade: {formData.grade}</p>
                      <p>Completion Date: {new Date(formData.completionDate).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex justify-between items-end pt-6 text-xs md:text-sm">
                      <div className="text-center">
                        <div className={`border-b-2 border-blue-800 w-24 md:w-32 mb-1`}></div>
                        <p className={`${themeClasses.certificateText} opacity-75`}>Instructor</p>
                        <p className={`${themeClasses.certificateText} font-medium`}>{formData.instructorName}</p>
                      </div>
                      
                      <div className="text-center">
                        <div className={`border-b-2 border-blue-800 w-24 md:w-32 mb-1`}></div>
                        <p className={`${themeClasses.certificateText} opacity-75`}>Date</p>
                        <p className={`${themeClasses.certificateText} font-medium`}>{new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={downloadCertificate}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  <Download className="h-5 w-5" />
                  Download Certificate
                </button>
              </div>
            ) : (
              <div className={`text-center ${themeClasses.bodyText} py-12`}>
                <Award className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Fill out the form to generate your certificate</p>
                <p className="text-sm mt-2">All fields are required</p>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className={`${themeClasses.featureCardBg} rounded-xl p-6 text-center shadow-md transition-colors duration-300`}>
            <Download className={`h-8 w-8 ${themeClasses.iconColor} mx-auto mb-3`} />
            <h3 className={`${themeClasses.titleText} font-bold mb-2`}>Instant Download</h3>
            <p className={`${themeClasses.featureText} text-sm`}>Download high-quality PNG certificates</p>
          </div>
          
          <div className={`${themeClasses.featureCardBg} rounded-xl p-6 text-center shadow-md transition-colors duration-300`}>
            <Calendar className={`h-8 w-8 ${themeClasses.iconColor} mx-auto mb-3`} />
            <h3 className={`${themeClasses.titleText} font-bold mb-2`}>Course Tracking</h3>
            <p className={`${themeClasses.featureText} text-sm`}>Track completion dates and grades</p>
          </div>
          
          <div className={`${themeClasses.featureCardBg} rounded-xl p-6 text-center shadow-md transition-colors duration-300`}>
            <Award className={`h-8 w-8 ${themeClasses.iconColor} mx-auto mb-3`} />
            <h3 className={`${themeClasses.titleText} font-bold mb-2`}>Professional Design</h3>
            <p className={`${themeClasses.featureText} text-sm`}>Beautiful, print-ready certificates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;