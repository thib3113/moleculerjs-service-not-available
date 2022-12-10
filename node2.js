const moleculer = require("moleculer");
const { ServiceBroker } = moleculer;
const config = require("./config");

const main = async () => {
    console.log("hello from node2");
    const node2 = new ServiceBroker({ ...config, nodeID: "node-2" });

    node2.createService({
        name: "test",
        actions: {
            ping: {
                handler: (ctx) => {},
            },
        },
        created: () => {
            console.log("test service created");
        },
        stopped: async () => {
            console.log("test service stopped");

            process.exit(0);
        },
    });

    await node2.start();
};

main().catch((e) => console.error(e));
