/*global chrome*/

var connections = {};

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('incoming message from injected script');
  console.log(request);

  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    var tabId = sender.tab.id;
    if (tabId in connections) {
      connections[tabId].postMessage(request);
    } else {
      console.log("Tab not found in connection list.");
    }
  } else {
    console.log("sender.tab not defined.");
  }
  return true;
});

chrome.runtime.onConnect.addListener(function(port) {

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(function(request) {
    console.log('incoming message from dev tools page');
    console.log(request)

    // Register initial connection
    if (request.name == 'init') {
      connections[request.tabId] = port;

      port.onDisconnect.addListener(function() {
        delete connections[request.tabId];
      });

      return;
    }
  });

});

//Service workers do not persist
//Bug exploit to keep service worker alive indefintiely
//https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();