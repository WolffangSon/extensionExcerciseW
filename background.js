chrome.runtime.onInstalled.addListener(() => {
  // Setting up variables
  chrome.storage.local.set({ webappURL: '', sheetTab: '', userEmail: '', botActive: 0, tabId: 0, errorCounter: 0, refreshMins: 1 });

  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    chrome.tabs.create({ active: true, url: 'options.html' });
  }

});

chrome.runtime.onStartup.addListener(() => {
  // Reset variables
  chrome.storage.local.set({ botActive: 0, tabId: 0, errorCounter: 0, refreshMins: 1 });

});

chrome.action.onClicked.addListener((tab) => {

  chrome.storage.local.get(['webappURL', 'sheetTab', 'botActive', 'refreshMins'], (result) => {
    if(result.webappURL == '' || result.sheetTab == '') {
      botSetIcon('warning', 'Verint RTU Bot (No Webapp URL)');
      botNotifSend(
        'warning',
        'No Webapp URL!',
        "Please setup the webapp URL or the Sheet Tab in the extension's options page."
      );
    } else if(result.botActive == 0) {
      chrome.storage.local.set({tabId: tab.id}, () => {
        activateBot(tab.id, 'UpdatingRT', result.refreshMins);
      });
    } else if(result.botActive == 1) {
      deactivateBot('UpdatingRT');
    }
  });

});

chrome.alarms.onAlarm.addListener((alarm) => {

  switch(alarm.name) {
    case 'UpdatingRT':
      chrome.storage.local.get(['botActive', 'tabId', 'webappURL', 'sheetTab', 'userEmail', 'refreshMins'], (result) => {
        if(result.botActive == 1) {
          processData(result.tabId, result.webappURL, result.sheetTab, result.userEmail, alarm.name, result.refreshMins);
        } else if(result.botActive == 0) {
          console.log('Warning: Verint RTU Bot is inactive! Nothing to do.');
        } else {
          console.log('Error: botActive variable is not set!');
        }
      });
      break;
    default:
      console.log('Error: Undefined alarm type!');
  }

});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  
  switch(request.type) {
    case 'activate':
      activateBot(request.tabId, 'UpdatingRT', 1);
      sendResponse({ status: 'process', message: '' });
      break;
    case 'deactivate':
      deactivateBot('UpdatingRT');
      sendResponse({ status: 'process', message: '' });
      break;
    default:
      sendResponse({ status: 'error', message: 'Undefined request type.' });
  }

});

function activateBot(tabId, alarmName, refreshMins) {
  
  chrome.tabs.sendMessage(tabId, {type: 'activate'}, (response) => {
    if(chrome.runtime.lastError) {
      botSetIcon('warning', 'Verint RTU Bot (Not loaded)');
      botNotifSend(
        'warning',
        'Script not loaded!',
        'Please refresh the page or make sure you have Verint open and try again.'
      );
    } else {
      setBotAlarm(alarmName, refreshMins);
      chrome.storage.local.set({botActive: 1}, () => {
        botSetIcon('activated', 'Verint RTU Bot (Active)', {text: `${refreshMins}`, color: 'green'});
        botNotifSend(
          'activated',
          'Verint RTU Bot Activated!',
          `The Verint Bot is updating every ${refreshMins} minutes.`
        );
        console.log('Verint RT Bot Activated!');
      });
    }
  });

}

function deactivateBot(alarmName) {

  unsetBotAlarm(alarmName);
  chrome.storage.local.set({botActive: 0}, () => {
    botSetIcon('deactivated', 'Verint RTU Bot (Inactive)', {text: ''});
    botNotifSend(
      'deactivated',
      'Verint RTU Bot Deactivated!',
      'No more updates.'
    )
    console.log('Verint RTU Bot Inactive!');
  });

}

function setBotAlarm(name, minutes) {

  chrome.alarms.create(name, {periodInMinutes: minutes});
  console.log('Verint RTU Bot Alarm: ' + name + ' has been set every: ' + minutes + ' minutes');

}

