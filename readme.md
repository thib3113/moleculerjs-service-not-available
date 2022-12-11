This is an example repo, to illustrate the serviceNotAvailable error from moleculer .

This test only works on linux like machine (kill need to allow to send specific signals) .

Also, you will need nats (or other message broker) (TCP transporter send disconnect when process die, without waiting the disconnect packet)

Here is the scenario :

-   start node1 and node2
-   kill node2 (let services to kill them, but exit before transit send DISCONNECTED)
-   restart node2 (before the heartbeatTimeout => node1 will just try to update the existing node)

To start this test, you can use `npm start`, or just run `index.js`

An easy fix can be to update this [function](https://github.com/moleculerjs/moleculer/blob/master/src/registry/node.js#L56-L75) with (tested locally) :

```diff 
// Update properties
this.metadata = payload.metadata;
this.ipList = payload.ipList;
this.hostname = payload.hostname;
this.port = payload.port;
this.client = payload.client || {};
this.config = payload.config || {};
-this.instanceID = payload.instanceID;

// Process services & events (should make a clone because it will manipulate the objects (add handlers))
this.services = _.cloneDeep(payload.services);
this.rawInfo = payload;

const newSeq = payload.seq || 1;
-if (newSeq > this.seq || isReconnected) {
+if (newSeq > this.seq || this.instanceID !== payload.instanceID || isReconnected) {
  this.seq = newSeq;
+  this.instanceID = payload.instanceID;
  return true;
}
```

(but I think changing instanceID need to produce some other events ? emit a reconnection ?)
