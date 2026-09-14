import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import BrandLogo from '@/components/BrandLogo';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase delivers a recovery session from the emailed link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Password too short', description: 'Use at least 6 characters.' });
      return;
    }
    if (password !== confirm) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Could not update password', description: error.message });
      return;
    }

    toast({ title: 'Password updated', description: 'You are signed in with your new password.' });
    navigate('/posts');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-primary/20 bg-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <BrandLogo imageClassName="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Set a new password</CardTitle>
          <CardDescription className="text-muted-foreground">
            {ready
              ? 'Choose a new password for your GEM account.'
              : 'Open this page from the reset link in your email to continue.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !ready}>
              {isLoading ? 'Updating...' : 'Update password'}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
              Back to sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
