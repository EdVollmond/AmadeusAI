import { test } from 'tap'
import TextLineStream from '../dist/textlinestream.es.mjs'

function concatArray() {
  const chunks = []
  
  return new TransformStream({
    transform(chunk) {
      chunks.push(chunk)
    },
    flush(controller) {
      controller.enqueue(chunks)
    }
  });
}

test('split two lines on end', async function (t) {
  const {readable, writable} =  new TextLineStream()
    
  const readStream = readable
    .pipeThrough(concatArray())      

  const writer = writable.getWriter();
  writer.write('hello\nworld');
  writer.close();
  
  for await (const list of readStream) {
    t.same(list, ['hello', 'world']);
    t.end();
  } 
})

test('split two lines on two writes', async function (t) {
  const {readable, writable} =  new TextLineStream()
    
  const readStream = readable
    .pipeThrough(concatArray())      

  const writer = writable.getWriter();
  writer.write('hello');
  writer.write('\nworld');
  writer.close();
  
  for await (const list of readStream) {
    t.same(list, ['hello', 'world']);
    t.end();
  } 
})

test('split four lines on three writes', async function (t) {
  const {readable, writable} =  new TextLineStream()
    
  const readStream = readable
    .pipeThrough(concatArray())      

  const writer = writable.getWriter();
  writer.write('hello\nwor');
  writer.write('ld\nbye\nwo');
  writer.write('rld');
  writer.close();
  
  for await (const list of readStream) {
    t.same(list, ['hello', 'world', 'bye', 'world']);
    t.end();
  } 
})

test('accumulate multiple writes', async function (t) {
  const {readable, writable} =  new TextLineStream()
    
  const readStream = readable
    .pipeThrough(concatArray())      

  const writer = writable.getWriter();
  writer.write('hello');
  writer.write('world');
  writer.close();
  
  for await (const list of readStream) {
    t.same(list, ['helloworld']);
    t.end();
  } 
})

test('support a mapper function', async function (t) {
  const {readable, writable} =  new TextLineStream({
    mapperFun: JSON.parse
  })
    
  const readStream = readable
    .pipeThrough(concatArray())      
    
  const a = { a: '42' }
  const b = { b: '24' }

  const writer = writable.getWriter();
  writer.write(JSON.stringify(a));
  writer.write('\n');
  writer.write(JSON.stringify(b));
  writer.close();
  
  for await (const list of readStream) {
    t.same(list, [a,b]);
    t.end();
  } 
})

test('split lines windows-style', async function (t) {
  const {readable, writable} =  new TextLineStream()
    
  const readStream = readable
    .pipeThrough(concatArray())      

  const writer = writable.getWriter();
  writer.write('hello\r\nworld');
  writer.close();
  
  for await (const list of readStream) {
    t.same(list, ['hello', 'world']);
    t.end();
  } 
})

test('do not return empty lines (default)', async function (t) {
  const {readable, writable} =  new TextLineStream()
    
  const readStream = readable
    .pipeThrough(concatArray())      

  const writer = writable.getWriter();
  writer.write('hello\n\nworld');
  writer.close();
  
  for await (const list of readStream) {
    t.same(list, ['hello', 'world']);
    t.end();
  }
})

test('return empty lines - returnEmptyLines option', async function (t) {
  const {readable, writable} =  new TextLineStream({
    returnEmptyLines: true
  })
    
  const readStream = readable
    .pipeThrough(concatArray())      

  const writer = writable.getWriter();
  writer.write('hello\n\nworld');
  writer.close();
  
  for await (const list of readStream) {
    t.same(list, ['hello', '', 'world']);
    t.end();
  }
})