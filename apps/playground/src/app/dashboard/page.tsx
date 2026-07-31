'use client';

import React from 'react';
import { useAuth, useUser } from '@bolkauth/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { isSignedIn, isLoaded, sessionId } = useAuth();
  const { user } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-900">
        <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto p-8">
          <Skeleton className="h-12 w-[300px]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] md:col-span-2 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/sign-out', { method: 'POST' });
      window.location.href = '/sign-in';
    } catch (e) {
      console.error('Failed to sign out', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-white">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8 pb-4">
          <h2 className="text-2xl font-bold">BolkAuth Dashboard</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300">
              {isSignedIn ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>
                  <span>Logged in as <span className="font-semibold text-white">{user?.email || 'User'}</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-slate-500 text-slate-500">Inactive</Badge>
                  <span>Not logged in</span>
                </div>
              )}
            </span>
            {isSignedIn && (
              <Button onClick={handleSignOut} variant="outline" size="sm" className="text-white border-slate-700 bg-slate-800 hover:bg-slate-700 hover:text-white">
                Sign Out
              </Button>
            )}
          </div>
        </header>

        <Separator className="bg-slate-700 mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-slate-800 border-slate-700 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Session Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Signed In</span>
                  <span className="font-medium">{isSignedIn ? 'Yes ✅' : 'No ❌'}</span>
                </div>
                <Separator className="bg-slate-700/50" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">User ID</span>
                  <span className="font-medium truncate ml-4" title={user?.id || 'N/A'}>
                    {user?.id || 'N/A'}
                  </span>
                </div>
                <Separator className="bg-slate-700/50" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Session ID</span>
                  <span className="font-medium truncate ml-4" title={sessionId || 'N/A'}>
                    {sessionId || 'N/A'}
                  </span>
                </div>
                <Separator className="bg-slate-700/50" />
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email</span>
                  <span className="font-medium truncate ml-4" title={user?.email || 'N/A'}>
                    {user?.email || 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="bg-slate-800 border-slate-700 text-white h-full">
              <CardHeader>
                <CardTitle className="text-lg">User Profile Data</CardTitle>
              </CardHeader>
              <CardContent>
                {!isSignedIn ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                    <p>You must be signed in to view profile data.</p>
                    <Button onClick={() => window.location.href = '/sign-in'} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                      Sign In Now
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg border border-slate-700">
                      <Avatar className="h-16 w-16 bg-blue-600 text-white border-2 border-slate-700">
                        <AvatarFallback className="bg-blue-600 text-2xl">{user?.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-lg font-medium">{user?.name || 'User Profile'}</h4>
                        <p className="text-slate-400 text-sm">{user?.email}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Raw User Object</h4>
                      <pre className="bg-slate-900 p-4 rounded-lg border border-slate-700 overflow-x-auto text-xs text-blue-300 font-mono">
                        {JSON.stringify(user, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
