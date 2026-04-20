// Dashboard Sidebar Component
import React from 'react';
import { X, Crown } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';

const DashboardSidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  navigationItems,
  activeStage
}) => {
  const { isFreeUser, isAdmin } = useSubscription();

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
            {navigationItems.map((item, index) => {
              // Hide "Upgrade to Pro" button if user is already pro
              if (item.highlight && !isFreeUser) return null;
              // Hide admin panel from non-admins
              if (item.adminOnly && !isAdmin) return null;

              if (item.highlight) {
                return (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-3 mt-4 rounded-lg
                             bg-gradient-to-r from-blue-900 to-teal-600 text-white
                             hover:from-blue-950 hover:to-teal-700 transition-all duration-200 text-left group
                             active:scale-[0.96] shadow-md"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <item.icon size={20} className="transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-sm sm:text-base font-semibold">{item.label}</span>
                  </button>
                );
              }

              const isActive = item.stageId != null && item.stageId === activeStage;

              return (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg
                           transition-all duration-200 text-left group
                           active:scale-[0.96] ${
                             isActive
                               ? 'bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-600'
                               : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                           }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <item.icon size={20} className="transition-transform duration-200 group-hover:scale-110" />
                  <span className={`text-sm sm:text-base ${isActive ? 'font-medium' : ''}`}>{item.label}</span>
                  {item.proOnly && isFreeUser && (
                    <span className="ml-auto inline-flex items-center gap-0.5 bg-gradient-to-r from-blue-900 to-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      <Crown size={10} />
                      PRO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default DashboardSidebar;
