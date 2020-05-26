module.exports = function(RED) {

    function DigitalOutNode(config) {

        RED.nodes.createNode(this,config);

        var node = this;

        // here we should receive something and once received, push it out

    }
    RED.nodes.registerType("xtendpid digital in", DigitalOutNode);

    function DigitalOutNode(config) {

        RED.nodes.createNode(this,config);

        var node = this;

        this.on('input', function(msg) {

            // do all the work here

        });
    }
    RED.nodes.registerType("xtendpid digital out", DigitalOutNode);

    function RelayOutNode(config) {

        RED.nodes.createNode(this,config);

        var node = this;

        this.on('input', function(msg) {

            // do all the work here

        });
    }
    RED.nodes.registerType("xtendpid relay out", RelayOutNode);
}
