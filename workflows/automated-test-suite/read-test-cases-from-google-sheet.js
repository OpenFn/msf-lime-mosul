getValues('1--fpoThZj_LMZQW3jOij6X8kWOnE9TUx6fGNf6CYlRY', 'Test Cases!A1:Z');

fn(state => {
  const [headers, ...rows] = state.data.values;
  
  const testCases = rows.map(row => {
    return headers.reduce((obj, header, index) => {
      obj[header] = row[index];
      return obj;
    }, {});
  });
  
  return { testCases };

});