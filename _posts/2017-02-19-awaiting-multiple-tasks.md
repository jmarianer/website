---
title: Awaiting multiple tasks at once
---
The [`CallServer` and `CallServerAsync`
methods](https://github.com/jmarianer/blogsource/blob/master/Common.cs#L32)
simulate a long-running server I/O. But what if we want to call multiple
servers and get the results? We can't simply say

```c#
var result1 = await CallServerAsync(5, "server1");
var result2 = await CallServerAsync(5, "server2");
// Use "result1" and "result2".
```

because that makes the calls run in series; the call to `server2` only starts
after the first call returns.

The solution is simple, albeit somewhat hacky:

```c#
var call1 = CallServerAsync(5, "server1");
var call2 = CallServerAsync(5, "server2");
// Use "await call1" and "await call2".
```

This makes both tasks start simultaneously and waits for them to finish only
when the results are needed. Since a second `await` call does nothing, it is
safe to use `await call1` multiple times after the tasks are started; the task
won't be called a second time.

If we want to use `await call1` multiple times, it may make sense to extract a
variable:

```c#
var call1 = CallServerAsync(5, "server1");
var call2 = CallServerAsync(5, "server2");
var result1 = await call1;
var result2 = await call2;
// Use "result1" and "result2".
```

However, my preferred solution in this case (which minimizes the number of local
variables and the propensity for errors) is:

```c#
var call1 = CallServerAsync(5, "server1");
var call2 = CallServerAsync(5, "server2");
await call1;
await call2;
// Use "call1.Result" and "call2.Result".
```

All these alternatives are demonstrated in
[`AwaitInParallel.cs`](https://github.com/jmarianer/blogsource/blob/master/AwaitInParallel.cs).
