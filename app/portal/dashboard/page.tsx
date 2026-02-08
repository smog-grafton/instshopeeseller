"use client";

import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Seller Dashboard
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">
            Welcome, {user?.name}! Your seller dashboard will be implemented here.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Products</h3>
              <p className="text-2xl font-bold text-orange-600">0</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Orders</h3>
              <p className="text-2xl font-bold text-blue-600">0</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Revenue</h3>
              <p className="text-2xl font-bold text-green-600">$0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
