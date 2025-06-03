'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/signup'); // Use replace to avoid adding to history
  }, [router]);

  return null; // Render nothing
}
