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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header className="w-full px-4 py-2 bg-white shadow-md border-b border-gray-100/50 z-50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <Image src="/gex-logo.png" alt="GEX Logo" width={50} height={50} className="h-10 w-10 object-contain" />
          </Link>
          <Link href="/">
            <span className="text-xl font-bold text-blue-700 tracking-tight">GreenEarthX Map</span>
          </Link>
          <div className="hidden sm:block">
            <UserGuide />
          </div>
        </div>
        <div className="sm:hidden">
          <button onClick={() => setMobileMenuOpen(m => !m)} className="p-2 rounded text-gray-700 hover:bg-gray-100">
            <i className="fa fa-bars text-xl" />
          </button>
        </div>
        <div className="hidden sm:flex items-center space-x-4">
          <button
            onClick={() => setShowContactModal(true)}
            title="Contact Support"
            className="text-gray-600 hover:text-blue-700 transition-colors"
          >
            <MailIcon className="h-6 w-6" />
          </button>
          <AuthBridge />
          <button
            onClick={() => (window.location.href = '/plant-widget')}
            className="bg-blue-600/80 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm hover:bg-blue-600 transition-colors ml-2"
          >
            <span>Plant List</span>
            <i className="fa fa-arrow-right" />
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden flex flex-col items-start gap-2 mt-2 p-3 bg-white rounded shadow-md border border-gray-200">
          <UserGuide />
          <button
            onClick={() => setShowContactModal(true)}
            title="Contact Support"
            className="text-gray-600 hover:text-blue-700 transition-colors flex items-center gap-2"
          >
            <MailIcon className="h-6 w-6" />
            <span>Contact Us</span>
          </button>
          <AuthBridge />
          <button
            onClick={() => (window.location.href = '/plant-widget')}
            className="bg-blue-600/80 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm hover:bg-blue-600 transition-colors"
          >
            <span>Plant List</span>
            <i className="fa fa-arrow-right" />
          </button>
        </div>
      )}
      {/* Email Contact Modal */}
      <ContactUsModal isOpen={showContactModal} onClose={() => setShowContactModal(false)} />
    </header>
  );
}