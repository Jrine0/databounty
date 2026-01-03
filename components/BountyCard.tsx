
import React from 'react';
import { Bounty } from '../types';

interface BountyCardProps {
  bounty: Bounty;
  onSelect: (id: string) => void;
}

const BountyCard: React.FC<BountyCardProps> = ({ bounty, onSelect }) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
      onClick={() => onSelect(bounty.id)}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {bounty.category}
          </span>
          <span className="text-lg font-bold text-green-600">${bounty.reward}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{bounty.title}</h3>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">{bounty.description}</p>
      </div>
      
      <div className="border-t border-gray-100 pt-4 mt-auto">
        <div className="flex flex-wrap gap-2 mb-4">
          {bounty.tags.map((tag) => (
            <span key={tag} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">#{tag}</span>
          ))}
        </div>
        <div className="flex justify-between items-center text-xs text-gray-400">
          <span>{bounty.submissionsCount} Submissions</span>
          <span>{new Date(bounty.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default BountyCard;
