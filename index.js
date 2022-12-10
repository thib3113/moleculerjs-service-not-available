const { ServiceBroker } = require("moleculer");
const { fork } = require("child_process");

const config = require("./config");

// Create broker
let node1 = new ServiceBroker({ ...config, nodeID: "node-1" });

let node2Process;

/**
 * SCENARIO :
 * node-1 and node-2 are two differents node
 * node-1 know action on node-2
 * node-2 will reboot (before heartbeatTimeout)
 * node-1 will not recognized action on node-2
 */
const main = async () => {
    //setup listener
    node1.localBus.on("$node.updated", ({ node }) => {
        console.log(`node ${node.id} (instance : ${node.instanceID}) connected . package with seq : ${node.seq}`);
    });

    node1.localBus.on("$node.connected", ({ node }) => {
        console.log(`node ${node.id} (instance : ${node.instanceID}) connected . package with seq : ${node.seq}`);
    });

    node1.repl();
    await node1.start();

    //start node2
    node2Process = fork("./node2.js", [], { stdio: "inherit", detached: false });

    //wait node-2 to connect to node-1
    await new Promise((resolve) => {
        node1.localBus.once("$node.connected", resolve);
    });

    //check actions from node-2, in node-1 registry
    const actionName = "test.ping";
    //will log action found on node-2
    logEndpointsForAction(actionName);

    //partial stop of node2 for an unknown reason (simulate a "can send service shutdown, but not disconnect for some reason")
    console.log("kill node-2");
    node2Process.kill("SIGINT");

    // => this will force node-2 to send an INFO package
    // also node-2 will exit just after sending the INFO
    console.log("wait next update from node-2");
    await new Promise((res) => {
        node1.localBus.once("$node.updated", res);
    });

    //restart node2 (this can be logged after "test service stopped", it's not a problem)
    console.log("start node-2");
    node2Process = fork("./node2.js", [], { stdio: "pipe" });

    // await new node-2 reconnect
    // $node.connected will not be fired !
    await new Promise((res) => {
        node1.localBus.once("$node.updated", res);
    });

    //verify if node2 is available / and if action is available
    const nodes = await node1.call("$node.list", { withServices: true, onlyAvailable: true });
    const resNode2 = nodes.find((n) => n.id === "node-2");
    console.log(
        `node-2 available ? ${JSON.stringify(!!resNode2)}, action test.ping available on node-2 ? ${JSON.stringify(
            resNode2 && resNode2.services.some((s) => s.actions["test.ping"])
        )}`
    );
    //if yes and yes, the action is available, next test will check on the registry

    //here no endpoints found
    //because $node.updated doesn't really update the node, because newSeq < oldSeq
    logEndpointsForAction(actionName);
};

const logEndpointsForAction = (actionName) => {
    const endpoints = (node1.registry.getActionEndpoints(actionName) || { endpoints: [] }).endpoints || [];

    if (endpoints.length === 0) {
        console.log("no endpoints found");
        return;
    }

    console.log(`${actionName} found on node : ${endpoints.map(({ node }) => node.id).join(", ")}`);
};

main().catch((e) => console.error(e));

process.on("exit", () => {
    if (node2Process) {
        node2Process.kill();
    }
});
