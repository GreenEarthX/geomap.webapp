// components/ContactUsModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ContactUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const topics = [
  "General Inquiry",
  "Map Help",
  "Verify/Update Plant",
  "Report an Issue",
  "Submit Feedback",
];

const ContactUsModal = ({ isOpen, onClose }: ContactUsModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string|null>(null);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, topic, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('Your message has been sent!');
        setName("");
        setEmail("");
        setTopic(topics[0]);
        setMessage("");
      } else {
        setError(data.error || 'Failed to send message.');
      }
    } catch (err) {
      setError('Failed to send message.');
    }
    setLoading(false);
  };


  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-blue-700">Contact Our Team</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Form */}
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            className="w-full border rounded-md px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Your email"
            className="w-full border rounded-md px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <select
            className="w-full border rounded-md px-3 py-2"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            {topics.map((t, i) => (
              <option key={i} value={t}>{t}</option>
            ))}
          </select>
          <textarea
            rows={4}
            placeholder="Your message"
            className="w-full border rounded-md px-3 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
          {success && <div className="text-green-600">{success}</div>}
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
};

export default ContactUsModal;
