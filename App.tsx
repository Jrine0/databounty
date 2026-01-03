
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import BountyCard from './components/BountyCard';
import { Bounty, Submission, User, BountyStatus, SubmissionStatus, SubmissionFile } from './types';
import { geminiService } from './services/geminiService';

// Initial Mock Data
const MOCK_BOUNTIES: Bounty[] = [
  {
    id: 'b1',
    title: 'E-commerce Price Data - Electronics',
    description: 'Scrape pricing data for top 100 laptops on Amazon and BestBuy. Need product name, current price, SKU, and availability status.',
    category: 'E-commerce',
    reward: 250,
    requesterId: 'u1',
    createdAt: new Date().toISOString(),
    status: 'active',
    submissionsCount: 2,
    tags: ['scraping', 'amazon', 'electronics']
  },
  {
    id: 'b2',
    title: 'Real Estate Listings - Miami',
    description: 'Collect images and metadata for all active listings in Downtown Miami. Format: ZIP of images + JSON for metadata.',
    category: 'Real Estate',
    reward: 500,
    requesterId: 'u1',
    createdAt: new Date().toISOString(),
    status: 'active',
    submissionsCount: 0,
    tags: ['images', 'real-estate', 'geodata']
  }
];

const MOCK_USER_HUNTER: User = {
  id: 'u2',
  name: 'ScrapeMaster99',
  role: 'hunter',
  balance: 145.50
};

