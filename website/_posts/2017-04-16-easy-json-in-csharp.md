---
title: Easy JSON in C#
---
I wanted to generate some simple one-off JSON output without creating lots of
objects or new types. Suppose the desired output is

```json
{
  "someField": 3,
  "someOtherField": "name",
  "someArray": [
    1,
    2,
    3
  ],
  "someObjectArray": [
    {
      "f1": 1,
      "f2": "apple"
    },
    {
      "f1": 2,
      "f2": "pear"
    }
  ]
}
```

Assuming all dictionary keys are valid C# identifiers, here's an easy way to do
this using [NewtonSoft.Json](http://www.newtonsoft.com/json):

```c#
var myOneOffObject = new {
    someField = 3,
    someOtherField = "name",
    someArray = new[] {1, 2, 3},
    someObjectArray = new[] {
        new { f1 = 1, f2 = "apple" },
        new { f1 = 2, f2 = "pear" },
    }
};
var output = JsonConvert.SerializeObject(myOneOffObject, Formatting.Indented);
```

Because arrays are statically typed in C# but not in JSON, both elements of
someObjectArray have to have the same fields. We can get around this, however,
by using `dynamic`. If we say `someObjectArray = new dynamic[] { ... }`, the
fields can be anything.

A full program demonstrating both of these can be found at [`Json.cs`](https://github.com/jmarianer/blogsource/blob/master/Json.cs).
