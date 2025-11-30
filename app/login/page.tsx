"use client";

import { signIn } from "../../auth";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";
import { useActionState, useEffect } from "react";
import { authenticate, handleSocialLogin } from "./actions";
import { toast } from "sonner";

export default function LoginPage() {
  const [state, dispatch] = useActionState(authenticate, undefined);

  useEffect(() => {
    if (state?.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm space-y-6 border border-border p-8 rounded-xl shadow-sm bg-card">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign In</h1>
          <p className="text-muted-foreground text-sm">Choose your preferred sign in method</p>
        </div>

        {/* Social Logins */}
        <div className="grid gap-2">
          <form action={handleSocialLogin.bind(null, "google")}>
            <Button variant="outline" className="w-full" type="submit">
              <FcGoogle className="mr-2 h-4 w-4" /> Sign in with Google
            </Button>
          </form>
          <form action={handleSocialLogin.bind(null, "github")}>
            <Button variant="outline" className="w-full" type="submit">
              <FaGithub className="mr-2 h-4 w-4" /> Sign in with GitHub
            </Button>
          </form>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Credentials Login */}
        <form action={dispatch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <div className="text-center text-sm">
          Don't have an account?{" "}
          <Link href="/register" className="underline hover:text-primary">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
