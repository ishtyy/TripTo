import React, { useState } from 'react';
import { X, Users, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GroupSizeModal({ isOpen, onClose, packageData, onConfirm }) {
    const [groupSize, setGroupSize] = useState(1);

    if (!isOpen || !packageData) return null;

    const handleConfirm = () => {
        if (groupSize < 1 || groupSize > 20) {
            toast.error('Group size must be between 1 and 20');
            return;
        }

        onConfirm({
            ...packageData,
            selectedGroupSize: groupSize
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShoppingCart className="text-purple-400" size={24} />
                        Add to Cart
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <h3 className="font-semibold text-white mb-2">{packageData.package_name}</h3>
                        <p className="text-gray-400 text-sm">{packageData.destination}</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            <Users className="inline mr-2" size={16} />
                            Group Size
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={groupSize}
                                onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                                className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-purple-500 transition-colors text-center text-lg font-semibold"
                                placeholder="1"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Users className="text-gray-400" size={20} />
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            You can add passenger details when you're ready to book
                        </p>
                    </div>

                    <div className="bg-gray-800/50 p-4 rounded-lg mb-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-300">Package price per person:</span>
                            <span className="text-white font-semibold">${packageData.price}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-2">
                            <span className="text-gray-300">Total for {groupSize} {groupSize === 1 ? 'person' : 'people'}:</span>
                            <span className="text-purple-400 font-bold text-lg">${(packageData.price * groupSize).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Info message */}
                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-lg mb-6">
                        <p className="text-blue-300 text-sm">
                            <ShoppingCart className="inline mr-1" size={14} />
                            This package will be added to your cart. You can review and book multiple items together.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            <ShoppingCart size={18} />
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}