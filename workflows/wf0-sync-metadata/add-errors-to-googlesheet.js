const spreadsheetId = '1Hnd2vMC7cK5OMksk5-4lv_OpqkXA1zSo1DrbtnopLtg'

each($.sheetsMapping, batchUpdateValues({
  spreadsheetId,
  range: $.data.range,
  values: $.data.values
}))
