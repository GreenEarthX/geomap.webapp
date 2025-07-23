"use client";
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const AuthBridge = dynamic(() => import('./AuthBridge'), { ssr: false });

export default function GexHeader() {
  return (
    <header className="w-full flex items-center justify-between px-4 py-2 bg-white/80 shadow-md border-b border-gray-100/50 z-50 backdrop-blur-sm">
      <div className="flex items-center space-x-2">
        <Link href="/">
          <Image src="/gex-logo.png" alt="GEX Logo" width={50} height={50} className="h-10 w-10 object-contain" />
        </Link>
        <span className="text-xl font-bold text-blue-700 tracking-tight">GreenEarthX Map</span>
      </div>
      <div className="flex items-center space-x-4">
        <AuthBridge />
      </div>
    </header>
  );
}