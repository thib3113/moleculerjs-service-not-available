This is an example repo, to illustrate the serviceNotAvailable error from moleculer .

This test only works on linux like machine (kill need to allow to send specific signals) .

Here is the scenario :

-   start node1 and node2
-   kill node2 (let services to kill them, but exit before transit send DISCONNECTED)
-   restart node2 (before the heartbeatTimeout => node1 will just try to update the existing node)

To start this test, you can use `npm start`, or just run `index.js`

An easy fix can be to update this [line](https://github.com/moleculerjs/moleculer/blob/master/src/registry/node.js#L71) with (tested locally) :

```typescript
if (newSeq > this.seq || this.instanceID !== payload.instanceID || isReconnected) {
```

(but I think changing instanceID need to produce some other events ? emit a reconnection ?)
