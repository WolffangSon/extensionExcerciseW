chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  switch (request.type) {
    case 'activate':
      sendResponse({ status: 'alive' });
      break;
    case 'requestData':
      let rows = constructData();
      sendResponse({ status: 'success', data: rows });
      break;
    default:
      sendResponse({ status: 'error' });
  }
});

function constructData() {
  let table = [];
  let col = 0;
  let row = 0;
  if (jQuery) {
    jQuery("#oRightPaneContent").contents().find("#adherenceListWrapper .tblItem").each(function (index) {

      if (table[row] == undefined) {
        table[row] = [];
      }

      table[row].push($(this).text());
      col++;

      if (col > 6) {
        row++;
        col = 0;
      }
    });
  } else {
    console.log('Error: jQuery library failed to load!');
    return 0;
  }

  return table;
}
