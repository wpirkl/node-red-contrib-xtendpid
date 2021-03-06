const zmq = require("zeromq")


module.exports = function(RED) {

    async function handle_events(sock, node) {
        for await (event of sock.events) {
            switch(event.type) {
                case "connect":
                case "handshake":
                case "end":
                    node.status({fill: "green", text: "connected"});
                    node.connected = true;
                    break;
                case "connect:delay":
                case "connect:retry":
                    node.status({fill: "blue", text: 'awaiting connection'});
                    node.connected = false;
                    break;
                case "close":
                case "disconnect":
                    node.status({fill: "red", text: "disconnected"});
                    node.connected = false;
                    break;
                default:
                    node.status({fill: "orange", text: "??" + event.type + "??"});
                    node.connected = false;
                    break;
            }
        }
    };

    function DigitalInNode(config) {

        RED.nodes.createNode(this, config);

        var node = this;
        node.connected = false;

        const sock = new zmq.Subscriber;

        sock.connect("tcp://" + config.host + ":" + config.port);

        sock.subscribe(Uint8Array.from([0x03, 0x00, config.pin]))

        async function receive() {
            node_msg = {};

            for await (const [msg] of sock) {
                node_msg.topic = config.topic;
                node_msg.payload = msg[3] != 0;
                // console.log("received message: %s", Uint8Array.from(msg).toString());
                node.send(node_msg);
            }
        };

        receive();

        handle_events(sock, node);

        node.on('close', function () {
            sock.close();
        });
    }

    RED.nodes.registerType("xtendpid digital in", DigitalInNode);

    async function req_rep_data(node, sock, msg) {

        // console.log("sending: " + Uint8Array.from(msg));

        await sock.send(Uint8Array.from(msg));
        const [result] = await sock.receive();

        // console.log("result: " + Uint8Array.from(result));

        // here parse the result and if it's not ok, raise an error
        if(result[0] != msg[0] || result[1] != 0 || result[2] != msg[1]) {
            node.error("Something went wrong!");
        } else {
            node.send({"payload": msg[3] != 0, "topic": msg.topic});
        }
    }

    function RequestDigitalInNode(config) {

        RED.nodes.createNode(this,config);

        var node = this;
        node.connected = false;

        const sock = new zmq.Request

        sock.connect("tcp://" + config.host + ":" + config.port);

        this.on('input', function(msg) {

            // do all the work here
            if(msg.topic == config.topic) {

                message = [3, config.pin];

                req_rep_data(node, sock, message);
            }
        });

        handle_events(sock, node);

        node.on('close', function () {
            sock.close();
        });
    }
    RED.nodes.registerType("xtendpid request digital in", RequestDigitalInNode);

    async function req_rep(node, sock, msg) {

        // console.log("sending: " + Uint8Array.from(msg));

        await sock.send(Uint8Array.from(msg));
        const [result] = await sock.receive();

        // console.log("result: " + Uint8Array.from(result));

        // here parse the result and if it's not ok, raise an error
        if(result[0] != msg[0] || result[1] != 0) {
            node.error("Something went wrong!");
        }
    }

    function DigitalOutNode(config) {

        RED.nodes.createNode(this,config);

        var node = this;
        node.connected = false;

        const sock = new zmq.Request

        sock.connect("tcp://" + config.host + ":" + config.port);

        this.on('input', function(msg) {

            // do all the work here
            if(msg.topic == config.topic) {

                message = [4, config.pin, (msg.payload)? 1 : 0];

                req_rep(node, sock, message);
            }
        });

        handle_events(sock, node);

        node.on('close', function () {
            sock.close();
        });
    }
    RED.nodes.registerType("xtendpid digital out", DigitalOutNode);


    function RelayOutNode(config) {

        RED.nodes.createNode(this,config);

        var node = this;
        node.connected = false;

        const sock = new zmq.Request

        sock.connect("tcp://" + config.host + ":" + config.port);

        this.on('input', function(msg) {

            // do all the work here
            if(msg.topic == config.topic) {

                message = [5, config.pin, (msg.payload)? 1 : 0];

                req_rep(node, sock, message);
            }

        });

        handle_events(sock, node);

        node.on('close', function () {
            sock.close();
        });
    }
    RED.nodes.registerType("xtendpid relay out", RelayOutNode);
}
