"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { logoutApi } from "@/lib/api-client";
import { getBuyerBaseUrl, isBackendImage, resolveBackendAssetUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function OnboardingPage() {
  const { user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showNotificationTooltip, setShowNotificationTooltip] = useState(false);
  const [showSupportTooltip, setShowSupportTooltip] = useState(false);
  const [showChatTooltip, setShowChatTooltip] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = async () => {
    await logoutApi();
    window.location.href = getBuyerBaseUrl() || "/";
  };

  // Get user avatar URL or fallback to initials
  const getUserAvatar = () => {
    if (user?.avatarUrl) {
      return resolveBackendAssetUrl(user.avatarUrl);
    }
    return null;
  };

  const getAvatarFallback = () => {
    return user?.name?.charAt(0).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
      {/* Header - Desktop */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-14 bg-white shadow-sm z-50">
        <div className="flex items-center justify-between h-full px-4 max-w-7xl mx-auto w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/images/logos/logo-orange.svg"
              alt="Shopee"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors"
            >
              {getUserAvatar() ? (
                <div className="relative w-8 h-8">
                  <Image
                    src={getUserAvatar()!}
                    alt={user?.name || "User"}
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                    unoptimized={isBackendImage(getUserAvatar())}
                    onError={(e) => {
                      // Hide broken image and show fallback
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.avatar-fallback-header') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="absolute inset-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center avatar-fallback-header" style={{ display: 'none' }}>
                    <span className="text-sm font-medium text-orange-600">
                      {getAvatarFallback()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-600">
                    {getAvatarFallback()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden lg:inline">{user?.name || "User"}</span>
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
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100 text-center">
                  {getUserAvatar() ? (
                    <div className="relative w-14 h-14 mx-auto mb-2">
                      <Image
                        src={getUserAvatar()!}
                        alt={user?.name || "User"}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-full object-cover"
                        unoptimized={isBackendImage(getUserAvatar())}
                        onError={(e) => {
                          // Hide broken image and show fallback
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            const fallback = parent.querySelector('.avatar-fallback-menu') as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="absolute inset-0 w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center avatar-fallback-menu" style={{ display: 'none' }}>
                        <span className="text-xl font-medium text-orange-600">
                          {getAvatarFallback()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                      <span className="text-xl font-medium text-orange-600">
                        {getAvatarFallback()}
                      </span>
                    </div>
                  )}
                  <p className="font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 transition-colors"
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
      <main className="flex-1 pt-14 md:pt-20 pb-20 md:pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 md:p-12 text-center flex flex-col items-center justify-center min-h-[470px]">
            {/* Welcome Illustration */}
            <div className="mb-8">
              <Image
                src="/assets/images/onboarding/onboaring-1.png"
                alt="Welcome to Shopee"
                width={200}
                height={200}
                className="object-contain mx-auto"
                priority
              />
            </div>

            {/* Welcome Text */}
            <h1 className="text-xl font-medium text-gray-800 mb-4">
              Welcome to Shopee!
            </h1>
            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
              To get started, register as a seller by providing the necessary information.
            </p>

            {/* Start Registration Button */}
            <Link
              href="/portal/my-onboarding/form/311000/311300"
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-4 py-2 rounded transition-colors text-sm shadow-md hover:shadow-lg min-w-[72px] h-8 inline-block text-center"
            >
              Start Registration
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Mobile & Tablet */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
          <div className="flex items-center justify-around h-16">
            <Link
              href="/"
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-orange-600 transition-colors"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="text-xs">Home</span>
            </Link>
            <Link
              href="/portal/my-onboarding"
              className="flex flex-col items-center justify-center flex-1 h-full text-orange-600"
            >
              <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs">Onboarding</span>
            </Link>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-600 hover:text-orange-600 transition-colors"
            >
              {getUserAvatar() ? (
                <div className="relative w-6 h-6 mb-1">
                  <Image
                    src={getUserAvatar()!}
                    alt={user?.name || "User"}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover"
                    unoptimized={isBackendImage(getUserAvatar())}
                    onError={(e) => {
                      // Hide broken image and show fallback
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.avatar-fallback-bottom') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="absolute inset-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center avatar-fallback-bottom" style={{ display: 'none' }}>
                    <span className="text-xs font-medium text-orange-600">
                      {getAvatarFallback()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-6 h-6 mb-1 rounded-full bg-orange-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-orange-600">
                    {getAvatarFallback()}
                  </span>
                </div>
              )}
              <span className="text-xs">Account</span>
            </button>
          </div>
        </nav>
      )}

      {/* Mobile User Menu Overlay */}
      {isMobile && showUserMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden" onClick={() => setShowUserMenu(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="text-center mb-4">
              {getUserAvatar() ? (
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <Image
                    src={getUserAvatar()!}
                    alt={user?.name || "User"}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover"
                    unoptimized={isBackendImage(getUserAvatar())}
                    onError={(e) => {
                      // Hide broken image and show fallback
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.avatar-fallback-mobile') as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }
                    }}
                  />
                  <div className="absolute inset-0 w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center avatar-fallback-mobile" style={{ display: 'none' }}>
                    <span className="text-2xl font-medium text-orange-600">
                      {getAvatarFallback()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-medium text-orange-600">
                    {getAvatarFallback()}
                  </span>
                </div>
              )}
              <p className="font-medium text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 text-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Right Sidebar - Desktop Only */}
      <aside className="hidden md:block fixed top-14 right-0 z-[6665] w-12 bg-white border-l border-gray-200" style={{ height: 'calc(100vh - 56px)' }}>
        <div className="flex flex-col items-center py-3 h-full">
          {/* Notification Icon */}
          <div className="relative mb-1">
            <button
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="flex items-center justify-center w-12 h-12 cursor-pointer hover:bg-gray-50 transition-colors rounded"
              onMouseEnter={() => setShowNotificationTooltip(true)}
              onMouseLeave={() => setShowNotificationTooltip(false)}
            >
              <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                <path d="M17.7639 5.68389C16.5418 3.54531 13.4582 3.54531 12.2361 5.68389C12.1244 5.87936 11.9166 5.99999 11.6914 5.99999H9.21429C8.14917 5.99999 7.28572 6.86344 7.28572 7.92856V18.0066C7.28572 18.6411 7.09788 19.2615 6.74588 19.7895L6.10797 20.7464C5.97646 20.9437 5.9642 21.1973 6.07607 21.4063C6.18794 21.6154 6.40578 21.7458 6.64286 21.7458H23.3571C23.5942 21.7458 23.8121 21.6154 23.9239 21.4063C24.0358 21.1973 24.0235 20.9437 23.892 20.7464L23.2541 19.7895C22.9021 19.2615 22.7143 18.6411 22.7143 18.0066V7.92856C22.7143 6.86344 21.8508 5.99999 20.7857 5.99999H18.3086C18.0834 5.99999 17.8756 5.87936 17.7639 5.68389Z" fill="#EE4D2D" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 23H18V23.375C18 23.6562 17.9493 23.9277 17.8552 24.1826C17.466 25.2368 16.3354 26 15 26C13.6646 26 12.534 25.2368 12.1448 24.1826C12.0507 23.9277 12 23.6562 12 23.375V23Z" fill="#EE4D2D" />
              </svg>
            </button>
            {/* Notification Tooltip */}
            {showNotificationTooltip && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                Notification
              </div>
            )}
          </div>

          {/* Support/Contact Shopee Icon */}
          <div className="relative mb-1">
            <button
              onMouseEnter={() => setShowSupportTooltip(true)}
              onMouseLeave={() => setShowSupportTooltip(false)}
              className="flex items-center justify-center w-12 h-12 cursor-pointer hover:bg-gray-50 transition-colors rounded relative"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                <path fillRule="evenodd" clipRule="evenodd" d="M25.503 19.0641V14.6286C24.8376 9.97631 20.8366 6.4 16.0002 6.4C11.2647 6.4 7.32995 9.82885 6.54336 14.3393V19.1577C6.54336 19.6229 6.16623 20 5.70102 20C4.17801 20 2.94336 18.7654 2.94336 17.2423V15.7577C2.94336 14.3329 4.0238 13.1605 5.41002 13.0152C6.71087 8.3904 10.9596 5 16.0002 5C21.0366 5 25.2825 8.38471 26.5872 13.0035C28.2106 13.0808 29.503 14.4215 29.503 16.0641V16.9359C29.503 18.6282 28.1312 20 26.439 20C25.9221 20 25.503 19.581 25.503 19.0641ZM17.8731 26.1226C17.8731 25.4322 17.3135 24.8726 16.6231 24.8726H15.1231C14.4328 24.8726 13.8731 25.4322 13.8731 26.1226C13.8731 26.8129 14.4328 27.3726 15.1231 27.3726H16.6231C17.3135 27.3726 17.8731 26.8129 17.8731 26.1226Z" fill="#EE4D2D" />
                <path d="M8 16C8 11.5817 11.5817 8 16 8C20.4183 8 24 11.5817 24 16V18C24 21.3137 21.3137 24 18 24H14C10.6863 24 8 21.3137 8 18L8 16Z" fill="#EE4D2D" />
                <path d="M18.7897 13.4838V13.4838C17.9512 13.8196 17.2379 14.4079 16.7486 15.1671L16.607 15.3868C16.6042 15.3912 16.6071 15.397 16.6122 15.3973L16.6495 15.4001C17.5465 15.4664 18.4311 15.6491 19.2811 15.9435L19.4443 16" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
                <path d="M11.9131 14.4723C11.9131 13.8648 12.4056 13.3723 13.0131 13.3723C13.6206 13.3723 14.1131 13.8648 14.1131 14.4723V15.7723C14.1131 16.3798 13.6206 16.8723 13.0131 16.8723C12.4056 16.8723 11.9131 16.3798 11.9131 15.7723V14.4723Z" fill="white" />
                <path d="M26.2998 17.5V19C26.2998 22.866 23.1658 26 19.2998 26H15.2998" stroke="#EE4D2D" strokeWidth="0.8" />
              </svg>
            </button>
            {/* Support Tooltip */}
            {showSupportTooltip && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                Contact Shopee
              </div>
            )}
          </div>

          {/* Chat Icon */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowChatTooltip(true)}
              onMouseLeave={() => setShowChatTooltip(false)}
              className="flex items-center justify-center w-12 h-12 cursor-pointer hover:bg-gray-50 transition-colors rounded"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                <path fillRule="evenodd" clipRule="evenodd" d="M11.2167 19.0562C16.0309 19.0562 19.9335 15.4619 19.9335 11.0281C19.9335 6.59431 16.0309 3 11.2167 3C6.40261 3 2.5 6.59431 2.5 11.0281C2.5 13.3008 3.52536 15.3529 5.17326 16.8135L4.64469 19.1019C4.47937 19.8176 5.18393 20.4191 5.84238 20.1243L8.87974 18.7644C9.62348 18.9546 10.4072 19.0562 11.2167 19.0562ZM7.07629 12.3661C7.67805 12.3661 8.16588 11.8669 8.16588 11.2511C8.16588 10.6353 7.67805 10.1361 7.07629 10.1361C6.47452 10.1361 5.98669 10.6353 5.98669 11.2511C5.98669 11.8669 6.47452 12.3661 7.07629 12.3661ZM10.9988 10.1361C11.6006 10.1361 12.0884 10.6353 12.0884 11.2511C12.0884 11.8669 11.6006 12.3661 10.9988 12.3661C10.8332 12.3661 10.6755 12.328 10.535 12.2603C10.1652 12.082 9.90922 11.6972 9.90922 11.2511C9.90922 10.6353 10.3971 10.1361 10.9988 10.1361ZM14.9213 10.1361C15.5231 10.1361 16.0109 10.6353 16.0109 11.2511C16.0109 11.8669 15.5231 12.3661 14.9213 12.3661C14.7558 12.3661 14.5982 12.328 14.4576 12.2604C14.0878 12.0821 13.8318 11.6972 13.8318 11.2511C13.8318 10.6353 14.3196 10.1361 14.9213 10.1361ZM21.0951 11.0278C21.0951 15.2797 18.0653 18.7353 14.0463 19.8587C14.6796 20.0505 15.3563 20.1542 16.0593 20.1542C16.6574 20.1542 17.2365 20.0791 17.7861 19.9386L20.0304 20.9434C20.5169 21.1612 21.0375 20.7168 20.9153 20.1879L20.5248 18.497C21.7424 17.4178 22.5 15.9016 22.5 14.2223C22.5 12.8155 21.9683 11.523 21.0798 10.5062C21.0899 10.6786 21.0951 10.8525 21.0951 11.0278Z" fill="#EE4D2D" />
              </svg>
            </button>
            {/* Chat Tooltip */}
            {showChatTooltip && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                Chat
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Notification Panel - Desktop Only */}
      {showNotificationPanel && (
        <div className="hidden md:block fixed top-14 right-12 z-[6664] w-80 bg-white border-l border-gray-200 shadow-lg" style={{ height: 'calc(100vh - 56px)' }}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-orange-600">Notification</h3>
              <button
                onClick={() => setShowNotificationPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-full p-8">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 99 96" className="w-24 h-24 mb-4">
              <g fill="none" fillRule="evenodd" transform="translate(.5)">
                <rect width="98" height="96" />
                <g transform="translate(4 8.447)">
                  <g stroke="#D8D8D8" transform="translate(16)">
                    <path fill="#FFF" d="M28.363419,1.05327496 C29.4912997,1.05327496 30.4539995,1.43133378 31.138389,2.0579615 C31.8296868,2.69091432 32.2321345,3.57520326 32.2321345,4.55327496 L32.2321345,4.55327496 L24.863419,5.05327496 L24.863419,4.55327496 C24.863419,3.58677665 25.2551698,2.71177665 25.8885453,2.07840123 C26.5219207,1.4450258 27.3969207,1.05327496 28.363419,1.05327496 Z" />
                    <path fill="#FAFAFA" d="M37.6410741,55.2137964 C37.5144483,57.4418941 36.5589026,59.4481758 35.0779888,60.9290896 C33.485502,62.5215764 31.285502,63.5065499 28.8554491,63.5065499 L28.8554491,63.5065499 L28.1978734,63.5065499 C25.8139899,63.5065499 23.6514927,62.5586583 22.0667548,61.0191955 C20.5913184,59.5859114 19.6165927,57.6398779 19.4303943,55.4686146 L19.4303943,55.4686146 Z" />
                    <path fill="#FFF" d="M28.4892236,4.47854076 C33.6031795,4.47854076 38.2380108,6.58097726 41.618519,9.98769303 C45.0095815,13.405045 47.1388924,18.1344672 47.2269329,23.3654571 L47.2269329,23.3654571 L47.2298823,45.956401 L55.9539884,52.5070496 C56.3313056,52.7903649 56.5533225,53.2347069 56.5533225,53.7065499 C56.5533225,54.100431 56.4015331,54.4588737 56.1531958,54.7265035 C55.9067561,54.992088 55.5653408,55.1684832 55.1828231,55.2010662 L55.1828231,55.2010662 L2.00011041,55.2065499 C1.53050799,55.2065499 1.08800691,54.9866256 0.804445079,54.6123007 C0.567823964,54.2999414 0.472136838,53.9248225 0.506959909,53.5632549 C0.541489439,53.2047351 0.704093512,52.8594033 0.98502544,52.6020091 L0.98502544,52.6020091 L9.74859829,45.954859 L9.74852902,23.720792 C9.83780147,18.3279168 11.9528492,13.5249589 15.3257191,10.0656052 C18.7090961,6.59547491 23.357962,4.47854076 28.4892236,4.47854076 Z" />
                    <line x1="3" x2="54" y1="51.053" y2="51.053" />
                  </g>
                  <ellipse cx="45" cy="74.107" fill="#F2F2F2" rx="45" ry="5" />
                  <path fill="#D8D8D8" d="M79.0373555,10.04 C80.6942098,10.04 82.0373555,11.3831458 82.0373555,13.04 C82.0373555,14.6968542 80.6942098,16.04 79.0373555,16.04 C77.3805013,16.04 76.0373555,14.6968542 76.0373555,13.04 C76.0373555,11.3831458 77.3805013,10.04 79.0373555,10.04 Z M71.0373555,7.04 C72.141925,7.04 73.0373555,7.9354305 73.0373555,9.04 C73.0373555,10.1445695 72.141925,11.04 71.0373555,11.04 C69.932786,11.04 69.0373555,10.1445695 69.0373555,9.04 C69.0373555,7.9354305 69.932786,7.04 71.0373555,7.04 Z M77.5373555,0.04 C78.9180674,0.04 80.0373555,1.15928813 80.0373555,2.54 C80.0373555,3.92071187 78.9180674,5.04 77.5373555,5.04 C76.1566437,5.04 75.0373555,3.92071187 75.0373555,2.54 C75.0373555,1.15928813 76.1566437,0.04 77.5373555,0.04 Z M77.5373555,1.04 C76.7089284,1.04 76.0373555,1.71157288 76.0373555,2.54 C76.0373555,3.36842712 76.7089284,4.04 77.5373555,4.04 C78.3657827,4.04 79.0373555,3.36842712 79.0373555,2.54 C79.0373555,1.71157288 78.3657827,1.04 77.5373555,1.04 Z" opacity=".5" />
                  <path fill="#FFF" stroke="#D8D8D8" d="M37.6153846,13.5537653 L37.6153846,33.069148 L32.4596425,33.069148 L32.459,35.534 L30.0874537,33.069148 L11.5,33.069148 L11.5,13.6612564 L37.6153846,13.5537653 Z" />
                  <rect width="19.507" height="1" x="15.587" y="19.169" fill="#D8D8D8" rx=".5" transform="matrix(-1 0 0 1 50.68 0)" />
                  <path fill="#D8D8D8" d="M15.9937331,24.1955558 L26.8833971,24.1955558 C27.1082845,24.1955558 27.2905918,24.3778631 27.2905918,24.6027504 C27.2905918,24.8276378 27.1082845,25.0099451 26.8833971,25.0099451 L15.9937331,25.0099451 C15.7688457,25.0099451 15.5865385,24.8276378 15.5865385,24.6027504 C15.5865385,24.3778631 15.7688457,24.1955558 15.9937331,24.1955558 Z" transform="matrix(-1 0 0 1 42.877 0)" />
                </g>
              </g>
            </svg>
            <p className="text-gray-400 text-sm">You have not received any notification</p>
          </div>
        </div>
      )}
    </div>
  );
}
