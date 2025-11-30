"use client";

import { useActionState } from "react";
import { registerUser } from "./actions";
import { Button } from "../../src/components/ui/button";
import { Input } from "../../src/components/ui/input";
import { Label } from "../../src/components/ui/label";
import Link from "next/link";

export default function RegisterPage() {
  const [state, dispatch] = useActionState(registerUser, undefined);

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm space-y-6 border border-border p-8 rounded-xl shadow-sm bg-card">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-muted-foreground text-sm">Enter your information below to create your account</p>
        </div>
        <form action={dispatch} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="John Doe" required />
            {state?.errors?.name && <p className="text-sm text-red-500">{state.errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            {state?.errors?.email && <p className="text-sm text-red-500">{state.errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
            {state?.errors?.password && (
              <p className="text-sm text-red-500">{state.errors.password}</p>
            )}
          </div>
          {state?.message && <p className="text-sm text-red-500 text-center">{state.message}</p>}
          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>
        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/api/auth/signin" className="underline hover:text-primary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
