import React, { useState, useContext } from 'react';
import { UserContext } from '../App';
import { ArrowLeft, TrendingUp, Plus, Trash2, Star, DollarSign, MapPin, Briefcase, GraduationCap, Users, Clock, Heart, Shield, Zap } from 'lucide-react';

const SCORING_DIMENSIONS = [
  { key: 'compensation', label: 'Compensation & Benefits', icon: DollarSign, weight: 15, description: 'Base salary, signing bonus, benefits, PTO' },
  { key: 'growth', label: 'Growth Potential', icon: TrendingUp, weight: 15, description: 'Promotion path, skill development, mentorship' },
  { key: 'roleFit', label: 'Role Fit', icon: Briefcase, weight: 12, description: 'How well does the role match your skills and interests?' },
  { key: 'company', label: 'Company Reputation', icon: Star, weight: 10, description: 'Brand recognition, industry standing, stability' },
  { key: 'culture', label: 'Culture & Values', icon: Heart, weight: 10, description: 'Work environment, diversity, mission alignment' },
  { key: 'location', label: 'Location & Flexibility', icon: MapPin, weight: 10, description: 'Remote options, commute, city preference' },
  { key: 'learning', label: 'Learning & Development', icon: GraduationCap, weight: 8, description: 'Training programs, certifications, conferences' },
  { key: 'team', label: 'Team & Manager', icon: Users, weight: 8, description: 'Team size, manager quality, collaboration' },
  { key: 'workLife', label: 'Work-Life Balance', icon: Clock, weight: 7, description: 'Hours expectations, flexibility, burnout risk' },
  { key: 'security', label: 'Job Security', icon: Shield, weight: 5, description: 'Company financial health, layoff risk, contract type' },
];

const GRADE_COLORS = {
  'A': 'bg-emerald-500',
  'B': 'bg-blue-500',
  'C': 'bg-yellow-500',
  'D': 'bg-orange-500',
  'F': 'bg-red-500',
};

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function getGradeDescription(grade) {
  switch(grade) {
    case 'A': return 'Excellent — strongly consider accepting';
    case 'B': return 'Good — solid opportunity worth pursuing';
    case 'C': return 'Average — negotiate or compare with other offers';
    case 'D': return 'Below average — significant concerns to address';
    case 'F': return 'Poor fit — likely not worth your time';
    default: return '';
  }
}

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
      <TrendingUp className="w-8 h-8 text-indigo-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">Score Your Job Offers</h3>
    <p className="text-gray-500 max-w-md mb-6">
      Add job offers and rate them across 10 dimensions. Get a clear A-F grade to help you decide which opportunity is the best fit.
    </p>
    <button
      onClick={onAdd}
      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
    >
      <Plus className="w-5 h-5" />
      Add Your First Offer
    </button>
  </div>
);

