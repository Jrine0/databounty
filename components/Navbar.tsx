
import React from 'react';
import { User } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate, currentView }) => {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <div 
              className="flex-shrink-0 flex items-center cursor-pointer" 
              onClick={() => onNavigate('home')}
            >
              <div className="bg-indigo-600 p-2 rounded-lg mr-2">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">DataBounty</span>
            </div>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <button
                onClick={() => onNavigate('home')}
                className={`${currentView === 'home' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onNavigate('bounties')}
                className={`${currentView === 'bounties' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
              >
                Browse Bounties
              </button>
              {user.role === 'requester' && (
                <button
                  onClick={() => onNavigate('create')}
                  className={`${currentView === 'create' ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Create Bounty
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right mr-4 hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-indigo-600 font-bold">${user.balance.toFixed(2)}</p>
            </div>
            <button
              onClick={onLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
