'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { HxlfedView } from '@/components/hxlfed-view';

export default function HxlfedStandalonePage() {
  const router = useRouter();

  return (
    <main className="w-screen h-screen overflow-hidden bg-black text-white">
      <HxlfedView
        className="w-full h-full"
        onNavigateToSynap={() => {
          router.push('/?view=sphere');
        }}
      />
    </main>
  );
}
