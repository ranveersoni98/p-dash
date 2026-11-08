"use client"

import * as React from "react"
import Link from "next/link"
import { WifiOffIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
            <WifiOffIcon className="size-5" />
          </div>
          <CardTitle>Couldn&apos;t load trading data</CardTitle>
          <CardDescription>
            {error.message ||
              "The trading API didn't respond. Check that the Parabellum API is running on port 3001."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The dashboard reads live data from{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              localhost:3001
            </code>
            . Start the API and try again.
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            Back to overview
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
