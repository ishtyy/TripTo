import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKey);
    }

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-gray-900/80 border border-gray-700/80 rounded-xl shadow-2xl p-6 max-w-md w-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
          aria-label="Close Modal"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}