'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical } from 'lucide-react';
import { PredefinedQuestion } from '@/types/bubble';
import { showToast } from '@/lib/toast';

export default function BubblePredefinedQuestions() {
  const [questions, setQuestions] = useState<PredefinedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    try {
      const response = await fetch('/api/bubble/questions?includeInactive=true');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData.question.trim() || !formData.answer.trim()) return;

    try {
      if (editingId) {
        // Update existing
        await fetch('/api/bubble/questions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingId, ...formData }),
        });
      } else {
        // Create new
        await fetch('/api/bubble/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, order: questions.length }),
        });
      }

      setFormData({ question: '', answer: '' });
      setEditingId(null);
      setIsAdding(false);
      fetchQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
    }
  }

  async function handleDelete(id: string) {
    showToast.info('Deleting question...', 'Deleting', { autoClose: 2000 });

    try {
      await fetch(`/api/bubble/questions?questionId=${id}`, { method: 'DELETE' });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to delete question:', error);
      showToast.error('Failed to delete question', 'Error');
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    try {
      await fetch('/api/bubble/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: !active }),
      });
      fetchQuestions();
    } catch (error) {
      console.error('Failed to toggle active:', error);
    }
  }

  async function handleReorder(id: string, direction: 'up' | 'down') {
    const currentIndex = questions.findIndex(q => q.id === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const currentItem = questions[currentIndex];
    const swapItem = questions[newIndex];

    try {
      await fetch('/api/bubble/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentItem.id, order: swapItem.order }),
      });

      await fetch('/api/bubble/questions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: swapItem.id, order: currentItem.order }),
      });

      fetchQuestions();
    } catch (error) {
      console.error('Failed to reorder:', error);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Predefined Questions</h2>
          <p className="text-gray-600 text-sm mt-1">Manage FAQ questions shown to visitors</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setFormData({ question: '', answer: '' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Question
        </button>
      </div>

      {/* Add/Edit Form */}
      {(isAdding || editingId) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">
            {editingId ? 'Edit Question' : 'New Question'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="e.g., What stack do you use?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                placeholder="Provide a concise answer..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setFormData({ question: '', answer: '' });
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No questions yet</div>
        ) : (
          questions.map((q, index) => (
            <div
              key={q.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Reorder Controls */}
                  <div className="flex items-center gap-2 pt-1">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleReorder(q.id, 'up')}
                        disabled={index === 0}
                        className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleReorder(q.id, 'down')}
                        disabled={index === questions.length - 1}
                        className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{q.question}</h4>
                    <p className="text-sm text-gray-600 mb-2">{q.answer}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${q.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {q.active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">Order: {q.order}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(q.id, q.active)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                    title={q.active ? 'Deactivate' : 'Activate'}
                  >
                    {q.active ? '👁️' : '🚫'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(q.id);
                      setFormData({ question: q.question, answer: q.answer });
                      setIsAdding(false);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
