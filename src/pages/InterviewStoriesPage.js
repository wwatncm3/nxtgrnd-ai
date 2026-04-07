import React, { useState, useContext } from 'react';
import { UserContext } from '../App';
import { ArrowLeft, Plus, Trash2, BookOpen, ChevronDown, ChevronUp, Copy, Check, Sparkles } from 'lucide-react';

const STORY_CATEGORIES = [
  'Leadership',
  'Teamwork',
  'Problem Solving',
  'Conflict Resolution',
  'Initiative',
  'Failure & Growth',
  'Technical Challenge',
  'Time Management',
  'Communication',
  'Adaptability',
];

const COMMON_QUESTIONS = [
  'Tell me about a time you led a team through a difficult project.',
  'Describe a situation where you had to resolve a conflict.',
  'Give an example of when you failed and what you learned.',
  'Tell me about a time you had to learn something quickly.',
  'Describe a situation where you went above and beyond.',
  'Tell me about a time you disagreed with your manager.',
  'Give an example of a time you had to prioritize multiple tasks.',
  'Describe a situation where you had to persuade others.',
  'Tell me about your greatest professional achievement.',
  'Describe a time you received critical feedback.',
];

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
      <BookOpen className="w-8 h-8 text-purple-600" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">Build Your Interview Story Bank</h3>
    <p className="text-gray-500 max-w-md mb-2">
      The STAR+R method helps you tell compelling interview stories. Build 5-10 master stories that can answer almost any behavioral question.
    </p>
    <div className="bg-purple-50 rounded-xl p-4 max-w-md mb-6 text-left">
      <p className="text-sm font-semibold text-purple-900 mb-2">STAR+R Framework:</p>
      <ul className="text-sm text-purple-700 space-y-1">
        <li><strong>S</strong>ituation — Set the scene</li>
        <li><strong>T</strong>ask — What was your responsibility?</li>
        <li><strong>A</strong>ction — What did you specifically do?</li>
        <li><strong>R</strong>esult — What was the outcome? Use numbers.</li>
        <li><strong>R</strong>eflection — What did you learn?</li>
      </ul>
    </div>
    <button
      onClick={onAdd}
      className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
    >
      <Plus className="w-5 h-5" />
      Add Your First Story
    </button>
  </div>
);

