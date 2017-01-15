---
title: Scope logger in C#
---
My program takes too long to run and I'd like to measure why. Unfortunately, my
routines are I/O-count and the profiler in Visual Studio only measures CPU time
(or else I'm too dumb to figure out how to make it measure wall-clock time).
Fortunately, the timespans in question are long enough that I can just output
some logging statements and eyeball it later.

For illustrative purposes, let's assume my method looks like this:

```c#
public static int CallServer(int delaySecs, string serverName)
{
    Thread.Sleep(TimeSpan.FromSeconds(delaySecs));
    return 0;
}
```

The most obvious way to measure how long it takes is to add logging calls at the
beginning and end:

```c#
public static void Log(string log)
{
    var ElapsedTime = DateTime.Now - Process.GetCurrentProcess().StartTime;
    Console.WriteLine($@"[{ElapsedTime:mm'm'ss's'}] {log}");
}

public static int CallServer(int delaySecs, string serverName)
{
    Log($"Entering CallServer for {serverName}");
    Thread.Sleep(TimeSpan.FromSeconds(delaySecs));
    Log($"Leaving CallServer for {serverName}");
    return 0;
}
```

Note, however, that the "leaving" log call cannot be the last line in the
function; it has to come before the return. This leaves us with at least two
problems:

- If the return statement calls another function, we aren't counting its runtime
  in the runtime for `CallServer`.
- If there is more than one return statement, we need to remember to place a
  "leaving" log call before each one.

In C, people would write functions that only had one return statement so that
statements like `Log("Leaving")` (and, more importantly, freeing resources) could
be placed just before it. Some teams carried that style along to C++, but C++
had a different solution: RAII. In C++, one could imagine a utility class that
logs "entering" in its constructor and "leaving" in its destructor.

C# destructors don't run deterministically, so that's out, but C# does have a
similar construct: the `using` clause. Therefore, we can write a utility class,
`ScopeLogger`, and call it as follows:

```c#
public static int CallServer(int delaySecs, string serverName)
{
    using (new ScopeLogger($"CallServer for {serverName}"))
    {
        Thread.Sleep(TimeSpan.FromSeconds(delaySecs));
        return 0;
    }
}
```

I have placed `Log`, `ScopeLogger` and `CallServer` in
[`Common.cs`](https://github.com/jmarianer/blogsource/blob/master/Common.cs)
and a quick demo in
[`ScopeLoggerDemo.cs`](https://github.com/jmarianer/blogsource/blob/master/ScopeLoggerDemo.cs).
The demo also shows that `ScopeLogger` behaves exactly as you'd want it to when
using `async` and `await`.
