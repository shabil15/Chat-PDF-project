import React, { useState } from "react";
import { auth } from "@/config/firebaseConfig";
import { createUserWithEmailAndPassword,AuthError } from "firebase/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getAuthErrorMessage } from "@/lib/authErrors";

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/');
      setEmail("");
      setPassword("");
    } catch (err) {
      const firebaseError = err as AuthError;
      setError(getAuthErrorMessage(firebaseError.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-zinc-50">
      {/* Welcome Section - Takes full width on mobile, half width on desktop */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-zinc-900">
        <div className="text-center">
          <div className="text-white">
            <span className="block text-2xl lg:text-3xl mb-3">Welcome to</span>
            <span className="block text-6xl lg:text-8xl font-bold tracking-tight">ChatPDF.</span>
          </div>
        </div>
      </div>

      {/* Signup Section - Takes full width on mobile, half width on desktop */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-md">
          <Card className="border-zinc-200 bg-white shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center text-zinc-800">
                Create an account
              </CardTitle>
              <CardDescription className="text-center text-zinc-600">
                Enter your email and password below to create your account
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSignup}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="border-zinc-200 bg-zinc-50">
                    <AlertDescription className="text-zinc-800">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-700">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-700">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-zinc-300 focus:border-zinc-500 focus:ring-zinc-500"
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-zinc-800 hover:bg-zinc-900 text-white"
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign up
                </Button>
                <p className="text-sm text-center text-zinc-600">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Signup;