# Kong Go Plugins

Example code of [Kong](https://konghq.com) plugins written in Go.
These are not plugins intended for production use, but rather
small examples to get you started writing your own:

* **go-hello**: a "hello world" plugin, which reads a request header
  and sets a response header.
* **go-hello-lm**: same as the previous as a loadble module to use
  with the go-pluginserver.
* **go-log**: a reimplementation of Kong's `file-log` plugin in Go.
  shows the use of go I/O, goroutines and long-lived globals.
* **go-log-lm**: same as **go-log** but built as a loadable module to
  use with the go-pluginserver.
