import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-900 text-xl font-bold text-white">
            N
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Start shopping authentic Nigerian foods
          </p>
        </div>

        <form action={registerAction} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <Input id="firstName" name="firstName" required className="mt-1" />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <Input id="lastName" name="lastName" required className="mt-1" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone (optional)
            </label>
            <Input id="phone" name="phone" type="tel" className="mt-1" placeholder="+234" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <Input id="password" name="password" type="password" required minLength={8} className="mt-1" />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-800 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
