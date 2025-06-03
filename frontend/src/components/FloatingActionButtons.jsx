// frontend/src/components/FloatingActionButtons.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowUp, Edit2 } from 'lucide-react';

export default function FloatingActionButtons({
  showScrollToTopThreshold = 200,
  // showBackButtonThreshold is no longer needed as Back button will always be visible
  canContribute = false,
  onCreatePostClick,
}) {
  const navigate = useNavigate();
  const [isScrollToTopVisible, setIsScrollToTopVisible] = useState(false);
  // Back button is now always visible, so no state needed for its visibility based on scroll

  const handleScroll = () => {
    // Show "Scroll to Top" button
    if (window.pageYOffset > showScrollToTopThreshold) {
      setIsScrollToTopVisible(true);
    } else {
      setIsScrollToTopVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    // Call handleScroll once on mount to set initial visibility for scroll-to-top
    handleScroll(); 
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showScrollToTopThreshold]);

  return (
    <>
      {/* Back Button - Top Right, ALWAYS VISIBLE */}
      <button
        onClick={goBack}
        className="fixed top-6 right-6 z-[100] bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-500"
        title="Go Back"
        aria-label="Go Back"
      >
        <ArrowLeft size={22} />
      </button>

      {/* Scroll to Top Button - Bottom Left, appears on scroll */}
      {isScrollToTopVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 left-6 z-[100] bg-sky-500 hover:bg-sky-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center animate-bounce hover:animate-none hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-300"
          title="Scroll to Top"
          aria-label="Scroll to Top"
        >
          <ArrowUp size={22} />
        </button>
      )}

      {/* Contribute Button - Bottom Right, visibility controlled by canContribute prop */}
      {canContribute && (
        <button
          onClick={onCreatePostClick}
          className="fixed bottom-6 right-6 z-[100] bg-sunset hover:bg-orange-600 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-300"
          title="Contribute / Create Post"
          aria-label="Contribute"
        >
          <Edit2 size={20} className="mr-0 sm:mr-2" />
          <span className="hidden sm:inline">Contribute</span>
        </button>
      )}
    </>
  );
}
