---
title: "Gitastrophe averted: Partial clones in git"
---
After figuring out how to [trim my Git repository](git-large-objects) by
cutting excess branches, I suddenly had to get my laptop reimaged (I don't know
why. I just do what my IT guy tells me to). The previous instructions were for
removing branches from an existing clone, but here I had a brand new laptop and
wanted to clone. Of course, I could have run `git clone
https://path.to/my/repo` followed by the steps from before, but that would
entail downloading 4GB of stuff only to delete it afterwards; I was working
from home that day and had little desire to wait for my home internet
connection to download the equivalent of an entire movie on DVD if I didn't
*absolutely* have to.

Fortunately, I didn't. I figured that `git clone` is little more than simply
`git init && git remote add && git fetch`. The steps are simple:

```sh
git init my-repo
git remote add origin https://path.to/my/repo
# Now repeat the steps from last time:
git config --unset-all remote.origin.fetch
git config --add remote.origin.fetch +refs/heads/master:refs/remotes/origin/master
git config --add remote.origin.fetch +refs/heads/joeym/*:refs/remotes/origin/joeym/*
git fetch
```

There's no immediate need to run `git gc` since no garbage was generated or
downloaded.
