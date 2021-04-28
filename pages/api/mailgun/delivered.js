const crypto = require('crypto');

const DOMAIN = 'mg.funeralguide.co.uk';

export default (req, res) => {
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

  res.status(200).json({ success: result });
}
