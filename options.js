chrome.storage.local.get(['webappURL', 'sheetTab', 'userEmail'], (result) => {
  if (result.webappURL != '') {
    document.getElementById('appUrl').value = result.webappURL;
  }
  if (result.userEmail != '') {
    document.getElementById('appUser').value = result.userEmail;
  }
  if (result.sheetTab != '') {
    document.getElementById('appTab').value = result.sheetTab;
  }
  document.getElementById('saveSettings').disabled = false;
  document.getElementById('saveSettings').addEventListener('click', saveSettings);
});

function saveSettings() {
  let input1 = document.getElementById('appUrl');
  let input2 = document.getElementById('appUser');
  let input3 = document.getElementById('appTab');
  let url = input1.value;
  let email = input2.value;
  let sTab = input3.value;
  let validation = isValidUrl(input1);

  if (validation == true && url != '') {
    chrome.storage.local.set({ webappURL: url, sheetTab: sTab, userEmail: email }, () => {
      document.getElementById('bot-icon').src = 'icons/check.png';
      document.getElementById('status').textContent = 'Settings saved!';
      document.getElementById('status').style = 'color: green;';
    });
  } else {
    document.getElementById('bot-icon').src = 'icons/cross.png';
    document.getElementById('status').textContent = 'This is not a valid URL!';
    document.getElementById('status').style = 'color: red;';
  }
}

function isValidUrl(input) {
  if (!input.checkValidity()) {
    return false;
  } else {
    return true;
  }
}
