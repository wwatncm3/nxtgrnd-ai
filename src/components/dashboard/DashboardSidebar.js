// Dashboard Sidebar Component
import React from 'react';
import { X } from 'lucide-react';

const DashboardSidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  navigationItems
}) => {
  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in-fast"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className={`fixed lg:sticky lg:top-16 top-0 left-0 h-full lg:h-[calc(100vh-64px)]
                   w-64 bg-white border-r z-50 lg:z-auto shadow-lg lg:shadow-none
                   transform transition-transform duration-300 ease-out
                   ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                   lg:block`}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between p-4 border-b lg:hidden">
          <span className="text-lg font-semibold">Menu</span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4">
          <div className="space-y-1">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg
                         hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 text-left group
                         active:scale-[0.98]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <item.icon size={20} className="transition-transform duration-200 group-hover:scale-110" />
                <span className="text-sm sm:text-base">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default DashboardSidebar;
