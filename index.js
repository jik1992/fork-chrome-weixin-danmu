// Get options
var prefs;
function refresh_options() {
  chrome.storage.sync.get({
    defaultfontSize: 48,
    showAllMessages: false,
    showMyMessages: false,
    showUsername: false,
    pinWeixinTab: false,
    showNotifications: false,
    danmuDebug: false
  }, function(items) { prefs = items; });
}
refresh_options();
chrome.storage.onChanged.addListener(refresh_options);

// Global Variables
var activated = false;
var hb_timer;

// Toolbar Button
chrome.browserAction.onClicked.addListener(function(tab) {
  if (prefs.danmuDebug) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var counter = 0;
      var timer = setInterval(function() {
        if (counter++ < 10) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: 'danmu',
            message: {user:{name: '弹幕测试'}, content:{text: randomString(), image: ''}}
          });
        }
        else {
          window.clearInterval(timer);
        }
      }, 500);
    });
  } else {
    if (activated) {
      chrome.tabs.create({
        url: 'http://aidistan.github.io/browser-weixin-danmu/helper.html'
      });
    }
    else {
      chrome.tabs.create({
        url: 'https://wx.qq.com/',
        pinned: prefs.pinWeixinTab
      });
    }
  }
});

// Recieve messages
chrome.runtime.onMessage.addListener(function(request) {
  if (request.type === 'weixin') {
    if (prefs.showAllMessages || request.message.room == 'inside') {
      chrome.runtime.sendMessage({
        type: 'notification',
        message: { title: '已捕获到消息', text: request.message.content.text }
      });

      if (request.message.user.isSelf && !prefs.showMyMessages) return;

      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] !== undefined) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'danmu', message: request.message });
        }
      });
    }
  } else if (request.type === 'heartbeat') {
    if (activated) {
      window.clearTimeout(hb_timer);
    }
    else {
      hookup();
    }
    hb_timer = setTimeout(breakup, 5000);
  } else if (request.type === 'notification' && prefs.showNotifications) {
    chrome.notifications.create('notification', {
      type: "basic",
      iconUrl: 'data/icons/icon.png',
      title: request.message.title,
      message: request.message.text
    });
  }
});

function hookup() {
  chrome.runtime.sendMessage({
    type: 'notification',
    message: { title: '已登陆网页微信', text: '开始监听微信消息' }
  });
  activated = true;
  chrome.browserAction.setIcon({
    path: 'data/icons/icon-16.png'
  });
}

function breakup() {
  chrome.runtime.sendMessage({
    type: 'notification',
    message: { title: '已退出网页微信', text: '不再监听微信消息' }
  });
  activated = false;
  chrome.browserAction.setIcon({
    path: 'data/icons/icon-o-16.png'
  });
}

function randomString(len) {
  len = len || 32;
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxy0z123456789';
  var maxPos = chars.length;
  var str = '';
  for (_i = 0; _i < len; _i++) {
    str += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return str;
}
