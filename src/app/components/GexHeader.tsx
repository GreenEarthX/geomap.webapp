"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import UserGuide from './UserGuide';
import { useState } from "react";
import ContactUsModal from './ContactUsModal'
import { MailIcon } from 'lucide-react'; // Optional: use lucide for icons

const AuthBridge = dynamic(() => import('./AuthBridge'), { ssr: false });

export default function GexHeader() {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <header className="w-full flex items-center justify-between px-4 py-2 bg-white shadow-md border-b border-gray-100/50 z-50 backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <Link href="/">
          <Image src="/gex-logo.png" alt="GEX Logo" width={50} height={50} className="h-10 w-10 object-contain" />
        </Link>
        <Link href="/">
          <span className="text-xl font-bold text-blue-700 tracking-tight">GreenEarthX Map</span>
        </Link>
        <UserGuide />
      </div>

      <div className="flex items-center space-x-4">
        {/* Contact Us Button */}
        <button
          onClick={() => setShowContactModal(true)}
          title="Contact Support"
          className="text-gray-600 hover:text-blue-700 transition-colors"
        >
          <MailIcon className="h-6 w-6" />
        </button>

        <AuthBridge />
      </div>

      {/* Email Contact Modal */}
      <ContactUsModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </header>
  );
}