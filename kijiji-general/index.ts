import { AzureFunction, Context } from "@azure/functions"
import axios from 'axios'
const Airtable = require('airtable-simple')
const cheerio = require('cheerio')
const sendgrid = require('@sendgrid/mail')

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
  console.log('running');
  var timeStamp = new Date().toISOString();
  
  if (myTimer.isPastDue)
  {
      context.log('Timer function is running late!');
  }

  const airtable = new Airtable(process.env['AIRTABLE_API_KEY'], process.env['AIRTABLE_BASE'], 'scrapers')
  sendgrid.setApiKey(process.env['SENDGRID_API_KEY'])

  const rows = await airtable.all()

  rows.forEach(async(row) => {
    const fields = row.fields

    if (!fields.url) {
      return
    }
    const response = await axios(fields.url)
    const $ = cheerio.load(response.data)
    const ads = $(fields.ads_selector)

    let oldAds: string[] = JSON.parse(fields.viewed_ads)
    let allAds: string[] = []
    ads.each(async(i, ad) => {
      const adId = $(ad).attr(fields.id_attr)
      allAds[i] = adId
      if (oldAds.includes(adId)) {
        return;
      }

      let baseUrl = typeof fields.base_url !== 'undefined' ? fields.base_url : ''

      let myAd = {
        title: $(ad).find(fields.title_selector).text().trim(),
        price: $(ad).find(fields.price_selector).text().trim(),
        location: $(ad).find(fields.location_selector).text().trim(),
        image: $(ad).find(fields.image_selector).attr(fields.image_attr),
        link: baseUrl + $(ad).find(fields.link_selector).attr('href')
      }

      let msg = {
        to: 'dude.wallace@gmail.com',
        from: 'spencer.wallace@outlook.com',
        subject: fields.subject,
        html: `<h1>${myAd.title}</h1><div>${myAd.price}</div><br><a href="${myAd.link}"><img src="${myAd.image}"></a><br><div>${myAd.location}</div><br><a href="${myAd.link}"><button>Go to Ad</button></a>`
      }


      try {
        await sendgrid.send(msg)
      } catch (error) {
        console.log(error)
      }

    })

    if (row.fields.save_all) {
      allAds = [...new Set([...allAds,...oldAds])];
    }
    airtable.update(row.id, 'viewed_ads', JSON.stringify(allAds))
  });

  context.log('Timer trigger function ran!', timeStamp);
};

export default timerTrigger;
