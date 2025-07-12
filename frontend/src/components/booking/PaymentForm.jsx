import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { Loader2, Lock } from 'lucide-react';

export default function PaymentForm() {
    const { confirmBooking } = useBooking();
    const [isProcessing, setIsProcessing] = useState(false);

    // This function simulates a payment request
    const handlePayment = (e) => {
        e.preventDefault();
        setIsProcessing(true);
        
        // Simulate a network delay for payment processing
        setTimeout(() => {
            // After the "payment" is successful, we call confirmBooking
            // which saves the data to the database and moves to the final step.
            confirmBooking();
            setIsProcessing(false);
        }, 2000); // 2-second delay
    };

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">Secure Payment</h2>
            <form onSubmit={handlePayment} className="space-y-4 max-w-lg">
                 <div>
                    <label className="block text-sm font-medium text-gray-300">Card Number</label>
                    <input 
                        placeholder="0000 0000 0000 0000" 
                        className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" 
                        required 
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Expiry Date</label>
                        <input 
                            placeholder="MM / YY" 
                            className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" 
                            required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">CVC</label>
                        <input 
                            placeholder="123" 
                            className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" 
                            required 
                        />
                    </div>
                </div>
                
                 <button 
                    type="submit" 
                    disabled={isProcessing} 
                    className="w-full md:w-auto px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                 >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Lock size={16} />}
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                </button>
            </form>
        </div>
    );
}
