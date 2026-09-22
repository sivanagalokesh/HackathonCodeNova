import { FormEvent, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState(['Hi! I can help you find products, check stock, or explain an order.']);
  if (!user) return null;
  const ask = (event: FormEvent) => { event.preventDefault(); if (!question.trim()) return; const q = question.trim(); const answer = /stock|available/i.test(q) ? 'Stock is live from the inventory service. Open a product page to see its current quantity.' : /order|delivery/i.test(q) ? 'Your order timeline is available in Orders, with every processing event streamed live.' : 'Try asking about stock, an order, or a product category. I will route you to the right place.'; setMessages(current => [...current, q, answer]); setQuestion(''); };
  return <div className={`chatbot ${open ? 'open' : ''}`}><button className="chat-toggle" onClick={() => setOpen(!open)} aria-label="Open Nova assistant">{open ? '×' : '✦'}<span>{!open && 'Ask Nova'}</span></button>{open && <div className="chat-panel"><div className="chat-head"><div><b>Nova assistant</b><small>Catalog guide · online</small></div><span>●</span></div><div className="chat-messages">{messages.map((message, index) => <div key={`${message}-${index}`} className={index % 2 ? 'chat-user' : 'chat-bot'}>{message}</div>)}</div><form onSubmit={ask} className="chat-input"><input value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask about your order…" /><button aria-label="Send">↗</button></form></div>}</div>;
}