const StoryForm = ({ story, onSave, onCancel }) => {
  const [formData, setFormData] = useState(story || {
    title: '',
    category: 'Leadership',
    question: '',
    situation: '',
    task: '',
    action: '',
    result: '',
    reflection: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const isComplete = formData.title && formData.situation && formData.task && formData.action && formData.result;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          {story ? 'Edit Story' : 'Add New Story'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Story Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Leading the NxtGrnd Beta Launch"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            >
              {STORY_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Common Question This Answers</label>
          <select
            value={formData.question}
            onChange={(e) => setFormData({...formData, question: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="">Select a question (or write your own below)</option>
            {COMMON_QUESTIONS.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-purple-700">STAR+R Method</span>
        </div>

        {[
          { key: 'situation', label: 'Situation', placeholder: 'Set the scene. Where were you? What was happening? (2-3 sentences)', color: 'blue' },
          { key: 'task', label: 'Task', placeholder: 'What was YOUR specific responsibility or goal? (1-2 sentences)', color: 'indigo' },
          { key: 'action', label: 'Action', placeholder: 'What did YOU specifically do? Be detailed. Use "I" not "we". (3-5 sentences)', color: 'purple' },
          { key: 'result', label: 'Result', placeholder: 'What was the outcome? Use numbers/metrics if possible. (2-3 sentences)', color: 'emerald' },
          { key: 'reflection', label: 'Reflection', placeholder: 'What did you learn? How would you apply it in the future? (1-2 sentences)', color: 'amber' },
        ].map(({ key, label, placeholder, color }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              <span className={`inline-block w-6 h-6 rounded-md bg-${color}-100 text-${color}-700 text-center text-xs font-bold leading-6 mr-2`}>
                {label[0]}
              </span>
              {label}
              {key !== 'reflection' && <span className="text-red-400 ml-1">*</span>}
            </label>
            <textarea
              value={formData[key]}
              onChange={(e) => setFormData({...formData, [key]: e.target.value})}
              placeholder={placeholder}
              rows={key === 'action' ? 4 : 2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none text-sm"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (skills demonstrated)</label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {formData.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-medium">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-500">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="e.g. leadership, Python, teamwork"
              className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm outline-none"
            />
            <button onClick={addTag} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-200">Add</button>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
        <button onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
        <button
          onClick={() => onSave({ ...formData, updatedAt: new Date().toISOString() })}
          disabled={!isComplete}
          className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {story ? 'Update Story' : 'Save Story'}
        </button>
      </div>
    </div>
  );
};

const StoryCard = ({ story, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullStory = [
    story.situation && `**Situation:** ${story.situation}`,
    story.task && `**Task:** ${story.task}`,
    story.action && `**Action:** ${story.action}`,
    story.result && `**Result:** ${story.result}`,
    story.reflection && `**Reflection:** ${story.reflection}`,
  ].filter(Boolean).join('\n\n');

  const copyStory = () => {
    const plain = fullStory.replace(/\*\*/g, '');
    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CATEGORY_COLORS = {
    'Leadership': 'bg-blue-100 text-blue-700',
    'Teamwork': 'bg-green-100 text-green-700',
    'Problem Solving': 'bg-purple-100 text-purple-700',
    'Conflict Resolution': 'bg-red-100 text-red-700',
    'Initiative': 'bg-amber-100 text-amber-700',
    'Failure & Growth': 'bg-orange-100 text-orange-700',
    'Technical Challenge': 'bg-indigo-100 text-indigo-700',
    'Time Management': 'bg-teal-100 text-teal-700',
    'Communication': 'bg-pink-100 text-pink-700',
    'Adaptability': 'bg-cyan-100 text-cyan-700',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${CATEGORY_COLORS[story.category] || 'bg-gray-100 text-gray-700'}`}>
                {story.category}
              </span>
              {story.tags && story.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 text-xs">{tag}</span>
              ))}
            </div>
            <h4 className="font-bold text-gray-900 mt-1">{story.title}</h4>
            {story.question && (
              <p className="text-sm text-gray-500 italic mt-1">Q: "{story.question}"</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={copyStory} className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={() => onDelete(story.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-3 text-sm text-purple-600 font-medium hover:text-purple-700"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          {expanded ? 'Collapse' : 'Read Full Story'}
        </button>

        {expanded && (
          <div className="mt-4 space-y-3 text-sm">
            {[
              { label: 'Situation', value: story.situation, color: 'blue' },
              { label: 'Task', value: story.task, color: 'indigo' },
              { label: 'Action', value: story.action, color: 'purple' },
              { label: 'Result', value: story.result, color: 'emerald' },
              { label: 'Reflection', value: story.reflection, color: 'amber' },
            ].filter(s => s.value).map(({ label, value, color }) => (
              <div key={label} className={`pl-4 border-l-2 border-${color}-300`}>
                <span className="font-semibold text-gray-700">{label}:</span>
                <p className="text-gray-600 mt-0.5">{value}</p>
              </div>
            ))}
            <button
              onClick={() => onEdit(story)}
              className="mt-2 text-sm text-purple-600 font-medium hover:text-purple-700"
            >
              Edit this story
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function InterviewStoriesPage({ setStage }) {
  const { user } = useContext(UserContext);
  const storageKey = `nxtgrnd_stories_${user?.email || 'guest'}`;

  const [stories, setStories] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  const saveStories = (newStories) => {
    setStories(newStories);
    localStorage.setItem(storageKey, JSON.stringify(newStories));
  };

  const handleSave = (storyData) => {
    if (editingStory) {
      const updated = stories.map(s => s.id === editingStory.id ? { ...storyData, id: editingStory.id } : s);
      saveStories(updated);
    } else {
      saveStories([...stories, { ...storyData, id: Date.now().toString() }]);
    }
    setShowForm(false);
    setEditingStory(null);
  };

  const handleEdit = (story) => {
    setEditingStory(story);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    saveStories(stories.filter(s => s.id !== id));
  };

  const filteredStories = filterCategory === 'All'
    ? stories
    : stories.filter(s => s.category === filterCategory);

  const usedCategories = [...new Set(stories.map(s => s.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStage(5)} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Interview Stories</h1>
            <p className="text-sm text-gray-500">
              {stories.length} stor{stories.length !== 1 ? 'ies' : 'y'} in your bank
              {stories.length >= 5 && stories.length < 10 && ' — good start!'}
              {stories.length >= 10 && ' — solid bank!'}
            </p>
          </div>
          {stories.length > 0 && (
            <button
              onClick={() => { setEditingStory(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Story
            </button>
          )}
        </div>

        {showForm ? (
          <StoryForm
            story={editingStory}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingStory(null); }}
          />
        ) : stories.length === 0 ? (
          <EmptyState onAdd={() => setShowForm(true)} />
        ) : (
          <>
            {usedCategories.length > 1 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setFilterCategory('All')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    filterCategory === 'All' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  All ({stories.length})
                </button>
                {usedCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      filterCategory === cat ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {cat} ({stories.filter(s => s.category === cat).length})
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {filteredStories.map(story => (
                <StoryCard
                  key={story.id}
                  story={story}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {stories.length > 0 && stories.length < 5 && (
              <div className="bg-purple-50 rounded-2xl p-5 mt-4">
                <h4 className="font-bold text-purple-900 mb-1">Keep Going!</h4>
                <p className="text-sm text-purple-700">
                  You have {stories.length} stor{stories.length !== 1 ? 'ies' : 'y'}. Aim for 5-10 master stories that cover different categories. Most behavioral interview questions can be answered with just 5-10 well-prepared stories.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
