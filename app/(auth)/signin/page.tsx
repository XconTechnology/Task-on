import type { Metadata } from "next"
import SignInForm from "@/components/auth/signin-form"

export const metadata: Metadata = {
  title: "Sign In - ProjectFlow",
  description: "Sign in to your ProjectFlow account to manage your projects and collaborate with your team.",
  robots: "noindex, nofollow",
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-xl">PM</span>
                </div>
                <span className="text-2xl font-bold">ProjectFlow</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">Welcome back!</h1>
              <p className="text-xl text-purple-100 mb-8">
                Sign in to continue managing your projects and collaborating with your team.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Secure & Fast</h3>
                  <p className="text-purple-100">Enterprise-grade security with lightning-fast performance</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Team Collaboration</h3>
                  <p className="text-purple-100">Work together seamlessly with real-time updates</p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <SignInForm />
          </div>
        </div>
      </div>
    </div>
  )
}
