/**
 * AttendGuard UI - AI Attendance Advisor Interaction Component
 * Member 4: AI Engineer (Intelligence & Analytics)
 */

'use client';

import React, { useState } from 'react';
import type { AttendanceAdvisorResponse } from '../../lib/ai/types.ts';
import type { AttendanceContextPayload } from '../../lib/analytics/types.ts';
import { queryAttendanceAdvisor, queryAttendanceAdvisorLocal } from '../../lib/ai/advisor-client.ts';

interface AttendanceAdvisorChatProps {
  studentName?: string;
  fallbackContext?: AttendanceContextPayload;
}

const SUGGESTED_QUESTIONS = [
  'Which subject is most at risk?',
  'How many C Programming classes do I need to reach 75%?',
  'Can I miss my next Physics class?',
  'Summarize my attendance status.',
];

export function AttendanceAdvisorChat({
  studentName,
  fallbackContext,
}: AttendanceAdvisorChatProps): React.JSX.Element {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AttendanceAdvisorResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleAsk(queryText?: string) {
    const q = (queryText || question).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let result: AttendanceAdvisorResponse;

      // In browser with live API route
      if (typeof window !== 'undefined' && window.location?.origin) {
        result = await queryAttendanceAdvisor(q, studentName);

        // If network/offline occurred but we have local context, fall back locally
        if (!result.success && fallbackContext) {
          result = await queryAttendanceAdvisorLocal(q, fallbackContext, studentName);
        }
      } else if (fallbackContext) {
        // Direct local evaluation (SSR / Test / Storybook)
        result = await queryAttendanceAdvisorLocal(q, fallbackContext, studentName);
      } else {
        result = await queryAttendanceAdvisor(q, studentName);
      }

      setResponse(result);
    } catch (err) {
      setErrorMessage(
        'The attendance advisor is temporarily offline. Your verified attendance calculations remain fully accurate below.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAsk();
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              AI Attendance Advisor
            </h2>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Verified AI
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Ask natural-language questions about your classes, risk levels, and absence allowances.
          </p>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Suggested Questions
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((sq) => (
            <button
              key={sq}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setQuestion(sq);
                handleAsk(sq);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="mt-4 flex gap-2">
        <label htmlFor="advisor-question-input" className="sr-only">
          Ask a question about your attendance
        </label>
        <input
          id="advisor-question-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question (e.g. Can I miss tomorrow's Physics class?)..."
          disabled={isLoading}
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-blue-400"
        />
        <button
          type="button"
          onClick={() => handleAsk()}
          disabled={isLoading || !question.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-ping rounded-full bg-white" />
              Thinking...
            </span>
          ) : (
            'Ask'
          )}
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="mt-4 animate-pulse rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-2 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* AI / Fallback Response Card */}
      {response && !isLoading && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900/30 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Advisor Response
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  response.source === 'AI'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {response.source === 'AI' ? 'Gemini Verified' : 'Deterministic Fallback'}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {response.category}
              </span>
            </div>
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {response.answer}
          </p>

          {/* Referenced Subjects */}
          {response.referencedSubjects && response.referencedSubjects.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 border-t border-blue-100/60 pt-2.5 text-xs text-slate-500 dark:border-blue-900/20">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Courses:</span>
              {response.referencedSubjects.map((sub) => (
                <span
                  key={sub}
                  className="rounded bg-white/80 px-2 py-0.5 text-[11px] font-medium text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-300"
                >
                  {sub}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
