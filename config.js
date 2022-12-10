const moleculer = require("moleculer");
module.exports = {
    logger: console,
    transporter: "NATS",
    heartbeatTimeout: 90000,
    middlewares: [
        moleculer.Middlewares.Debugging.TransitLogger({
            logPacketData: true,
            folder: null,
            colors: {
                send: "magenta",
                receive: "blue",
            },
            packetFilter: ["HEARTBEAT", "RES", "REQ", "EVENT"],
        }),
    ],
};
