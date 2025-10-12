"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Globe, MapPin, Building2, User } from "lucide-react";

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
  "Request New Entry",
];

const ContactUsModal = ({ isOpen, onClose }: ContactUsModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [topic, setTopic] = useState(topics[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, telephone, topic, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Your message has been sent!");
        setName("");
        setEmail("");
        setTelephone("");
        setTopic(topics[0]);
        setMessage("");
      } else {
        setError(data.error || "Failed to send message.");
      }
    } catch {
      setError("Failed to send message.");
    }
    setLoading(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl sm:max-w-lg md:max-w-4xl flex flex-col max-h-[90vh] md:max-h-[80vh] overflow-y-auto md:overflow-y-visible">
        {/* Logo Section - Shown at the top for mobile, inside right section for web */}
        <div className="bg-white flex justify-center py-4 md:hidden">
          <img
            src="/gex-logo.png"
            alt="GreenEarthX Logo"
            className="w-20 h-20 object-contain"
          />
        </div>

        {/* Main Content - Form and Info Sections */}
        <div className="flex flex-col md:flex-row">
          {/* Left Section - Contact Form */}
          <div className="w-full md:w-2/3 p-4 sm:p-6 md:p-8 bg-gray-50">
            <div className="flex justify-between items-center mb-4 sm:mb-5">
              <h2 className="text-xl sm:text-2xl font-semibold text-blue-700">Contact Our Team</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl leading-none p-2"
              >
                ✕
              </button>
            </div>

            <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Your name"
                className="w-full border rounded-md px-3 py-2.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Your email"
                className="w-full border rounded-md px-3 py-2.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="tel"
                placeholder="Your telephone (optional)"
                className="w-full border rounded-md px-3 py-2.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
              <select
                className="w-full border rounded-md px-3 py-2.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              >
                {topics.map((t, i) => (
                  <option key={i} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <textarea
                rows={4}
                placeholder={
                  topic === "Request New Entry"
                    ? "Please provide details about the plant for the new entry"
                    : "Your message"
                }
                className="w-full border rounded-md px-3 py-2.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              {success && <div className="text-green-600 text-sm">{success}</div>}
              {error && <div className="text-red-600 text-sm">{error}</div>}

              <div className="flex justify-between items-center pt-3 sm:pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 sm:py-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base transition-all"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-md text-sm sm:text-base hover:bg-blue-700 transition-all"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Email"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Section - Info (with Logo for Web) */}
          <div className="w-full md:w-1/3 bg-blue-700 text-white flex flex-col">
            {/* Logo Section - Shown only for web */}
            <div className="hidden md:flex bg-white justify-center py-4">
              <img
                src="/gex-logo.png"
                alt="GreenEarthX Logo"
                className="w-24 h-24 object-contain"
              />
            </div>

            {/* Info Section */}
            <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="sm:w-5 sm:h-5" />
                <p>GreenEarthX, Inc.</p>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={16} className="sm:w-5 sm:h-5" />
                <a
                  href="https://www.greenearthx.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline"
                >
                  www.greenearthx.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="sm:w-5 sm:h-5" />
                <p>9081 Sherwood County, Presto, PA 15142</p>
              </div>
              <div className="flex items-center gap-2">
                <Building2 size={16} className="sm:w-5 sm:h-5" />
                <p>Delaware, U.S.</p>
              </div>

              <div className="border-t border-blue-400 my-2 sm:my-3 w-full"></div>

              {/* Signature Style */}
              <div className="pl-1">
                <p className="text-[10px] sm:text-xs italic text-blue-200 mb-1">Represented by</p>
                <p className="font-signature text-sm sm:text-base">Dr. Sumit Dutta Chowdhury</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
};

export default ContactUsModal;