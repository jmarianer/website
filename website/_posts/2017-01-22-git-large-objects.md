---
title: "Gitastrophe averted: Finding large objects in git"
---
My teammates and I recently asked for larger SSDs for our computers;
unfortunately, this was deemed too expensive to fit in our team's budget. I
could rant about the hit to my productivity as I struggled to shrink my
disk footprint, but instead I'll be constructive and share my experience.

One of my teammates noticed that there were some large files in one of our Git
repositories, but we didn't know which files these were or who put them there. I
decided to take the time to find out. After `git gc`ing, I first listed the top
twenty objects with their sizes:

```
cd .git/objects/pack
git verify-pack -v .pack | /usr/bin/sort -rn -k3 | head -20
```

(I had to use the full path to `/usr/bin/sort` because I'm running in Bash on
CygWin, and some tools I use mess up my path. Ignore that little detail, please.)

This gives me the size and hash of the largest objects, but the hash
unfortunately doesn't tell me much. My next step was to find a list of all
objects and their hashes:

```sh
git rev-list --objects --all
```

I wrote a quick Python script to correlate the two lists, which is available as
[`git-find-large-objects.py`](https://github.com/jmarianer/blogsource/blob/master/git-find-large-objects.py).
The output is a table of the largest objects, along with their name and size.

Next time: how I used this data to save my precious SSD space.
