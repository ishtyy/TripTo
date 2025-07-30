// src/components/common/ConfirmationModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    if (!isOpen) return null;

    const confirmButtonColor = type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700';

    return ReactDOM.createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center p-4 z-[9999]"
                    onClick={onClose} // Close on backdrop click
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 50 }}
                        className="bg-gray-800 rounded-lg p-6 w-full max-w-sm shadow-xl border border-gray-700 relative text-white"
                        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <AlertTriangle size={48} className={`mb-4 ${type === 'danger' ? 'text-red-500' : 'text-yellow-500'}`} />
                            <h3 className="text-xl font-bold mb-2 text-center">{title}</h3>
                            <p className="text-gray-300 text-center text-sm">{message}</p>
                        </div>

                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={onClose}
                                className="px-5 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                className={`px-5 py-2 ${confirmButtonColor} text-white rounded-md transition-colors`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.getElementById("modal-root")
    );
};

export default ConfirmationModal;