/* Node models used by Master
 * Nodes listen for Maseter 
 * Every client connect regard as node
 */
var __ = require('underscore');

var Node = function(nodeType,nodeId,socket, server) {
  this.nodeId = nodeId;
  this.nodeType = nodeType;
  this.socket = socket;
  this.id = socket.id;
  var node = this;

  // Join 'nodes' room
  socket.join('nodes');
  //join 'areas','connectors' ect room
  socket.on('disconnect', function() {
    socket.leave('nodes');
  });
};

module.exports = {
  Node: Node
};
