import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 dark:bg-yellow-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 dark:bg-pink-700 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Main heading */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
               Finance Tracker
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Your one-stop destination for seamless shopping experiences. 
              Join thousands of happy customers today.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto py-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-3">🚀</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Fast & Easy</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Quick checkout process</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Secure</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Your data is protected</p>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="text-3xl mb-3">💎</div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Premium</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Best quality products</p>
            </div>
          </div>

          {/* Auth buttons */}
          <SignedOut>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <SignUpButton mode="modal">
                <button className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 min-w-[200px]">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </button>
              </SignUpButton>
              
              <SignInButton mode="modal">
                <button className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-xl border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-400 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 min-w-[200px]">
                  Sign In
                </button>
              </SignInButton>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Start your journey in seconds. No credit card required.
            </p>
          </SignedOut>

          <SignedIn>
            <div className="space-y-6">
              <div className="inline-block px-6 py-3 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-full">
                <p className="text-green-700 dark:text-green-300 font-semibold">
                  ✓ You're signed in and ready to go!
                </p>
              </div>
              <div>
                <Link href="/dashboard">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                    Go to Dashboard
                  </button>
                </Link>
              </div>
            </div>
          </SignedIn>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div>
      </div>
    </div>
  );
}
