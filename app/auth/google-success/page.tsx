"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userParam = searchParams.get('user');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect to home page
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/auth?error=invalid_data');
      }
    } else {
      router.push('/auth?error=missing_data');
    }
  }, [searchParams, router]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent mx-auto"></div>
        <h2 className="text-2xl font-medium text-white">Completing Google Sign-In...</h2>
        <p className="mt-2 text-gray-400">Please wait while we redirect you</p>
      </div>
    </div>
  );
}

export default function GoogleSuccess() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent mx-auto"></div>
          <h2 className="text-2xl font-medium text-white">Loading...</h2>
        </div>
      </div>
    }>
      <GoogleSuccessContent />
    </Suspense>
  );
}