'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function ComponentPreview() {
  const [count, setCount] = React.useState(0);

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Component Demo
            <Badge variant={count > 5 ? 'destructive' : 'default'}>Count: {count}</Badge>
          </CardTitle>
          <CardDescription>An interactive preview of shadcn components</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Interact with the button below to see the badge state change when the count exceeds 5.
          </p>
          <div className="flex gap-4">
            <Button onClick={() => setCount(c => c + 1)}>Increment</Button>
            <Button variant="outline" onClick={() => setCount(0)}>Reset</Button>
          </div>
        </CardContent>
        {count > 5 && (
          <CardFooter>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                The counter has exceeded the normal range!
              </AlertDescription>
            </Alert>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
