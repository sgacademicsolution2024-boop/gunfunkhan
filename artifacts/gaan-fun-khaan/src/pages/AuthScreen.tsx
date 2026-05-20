import { useState } from "react";
import { LogIn, Mail } from "lucide-react";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/Logo";

export default function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState(supabaseConfigError);
  const [isLoading, setIsLoading] = useState(false);

  async function signInWithPassword() {
    if (!supabase) return;
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setNotice(error ? error.message : "Signed in.");
    setIsLoading(false);
  }

  async function sendMagicLink() {
    if (!supabase) return;
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setNotice(error ? error.message : "Magic link sent. Open it on this device to continue.");
    setIsLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-5 shadow-lg">
        <div className="mb-5 flex items-center gap-3">
          <Logo size="md" />
          <div>
            <h1 className="font-serif text-xl font-black">Gaan Fun Khaan POS</h1>
            <p className="text-sm font-semibold text-muted-foreground">Staff sign in</p>
          </div>
        </div>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!supabase || isLoading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!supabase || isLoading}
          />
          <Button className="w-full" onClick={signInWithPassword} disabled={!supabase || isLoading || !email || !password}>
            <LogIn className="mr-2 h-4 w-4" />
            Sign In
          </Button>
          <Button variant="outline" className="w-full" onClick={sendMagicLink} disabled={!supabase || isLoading || !email}>
            <Mail className="mr-2 h-4 w-4" />
            Send Magic Link
          </Button>
        </div>

        {notice && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}
