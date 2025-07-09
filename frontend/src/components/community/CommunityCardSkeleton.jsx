import React from 'react';

export default function CommunityCardSkeleton() {
    return (
        <div className="bg-gray-900/80 rounded-xl p-5 shadow-lg border-2 border-gray-800 animate-pulse min-h-[200px]">
            <div className="h-7 w-1/2 bg-gray-700 rounded-md mb-4"></div>
            <div className="space-y-2 flex-grow">
                <div className="h-4 bg-gray-700/80 rounded-md"></div>
                <div className="h-4 w-5/6 bg-gray-700/80 rounded-md"></div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700/50">
                <div className="h-3 w-3/4 bg-gray-700 rounded-md"></div>
            </div>
        </div>
    );
}
