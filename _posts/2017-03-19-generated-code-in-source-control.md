---
---
**tl;dr: Don't. Just don't.**

I've seen many generated files in source control, and it always rubbed me the
wrong way. As a young developer, I couldn't articulate my thoughts very well,
so I didn't say anything to my superiors (not that they would have listened).
I now have the experience to know that I was absolutely right. Here is a
sampling of the experience in question.

* I worked at a company where _binaries_ were put in source control as a matter
  of course. This was because the build system didn't support the particular
method of building these binaries, which I believe was "F5 in Visual Studio".
(The build system was an old pile of hacks that mostly centered around
platform-independent C code, not Windows-specific C++.)

  *Fallout*: Someone eventually checked in a new binary but forgot to check in
the relevant sources, and then we had a binary release in the wild whose
sources we could not find.

* A tool I used read configuration directly from source control in a certain
  format, but we wanted to use a preprocessor to make the configuration easier
to read, so we put the preprocessor in source-control next to its output.

  *Fallout*: Someone modified the output directly ("just one tiny change"), and
the next time we wanted to modify the preprocessor we were in trouble. We
would have to either perform the post-preprocessing step manually (and hope we
understood the original tiny change's intent), or make it a new part of the
preprocessor (which means the project to update the preprocessor becomes more
complicated).

* Yet another tool that requires its configuration in source control, but this
  time its authors knew that the configuration format was convoluted and
provided a preprocessor, along with instructions that amounted to "here's the
file you need to modify, but before committing, you have to run this command".

  *Fallout*: I, being new to the system, didn't realize I had to run that
command and sent a change out without it; luckily, my code-reviewer caught my
mistake before I committed it, but it could have easily gone the other way.

* Some people use a code generator for simple, repetitive tasks; an example
  might be boilerplate data retrieval routines (or boilerplate at the beginning
of data retrieval routines). I haven't seen this done myself (only heard
secondhand), so I can't describe an actual situation, but

  *Inevitable fallout*: Someone finds a bug in the boilerplate, fixes the code
generator and then needs to go over the entire codebase to look for instances
of generated code.
