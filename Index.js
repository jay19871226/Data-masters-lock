"use strict";

var utils = require("./utils");
var cheerio = require("cheerio");
var log = require("npmlog");

var defaultLogRecordSize = 100;
log.maxRecordSize = defaultLogRecordSize;

function setOptions(globalOptions, options) {
  Object.keys(options).map(function(key) {
    switch (key) {
      case 'logLevel':
        log.level = options.logLevel;
        globalOptions.logLevel = options.logLevel;
        break;
      case 'logRecordSize':
        log.maxRecordSize = options.logRecordSize;
        globalOptions.logRecordSize = options.logRecordSize;
        break;
      case 'selfListen':
        globalOptions.selfListen = options.selfListen;
        break;
      case 'listenEvents':
        globalOptions.listenEvents = options.listenEvents;
        break;
      case 'pageID':
        globalOptions.pageID = options.pageID.toString();
        break;
      case 'updatePresence':
        globalOptions.updatePresence = options.updatePresence;
        break;
      case 'forceLogin':
        globalOptions.forceLogin = options.forceLogin;
        break;
      default:
        log.warn("setOptions", "Unrecognized option given to setOptions: " + key);
        break;
    }
  });
}

function buildAPI(globalOptions, html, jar) {
  var maybeCookie = jar.getCookies("https://www.facebook.com").filter(function(val) {
    return val.cookieString().split("=")[0] === "c_user";
  });

  if(maybeCookie.length === 0) {
    throw {error: "Error retrieving userID. This can be caused by a lot of things, including getting blocked by Facebook for logging in from an unknown location. Try logging in with a browser to verify."};
  }

  var userID = maybeCookie[0].cookieString().split("=")[1].toString();
  log.info("login", "Logged in");

  var clientID = (Math.random() * 2147483648 | 0).toString(16);

  // All data available to api functions
  var ctx = {
    userID: userID,
    jar: jar,
    clientID: clientID,
    globalOptions: globalOptions,
    loggedIn: true,
    access_token: 'NONE',
    clientMutationId: 0
  };

  var api = {
    setOptions: setOptions.bind(null, globalOptions),
    getAppState: function getAppState() {
      return utils.getAppState(jar);
    },
  };

  var apiFuncNames = [
    'addUserToGroup',
    'changeArchivedStatus',
    'changeBlockedStatus',
    'changeGroupImage',
    'changeThreadColor',
    'changeThreadEmoji',
    'changeNickname',
    'createPoll',
    'deleteMessage',
    'deleteThread',
    'forwardAttachment',
    'getCurrentUserID',
    'getFriendsList',
    'getThreadHistory',
    'getThreadInfo',
    'getThreadList',
    'getThreadPictures',
    'getUserID',
    'getUserInfo',
    'handleMessageRequest',
    'listen',
    'logout',
    'markAsRead',
    'muteThread',
    'removeUserFromGroup',
    'resolvePhotoUrl',
    'searchForThread',
    'sendMessage',
    'sendTypingIndicator',
    'setMessageReaction',
    'setTitle',
  ];

  var defaultFuncs = utils.makeDefaults(html, userID, ctx);

  // Load all api functions in a loop
  apiFuncNames.map(function(v) {
    api[v] = require('./src/' + v)(defaultFuncs, api, ctx);
  });

  return [ctx, defaultFuncs, api];
}
