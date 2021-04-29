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

export default (req, res) => {

  mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

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
    event.save(function (err, event) {
      if (err) return console.error(err);
    });
  }

  res.status(200).json({ success: result });
}
