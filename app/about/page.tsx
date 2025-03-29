// app/about/page.tsx
"use client"

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Briefcase, 
  Users, 
  BookOpen, 
  Award, 
  Check, 
  ArrowRight, 
  MessageCircle,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  image: string;
  bio: string;
}

interface TestimonialType {
  id: number;
  content: string;
  name: string;
  role: string;
  company: string;
  image: string;
}

const AboutPage: React.FC = () => {
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Founder & CEO",
      image: "/api/placeholder/200/200",
      bio: "PhD in Educational Technology with over 15 years of experience in e-learning solutions."
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "CTO",
      image: "/api/placeholder/200/200",
      bio: "Former Google engineer with expertise in scalable educational platforms."
    },
    {
      id: 3,
      name: "Priya Patel",
      role: "Head of Content",
      image: "/api/placeholder/200/200",
      bio: "Educational consultant who has developed curriculum for major universities."
    },
    {
      id: 4,
      name: "James Wilson",
      role: "UX/UI Designer",
      image: "/api/placeholder/200/200",
      bio: "Award-winning designer focused on creating accessible learning experiences."
    }
  ];

  const testimonials: TestimonialType[] = [
    {
      id: 1,
      content: "This LMS platform transformed how our university delivers online courses. The analytics and student engagement features are exceptional.",
      name: "Prof. Robert Taylor",
      role: "Dean of Online Learning",
      company: "Pacific State University",
      image: "/api/placeholder/80/80"
    },
    {
      id: 2,
      content: "We've seen a 45% increase in course completion rates since adopting this platform. The intuitive interface makes learning enjoyable.",
      name: "Jennifer Adams",
      role: "Training Director",
      company: "GlobalTech Inc.",
      image: "/api/placeholder/80/80"
    },
    {
      id: 3,
      content: "As someone who teaches complex technical subjects, I appreciate the flexibility of the content delivery options and interactive assessment tools.",
      name: "Dr. Marcus Lee",
      role: "Engineering Professor",
      company: "Technical Institute of Innovation",
      image: "/api/placeholder/80/80"
    }
  ];

  const stats = [
    { label: "Active Learners", value: "250K+" },
    { label: "Courses Delivered", value: "5,000+" },
    { label: "Completion Rate", value: "94%" },
    { label: "Partner Institutions", value: "120+" }
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
    
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-blue-600 dark:text-blue-400 text-xl font-bold">QuisefLearn</span>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
                Home
              </Link>
              <Link href="/about" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                About
              </Link>
              <Link href="/catalog" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Catalogue
              </Link>
              <Link href="/contact" className="px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                Contact
              </Link>
              <Link href="/login" className="ml-4 px-4 py-2 border border-blue-600 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-gray-700">
                Sign In
              </Link>
              <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Sign Up
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
              >
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-white dark:bg-gray-800 shadow-lg`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            
            <Link href="/" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Home
            </Link>
            <Link href="/about" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              About
            </Link>
            <Link href="/catalog" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Catalogue
            </Link>
            <Link href="/contact" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Contact
            </Link>
            <Link href="/login" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-md">
              Sign In
            </Link>
            <Link href="/signup" className="block px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gray-50 dark:bg-gray-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-full h-full bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Transforming Education Through Technology
            </h1>
            <p className="text-lg md:text-xl mb-8 text-blue-100">
              We're on a mission to make quality education accessible, engaging, and effective for learners around the world.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/signup" 
                className="btn-primary"
              >
                Sign-Up
              </Link>
              <Link 
                href="/contact" 
                className="btn-secondary"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave SVG Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" fill="#ffffff" preserveAspectRatio="none">
            <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
          </svg>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Story</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-white text-lg">From a startup with a vision to a leading educational technology provider.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <h3 className="text-xl font-semibold text-gray-300 mb-4">Founded with Purpose</h3>
              <p className="text-gray-50 mb-4">
                Our journey began in 2016 when a group of educators and technologists came together with a shared vision: to build a learning platform that actually helps people learn effectively.
              </p>
              <p className="text-gray-50 mb-4">
                We observed the limitations of traditional e-learning systems—poor engagement, high dropout rates, and minimal personalization. We knew there had to be a better way.
              </p>
              <p className="text-gray-50 mb-6">
                Today, we serve millions of learners across educational institutions, corporations, and government organizations by providing a platform that adapts to individual learning styles and needs.
              </p>
              <Link href="/our-journey" className="text-blue-800 font-medium flex items-center hover:text-blue-700 transition">
                Learn more about our journey <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] order-1 md:order-2">
              <Image 
                src="/image/flat.jpg"
                alt="Our team working together" 
                fill
                className="object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Impact</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Core Values</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-60 text-lg">The principles that guide everything we do.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Inclusivity</h3>
              <p className="text-gray-600">Education should be accessible to all, regardless of background or circumstances.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">We continuously evolve our platform with the latest in learning science and technology.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Excellence</h3>
              <p className="text-gray-600">We're committed to the highest standards in everything from UX design to content quality.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Impact</h3>
              <p className="text-gray-50">We measure our success by the positive outcomes we create for learners worldwide.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Meet Our Team</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-60 text-lg">The passionate experts behind our learning platform.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map(member => (
              <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative h-64">
                  <Image 
                    src={member.image} 
                    alt={member.name} 
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link href="/team" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition">
              Meet our full team <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-90 mb-4">What Our Users Say</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map(testimonial => (
              <div key={testimonial.id} className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <div className="h-0.5 flex-grow bg-gray-200"></div>
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <Image 
                    src={testimonial.image} 
                    alt={testimonial.name} 
                    width={48} 
                    height={48} 
                    className="rounded-full mr-4"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-900 py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">What Sets Us Apart</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-60 text-lg">Our platform is designed with both educators and learners in mind.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="order-2 md:order-1">
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white">
                      <Check className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">Adaptive Learning Paths</h3>
                    <p className="mt-1 text-gray-500">Personalized learning experiences that adjust to each student's progress and performance.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white">
                      <Check className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-90">Comprehensive Analytics</h3>
                    <p className="mt-1 text-gray-500">Detailed insights into learning patterns, engagement metrics, and outcome tracking.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white">
                      <Check className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">Interactive Content Tools</h3>
                    <p className="mt-1 text-gray-500">Create engaging multimedia lessons that facilitate active learning and retention.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white">
                      <Check className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white">Seamless Integration</h3>
                    <p className="mt-1 text-gray-500">Connect with your existing tools through our extensive API and integration capabilities.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <Link href="/features" className="btn-primary">
                  Explore All Features
                </Link>
              </div>
            </div>
            
            <div className="relative h-64 sm:h-80 lg:h-96 order-1 md:order-2">
              <Image 
                src="/image/group.jpg"
                alt="Platform features demonstration" 
                fill
                className="object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Ready to Transform Your Learning Experience?</h2>
            <p className="text-lg md:text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
              Join thousands of educational institutions and businesses that have enhanced their learning outcomes with our platform.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/signup" 
                className="btn-white"
              >
                Sign-Up
              </Link>
             
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Get in Touch</h2>
            <div className="w-16 h-1 bg-blue-600 mx-auto mb-6"></div>
            <p className="text-gray-60 text-lg">Have questions about our platform? We're here to help.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600 mb-4">We'll respond within 24 hours</p>
              <a href="mailto:info@edulearn.com" className="text-blue-600 font-medium hover:text-blue-700 transition">info@edulearn.com</a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600 mb-4">Monday - Friday, 9am - 5pm EST</p>
              <a href="tel:+1-555-123-4567" className="text-blue-600 font-medium hover:text-blue-700 transition">+1 (555) 123-4567</a>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Visit Us</h3>
              <p className="text-gray-600 mb-4">Our headquarters location</p>
              <address className="not-italic text-blue-600">
                100 Education Lane<br />
                Boston, MA 02108
              </address>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons Styles */}
      <style jsx>{`
        .btn-primary {
          @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 inline-block;
        }
        
        .btn-secondary {
          @apply bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-medium py-3 px-6 rounded-lg transition duration-200 inline-block;
        }
        
        .btn-white {
          @apply bg-white text-blue-600 hover:bg-blue-50 font-medium py-3 px-6 rounded-lg transition duration-200 inline-block;
        }
        
        .btn-outline-white {
          @apply bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 font-medium py-3 px-6 rounded-lg transition duration-200 inline-block;
        }
      `}</style>
    </div>
  );
};

export default AboutPage;