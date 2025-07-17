import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Loader2, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import toast from 'react-hot-toast'; // Ensure toast is imported for this component as well

export const DynamicDataTable = ({ endpoint, columns, searchPlaceholder, itemKey, actions = [] }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('created_at');
    const [sortOrder, setSortOrder] = useState('desc');

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // fetchData now responsible for refreshing the table data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Check if endpoint already has query parameters, append correctly
            const url = new URL(endpoint, window.location.origin); // Use window.location.origin for base URL
            url.searchParams.append('page', currentPage);
            url.searchParams.append('limit', 10);
            if (debouncedSearchTerm) url.searchParams.append('q', debouncedSearchTerm);
            if (sortBy) url.searchParams.append('sortBy', sortBy);
            if (sortOrder) url.searchParams.append('sortOrder', sortOrder);

            // Handle optional 'status' query parameter if present in the original endpoint
            // This is for the dashboard's "Pending Bookings" click
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('status')) {
                url.searchParams.append('status', urlParams.get('status'));
            }


            const { data: response } = await api.get(url.pathname + url.search); // Use pathname and search for correct URL

            setData(response.data);
            setTotalPages(response.totalPages);
            // Adjust current page if it's now out of bounds due to filtering/deletion
            if (currentPage > response.totalPages && response.totalPages > 0) {
                setCurrentPage(response.totalPages);
            } else if (response.totalPages === 0) {
                setCurrentPage(1); // Reset to page 1 if no data
            }

        } catch (error) {
            console.error("[DynamicDataTable] Failed to fetch data:", error);
            toast.error(error.response?.data?.message || `Failed to fetch data.`);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearchTerm, sortBy, sortOrder, endpoint]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSort = (columnAccessor) => {
        if (sortBy === columnAccessor) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(columnAccessor);
            setSortOrder('desc');
        }
        setCurrentPage(1); // Reset to first page on sort change
    };

    // Corrected executeAction to pass the ID and the fetchData callback
    // This is the CRITICAL change to fix the "undefined bookingId" error.
    const executeAction = (actionFn, itemData) => { // itemData is the specific row's ID here
        // actionFn here is the function passed from AdminBookingsPage's actions array
        // It expects (rowId, refreshCallback)
        actionFn(itemData, fetchData); // Pass the itemData (which is the ID) and fetchData for refresh
    };

    return (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18}/>
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-primary pl-10 bg-gray-700 text-white border-gray-600 focus:border-yellow-500 focus:ring-yellow-500"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="bg-gray-900/50 text-xs text-gray-400 uppercase">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.accessor}
                                    scope="col"
                                    className={`px-6 py-3 ${col.sortable ? 'cursor-pointer hover:bg-gray-700' : ''}`}
                                    onClick={() => col.sortable && handleSort(col.accessor)}
                                >
                                    <div className="flex items-center">
                                        {col.header}
                                        {sortBy === col.accessor && (sortOrder === 'asc' ? <ArrowUp size={14} className="ml-1"/> : <ArrowDown size={14} className="ml-1"/>)}
                                    </div>
                                </th>
                            ))}
                            <th scope="col" className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={columns.length + 1} className="text-center p-8"><Loader2 className="animate-spin inline-block text-yellow-400"/> <span className="ml-2">Loading data...</span></td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={columns.length + 1} className="text-center p-8 text-gray-400">No data found.</td></tr>
                        ) : data.map(item => (
                            <tr key={item[itemKey]} className="border-b border-gray-800 hover:bg-gray-800/40">
                                {columns.map(col => (
                                    <td key={`${item[itemKey]}-${col.accessor}`} className="px-6 py-4">
                                        {col.type === 'date'
                                            ? item[col.accessor] ? new Date(item[col.accessor]).toLocaleDateString() : 'N/A'
                                            : item[col.accessor]
                                        }
                                    </td>
                                ))}
                                <td className="px-6 py-4 flex items-center justify-end space-x-2">
                                    {actions.map((action, index) => (
                                        // Conditionally render action button based on isVisible prop
                                        (action.isVisible ? action.isVisible(item) : true) && (
                                            <button
                                                key={action.label + index} // Use label+index for unique key
                                                onClick={() => executeAction(action.action, item[itemKey])} // Pass item[itemKey] (the ID)
                                                className="p-2 rounded-md hover:bg-gray-700 transition-colors text-white"
                                                title={action.label}
                                            >
                                                {action.icon}
                                            </button>
                                        )
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 flex justify-between items-center text-sm">
                <p className="text-gray-400">Page {currentPage} of {totalPages}</p>
                <div className="flex space-x-2">
                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage <= 1} className="btn btn-secondary p-2 h-auto text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft/></button>
                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages} className="btn btn-secondary p-2 h-auto text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight/></button>
                </div>
            </div>
        </div>
    );
};