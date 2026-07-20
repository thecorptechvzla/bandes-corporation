'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const mode = typeof window !== 'undefined' ? localStorage.getItem('bandes_ui_mode') : null;
    router.replace(mode === 'classic' ? '/dashboard' : '/v2/dashboard');
  }, [router]);

  return null;
}
