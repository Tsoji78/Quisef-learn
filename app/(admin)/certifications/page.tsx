"use client"
import React, { useState, useRef } from 'react';
import { Download, Award, Calendar, User, BookOpen, Star, Sun, Moon, Sparkles, GraduationCap } from 'lucide-react';

const CertificateGenerator = () => {
  const [formData, setFormData] = useState({
    studentName: '',
    courseName: '',
    completionDate: ''
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
      
      // Set canvas size (16:9 ratio for better printing)
      canvas.width = 1600;
      canvas.height = 900;
      
      if (!ctx) {
        alert('Unable to generate certificate: Canvas context not available.');
        return;
      }
      
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add decorative border
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 12;
      ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);
      
      // Inner elegant border
      ctx.strokeStyle = '#1e40af';
      ctx.lineWidth = 4;
      ctx.strokeRect(90, 90, canvas.width - 180, canvas.height - 180);
      
      // Add corner decorations
      const cornerSize = 80;
      ctx.fillStyle = '#d4af37';
      // Top left corner
      ctx.fillRect(90, 90, cornerSize, 8);
      ctx.fillRect(90, 90, 8, cornerSize);
      // Top right corner
      ctx.fillRect(canvas.width - 170, 90, cornerSize, 8);
      ctx.fillRect(canvas.width - 98, 90, 8, cornerSize);
      // Bottom left corner
      ctx.fillRect(90, canvas.height - 98, cornerSize, 8);
      ctx.fillRect(90, canvas.height - 170, 8, cornerSize);
      // Bottom right corner
      ctx.fillRect(canvas.width - 170, canvas.height - 98, cornerSize, 8);
      ctx.fillRect(canvas.width - 98, canvas.height - 170, 8, cornerSize);
      
      // Set text properties
      ctx.textAlign = 'center';
      
      // Title
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 64px serif';
      ctx.fillText('CERTIFICATE OF COMPLETION', canvas.width / 2, 200);
      
      // Decorative line under title
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 300, 230);
      ctx.lineTo(canvas.width / 2 + 300, 230);
      ctx.stroke();
      
      // Subtitle
      ctx.font = '28px serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('This is to certify that', canvas.width / 2, 300);
      
      // Student name with elegant styling
      ctx.font = 'bold 56px serif';
      ctx.fillStyle = '#d4af37';
      ctx.fillText(formData.studentName.toUpperCase(), canvas.width / 2, 380);
      
      // Underline for student name
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const nameWidth = ctx.measureText(formData.studentName.toUpperCase()).width;
      ctx.moveTo(canvas.width / 2 - nameWidth / 2 - 20, 400);
      ctx.lineTo(canvas.width / 2 + nameWidth / 2 + 20, 400);
      ctx.stroke();
      
      // Course completion text
      ctx.fillStyle = '#64748b';
      ctx.font = '28px serif';
      ctx.fillText('has successfully completed the course', canvas.width / 2, 460);
      
      // Course name
      ctx.font = 'bold 42px serif';
      ctx.fillStyle = '#1e40af';
      ctx.fillText(formData.courseName, canvas.width / 2, 530);
      
      // Completion date
      ctx.fillStyle = '#64748b';
      ctx.font = '24px serif';
      ctx.fillText(`Completed on ${new Date(formData.completionDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, canvas.width / 2, 600);
      
      // Quisef Learn branding
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 32px serif';
      ctx.fillText('QUISEF LEARN', canvas.width / 2, 720);
      
      // Issue date
      ctx.fillStyle = '#64748b';
      ctx.font = '20px serif';
      ctx.fillText(`Issued on ${new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`, canvas.width / 2, 760);
      
      // Download the certificate
      const link = document.createElement('a');
      link.download = `${formData.studentName.replace(/\s+/g, '_')}_Certificate.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }
  };

  const resetForm = () => {
    setFormData({
      studentName: '',
      courseName: '',
      completionDate: ''
    });
    setShowCertificate(false);
  };

  // Theme classes
  const themeClasses = {
    background: isDarkMode 
      ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900' 
      : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50',
    cardBg: isDarkMode 
      ? 'bg-gray-800/80 backdrop-blur-sm border-gray-700/50' 
      : 'bg-white/80 backdrop-blur-sm border-white/50',
    titleText: isDarkMode ? 'text-white' : 'text-slate-800',
    bodyText: isDarkMode ? 'text-gray-300' : 'text-slate-600',
    inputBg: isDarkMode 
      ? 'bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400' 
      : 'bg-white/70 border-slate-200 text-slate-900 placeholder-slate-400',
    inputFocus: isDarkMode 
      ? 'focus:ring-amber-400/50 focus:border-amber-400' 
      : 'focus:ring-blue-500/30 focus:border-blue-500',
    labelText: isDarkMode ? 'text-gray-200' : 'text-slate-700',
    buttonPrimary: isDarkMode 
      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25' 
      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25',
    buttonSecondary: isDarkMode 
      ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border-gray-600/50' 
      : 'bg-slate-100/70 hover:bg-slate-200/70 text-slate-700 border-slate-200',
    iconColor: isDarkMode ? 'text-amber-400' : 'text-blue-600',
    certificateBg: 'bg-gradient-to-br from-white to-slate-50',
    certificateText: 'text-slate-800',
    certificateAccent: 'text-amber-600',
    featureCardBg: isDarkMode 
      ? 'bg-gray-800/50 backdrop-blur-sm border-gray-700/30' 
      : 'bg-white/60 backdrop-blur-sm border-white/30'
  };

  return (
    <div className={`min-h-screen ${themeClasses.background} py-12 px-4 transition-all duration-700`}>
      <div className="max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1 flex justify-center">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isDarkMode ? 'bg-amber-500/20' : 'bg-blue-100'} ${isDarkMode ? 'border border-amber-500/30' : ''}`}>
                  <GraduationCap className={`h-14 w-14 ${themeClasses.iconColor}`} />
                </div>
                <div className="text-left">
                  <h1 className={`text-5xl md:text-6xl font-bold ${themeClasses.titleText} tracking-tight`}>
                    Quisef Learn
                  </h1>
                  <p className={`text-lg ${themeClasses.bodyText} mt-1`}>Certificate Generator</p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className={`group flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-300 shadow-lg ${
                isDarkMode 
                  ? 'bg-gray-800/80 hover:bg-gray-700/80 text-amber-400 border border-gray-700/50' 
                  : 'bg-white/80 hover:bg-white text-slate-700 border border-white/50'
              }`}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="hidden sm:inline font-medium">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5 group-hover:-rotate-12 transition-transform duration-300" />
                  <span className="hidden sm:inline font-medium">Dark</span>
                </>
              )}
            </button>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <p className={`text-xl ${themeClasses.bodyText} leading-relaxed`}>
              Create beautiful, professional certificates for course completions in seconds
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Enhanced Form Section */}
          <div className={`${themeClasses.cardBg} rounded-3xl p-8 md:p-10 shadow-2xl border transition-all duration-300`}>
            <div className="flex items-center gap-3 mb-8">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-amber-500/20' : 'bg-blue-100'}`}>
                <User className={`h-6 w-6 ${themeClasses.iconColor}`} />
              </div>
              <h2 className={`text-3xl font-bold ${themeClasses.titleText}`}>
                Course Information
              </h2>
            </div>
            
            <form onSubmit={generateCertificate} className="space-y-8">
              <div className="space-y-2">
                <label className={`block ${themeClasses.labelText} font-semibold text-lg`}>
                  Student Name *
                </label>
                <input
                  type="text"
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-5 py-4 rounded-xl border-2 ${themeClasses.inputBg} focus:outline-none focus:ring-4 ${themeClasses.inputFocus} transition-all duration-200 text-lg`}
                  placeholder="Enter the student's full name"
                />
              </div>

              <div className="space-y-2">
                <label className={`block ${themeClasses.labelText} font-semibold text-lg`}>
                  Course Name *
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-5 py-4 rounded-xl border-2 ${themeClasses.inputBg} focus:outline-none focus:ring-4 ${themeClasses.inputFocus} transition-all duration-200 text-lg`}
                  placeholder="Enter the course name"
                />
              </div>

              <div className="space-y-2">
                <label className={`block ${themeClasses.labelText} font-semibold text-lg`}>
                  Completion Date *
                </label>
                <input
                  type="date"
                  name="completionDate"
                  value={formData.completionDate}
                  onChange={handleInputChange}
                  required
                  className={`w-full px-5 py-4 rounded-xl border-2 ${themeClasses.inputBg} focus:outline-none focus:ring-4 ${themeClasses.inputFocus} transition-all duration-200 text-lg`}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className={`flex-1 ${themeClasses.buttonPrimary} text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg transform hover:scale-105`}
                >
                  <Sparkles className="h-6 w-6" />
                  Generate Certificate
                </button>
                
                {showCertificate && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className={`px-8 py-4 ${themeClasses.buttonSecondary} font-semibold rounded-xl transition-all duration-300 border transform hover:scale-105`}
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Enhanced Certificate Preview */}
          <div className={`${themeClasses.cardBg} rounded-3xl p-8 md:p-10 shadow-2xl border transition-all duration-300`}>
            <div className="flex items-center gap-3 mb-8">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-amber-500/20' : 'bg-blue-100'}`}>
                <BookOpen className={`h-6 w-6 ${themeClasses.iconColor}`} />
              </div>
              <h2 className={`text-3xl font-bold ${themeClasses.titleText}`}>
                Preview
              </h2>
            </div>

            {showCertificate ? (
              <div className="space-y-8">
                <div 
                  ref={certificateRef}
                  className={`${themeClasses.certificateBg} p-8 md:p-12 rounded-2xl border-4 border-amber-400 shadow-2xl relative overflow-hidden`}
                >
                  {/* Decorative elements */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-amber-400 rounded-tl-lg"></div>
                  <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-amber-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-amber-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-amber-400 rounded-br-lg"></div>
                  
                  <div className="text-center space-y-6 relative z-10">
                    <div className="flex justify-center">
                      <div className="p-4 bg-amber-100 rounded-full">
                        <Star className="h-16 w-16 text-amber-600" />
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
                        CERTIFICATE OF COMPLETION
                      </h3>
                      <div className="w-32 h-1 bg-amber-400 mx-auto rounded-full"></div>
                    </div>
                    
                    <p className="text-slate-600 text-lg italic">
                      This is to certify that
                    </p>
                    
                    <div>
                      <h4 className="text-2xl md:text-3xl font-bold text-amber-600 uppercase tracking-wide">
                        {formData.studentName}
                      </h4>
                      <div className="w-48 h-0.5 bg-amber-400 mx-auto mt-2"></div>
                    </div>
                    
                    <p className="text-slate-600 text-lg italic">
                      has successfully completed the course
                    </p>
                    
                    <h5 className="text-xl md:text-2xl font-bold text-slate-800">
                      {formData.courseName}
                    </h5>
                    
                    <div className="text-slate-600 space-y-2">
                      <p className="text-lg">
                        Completed on {new Date(formData.completionDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    
                    <div className="pt-8">
                      <div className="text-slate-800 font-bold text-xl">QUISEF LEARN</div>
                      <p className="text-slate-500 text-sm mt-1">
                        Issued on {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={downloadCertificate}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg shadow-lg shadow-green-500/25 transform hover:scale-105"
                >
                  <Download className="h-6 w-6" />
                  Download Certificate
                </button>
              </div>
            ) : (
              <div className={`text-center ${themeClasses.bodyText} py-16`}>
                <div className={`p-6 rounded-full ${isDarkMode ? 'bg-amber-500/10' : 'bg-blue-50'} inline-block mb-6`}>
                  <Award className="h-20 w-20 opacity-50" />
                </div>
                <h3 className={`text-2xl font-semibold ${themeClasses.titleText} mb-3`}>
                  Ready to Create?
                </h3>
                <p className="text-lg mb-2">Fill out the form to generate your certificate</p>
                <p className="text-sm opacity-75">All fields are required</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Features Section */}
        <div className="mt-20">
          <h3 className={`text-3xl font-bold ${themeClasses.titleText} text-center mb-12`}>
            Why Choose Our Certificate?
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`${themeClasses.featureCardBg} rounded-2xl p-8 text-center shadow-xl border transition-all duration-300 hover:scale-105`}>
              <div className={`p-4 ${isDarkMode ? 'bg-amber-500/20' : 'bg-blue-100'} rounded-full inline-block mb-6`}>
                <Download className={`h-10 w-10 ${themeClasses.iconColor}`} />
              </div>
              <h4 className={`${themeClasses.titleText} font-bold text-xl mb-3`}>Impct Your world</h4>
              <p className={`${themeClasses.bodyText}`}>Using what you learn to develop novel solutions</p>
            </div>
            
            
            <div className={`${themeClasses.featureCardBg} rounded-2xl p-8 text-center shadow-xl border transition-all duration-300 hover:scale-105`}>
              <div className={`p-4 ${isDarkMode ? 'bg-amber-500/20' : 'bg-blue-100'} rounded-full inline-block mb-6`}>
                <Calendar className={`h-10 w-10 ${themeClasses.iconColor}`} />
              </div>
              <h4 className={`${themeClasses.titleText} font-bold text-xl mb-3`}>Successful Completion</h4>
              <p className={`${themeClasses.bodyText}`}>Opportunities and Career advancement.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;