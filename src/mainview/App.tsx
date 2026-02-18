import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

function App() {
  const [projectName, setProjectName] = useState("Mynth Desktop");
  const [stepsDone, setStepsDone] = useState(2);
  const totalSteps = 5;

  const progress = useMemo(
    () => Math.round((stepsDone / totalSteps) * 100),
    [stepsDone, totalSteps],
  );

  return (
    <div className="theme min-h-full bg-background text-foreground">
      <main className="mx-auto flex min-h-full w-full flex-col gap-6 px-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Coss UI + Electrobun
          </h1>
          <Badge variant="secondary">Desktop</Badge>
          <Badge>Tailwind v4</Badge>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Project Setup</CardTitle>
            <CardDescription>
              Coss components are now integrated and running in the renderer
              view.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="project-name">
                Project name
              </label>
              <Input
                id="project-name"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="Enter your project name"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Launch readiness</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              onClick={() =>
                setStepsDone((value) =>
                  Math.max(0, Math.min(totalSteps, value - 1)),
                )
              }
              variant="secondary"
            >
              Back
            </Button>
            <Button
              onClick={() =>
                setStepsDone((value) =>
                  Math.max(0, Math.min(totalSteps, value + 1)),
                )
              }
            >
              Next
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              Using Coss UI primitives from{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                src/mainview/components/ui
              </code>
              .
            </p>
            <p>
              Current project:{" "}
              <span className="font-medium text-foreground">{projectName}</span>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default App;
