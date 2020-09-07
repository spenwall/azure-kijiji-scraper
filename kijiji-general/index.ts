import { AzureFunction, Context } from "@azure/functions"
import axios from 'axios'
const cheerio = require('cheerio')
const sendGrid = require('./components/sendGrid')
const Airtable = require('airtable-simple')

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    let timeStamp = new Date().toISOString()
    let airtable = new Airtable(process.env['AIRTABLE_API_KEY'], process.env['AIRTABLE_BASE'], 'viewed')
    const urls: string[] = JSON.parse(process.env['URLS'])

    urls.forEach(async(url) => {
        console.log(url)
        const response = await axios(url)
        const $ = cheerio.load(response.data)
        const ads = $('.search-item.regular-ad')

        try {
            const row = await airtable.first('url', url)
            console.log(row)
            const oldAds: string[] = JSON.parse(row.fields.viewed_ads)
            const allIds: string[] = []
            ads.each((i, ad) => {
                const adId = $(ad).attr('data-listing-id')
                allIds[i] = adId
                if (oldAds.includes(adId)) {
                    return
                }
    
                let myAd = {
                    title: $(ad).find('a.title').text().trim(),
                    price: $(ad).find('.price').text().trim(),
                    location: "Medicine Hat",
                    image: $(ad).find('.image img').attr('src').trim(),
                    link: 'http://www.kijiji.ca' + $(ad).find('a.title').attr('href').trim()
                }
    
                sendGrid(myAd)
    
            })
            airtable.update(row.id, 'viewed_ads', JSON.stringify(allIds))
        } catch(error) {
            console.log(error)
        }
    })

    if (myTimer.isPastDue)
    {
        context.log('Timer function is running late!')
    }
    context.log('Timer trigger function ran!', timeStamp)
};

export default timerTrigger;
