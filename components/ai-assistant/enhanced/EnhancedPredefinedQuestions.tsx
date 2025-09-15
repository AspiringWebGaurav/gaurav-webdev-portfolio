"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button, Input, Badge, Card, Spinner, Icons } from '../design-system/components';
import { AIQuestion } from '../types';

interface EnhancedPredefinedQuestionsProps {
  questions: AIQuestion[];
  onQuestionClick: (question: AIQuestion) => void;
  isLoading: boolean;
  error?: string;
}

const EnhancedPredefinedQuestions: React.FC<EnhancedPredefinedQuestionsProps> = ({
  questions,
  onQuestionClick,
  isLoading,
  error
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter and categorize questions
  const { filteredQuestions, categories } = useMemo(() => {
    // Extract categories from questions (you might want to add a category field to AIQuestion type)
    const categoryMap = new Map<string, number>();
    
    questions.forEach(question => {
      // Simple categorization based on question content
      let category = 'General';
      if (question.question.toLowerCase().includes('project')) category = 'Projects';
      else if (question.question.toLowerCase().includes('skill') || question.question.toLowerCase().includes('tech')) category = 'Skills';
      else if (question.question.toLowerCase().includes('experience') || question.question.toLowerCase().includes('work')) category = 'Experience';
      else if (question.question.toLowerCase().includes('contact') || question.question.toLowerCase().includes('resume')) category = 'Contact';
      
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const categories = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));

    // Filter questions based on search and category
    const filtered = questions.filter(question => {
      const matchesSearch = searchQuery === '' || 
        question.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        question.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (selectedCategory === 'all') return true;
      
      // Apply same categorization logic for filtering
      let questionCategory = 'General';
      if (question.question.toLowerCase().includes('project')) questionCategory = 'Projects';
      else if (question.question.toLowerCase().includes('skill') || question.question.toLowerCase().includes('tech')) questionCategory = 'Skills';
      else if (question.question.toLowerCase().includes('experience') || question.question.toLowerCase().includes('work')) questionCategory = 'Experience';
      else if (question.question.toLowerCase().includes('contact') || question.question.toLowerCase().includes('resume')) questionCategory = 'Contact';
      
      return questionCategory === selectedCategory;
    });

    return { filteredQuestions: filtered, categories };
  }, [questions, searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Spinner size="lg" className="text-ai-primary-blue mb-4" />
        <p className="text-ai-text-secondary text-sm">Loading questions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h3 className="text-lg font-semibold text-ai-text-primary mb-2">
          Failed to load questions
        </h3>
        <p className="text-ai-text-secondary text-sm mb-4">{error}</p>
        <Button variant="primary" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-ai-primary-blue/20 flex items-center justify-center mb-4">
          <Icons.Question className="w-8 h-8 text-ai-primary-blue" />
        </div>
        <h3 className="text-lg font-semibold text-ai-text-primary mb-2">
          No questions available
        </h3>
        <p className="text-ai-text-secondary text-sm">
          Questions will appear here once added by the admin
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-ai-surface-primary">
      {/* Header with Search and Filters */}
      <div className="p-4 border-b border-ai-border-light bg-ai-surface-secondary">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-ai-text-primary">
              Quick Questions
            </h2>
            <p className="text-sm text-ai-text-secondary">
              Pre-written questions about Gaurav's portfolio
            </p>
          </div>
          <Badge variant="info" size="md">
            {filteredQuestions.length} questions
          </Badge>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Icons.Question className="w-4 h-4" />}
            className="w-full"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All Questions
          </Button>
          {categories.map(({ name, count }) => (
            <Button
              key={name}
              variant={selectedCategory === name ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(name)}
              className="flex items-center space-x-1"
            >
              <span>{name}</span>
              <Badge variant="default" size="sm">
                {count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Questions List - GitHub-inspired Layout */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-ai-surface-tertiary flex items-center justify-center mb-4">
              <Icons.Question className="w-8 h-8 text-ai-text-muted" />
            </div>
            <h3 className="text-lg font-medium text-ai-text-primary mb-2">
              No questions found
            </h3>
            <p className="text-ai-text-secondary mb-4 max-w-sm">
              No questions match your search criteria. Try adjusting your filters.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-ai-primary-blue hover:text-ai-primary-blue/80"
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-ai-border-light">
            {filteredQuestions.map((question, index) => (
              <div
                key={question.id}
                className="group cursor-pointer hover:bg-ai-surface-secondary/50 transition-all duration-200 border-l-4 border-transparent hover:border-ai-primary-blue/30"
                onClick={() => onQuestionClick(question)}
              >
                <div className="p-4 sm:p-6">
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-ai-primary-blue/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-ai-primary-blue/30 transition-colors">
                        <Icons.Question className="w-3 h-3 text-ai-primary-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-ai-text-primary leading-tight group-hover:text-ai-primary-blue transition-colors text-base sm:text-lg break-words">
                          {question.question}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Action Badges */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {question.fileUrl && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          <Icons.Download className="w-3 h-3" />
                          <span className="hidden sm:inline">File</span>
                        </div>
                      )}
                      {question.anchorLink && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          <Icons.Link className="w-3 h-3" />
                          <span className="hidden sm:inline">Link</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Answer Preview */}
                  <div className="ml-9 mb-4">
                    <p className="text-sm text-ai-text-secondary leading-relaxed break-words">
                      {question.answer.length > 200
                        ? (
                          <>
                            {question.answer.substring(0, 200)}
                            <span className="text-ai-text-muted">...</span>
                          </>
                        )
                        : question.answer
                      }
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="ml-9 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-ai-text-muted">
                      <span className="flex items-center gap-1">
                        <Icons.Clock className="w-3 h-3" />
                        Quick answer
                      </span>
                      {question.fileUrl && (
                        <span className="flex items-center gap-1">
                          <Icons.Download className="w-3 h-3" />
                          Downloadable
                        </span>
                      )}
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs px-3 py-1 h-auto text-ai-primary-blue hover:text-ai-primary-blue/80 hover:bg-ai-primary-blue/10"
                        rightIcon={<Icons.ChevronRight className="w-3 h-3" />}
                      >
                        View Answer
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default EnhancedPredefinedQuestions;