function unsetBotAlarm(name) {

  chrome.alarms.clear(name, (wasCleared) => {
    if(wasCleared == true) {
      console.log('Verint RTU Bot Alarm: ' + name + '. Was unset.');
    } else {
      console.log('Verint RTU Bot Error: There was an issue unsetting the alarm: ' + name);
    }
  });
  
}

async function postData(url, data) {

  let result = { status: 0, rows: 0};
  let resp = await fetch(url, {
    headers: {'Content-Type': 'text/plain'},
    method: 'POST',
    body: JSON.stringify(data)
  }).then((response) => {
    if (response.status >= 200 && response.status <= 299) {
      return response.json();
    } else {
      throw Error(response.statusText);
    }
  }).catch((error) => {
    // Handle the error
    console.log(error);
  });

  return resp ? resp : result;

}

function processData(tabId, url, sheetTab, userEmail, alarmName, refreshMins) {

  chrome.tabs.sendMessage(tabId, {type: 'requestData'}, async (response) => {
    if(chrome.runtime.lastError) {
      chrome.storage.local.get(['errorCounter'], (result) => {
        if(result.errorCounter > 4) {
          deactivateBot(alarmName);
          botNotifSend(
            'warning',
            'Verint Data Not Processed!',
            `Deactivating Verint RTU Bot due to ${result.errorCounter} consecutive failures.`
            );
          chrome.storage.local.set({errorCounter: 0});
        } else {
          botNotifSend(
            'warning',
            'Verint Data Not Processed!',
            'Please reload or make sure you have Verint open and try again.'
          );
          chrome.storage.local.set({errorCounter: result.errorCounter + 1});
        }
      });      
    } else {
      if(response.status == 'success') {
        let pData = {refresh: refreshMins, sTab: sheetTab, userEmail: userEmail, data: response.data};
        let postedData = await postData(url, pData);
        if(postedData.status == 0) {
          chrome.storage.local.get(['errorCounter'], (result) => {
            if(result.errorCounter > 4) {
              deactivateBot(alarmName);
              botNotifSend(
                'warning',
                'Verint Data Not Processed!',
                `Deactivating Verint RTU Bot due to ${result.errorCounter} consecutive POST failures.`
                );
              chrome.storage.local.set({errorCounter: 0});
            } else {
              botNotifSend(
                'warning',
                'Verint Webapp Post Issues!',
                'Please make sure you have a valid webapp URL.'
              );
              chrome.storage.local.set({ errorCounter: result.errorCounter + 1 });
            }
          })
        } else if(postedData.status == 1) {
            chrome.storage.local.set({ errorCounter: 0 });
        } else if(postedData.status == 2) {
          botNotifSend(
            'warning',
            'Verint - Unable to Post!',
            `Another bot is running: ${postedData.user}`
          );
        }
      } else if(response.status == 'error') {
        console.log('There was an issue retrieving the data!');
      } else {
        console.log('There was an unknowkn issue.');
      }
    }
  });

}

function botNotifSend(type, title, message) {
  
  let icon = '';
  switch(type) {
    case 'activated':
      icon = 'icons/bot-64.png';
      break;
    case 'deactivated':
      icon = 'icons/bot-inactive-64.png';
      break;
    case 'warning':
      icon = 'icons/bot-warning-64.png';
      break;
    default:
      icon = 'icons/bot-64.png';
  }
  chrome.notifications.create({
    type: 'basic',
    iconUrl: icon,
    title: title,
    message: message
  });

}

function botSetIcon(type, title, badge) {

  let icon = '';
  switch(type) {
    case 'activated':
      icon = 'icons/bot-16.png';
      break;
    case 'deactivated':
      icon = 'icons/bot-inactive-16.png';
      break;
    case 'warning':
      icon = 'icons/bot-warning-16.png';
      break;
    default:
      icon = 'icons/bot-16.png';
  }
  chrome.action.setIcon({ path: {'16': icon} });
  if(title) {
    chrome.action.setTitle({ title: title });
  }
  if(badge) {
    chrome.action.setBadgeText({ text: badge.text });
    if(badge.color) {
      chrome.action.setBadgeBackgroundColor({ color: badge.color });
    }
  }

}
