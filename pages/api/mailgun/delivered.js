const crypto = require('crypto');
const mongoose = require('mongoose');

const mongoDB = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_URL}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;
const DOMAIN = 'mg.funeralguide.co.uk';

const eventSchema = new mongoose.Schema({
  messageId: String,
  to: String,
  from: String,
  subject: String,
});
const Event = mongoose.model('Event', eventSchema);

export default async (req, res) => {

  const test = await mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log({test});

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function() {
    console.log('DB connected');
  });

  // Event.find(function (err, events) {
  //   if (err) return console.error(err);
  //   console.log(events);
  // })

  const { 'event-data': eventData } = req.body;
  const { timestamp, token, signature } = req.body.signature || {};

  const verify = ({ signingKey, timestamp, token, signature }) => {
    const encodedToken = crypto
        .createHmac('sha256', signingKey)
        .update(timestamp.concat(token))
        .digest('hex')

    return (encodedToken === signature)
  };

  const result = verify({
    signingKey: process.env.MAILGUN_ACCESS_KEY,
    timestamp,
    token,
    signature,
  });

  if (result) {
    const { message } = eventData || {};
    const { headers } = message;
    const { 'message-id': messageId, to, from, subject } = headers || {};

    const event = new Event({ messageId, to, from, subject });
    // event.save(function (err, event) {
    //   if (err) return console.error(err);
    // });

    // const promise = await event.save();

    let saveEvent = null;
    try {
      const newEvent = new Event({ messageId, to, from, subject });
      console.log('before save');
      saveEvent = await newEvent.save(); //when fail its goes to catch
      console.log(saveEvent); //when success it print.
      console.log('after save');
    } catch (err) {
      console.log('err' + err);
      res.status(500).send(err);
    }

    res.status(200).json({ success: true, event: saveEvent });
  } else {
    res.status(200).json({ success: false });
  }

  // res.status(200).json({ success: result, test: promise });
}