const MOCK_USER_REQUESTER: User = {
  id: 'u1',
  name: 'DataCorp Solutions',
  role: 'requester',
  balance: 2500.00
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'home' | 'bounties' | 'create' | 'details'>('landing');
  const [bounties, setBounties] = useState<Bounty[]>(MOCK_BOUNTIES);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');

  // Handle Login (Simplified for this app)
  const login = (role: 'hunter' | 'requester') => {
    const user = role === 'hunter' ? MOCK_USER_HUNTER : MOCK_USER_REQUESTER;
    setCurrentUser(user);
    setView('home');
  };

  const logout = () => {
    setCurrentUser(null);
    setView('landing');
  };

  const navigateToBounty = (id: string) => {
    setSelectedBountyId(id);
    setView('details');
  };

  const handleCreateBounty = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newBounty: Bounty = {
      id: Math.random().toString(36).substr(2, 9),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      reward: Number(formData.get('reward')),
      requesterId: currentUser?.id || '',
      createdAt: new Date().toISOString(),
      status: 'active',
      submissionsCount: 0,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim())
    };
    setBounties([newBounty, ...bounties]);
    setView('home');
  };

  const handleFileSubmit = (e: React.ChangeEvent<HTMLInputElement>, bountyId: string) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentUser) return;

    // Cast FileList to an array of File objects to avoid 'unknown' type issues in TS
    const fileList = Array.from(files) as File[];
    const mainFile = fileList[0];
    const additionalFiles: SubmissionFile[] = fileList.slice(1).map((f: File) => ({
      name: f.name,
      size: f.size,
      type: f.type
    }));

    const newSubmission: Submission = {
      id: Math.random().toString(36).substr(2, 9),
      bountyId,
      hunterId: currentUser.id,
      hunterName: currentUser.name,
      fileName: fileList.length > 1 ? `${mainFile.name} (+${fileList.length - 1} more)` : mainFile.name,
      fileSize: fileList.reduce((acc: number, f: File) => acc + f.size, 0),
      fileType: mainFile.type || 'application/octet-stream',
      timestamp: new Date().toISOString(),
      status: 'pending',
      additionalFiles: additionalFiles
    };

    setSubmissions([newSubmission, ...submissions]);
    setBounties(bounties.map(b => b.id === bountyId ? { ...b, submissionsCount: b.submissionsCount + 1 } : b));
    alert(`${files.length} file(s) submitted successfully! The requester will review your data shortly.`);
  };

  const processPayout = (subId: string, type: 'full' | 'partial', amount?: number) => {
    const sub = submissions.find(s => s.id === subId);
    const bounty = bounties.find(b => b.id === sub?.bountyId);
    if (!sub || !bounty || !currentUser) return;

    const payoutValue = type === 'full' ? bounty.reward : (amount || 0);

    setSubmissions(submissions.map(s => s.id === subId ? { 
      ...s, 
      status: type === 'full' ? 'accepted' : 'partial',
      payoutAmount: payoutValue
    } : s));

    // Update Requester Balance
    setCurrentUser({
      ...currentUser,
      balance: currentUser.balance - payoutValue
    });

    alert(`Payout of $${payoutValue} processed for ${sub.hunterName}`);
  };

  const fetchAiSuggestion = async (title: string, desc: string) => {
    setLoading(true);
    const suggestion = await geminiService.suggestScrapingStrategy(title, desc);
    setAiSuggestion(suggestion);
    setLoading(false);
  };

  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.includes('image') || fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType.includes('zip') || mimeType.includes('rar') || fileName.match(/\.(zip|7z|rar|gz)$/i)) {
      return (
        <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const LandingPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-blue-800 text-white p-6">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-extrabold mb-4 tracking-tight">DataBounty</h1>
        <p className="text-xl text-indigo-100 max-w-2xl">
          The ultimate marketplace for high-quality datasets. Collect, scrape, and deliver data to earn massive rewards.
        </p>
      </div>
      <div className="flex space-x-6">
        <button 
          onClick={() => login('hunter')}
          className="px-8 py-4 bg-white text-indigo-900 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-colors shadow-2xl"
        >
          I'm a Data Hunter
        </button>
        <button 
          onClick={() => login('requester')}
          className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-indigo-900 transition-all shadow-2xl"
        >
          I Need Data
        </button>
      </div>
    </div>
  );

  const Dashboard = () => {
    const myBounties = currentUser?.role === 'requester' ? 
      bounties.filter(b => b.requesterId === currentUser.id) : 
      [];
    const mySubmissions = currentUser?.role === 'hunter' ? 
      submissions.filter(s => s.hunterId === currentUser.id) : 
      [];

    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome, {currentUser?.name}</h2>
          <p className="text-gray-500">Here is your {currentUser?.role} activity overview.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Available Balance</h4>
            <p className="text-3xl font-bold text-gray-900">${currentUser?.balance.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
              {currentUser?.role === 'requester' ? 'Active Bounties' : 'Submissions'}
            </h4>
            <p className="text-3xl font-bold text-gray-900">
              {currentUser?.role === 'requester' ? myBounties.length : mySubmissions.length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h4 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Earned/Spent</h4>
            <p className="text-3xl font-bold text-gray-900">$0.00</p>
          </div>
        </div>

        {currentUser?.role === 'requester' && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Your Active Bounties</h3>
              <button 
                onClick={() => setView('create')}
                className="text-indigo-600 font-semibold hover:underline"
              >
                + Post New
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myBounties.map(b => (
                <div key={b.id} className="relative">
                  <BountyCard bounty={b} onSelect={navigateToBounty} />
                  {b.submissionsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse shadow-lg">
                      {b.submissionsCount} New
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {currentUser?.role === 'hunter' && (
          <section>
            <h3 className="text-xl font-bold mb-6">Your Recent Submissions</h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Asset</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bounty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mySubmissions.map(s => {
                    const b = bounties.find(x => x.id === s.bountyId);
                    return (
                      <tr key={s.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getFileIcon(s.fileType, s.fileName)}
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">{s.fileName}</p>
                              <p className="text-xs text-gray-500">{formatSize(s.fileSize)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{b?.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            s.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            s.status === 'partial' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {s.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(s.timestamp).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                  {mySubmissions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-400">No submissions yet. Go hunting!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    );
  };

  const BountyDetails = () => {
    const bounty = bounties.find(b => b.id === selectedBountyId);
    if (!bounty) return null;

    const bountySubmissions = submissions.filter(s => s.bountyId === bounty.id);

    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <button 
          onClick={() => setView('bounties')}
          className="text-gray-500 mb-8 flex items-center hover:text-indigo-600 font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Explore More Bounties
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1 pr-4">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{bounty.title}</h2>
              <p className="text-sm text-gray-500">Posted by DataCorp Solutions • {new Date(bounty.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                <span className="text-4xl font-black text-green-600">${bounty.reward}</span>
              </div>
              <p className="text-xs text-gray-400 font-bold mt-2 tracking-widest uppercase">Max Bounty</p>
            </div>
          </div>

          <div className="flex gap-2 mb-8 flex-wrap">
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wider">{bounty.category}</span>
            {bounty.tags.map(t => <span key={t} className="px-3 py-1 bg-gray-50 text-gray-500 text-xs rounded-lg font-medium">#{t}</span>)}
          </div>

          <div className="prose prose-indigo max-w-none mb-10">
            <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Requirements & Scope
            </h4>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-gray-700 whitespace-pre-wrap leading-relaxed">
              {bounty.description}
            </div>
          </div>

          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 mb-10 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold flex items-center text-lg">
                <svg className="w-6 h-6 mr-2 text-indigo-200" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Scraping Strategy Assistant
              </h4>
              <button 
                onClick={() => fetchAiSuggestion(bounty.title, bounty.description)}
                disabled={loading}
                className="text-xs font-bold bg-white text-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-50 disabled:opacity-50 transition-all uppercase tracking-wider"
              >
                {loading ? 'Analyzing...' : 'Get AI Tactics ✨'}
              </button>
            </div>
            {aiSuggestion ? (
              <div className="text-sm text-indigo-100 bg-black/10 p-5 rounded-xl border border-white/20 italic backdrop-blur-sm">
                {aiSuggestion}
              </div>
            ) : (
              <p className="text-indigo-100 text-sm opacity-80">Need help starting? Click to get recommended tools and scraping strategies for this specific bounty.</p>
            )}
          </div>

          {currentUser?.role === 'hunter' && (
            <div className="border-t border-gray-100 pt-8">
              <h4 className="text-xl font-bold mb-6 text-gray-900">Submit Your Data</h4>
              <div className="relative border-3 border-dashed border-indigo-200 rounded-2xl p-12 text-center hover:border-indigo-400 transition-all bg-indigo-50/30 group">
                <input 
                  type="file" 
                  id="bounty-upload" 
                  multiple
                  className="hidden" 
                  onChange={(e) => handleFileSubmit(e, bounty.id)}
                  accept=".zip,.7z,.rar,.json,.csv,.parquet,.jpg,.jpeg,.png,.pdf,.txt"
                />
                <label htmlFor="bounty-upload" className="cursor-pointer block group">
                  <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm group-hover:scale-110 transition-transform">
                    <svg className="h-10 w-10 text-indigo-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-bold text-indigo-900">Click to upload files or a complete ZIP</p>
                  <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">Upload images, JSON datasets, or archive files. You can select multiple files at once.</p>
                  <div className="mt-6 flex justify-center space-x-4 opacity-50 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200">.ZIP</span>
                    <span className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200">.JSON</span>
                    <span className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200">.JPG/.PNG</span>
                    <span className="text-xs bg-white px-3 py-1 rounded-full border border-gray-200">.CSV</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {currentUser?.role === 'requester' && (
            <div className="border-t border-gray-100 pt-8">
              <h4 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M6 16h.01" />
                </svg>
                Incoming Submissions
              </h4>
              <div className="space-y-4">
                {bountySubmissions.map(s => (
                  <div key={s.id} className="bg-white rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors">
                    <div className="flex items-center space-x-5 mb-4 md:mb-0">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        {getFileIcon(s.fileType, s.fileName)}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <p className="text-base font-bold text-gray-900">{s.fileName}</p>
                          {s.additionalFiles && s.additionalFiles.length > 0 && (
                            <span className="ml-2 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">Batch</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Submitted by <span className="text-indigo-600 font-semibold">{s.hunterName}</span> • {formatSize(s.fileSize)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {s.status === 'pending' ? (
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => processPayout(s.id, 'partial', bounty.reward / 2)}
                            className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 border border-blue-100 transition-colors"
                          >
                            Partial Reward
                          </button>
                          <button 
                            onClick={() => processPayout(s.id, 'full')}
                            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-sm shadow-indigo-100 transition-colors"
                          >
                            Accept & Pay Full
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className={`px-4 py-1.5 text-xs font-black rounded-full tracking-wider ${
                            s.status === 'accepted' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {s.status === 'accepted' ? 'PAID FULL' : 'PAID PARTIAL'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {bountySubmissions.length === 0 && (
                  <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
                    <p className="text-gray-400 font-medium italic">Waiting for hunters to upload datasets...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CreateBountyView = () => {
    const [refining, setRefining] = useState(false);
    const [desc, setDesc] = useState('');

    const refineWithAI = async () => {
      if (!desc) return;
      setRefining(true);
      const refined = await geminiService.refineRequirement(desc);
      setDesc(refined);
      setRefining(false);
    };

    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-8 text-gray-900">Post New Data Bounty</h2>
        <form onSubmit={handleCreateBounty} className="space-y-6 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Bounty Title</label>
            <input required name="title" className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. Scrape Top 500 Shopify Stores" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
              <select name="category" className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                <option>E-commerce</option>
                <option>Real Estate</option>
                <option>Finance</option>
                <option>Social Media</option>
                <option>Academic</option>
                <option>Machine Learning</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Total Budget ($)</label>
              <input required name="reward" type="number" min="10" className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="250" />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-bold text-gray-700">Detailed Data Requirements</label>
              <button 
                type="button"
                onClick={refineWithAI}
                disabled={refining}
                className="text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors flex items-center bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
              >
                {refining ? (
                  <>
                    <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refining...
                  </>
                ) : 'Auto-Refine ✨'}
              </button>
            </div>
            <textarea 
              required 
              name="description" 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={8} 
              className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              placeholder="Specify the type of data, source URLs, required fields (e.g. Email, Phone), and preferred format (ZIP of images, JSON, etc.)"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Tags (comma separated)</label>
            <input name="tags" className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="scraping, python, lead-gen, image-dataset" />
          </div>
          <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all text-lg tracking-wide">
            Launch Bounty & Deposit Reward
          </button>
        </form>
      </div>
    );
  };

  const BrowseBounties = () => (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight">Open Market</h2>
          <p className="text-gray-500 mt-1 font-medium text-lg">Browse available data bounties and start hunting.</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <input className="pl-10 pr-4 py-3 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 w-64 shadow-sm" placeholder="Search data types..." />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select className="px-5 py-3 border border-gray-200 rounded-2xl outline-none bg-white shadow-sm font-medium">
            <option>Top Rewards</option>
            <option>Most Recent</option>
            <option>Trending</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {bounties.map(b => (
          <BountyCard key={b.id} bounty={b} onSelect={navigateToBounty} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {currentUser && (
        <Navbar 
          user={currentUser} 
          onLogout={logout} 
          onNavigate={(v) => setView(v as any)} 
          currentView={view} 
        />
      )}
      
      <main className="pb-20">
        {view === 'landing' && <LandingPage />}
        {view === 'home' && <Dashboard />}
        {view === 'bounties' && <BrowseBounties />}
        {view === 'create' && <CreateBountyView />}
        {view === 'details' && <BountyDetails />}
      </main>

      {currentUser && (
        <footer className="bg-white border-t border-gray-100 py-16 mt-auto">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-6">
                  <div className="bg-indigo-600 p-2 rounded-xl mr-3 shadow-lg shadow-indigo-200">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className="text-2xl font-black text-gray-900 tracking-tighter">DataBounty</span>
                </div>
                <p className="text-gray-500 max-w-sm leading-relaxed font-medium">The world's first decentralized platform for crowdsourced data acquisition. Empowering researchers and businesses with high-quality, verified datasets.</p>
              </div>
              <div>
                <h5 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Resources</h5>
                <ul className="space-y-4 text-sm text-gray-500 font-medium">
                  <li className="hover:text-indigo-600 cursor-pointer transition-colors">Documentation</li>
                  <li className="hover:text-indigo-600 cursor-pointer transition-colors">Scraping Best Practices</li>
                  <li className="hover:text-indigo-600 cursor-pointer transition-colors">API Reference</li>
                </ul>
              </div>
              <div>
                <h5 className="font-bold text-gray-900 mb-6 uppercase tracking-widest text-xs">Legal</h5>
                <ul className="space-y-4 text-sm text-gray-500 font-medium">
                  <li className="hover:text-indigo-600 cursor-pointer transition-colors">Terms of Service</li>
                  <li className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy Policy</li>
                  <li className="hover:text-indigo-600 cursor-pointer transition-colors">Ethics Guidelines</li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm font-medium">© 2024 DataBounty Protocol. Secured by AI Verification.</p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <span className="text-gray-400 hover:text-indigo-600 cursor-pointer"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></span>
                <span className="text-gray-400 hover:text-indigo-600 cursor-pointer"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.192.694.805.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;