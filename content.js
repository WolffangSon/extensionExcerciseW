chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    
    switch(request.type) {
      case 'activate':
        sendResponse({status: 'alive'});
        break;
      case 'requestData':
        let rows = constructData();
        sendResponse({status: 'success', data: rows});
        break;
      default:
        sendResponse({status: 'error'});
    }

});

function constructData() {
  let table = [];
  let col = 0;
  let row = 0;
  if(jQuery) {
//codigo original
    jQuery("#oRightPaneContent").contents().find("#adherenceListWrapper .tblItem").each(function(index) {

//extracto
    //  jQuery("#f7808fdf-c04b-45ea-9e0b-ec8850b86db7:last").contents().find(".f9-widget-grid-content-inner .f9-widget-grid-row").each(function(index){



      if(table[row] == undefined) {
        table[row] = [];
      }

      table[row].push($(this).text());
      col ++;

      if(col > 6) {
        row ++;
        col = 0;
      }
    });
  } else {
    console.log('Error: jQuery library failed to load!');
    return 0;
  }

  return table;

}
/*
https://script.google.com/a/macros/telusinternational.com/s/AKfycbyalU2GY2gR2e1gDTJpHoWrI8Qi4H_lviSdwYwTyJW8bAfPSrruWLAieaYGsRaWx_mH/exec
https://script.google.com/a/macros/telusinternational.com/s/AKfycbyalU2GY2gR2e1gDTJpHoWrI8Qi4H_lviSdwYwTyJW8bAfPSrruWLAieaYGsRaWx_mH/exec

*/