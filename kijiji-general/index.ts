import { AzureFunction, Context } from "@azure/functions"
import axios from 'axios'
const cheerio = require('cheerio')
const airtableIds = require('./components/airtableIds')
const sendGrid = require('./components/sendGrid')

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    var timeStamp = new Date().toISOString()
    const urls: string[] = JSON.parse(process.env['URLS'])

    urls.forEach(async(url) => {
        const response = await axios(url)
        const $ = cheerio.load(response.data)
        const ads = $('.search-item.regular-ad')

        try {
            const oldAds: string[] = await airtableIds.getLastIds(url)
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
            airtableIds.saveIds(url, allIds)
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
