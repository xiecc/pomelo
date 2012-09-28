/* WebClient model used by MasterServer
 * WebClient listens for webBroswer agent,
 * sends node announcements to client
 */
var WebClient = function(socket, server) {
  this.socket = socket;
  this.id = socket.id;
  var wc = this;

  // Join web_clients room
  socket.join('web_clients');

  // Remove WebClient from sockets 
  socket.on('disconnect', function() {
    socket.leave('web_clients');
  });
};

WebClient.prototype = {};

module.exports = {
  WebClient: WebClient
}
