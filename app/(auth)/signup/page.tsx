import type { Metadata } from "next"
import SignUpForm from "@/components/auth/signup-form"

export const metadata: Metadata = {
  title: "Sign Up - ProjectFlow",
  description:
    "Create your ProjectFlow account and start managing projects like a pro. Join thousands of teams already using ProjectFlow.",
  robots: "noindex, nofollow",
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <SignUpForm />
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">PM</span>
                </div>
                <span className="text-2xl font-bold">ProjectFlow</span>
              </div>
              <h1 className="text-4xl font-bold mb-4">Start your journey!</h1>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of teams who trust ProjectFlow to manage their projects efficiently.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Powerful Project Management</h3>
                  <p className="text-blue-100">Organize tasks, track progress, and hit deadlines</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Free to Start</h3>
                  <p className="text-blue-100">Begin with our free plan and upgrade as you grow</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Lightning Fast</h3>
                  <p className="text-blue-100">Built for speed and performance you can rely on</p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl" />
        </div>
      </div>
    </div>
  )
}
