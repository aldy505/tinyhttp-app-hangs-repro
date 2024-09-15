Reproduction for https://github.com/tinyhttp/tinyhttp/issues/410

You know, the usual.
```bash
pnpm install

pnpm run test:working

pnpm run test:hangs
```

It turns out I need to manually closes the `server` instance.