const OfferForm = ({ offer, onSave, onCancel }) => {
  const [formData, setFormData] = useState(offer || {
    company: '',
    role: '',
    salary: '',
    location: '',
    notes: '',
    scores: SCORING_DIMENSIONS.reduce((acc, dim) => ({ ...acc, [dim.key]: 5 }), {}),
  });

  const totalScore = SCORING_DIMENSIONS.reduce((sum, dim) => {
    const score = formData.scores[dim.key] || 5;
    return sum + (score / 10) * dim.weight;
  }, 0);

  const grade = getGrade(totalScore);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {offer ? 'Edit Offer' : 'Add New Offer'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
              placeholder="e.g. Deloitte"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              placeholder="e.g. Technology Analyst"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salary / Compensation</label>
            <input
              type="text"
              value={formData.salary}
              onChange={(e) => setFormData({...formData, salary: e.target.value})}
              placeholder="e.g. $90K base + $12.5K signing"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="e.g. Houston, TX (Hybrid)"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            placeholder="Any additional thoughts about this offer..."
            rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
          />
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-gray-900">Rate Each Dimension (1-10)</h4>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Overall:</span>
            <span className={`px-3 py-1 rounded-full text-white font-bold text-sm ${GRADE_COLORS[grade]}`}>
              {grade} ({Math.round(totalScore)}/100)
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {SCORING_DIMENSIONS.map((dim) => {
            const Icon = dim.icon;
            const score = formData.scores[dim.key] || 5;
            return (
              <div key={dim.key} className="flex items-center gap-3">
                <div className="flex items-center gap-2 w-48 flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{dim.label}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={score}
                  onChange={(e) => setFormData({
                    ...formData,
                    scores: { ...formData.scores, [dim.key]: parseInt(e.target.value) }
                  })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="w-8 text-center text-sm font-bold text-gray-900">{score}</span>
                <span className="text-xs text-gray-400 w-8">/{dim.weight}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ ...formData, totalScore, grade, updatedAt: new Date().toISOString() })}
          disabled={!formData.company || !formData.role}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {offer ? 'Update Offer' : 'Save Offer'}
        </button>
      </div>
    </div>
  );
};

const OfferCard = ({ offer, onEdit, onDelete, rank }) => {
  const grade = offer.grade || getGrade(offer.totalScore || 0);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${GRADE_COLORS[grade]} flex items-center justify-center`}>
            <span className="text-white font-bold text-xl">{grade}</span>
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{offer.company}</h4>
            <p className="text-sm text-gray-500">{offer.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {rank && (
            <span className="text-xs font-medium text-gray-400 mr-2">#{rank}</span>
          )}
          <button onClick={() => onEdit(offer)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
            <Zap className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(offer.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {offer.salary && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-medium">
            <DollarSign className="w-3 h-3" /> {offer.salary}
          </span>
        )}
        {offer.location && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
            <MapPin className="w-3 h-3" /> {offer.location}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-gray-600 text-xs font-medium">
          Score: {Math.round(offer.totalScore || 0)}/100
        </span>
      </div>

      <p className="mt-2 text-xs text-gray-400">{getGradeDescription(grade)}</p>

      {offer.notes && (
        <p className="mt-2 text-sm text-gray-500 italic">"{offer.notes}"</p>
      )}
    </div>
  );
};

export default function OfferScoringPage({ setStage }) {
  const { user } = useContext(UserContext);
  const storageKey = `nxtgrnd_offers_${user?.email || 'guest'}`;

  const [offers, setOffers] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const saveOffers = (newOffers) => {
    setOffers(newOffers);
    localStorage.setItem(storageKey, JSON.stringify(newOffers));
  };

  const handleSave = (offerData) => {
    if (editingOffer) {
      const updated = offers.map(o => o.id === editingOffer.id ? { ...offerData, id: editingOffer.id } : o);
      saveOffers(updated);
    } else {
      saveOffers([...offers, { ...offerData, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditingOffer(null);
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    saveOffers(offers.filter(o => o.id !== id));
  };

  const sortedOffers = [...offers].sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setStage(5)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Offer Scoring</h1>
            <p className="text-sm text-gray-500">Compare job offers with A-F grades across 10 dimensions</p>
          </div>
          {offers.length > 0 && (
            <button
              onClick={() => { setEditingOffer(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Offer
            </button>
          )}
        </div>

        {showForm ? (
          <OfferForm
            offer={editingOffer}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingOffer(null); }}
          />
        ) : offers.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <div className="space-y-3">
            {sortedOffers.map((offer, i) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                rank={i + 1}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}

            {sortedOffers.length >= 2 && (
              <div className="bg-indigo-50 rounded-2xl p-5 mt-4">
                <h4 className="font-bold text-indigo-900 mb-1">Recommendation</h4>
                <p className="text-sm text-indigo-700">
                  Based on your scores, <strong>{sortedOffers[0].company} ({sortedOffers[0].role})</strong> is your strongest offer with a grade of {sortedOffers[0].grade} ({Math.round(sortedOffers[0].totalScore)}/100).
                  {sortedOffers[1] && ` It scores ${Math.round(sortedOffers[0].totalScore - sortedOffers[1].totalScore)} points higher than ${sortedOffers[1].company}.`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
