import { useState } from 'react';
import type { ExpoInformation } from '../types/expo';

export default function Faq({ items }: { items: ExpoInformation['faqs'] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return <div className="faq-list">{items.map((item, index) => (
    <article className="faq-item" key={item.question}>
      <h3><button type="button" id={`faq-button-${index}`} aria-expanded={openIndex === index}
        aria-controls={`faq-answer-${index}`} onClick={() => setOpenIndex(current => current === index ? null : index)}>
        {item.question}<span aria-hidden="true">{openIndex === index ? '−' : '+'}</span>
      </button></h3>
      <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-button-${index}`} hidden={openIndex !== index}><p>{item.answer}</p></div>
    </article>
  ))}</div>;
}
