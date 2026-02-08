"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { logoutApi } from "@/lib/api-client";
import Image from "next/image";

export default function OnboardingPage() {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logoutApi();
    window.location.href = "http://instshopee.test:3000";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Logo */}
          <div className="flex items-center">
            <svg viewBox="0 0 113 126" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 fill-orange-600">
              <path d="M76.968 94.081c-.741 6.073-4.447 10.939-10.187 13.374-3.194 1.356-7.476 2.086-10.871 1.856-5.279-.2-10.241-1.478-14.812-3.809-1.664-.848-4.104-2.525-5.943-4.058-.42-.348-.635-.66-.232-1.228.43-.645 2.13-3.102 2.398-3.507.362-.552.956-.58 1.5-.153.075.057.628.486.74.569 4.4 3.423 10.076 5.994 16.384 6.235 7.955-.108 13.726-3.65 14.757-9.136 1.135-6.046-3.69-11.231-12.98-14.124-2.953-.92-10.38-3.872-11.75-4.672-6.474-3.77-9.488-8.717-9.058-14.807.657-8.438 8.534-14.762 18.53-14.804 4.744-.01 9.194 1.036 13.159 2.695 1.459.61 4.176 2.066 5.145 2.785.677.494.625 1.046.358 1.474-.395.656-1.57 2.483-2.043 3.245-.345.523-.773.583-1.38.2-5.112-3.41-10.37-4.567-15.103-4.661-6.828.134-11.978 4.165-12.316 9.691-.09 4.992 3.729 8.613 11.833 11.378C71.83 77.964 78.17 84.24 76.968 94.08ZM56.32 7.34c10.83 0 19.66 10.208 20.073 22.986H36.248C36.66 17.548 45.489 7.34 56.32 7.34ZM97.44 125.687c5.72-.155 10.355-4.776 10.844-10.504l.037-.692 4.05-81.638v-.001a2.402 2.402 0 0 0-2.4-2.526H83.95C83.312 13.454 71.185 0 56.32 0 41.455 0 29.33 13.454 28.69 30.326H2.632a2.402 2.402 0 0 0-2.35 2.588H.28l3.696 81.319.055 1.02c.564 5.658 4.7 10.215 10.322 10.425h.002l82.669.013.414-.004Z" fillRule="evenodd"></path>
            </svg>
            <span className="ml-2 text-lg font-semibold text-gray-800">Shopee</span>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.name || "User"}</span>
              <svg 
                className={`w-4 h-4 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                <div className="px-4 py-3 border-b border-gray-100 text-center">
                  <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-2">
                    <span className="text-xl font-medium text-gray-700">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <p className="font-medium text-gray-800">{user?.name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            {/* Welcome Illustration */}
            <div className="mb-8">
              <div className="w-48 h-48 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                <div className="relative">
                  <div className="w-32 h-32 bg-orange-200 rounded-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Welcome Text */}
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Welcome to Shopee!
            </h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              To get started, register as a seller by providing the necessary information.
            </p>

            {/* Start Registration Button */}
            <button
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-8 py-3 rounded transition-colors"
              onClick={() => {
                // TODO: Open registration modal/form
                alert("Registration form will be implemented next!");
              }}
            >
              Start Registration
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
