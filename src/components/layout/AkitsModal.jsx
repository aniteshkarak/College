import React, { useEffect } from 'react';
import {
  X,
  Phone,
  PhoneCall,
  MessageCircle,
  ExternalLink,
  Sparkles,
  Building2,
  UserCheck,
  ShoppingCart,
  Code2,
  Smartphone,
  Wrench,
  TrendingUp,
  Layers,
  Zap,
  Database,
  Store,
  Gem,
  Utensils,
  Plane,
  GraduationCap,
  Rocket,
  CheckCircle2,
  Globe,
  Briefcase
} from 'lucide-react';

export const AkitsModal = ({ isOpen, onClose }) => {
  // Close modal on Escape key press and prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 10 Core Services offered by AKITS
  const services = [
    {
      id: 1,
      title: 'Business Website Development',
      desc: 'Custom, brand-tailored corporate and business websites engineered to showcase your services and convert visitors.',
      icon: Briefcase,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 2,
      title: 'Personal Portfolio Website Development',
      desc: 'Modern, high-impact personal portfolios for professionals, creators, doctors, and engineers to elevate personal brands.',
      icon: UserCheck,
      color: 'from-purple-500 to-pink-600',
    },
    {
      id: 3,
      title: 'E-commerce Website Development',
      desc: 'Fast, secure online stores with product catalogs, shopping carts, payment gateways, and order workflows.',
      icon: ShoppingCart,
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 4,
      title: 'Custom Web Application Development',
      desc: 'Interactive full-stack web applications built with modern frameworks (React, Node.js, Express, PostgreSQL, Redis).',
      icon: Code2,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 5,
      title: 'Responsive Website Design',
      desc: 'Fluid, mobile-first layouts that look flawless and operate smoothly across smartphones, tablets, laptops, and desktops.',
      icon: Smartphone,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      id: 6,
      title: 'Website Maintenance and Support',
      desc: 'Continuous security patching, bug fixes, uptime monitoring, performance tuning, and dependable ongoing technical support.',
      icon: Wrench,
      color: 'from-rose-500 to-red-600',
    },
    {
      id: 7,
      title: 'Search Engine Optimization (SEO)',
      desc: 'Technical SEO, schema markup, Google Search Console indexing, and keyword structure to boost organic Google rankings.',
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 8,
      title: 'Landing Page Development',
      desc: 'High-conversion marketing landing pages designed with persuasive copy flow, clear calls-to-action, and swift loading.',
      icon: Layers,
      color: 'from-violet-500 to-purple-600',
    },
    {
      id: 9,
      title: 'Website Redesign & Performance Optimization',
      desc: 'Modernizing outdated interfaces, improving Google Core Web Vitals, and dramatically speeding up page load times.',
      icon: Zap,
      color: 'from-yellow-500 to-amber-600',
    },
    {
      id: 10,
      title: 'Database & Backend Integration',
      desc: 'Robust RESTful API design, database architecture (PostgreSQL, MySQL, MongoDB), secure authentication, and cloud deployment.',
      icon: Database,
      color: 'from-indigo-500 to-violet-600',
    },
  ];

  // Verified Real Projects Developed by AKITS
  const verifiedProjects = [
    {
      name: 'GS Consultant',
      category: 'Professional Business Website',
      description:
        'Official corporate portal providing HR recruitment, staffing, payroll compliance, GST & taxation advisory, and IT solutions.',
      tech: 'React 19 • Tailwind CSS • Supabase • TanStack',
      link: null,
    },
    {
      name: 'Bharat PG',
      category: 'PG & Accommodation Platform',
      description:
        'Kharagpur student and professional accommodation portal featuring live room discovery, verified student amenities, and real reviews.',
      tech: 'Mobile-First • Vite • SEO Architecture',
      link: 'https://bharatpg.site',
    },
    {
      name: 'Gupta Real Estate',
      category: 'Real Estate & Housing Portal',
      description:
        'Modern real estate showcase for luxury apartments (Triveni Apartments) and bachelor PG accommodation with architectural blueprints.',
      tech: 'React • Tailwind CSS • Spatial Blueprint SVGs',
      link: null,
    },
    {
      name: 'Deb Jewellary',
      category: 'Luxury Jewellery Commerce',
      description:
        'Fine jewellery and hallmarked gold retail showroom web platform with live digital collections, rates, and customer enquiry flow.',
      tech: 'React • Node.js • Express • Tailwind CSS',
      link: null,
    },
    {
      name: 'Maa Malti Tours & Travels',
      category: 'Travel Agency & Fleet Booking',
      description:
        'Cab booking, outstation taxi, and wedding car rental portal with an automated intercity fare calculator and direct WhatsApp booking.',
      tech: 'Mobile-First • Instant Fare Engine',
      link: null,
    },
    {
      name: 'Collage Story',
      category: 'Campus Social & Discovery Platform',
      description:
        'College-first student networking and discovery platform featuring campus verification, real-time messaging, and interactive games.',
      tech: 'React • Node.js • PostgreSQL • Redis • Socket.IO',
      link: null,
    },
  ];

  // Business Types Supported
  const businessTypes = [
    { name: 'Mobile & Electronics Shops', icon: Smartphone },
    { name: 'Jewellery & Gold Showrooms', icon: Gem },
    { name: 'Restaurants, Cafes & Hotels', icon: Utensils },
    { name: 'Real Estate & Housing Businesses', icon: Building2 },
    { name: 'Travel Agencies & Cab Operators', icon: Plane },
    { name: 'Coaching Centres & Educators', icon: GraduationCap },
    { name: 'Tech Startups & Innovators', icon: Rocket },
    { name: 'Any Local or Established Business', icon: Store },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="akits-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl text-slate-200 overflow-hidden my-auto">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-900/30">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="akits-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AKITS – Anitesh Karak IT Solution
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 rounded-full">
                  Verified Digital Partner
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Web Development & Custom Digital Solutions
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-8 text-slate-300">
          
          {/* Section 1: About Us Banner */}
          <div className="relative p-6 sm:p-7 rounded-2xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-800/40 shadow-inner">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>About Us</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">
              Empowering Businesses with Modern, High-Performance Websites
            </h3>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white font-semibold">AKITS (Anitesh Karak IT Solution)</strong> is a web development and digital solutions initiative focused on helping individuals, startups and businesses establish a strong online presence.
              </p>
              <p>
                We create modern, responsive, user-friendly and professional websites that help businesses showcase their services, reach more customers and grow their digital presence.
              </p>
              <p>
                Whether you are a small business owner, entrepreneur, startup founder or professional, AKITS can help turn your ideas into a professional online experience.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-purple-900/30">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Mobile Responsive</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Modern Tech Stack</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>SEO & Speed Optimized</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Reliable Support</span>
              </div>
            </div>
          </div>

          {/* Section 2: Our Services */}
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
                <Layers className="w-4 h-4" />
                <span>Comprehensive Expertise</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Our Services
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                End-to-end web engineering, UI/UX design, and digital deployment solutions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {services.map((service) => {
                const IconComponent = service.icon;
                return (
                  <div
                    key={service.id}
                    className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-start gap-3.5 group"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center text-white shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                        {service.id}. {service.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed mt-1">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Projects Developed by AKITS */}
          <div>
            <div className="mb-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                <Globe className="w-4 h-4" />
                <span>Verified Track Record</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Projects & Digital Solutions
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Selected client platforms, specialized business portals, and web applications developed by AKITS.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {verifiedProjects.map((project, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between p-4 rounded-xl bg-slate-800/70 border border-slate-700/80 hover:border-indigo-500/50 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded-md">
                        {project.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                      {project.name}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {project.tech}
                    </span>
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Visit <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">
                        Verified Project
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Business Website Enquiry Section (CTA) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-700/40 shadow-xl">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-purple-300 bg-purple-900/50 border border-purple-700/50 inline-block">
                Start Your Digital Journey
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Want to Grow Your Business Online?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Are you a business owner looking to build your personal website or business website? AKITS can help you establish your online presence with a professional website tailored to your needs.
              </p>
            </div>

            {/* Business Sectors Grid */}
            <div className="mt-6 pt-6 border-t border-purple-900/30">
              <p className="text-xs font-semibold text-center text-slate-400 mb-4 uppercase tracking-wider">
                Tailored solutions for every industry:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {businessTypes.map((biz, idx) => {
                  const BizIcon = biz.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-medium"
                    >
                      <BizIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">{biz.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center mt-6 pt-4 space-y-1">
              <p className="text-xs text-slate-300">
                We can help you build a professional website to showcase your products, services and business information online.
              </p>
              <p className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Let's Build Your Online Presence!
              </p>
            </div>
          </div>

          {/* Section 5: Contact Information */}
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 text-center space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                AKITS – Anitesh Karak IT Solution
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Direct Consultation • Quick Response • Professional Guidance
              </p>
              <p className="text-sm font-bold text-slate-200 mt-2 flex items-center justify-center gap-1.5">
                <Phone className="w-4 h-4 text-purple-400" />
                <span>Contact Number: 8972460400</span>
              </p>
            </div>

            {/* Direct Mobile Friendly Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href="tel:8972460400"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/30 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Now (8972460400)</span>
              </a>

              <a
                href="https://wa.me/918972460400?text=Hello%20AKITS%2C%20I%20am%20interested%20in%20building%20a%20website%20for%20my%20business."
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp (8972460400)</span>
              </a>
            </div>
            
            <p className="text-[11px] text-slate-400">
              Available for web development enquiries, project consultations & business collaborations.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between px-6 py-3.5 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-xs">
          <span className="text-[11px] text-slate-400">
            © 2026 AKITS. All Rights Reserved.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default AkitsModal;
