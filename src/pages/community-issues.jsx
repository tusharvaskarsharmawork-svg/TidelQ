import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration - Using the same credentials from auth.js
const SUPABASE_URL = 'https://nbhabuzspifmsmyixlgr.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iaGFidXpzcGlmbXNteWl4bGdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODgxNjEsImV4cCI6MjA5MjI2NDE2MX0.UW8qPnRpN-7mE9BiJKV1h0rDlKpKljKhViUu4OEHM7Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

export default function CommunityIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    beach_location: '',
    category: 'Pollution',
    description: ''
  });

  const categories = ['Pollution', 'Safety', 'Infrastructure', 'Wildlife', 'General'];
  const beaches = ['Anjuna', 'Baga', 'Calangute', 'Candolim', 'Colva', 'Miramar', 'Palolem', 'Vagator'];

  useEffect(() => {
    fetchIssues();
  }, []);

  async function fetchIssues() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("public_issues")
        .select("*")
        .order("votes", { ascending: false });

      if (error) throw error;
      setIssues(data || []);
      setError(null);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load issues. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.beach_location) return;

    try {
      const { error } = await supabase
        .from("public_issues")
        .insert([{ ...formData, status: 'open', votes: 0 }]);

      if (error) throw error;

      setFormData({ title: '', beach_location: '', category: 'Pollution', description: '' });
      showToast("Issue raised successfully!");
      fetchIssues();
    } catch (err) {
      console.error("Submit error:", err);
      alert("Failed to submit issue.");
    }
  };

  const handleVote = async (id, currentVotes) => {
    // Optimistic UI Update
    const localVotes = JSON.parse(localStorage.getItem('react_issues_votes') || '{}');
    const hasVoted = localVotes[id] === 1;
    const delta = hasVoted ? -1 : 1;
    const newVotes = currentVotes + delta;

    // Update local state instantly
    setIssues(prev => prev.map(issue => 
      issue.id === id ? { ...issue, votes: newVotes } : issue
    ));

    // Update local storage
    if (hasVoted) delete localVotes[id];
    else localVotes[id] = 1;
    localStorage.setItem('react_issues_votes', JSON.stringify(localVotes));

    // Sync with DB
    try {
      const { error } = await supabase
        .from("public_issues")
        .update({ votes: newVotes })
        .eq('id', id);
      
      if (error) throw error;
    } catch (err) {
      console.error("Vote error:", err);
      // Revert if failed
      setIssues(prev => prev.map(issue => 
        issue.id === id ? { ...issue, votes: currentVotes } : issue
      ));
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-orange-400 via-rose-400 to-teal-400 bg-clip-text text-transparent">
            Community Issues
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Report hazards, pollution, and infrastructure problems. Help protect our coastlines.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Left Column: Trending Issues */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold border-b border-slate-800 pb-4 flex items-center gap-2">
              Trending Issues 
              <span className="bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full text-sm">
                {issues.length}
              </span>
            </h2>

            {loading ? (
              // Skeleton Loader
              <div className="space-y-4">
                {[1, 2, 3].map(n => (
                  <div key={n} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl animate-pulse flex gap-6">
                    <div className="w-12 h-16 bg-slate-800 rounded-xl" />
                    <div className="flex-1 space-y-3">
                      <div className="h-6 bg-slate-800 rounded w-3/4" />
                      <div className="h-4 bg-slate-800 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl text-rose-400 text-center">
                {error}
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-20 text-slate-500 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
                No issues yet. Be the first to raise one!
              </div>
            ) : (
              <div className="space-y-4">
                {issues.map(issue => {
                  const hasVoted = JSON.parse(localStorage.getItem('react_issues_votes') || '{}')[issue.id] === 1;
                  return (
                    <div key={issue.id} className={`group relative bg-slate-900/40 border ${issue.votes >= 10 ? 'border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.05)]' : 'border-slate-800'} p-6 rounded-2xl transition-all hover:bg-slate-900/60 flex gap-6`}>
                      
                      {/* Voting */}
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => handleVote(issue.id, issue.votes)}
                          className={`p-2 rounded-xl transition-all ${hasVoted ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 hover:border-slate-600'}`}
                        >
                          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/></svg>
                          <span className="block text-center font-black text-lg mt-1">{issue.votes || 0}</span>
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold">{issue.title}</h3>
                          {issue.votes >= 10 && (
                            <span className="text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white px-2 py-0.5 rounded">Trending</span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-4">
                          <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">📍 {issue.beach_location}</span>
                          <span className="bg-slate-800/50 px-2 py-1 rounded">🏷️ {issue.category}</span>
                          <span className={`px-2 py-1 rounded font-bold uppercase text-[10px] ${issue.status === 'open' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}`}>
                            {issue.status}
                          </span>
                        </div>

                        {issue.description && (
                          <p className="text-slate-400 text-sm leading-relaxed mb-4 line-clamp-3">
                            {issue.description}
                          </p>
                        )}

                        <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                          Reported {new Date(issue.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-12 bg-slate-900/60 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl">
              <h2 className="text-2xl font-black mb-2">Raise an Issue</h2>
              <p className="text-slate-400 text-sm mb-8">Seen something wrong? Let the community know.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Issue Title</label>
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Excessive plastic at Anjuna"
                    className="w-100 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Beach Location</label>
                  <select 
                    name="beach_location"
                    value={formData.beach_location}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all appearance-none"
                  >
                    <option value="" disabled>Select a beach</option>
                    {beaches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Category</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Description (Optional)</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Provide more details..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500/50 transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black py-4 rounded-xl transition-all transform active:scale-95 shadow-lg shadow-teal-500/10"
                >
                  SUBMIT ISSUE
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-emerald-500 text-slate-950 px-6 py-4 rounded-2xl font-black shadow-2xl animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
}
