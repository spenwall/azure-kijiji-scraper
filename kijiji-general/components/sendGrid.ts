const sendgrid = require('@sendgrid/mail')

module.exports = async (ad) => {
    sendgrid.setApiKey(process.env['SENDGRID_API_KEY'])

    const msg = {
        personalizations: [{
            to: 'dude.wallace@gmail.com',
            subject: ad.title,
            dynamic_template_data: {
                title: ad.title,
                link: ad.link,
                price: ad.price,
                location: ad.location,
                image: ad.image,
            }
        }],
        subject: ad.title,
        from: 'spencer.wallace@outlook.com',
        template_id: 'd-44ac8371af674af896c065ca398c360a'
    }

    try {
        await sendgrid.send(msg)
    } catch (error) {
        console.log(error)    
    }
}