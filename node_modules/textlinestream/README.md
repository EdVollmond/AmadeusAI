# TextLineStream - Split WHATWG streams into lines

Transform a stream into a stream where each chunk is divided by a newline,
be it `\n` or `\r\n`. `\r` can be enabled via the `allowCR` option.

Returning empty lines can be enabled using the `returnEmptyLines` option.

This is a slightly extended version of [Deno's TextLineStream](https://doc.deno.land/https://deno.land/std@0.141.0/streams/mod.ts/~/TextLineStream).

 ```js
 import { TextLineStream } from "textlinestream";
 const res = await fetch("https://example.com");
 const lines = res.body
   .pipeThrough(new TextDecoderStream())
   .pipeThrough(new TextLineStream());
 ```
 
### Installation
 
 ```
 npm i textlinestream
 ```
 
### NDJSON - Newline Delimited JSON
 
Each line may be transformed by specifying a mapper function (`mapperFun`) in 
the options argument.

```js
import { TextLineStream } from "textlinestream";
const res = await fetch("https://example.com");
const lines = res.body
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream({
    mapperFun: JSON.parse
  }));

for await (const obj of lines) {
  // where obj is a js object
} 
```
 
### License
MIT