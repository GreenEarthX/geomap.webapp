"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MailIcon, ExternalLinkIcon } from "lucide-react";

interface ReportMissingProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenContact: () => void; // opens ContactUsModal
}

const ReportMissingProjectModal = ({
  isOpen,
  onClose,
  onOpenContact,
}: ReportMissingProjectModalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b">
          <h2 className="text-xl font-semibold text-emerald-700">
            Report Missing Project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 text-sm leading-relaxed">
            Can’t find your project on the map?  
            Don’t worry — you’re not overlooked! You can help us by:
          </p>

          <div className="flex flex-col gap-3">
            {/* Contact Us link */}
            <button
              onClick={() => {
                onClose();
                onOpenContact();
              }}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <MailIcon className="h-5 w-5" />
              Contact Our Team
            </button>

            {/* Typeform link */}
            <a
              href="https://form.typeform.com/to/NVsVmo67"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
            >
              <ExternalLinkIcon className="h-5 w-5" />
              Fill in Project Details
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") as HTMLElement
  );
};

export default ReportMissingProjectModal;
