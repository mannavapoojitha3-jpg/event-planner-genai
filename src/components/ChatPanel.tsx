import { useId, useRef, useState, type FormEvent } from 'react';
import type { ChatMessage } from '../engine/types';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
}

const SUGGESTIONS = [
  'Plan this for 150 guests within ₹5 lakh',
  'Reduce catering by 20% and redistribute the savings',
  'Create a checklist for the final seven days',
  'Suggest elegant decor ideas',
];

const MAX_INPUT = 300;

export function ChatPanel({ messages, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit(text: string) {
    const trimmed = text.replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT);
    if (!trimmed) return;
    onSend(trimmed);
    setDraft('');
    inputRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submit(draft);
  }

  return (
    <section className="card chat" aria-labelledby="chat-heading">
      <h2 id="chat-heading">Refine your plan</h2>
      <p className="hint">Ask for changes in plain language. Your event details are kept between messages.</p>

      <div className="chat__suggestions" aria-label="Example requests">
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} type="button" className="chip" onClick={() => submit(suggestion)}>
            {suggestion}
          </button>
        ))}
      </div>

      <div className="chat__log" role="log" aria-live="polite" aria-relevant="additions">
        {messages.length === 0 && <p className="hint">No messages yet. Try one of the examples above.</p>}
        {messages.map((message) => (
          <div key={message.id} className={`chat__message chat__message--${message.role}`}>
            <p className="chat__author">{message.role === 'user' ? 'You' : 'Planner'}</p>
            {message.text.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        ))}
      </div>

      <form className="chat__form" onSubmit={handleSubmit}>
        <label htmlFor={inputId} className="visually-hidden">
          Message the planner
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="text"
          value={draft}
          maxLength={MAX_INPUT}
          placeholder="e.g. reduce decor by 10%"
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="button button--primary" disabled={!draft.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}
