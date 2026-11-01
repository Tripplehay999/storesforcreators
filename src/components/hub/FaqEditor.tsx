"use client";

import { useState } from "react";
import Icon from "./Icon";

/** A product page can have at most this many questions (matches normalizeProduct). */
export const FAQ_LIMIT = 15;

// Questions buyers often ask. Only the question is filled in: the answer is the creator's to write.
const SUGGESTIONS = [
  { question: "How do I get it after I pay?", hint: "e.g. You'll get an email with your download link right after paying." },
  { question: "Who is this for?", hint: "e.g. Anyone just starting out who wants a simple plan to follow." },
  { question: "What format is it?", hint: "e.g. A PDF you can open on your phone, tablet or computer." },
  { question: "Do I need any experience?", hint: "e.g. No. Everything is explained step by step." }
];

type Row = { id: string; question: string; answer: string; hint?: string };

let counter = 0;
const newId = () => `faq-${Date.now().toString(36)}-${(counter += 1)}`;

/**
 * Question-and-answer pairs for a product page, one box each.
 * Fields are named faq_question / faq_answer so the product form reads them in order.
 */
export default function FaqEditor({ initial }: { initial: [string, string][] }) {
  const [rows, setRows] = useState<Row[]>(() =>
    initial.map(([question, answer], index) => ({ id: `faq-initial-${index}`, question, answer }))
  );

  const asked = new Set(rows.map(row => row.question.trim().toLowerCase()));
  const suggestions = SUGGESTIONS.filter(item => !asked.has(item.question.toLowerCase()));
  const full = rows.length >= FAQ_LIMIT;

  function update(id: string, change: Partial<Row>) {
    setRows(current => current.map(row => (row.id === id ? { ...row, ...change } : row)));
  }

  function add(question = "", hint?: string) {
    const id = newId();
    setRows(current => [...current, { id, question, answer: "", hint }]);
    // Put the cursor where the creator needs to type next.
    requestAnimationFrame(() => document.getElementById(`${id}-${question ? "a" : "q"}`)?.focus());
  }

  function remove(id: string) {
    setRows(current => current.filter(row => row.id !== id));
  }

  return (
    <div className="faq-editor">
      {rows.length === 0 ? (
        <p className="faq-empty">
          No questions yet. Tap a common question below, or add your own.
        </p>
      ) : (
        <ol className="faq-rows">
          {rows.map((row, index) => (
            <li className="faq-row" key={row.id}>
              <div className="faq-row-head">
                <span className="faq-num">Question {index + 1}</span>
                <button
                  className="btn btn-ghost btn-sm btn-danger"
                  type="button"
                  onClick={() => remove(row.id)}
                  aria-label={`Remove question ${index + 1}`}
                >
                  <Icon name="trash" size={14} /> Remove
                </button>
              </div>

              <label className="field">
                Question
                <input
                  id={`${row.id}-q`}
                  name="faq_question"
                  value={row.question}
                  onChange={event => update(row.id, { question: event.target.value })}
                  placeholder="What do buyers often ask you?"
                  maxLength={200}
                />
              </label>

              <label className="field">
                Your answer
                <textarea
                  id={`${row.id}-a`}
                  name="faq_answer"
                  value={row.answer}
                  onChange={event => update(row.id, { answer: event.target.value })}
                  placeholder={row.hint ?? "Write a short, friendly answer."}
                  rows={2}
                  maxLength={1000}
                />
              </label>
            </li>
          ))}
        </ol>
      )}

      {full ? (
        <p className="field-hint">That&apos;s the most questions a product can have ({FAQ_LIMIT}).</p>
      ) : (
        <div className="faq-add">
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => add()}>
            <Icon name="plus" size={14} /> Add a question
          </button>

          {suggestions.length > 0 && (
            <div className="faq-suggest">
              <span>Common questions:</span>
              <div className="chip-row">
                {suggestions.map(item => (
                  <button className="chip" type="button" key={item.question} onClick={() => add(item.question, item.hint)}>
                    <Icon name="plus" size={12} /> {item.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
