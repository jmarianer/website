---
title: "Interviewee questions: the development environment"
---
This post is part of the [Do you have any questions for me?](do-you-have-any-questions-for-me) series.

Perhaps the most important thing to me, as a developer, is the development
environment. As much as I hate dress codes, I would likely choose an employer
that mandated one (especially if they had a good reason) over one whose source
control situation was `mkdir -P project/new/new/really.new/1/test`.

1. What's your [Joel Test](https://www.joelonsoftware.com/2000/08/09/the-joel-test-12-steps-to-better-code/) score?

   Joel Spolsky wrote an article in the year 2000 about twelve things a good
software team does. Now, not everything in that test has stood the test of time,
and certainly some things apply to different teams better than others, but
a good interviewer will be able to say with confidence "we're only a 9 because
we believe that items x, y and z don't apply to our industry", or "we're an 8
but we're working on it", or even just "I haven't calculated it recently but
I'm sure it's good". If nothing else, "who's this Joel person?" is a red flag
(assuming you're talking to a software engineer and not a recruiter).

   That said, regardless of the answer, it's important to drill down into the
aspects that are most important to me; some of the following questions have
significant overlap with Joel test questions, though they provide more
information than a simple yes/no question could.

2. What source control system do you use?

   Joel has used CVS, which was, in his words, *fine*. That may have been true
in 2000, but the only reasonable open-source options in 2017 are Git and
Mercurial.  "Subversion but we'd like to upgrade" *might* be fine if they seem
like they'll actually do it, but not if they've been "about to upgrade" for the
last five years. For closed-source alternatives, I'd need some time to
research the particular system in question.

   For anyone interviewing for a company that deals with source control, likely
the only reasonable answer is "we are self-hosting"; as a matter of fact, I
would probably replace this question with "are you self-hosting" in that case.

   "We use a source-control system we developed ourselves and which works most
of the time" is a valid answer [if and only if the company in question is
Google](https://youtu.be/W71BTkUbdqE).

3. Do you check in generated code or binaries?

   This is (almost) [never a good idea](generated-code-in-source-control) and I
am constantly surprised by people who think it is. With the possible exception
of binary libraries that aren't available in source form, one should *never*
check in anything that isn't in a form immediately modifiable by the devs. For
compiler output, this means the source code. For generated code, this means the
generator scripts and their input.

4. Tell me about your continuous build system.

   First of all, you have one, right? Joel's [daily
builds](https://www.joelonsoftware.com/2001/01/27/daily-builds-are-your-friend/)
are a thing of the past. With today's hardware, there's no reason not to do at
least an incremental build every single commit.

   Does your continuous build run automated tests? If it doesn't, they will
only be run when it's too late &ndash; if someone remembers to run them at all.

   What do you do when the build is broken (including warnings and test
failures)? This can be technological (automatic revert) or cultural (stop
whatever you're doing and fix things).

5. What tools do your developers use?

   This is partially a matter of preference: I would feel as much (or even more)
at home with Vim on Ubuntu as with Visual Studio Bells and Whistles Edition.
However, beware frugality for frugality's sake. "We use gcc 3.0 because that's
the only thing that runs on our five-year-old hardware" is a very, very
dangerous flag. (I also don't think it makes sense, since gcc 3.0 is fifteen
years old by now.)

6. How fast can you iterate?

   A developer's day usually looks like this: think for a bit, write some code,
compile/run/test, repeat. As a developer, I'm responsible for the first two
steps, but you're responsible for the last bit. If compilation takes hours for
even the smallest change, I will not be able to do my job.

7. Do you do code reviews?

   A second pair of eyes can make the difference between unreadable and/or buggy
code and code that is production-quality. This goes beyond mandating code
reviews in the employee handbook (or in your version control system's policy):
the culture must be such that in-depth reviewers are seen as guardians of code
quality, as opposed to obstacles to getting work done.

8. Do you have a style guide?

   I've been the developer who wanted to use all the newest shinies in his code,
but I now believe that that has to be balanced with consistency. If every
developer has their own style, no one can read anyone else's code.  Ideally,
style guide violations should be treated as harshly as compile-time warnings by
the continuous build system.

9. Are you aggressive about paying down technical debt?

   Some developers always want to work on the next big thing, leaving old code
to languish. If said old code is still live and needs to be updated, whoever has
that job is going to hate it. Now, I would be quite happy with a
several-month-long project to refactor an old codebase, making it easier to
maintain going forward &ndash; but that has to be a real part of my (or
someone's) job, and not just something we do in between "real projects".

   By the way, the last few questions might sound like yes/no questions, but
they shouldn't be treated as such. For one thing, a "no" answer with a very
good reason behind it can be quite convincing (though it would have to be a
*very* good reason), and for another, it's easy to say "yes, we like paying
down technical debt" and "forget" to add "and we'll do it as soon as we're done
with our current release, and the next one, and the one after that."

1. What technologies do you use?

   Sometimes it's obvious, but usually it isn't. "Technologies" is deliberately
very broad, encompassing programming languages, servers, cloud providers,
protocols, etc.

   Ancient technologies can be either good (TCP/IP), bad (EBCDIC) or
necessary-evil (EBCDIC because we work for a bank that has mainframes).  Most
modern technologies are fine, or at least fine-ish; a major exception is XML.
(A previous draft of this post went so far as to say XML is *at most* a
necessary evil, but the existence of
[react.js](https://facebook.github.io/react/) and JSX might be a
counterexample.)

1. Tell me about your testing ideology, please.

   Plenty of companies' testing strategy is "let's hope/mandate that the
developers don't do anything stupid". I hereby promise you that if and when I'm
on your team, I will do something stupid at least once  &ndash; not out of
malice, but because I'm human.

   Automated tests are great, but only if they are engrained in your culture
(for example, in your style guide, and checked by code reviewers). But a good
developer isn't always a good writer-of-automated-tests, and a good
writer-of-automated-tests *is not a complete testing solution* &ndash;
especially if your product has anything even remotely close to a UI. All the
automated tests in the world won't account for the fact that one of your screens
uses a different font, or the product is impossible to use without a mouse (tab
order, anyone?), or the UI is just generally "clunky" (how do you even *define*
that, let alone test for it automatically?).

   A server-side-only product *might* be able to get by with just automated tests,
but I wouldn't bet on that. The fact that I can't give any examples offhand may
indicate that there are none, or it may just be a side-effect of the fact that
*good software developers are not good testers*.

1. What if I need a specialized tool to do my job? Say, a $300
   [SSD](git-large-objects), or a $60 software license, or even a $15 book? Are
these things budgeted for?
