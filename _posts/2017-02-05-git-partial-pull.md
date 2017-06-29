---
title: "Gitastrophe averted: Partial pulls in git"
---
My team's workflow involves a single Git repository per project. Everyone can
push to their own branches (named `$USERNAME/foobranch`), but only certain
people are allowed to push to `master`, and only after a code review.

When one of the projects [overflowed some of our SSDs](git-large-objects), I decided to
investigate. I got a list of MD5 hashes of some very large objects:

```
 388MiB 14d2bad3db532fe260ddcafdec245cbaf3f53ee2 path/to/some/large.dll
 788Mib 31215e9a73613eeee9a05d90fd80b5c86a20c5a6 path/to/some/large.pdb
```

...but when I tried to `cd path/to/some`, the file wasn't there! After some
headscratching, the problem became obvious: these large binary files were only
in some development branches, but not in `master`. It turns out that someone
had checked in some extremely large files into a branch called
`joesmith/tools`, and we were all getting it as part of every `git fetch`.

I knew that Git's configuration allowed to specify which branches to fetch, so I
[tried to figure
out](https://stackoverflow.com/questions/40854943/fetching-all-but-one-branch-by-default)
how to tell it to fetch everything except that branch.  Upon finding out that
that's impossible, I set out to do what I should have done to start with: fetch
`master` and all my branches, but nothing else.

Starting with a "messy" repository, I ran the following commands to change the
refspecs for pulling from `remote.origin`. Note that this would have deleted any
customizations I'd made to `remote.origin.fetch`; I was certain I hadn't made
any, so I didn't care.

```sh
# Clear existing refspecs
git config --unset-all remote.origin.fetch
# Add (only) "master" and "joeym/*". We can add any shared branches here, too.
git config --add remote.origin.fetch +refs/heads/master:refs/remotes/origin/master
git config --add remote.origin.fetch +refs/heads/joeym/*:refs/remotes/origin/joeym/*
```

`git gc` still won't clean anything up in the current situation, because we
still have references that were previously fetched. So we want to delete all
remote tracking branches except the ones in the new fetch refspecs. The easiest
way is to delete *all* the remote tracking branches...

```sh
git for-each-ref --format "%(refname)" refs/remotes/origin | xargs -n1 git update-ref -d
```

...and then refetch the ones we care about.

    git fetch

If we have recently fetched, this won't add any new objects, but it will
recreate the `remotes/origin/master` and `remotes/origin/joeym/*` refs.

Now, all the large objects in joesmith's branch are unreferenced. A simple

    git gc

reduced my repository from 4GB to around 500MB.

Side-note: my system has, for reasons that escape me, a version of `ls`
that uses signed integers for file sizes. I sent the following to a teammate:

> ```
> $ ls -l
>    C:\src\local-tools\.git\objects\pack\*.*
> ra------    450176 Mon Nov 28 13:53:00 2016 pack-de09b9e4508e1a02a30fbb74967d11145b657614.idx*
> ra------ -1955346137 Mon Nov 28 13:53:00 2016 pack-de09b9e4508e1a02a30fbb74967d11145b657614.pack*
>    -1954889728 (-1954895961) bytes in 2 files
> ```
> 
> Looks like the Git repository is taking up negative space on your SSD. What
> are you complaining about?

Next time: what to do with a brand new clone.
