const Airtable = require('airtable')
const apiKey = process.env['AIRTABLE_API_KEY']
const base = new Airtable({ apiKey }).base(process.env['AIRTABLE_BASE']);

module.exports.getLastIds = async (url) => {
    const select = 'AND(url = "' + url + '")';
  
    try {
        let row = await base("viewed")
          .select({
            view: "Grid view",
            filterByFormula: select
          })
          .firstPage();

          if (row.length === 0) {
            createNewRow(url)
            return null
          }
        
          return JSON.parse(row[0].fields.viewed_ads)
    } catch (error) {
        console.log(error)
    }
  
  };
  
  const createNewRow = (url) => {
    base("viewed").create(
      {
        url
      },
      function(err, record) {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
  };

  module.exports.saveIds = async (url, ids) => {
    const select = 'AND(url = "' + url + '")';
    
    console.log('saving ids', ids)
    try {
        let row = await base("viewed")
          .select({
            view: "Grid view",
            filterByFormula: select
          })
          .firstPage(); 
      
        await base("viewed").update(row[0].id, {
          "viewed_ads": JSON.stringify(ids)
        }) 
    } catch (error) {
     console.log(error)   
    }
  }