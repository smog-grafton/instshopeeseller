"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getNotifications } from "@/lib/api-client";

export default function PortalRightbar() {
  const router = useRouter();
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showNotificationTooltip, setShowNotificationTooltip] = useState(false);
  const [showSupportTooltip, setShowSupportTooltip] = useState(false);
  const [showChatTooltip, setShowChatTooltip] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    if (!showNotificationPanel) return;
    setLoadingNotifications(true);
    getNotifications("wallet")
      .then((res) => setNotifications(res.notifications || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoadingNotifications(false));
  }, [showNotificationPanel]);

  return (
    <>
      <aside className="hidden md:block fixed top-14 right-0 z-30 w-12 bg-white border-l border-gray-200" style={{ height: "calc(100vh - 56px)" }}>
        <div className="flex flex-col items-center py-3 h-full">
          {/* Notification Icon */}
          <div className="relative mb-1">
            <button
              type="button"
              onClick={() => setShowNotificationPanel(!showNotificationPanel)}
              className="flex items-center justify-center w-12 h-12 cursor-pointer hover:bg-gray-50 transition-colors rounded"
              onMouseEnter={() => setShowNotificationTooltip(true)}
              onMouseLeave={() => setShowNotificationTooltip(false)}
              aria-label="Notifications"
            >
              <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                <path d="M17.7639 5.68389C16.5418 3.54531 13.4582 3.54531 12.2361 5.68389C12.1244 5.87936 11.9166 5.99999 11.6914 5.99999H9.21429C8.14917 5.99999 7.28572 6.86344 7.28572 7.92856V18.0066C7.28572 18.6411 7.09788 19.2615 6.74588 19.7895L6.10797 20.7464C5.97646 20.9437 5.9642 21.1973 6.07607 21.4063C6.18794 21.6154 6.40578 21.7458 6.64286 21.7458H23.3571C23.5942 21.7458 23.8121 21.6154 23.9239 21.4063C24.0358 21.1973 24.0235 20.9437 23.892 20.7464L23.2541 19.7895C22.9021 19.2615 22.7143 18.6411 22.7143 18.0066V7.92856C22.7143 6.86344 21.8508 5.99999 20.7857 5.99999H18.3086C18.0834 5.99999 17.8756 5.87936 17.7639 5.68389Z" fill="#EE4D2D" />
                <path fillRule="evenodd" clipRule="evenodd" d="M12 23H18V23.375C18 23.6562 17.9493 23.9277 17.8552 24.1826C17.466 25.2368 16.3354 26 15 26C13.6646 26 12.534 25.2368 12.1448 24.1826C12.0507 23.9277 12 23.6562 12 23.375V23Z" fill="#EE4D2D" />
              </svg>
            </button>
            {showNotificationTooltip && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                Notification
              </div>
            )}
          </div>

          {/* Support / Contact Shopee Icon */}
          <div className="relative mb-1">
            <button
              type="button"
              onClick={() => router.push("/portal/customer-service/chat-management")}
              onMouseEnter={() => setShowSupportTooltip(true)}
              onMouseLeave={() => setShowSupportTooltip(false)}
              className="flex items-center justify-center w-12 h-12 cursor-pointer hover:bg-gray-50 transition-colors rounded relative"
              aria-label="Contact Shopee"
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                <path fillRule="evenodd" clipRule="evenodd" d="M25.503 19.0641V14.6286C24.8376 9.97631 20.8366 6.4 16.0002 6.4C11.2647 6.4 7.32995 9.82885 6.54336 14.3393V19.1577C6.54336 19.6229 6.16623 20 5.70102 20C4.17801 20 2.94336 18.7654 2.94336 17.2423V15.7577C2.94336 14.3329 4.0238 13.1605 5.41002 13.0152C6.71087 8.3904 10.9596 5 16.0002 5C21.0366 5 25.2825 8.38471 26.5872 13.0035C28.2106 13.0808 29.503 14.4215 29.503 16.0641V16.9359C29.503 18.6282 28.1312 20 26.439 20C25.9221 20 25.503 19.581 25.503 19.0641ZM17.8731 26.1226C17.8731 25.4322 17.3135 24.8726 16.6231 24.8726H15.1231C14.4328 24.8726 13.8731 25.4322 13.8731 26.1226C13.8731 26.8129 14.4328 27.3726 15.1231 27.3726H16.6231C17.3135 27.3726 17.8731 26.8129 17.8731 26.1226Z" fill="#EE4D2D" />
                <path d="M8 16C8 11.5817 11.5817 8 16 8C20.4183 8 24 11.5817 24 16V18C24 21.3137 21.3137 24 18 24H14C10.6863 24 8 21.3137 8 18L8 16Z" fill="#EE4D2D" />
                <path d="M18.7897 13.4838V13.4838C17.9512 13.8196 17.2379 14.4079 16.7486 15.1671L16.607 15.3868C16.6042 15.3912 16.6071 15.397 16.6122 15.3973L16.6495 15.4001C17.5465 15.4664 18.4311 15.6491 19.2811 15.9435L19.4443 16" stroke="white" strokeWidth="1.1" strokeLinecap="round" />
                <path d="M11.9131 14.4723C11.9131 13.8648 12.4056 13.3723 13.0131 13.3723C13.6206 13.3723 14.1131 13.8648 14.1131 14.4723V15.7723C14.1131 16.3798 13.6206 16.8723 13.0131 16.8723C12.4056 16.8723 11.9131 16.3798 11.9131 15.7723V14.4723Z" fill="white" />
                <path d="M26.2998 17.5V19C26.2998 22.866 23.1658 26 19.2998 26H15.2998" stroke="#EE4D2D" strokeWidth="0.8" />
              </svg>
            </button>
            {showSupportTooltip && (
              <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded whitespace-nowrap pointer-events-none z-10">
                Contact Shopee
              </div>
            )}
          </div>

          {/* Chat Icon */}
          <div className="relative">
            <button
              type="button"
              onClick={() => router.push("/portal/customer-service/chat-management")}
              onMouseEnter={() => setShowChatTooltip(true)}
              onMouseLeave={() => setShowChatTooltip(false)}
              className="flex items-center justify-center w-12 h-12 cursor-pointer hover:bg-gray-50 transition-colors rounded"
              aria-label="Chat"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                <path fillRule="evenodd" clipRule="evenodd" d="M11.2167 19.0562C16.0309 19.0562 19.9335 15.4619 19.9335 11.0281C19.9335 6.59431 16.0309 3 11.2167 3C6.40261 3 2.5 6.59431 2.5 11.0281C2.5 13.3008 3.52536 15.3529 5.17326 16.8135L4.64469 19.1019C4.47937 19.8176 5.18393 20.4191 5.84238 20.1243L8.87974 18.7644C9.62348 18.9546 10.4072 19.0562 11.2167 19.0562ZM7.07629 12.3661C7.67805 12.3661 8.16588 11.8669 8.16588 11.2511C8.16588 10.6353 7.67805 10.1361 7.07629 10.1361C6.47452 10.1361 5.98669 10.6353 5.98669 11.2511C5.98669 11.8669 6.47452 12.3661 7.07629 12.3661ZM10.9988 10.1361C11.6006 10.1361 12.0884 10.6353 12.0884 11.2511C12.0884 11.8669 11.6006 12.3661 10.9988 12.3661C10.8332 12.3661 10.6755 12.328 10.535 12.2603C10.1652 12.082 9.90922 11.6972 9.90922 11.2511C9.90922 10.6353 10.3971 10.1361 10.9988 10.1361ZM14.9213 10.1361C15.5231 10.1361 16.0109 10.6353 16.0109 11.2511C16.0109 11.8669 15.5231 12.3661 14.9213 12.3661C14.7558 12.3661 14.5982 12.328 14.4576 12.2604C14.0878 12.0821 13.8318 11.6972 13.8318 11.2511C13.8318 10.6353 14.3196 10.1361 14.9213 10.1361ZM21.0951 11.0278C21.0951 15.2797 18.0653 18.7353 14.0463 19.8587C14.6796 20.0505 15.3563 20.1542 16.0593 20.1542C16.6574 20.1542 17.2365 20.0791 17.7861 19.9386L20.0304 20.9434C20.5169 21.1612 21.0375 20.7168 20.9153 20.1879L20.5248 18.497C21.7424 17.4178 22.5 15.9016 22.5 14.2223C22.5 12.8155 21.9683 11.523 21.0798 10.5062C21.0899 10.6786 21.0951 10.8525 21.0951 11.0278Z" fill="#EE4D2D" />
              </svg>
            </button>
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
        <div className="hidden md:block fixed top-14 right-12 z-20 w-80 bg-white border-l border-gray-200 shadow-lg" style={{ height: "calc(100vh - 56px)" }}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-orange-600">Notification</h3>
              <button
                type="button"
                onClick={() => setShowNotificationPanel(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="h-full overflow-auto">
            {loadingNotifications ? (
              <div className="p-6 text-sm text-gray-500">Loading notifications...</div>
            ) : notifications.length === 0 ? (
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
                    </g>
                  </g>
                </svg>
                <p className="text-gray-400 text-sm">You have not received any notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="text-sm text-gray-800">{item.title || "Notification"}</div>
                    <div className="text-xs text-gray-500 mt-1">{item.message || ""}</div>
                    {item.createdAt && <div className="text-[11px] text-gray-400 mt-1">{item.createdAt}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
