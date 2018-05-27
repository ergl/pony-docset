# Pony Docset

Latest revision: Pony 0.22.2 | [Download docset](https://github.com/ergl/pony-docset/releases/download/0.22.2/Pony.docset.zip)

[Pony](https://www.ponylang.org) is an "object-oriented, actor-model,
capabilities-secure, high-performance programming language". I found the
original [online documentation](https://stdlib.ponylang.org) a bit cumbersome to use,
so I created this docset.

[Dash](https://kapeli.com/dash) is an API Documentation Browser and Code Snippet
Manager for Mac. If you are using Windows or Linux you probably want to have a
look at [Zeal](https://zealdocs.org) which is quite similar to Dash.

## Installation for Dash

Download the [latest revision](https://github.com/ergl/pony-docset/releases) of
the docset and unzip it. To install it just double-click on `Pony.docset` and
Dash will add it automatically.

## Installation for Zeal (Linux or Windows)

**Untested, taken from [https://github.com/obstschale/octave-docset](https://github.com/obstschale/octave-docset)**

To manually install a docset in Zeal, download the [latest revision](https://github.com/ergl/pony-docset/releases),
unzip it and copy it into `%HOMEPATH%\AppData\zeal\docset\`.
Restart Zeal and the documentation should be loaded automatically.

---

### Generate docset

The docset is generated with an ugly combination of javascript and the original
[Pony documentation](https://stdlib.ponylang.org).

To generate the docset, simply run `make`. (Note: It will take a while).
