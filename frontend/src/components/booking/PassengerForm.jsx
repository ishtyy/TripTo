import React from 'react';
import { useForm } from 'react-hook-form';
import { useBooking } from '../../context/BookingContext';

export default function PassengerForm() {
  const { addPassengerInfo } = useBooking();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    addPassengerInfo(data);
  };

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-white mb-4">Passenger Information</h2>
      <p className="text-gray-400 mb-6">Please enter the details for the primary passenger.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
        <div>
          <label className="block text-sm font-medium text-gray-300">First Name</label>
          <input {...register('firstName', { required: true })} className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" />
          {errors.firstName && <span className="text-red-400">This field is required</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Last Name</label>
          <input {...register('lastName', { required: true })} className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" />
          {errors.lastName && <span className="text-red-400">This field is required</span>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Email Address</label>
          <input type="email" {...register('email', { required: true })} className="mt-1 block w-full px-4 py-3 rounded-lg bg-gray-800 text-white border-2 border-gray-700" />
          {errors.email && <span className="text-red-400">This field is required</span>}
        </div>
        <button type="submit" className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold">
          Continue to Review
        </button>
      </form>
    </div>
  );
}
