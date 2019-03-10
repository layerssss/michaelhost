michaelhost
=====

This is Michael Yin's very own hosting software.

## What's included

* Web-UI admin dashboard server
* Let's Encrypt powered SSL reverse proxy
* Optional OIDC guard on reverse proxy
* docker-compose instance management with port forwarding
* Web-based terminals
* Cronjobs
* MountedApp through admin dashboard
* Webhooks server (DockerHub, GitHub)

## Usage

```
# with sudo or permissions to listen to 80 / 443 ports
npm i -g michaelhost

# init state file at ~/.michaelhost-state.json
michaelhost init --email "your@domain"

michaelhost service --email "your@domain"
```

Absolutely no warranty

## License

MIT License

Copyright (c) 2019 Michael Yin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
