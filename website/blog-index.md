---
layout: post-list
permalink: /blog/
---

Joey's Blog
===========

## Latest posts

{% for post in site.posts %}
* [{{ post.title | escape }}]({{ post.url | relative_url }}) <span>(published {{ post.date | date: "%b %-d, %Y" }})</span>
{% endfor %}
