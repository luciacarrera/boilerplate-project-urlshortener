require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser')
const dns = require('dns');
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(function (req, res, next) {
  console.log(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

const urlSchema = new mongoose.Schema({
  short_url:{type: Number, unique: true,required: true},
  original_url: {type: String, required: true}
})

let Url = mongoose.model('Url', urlSchema)

const createAndSaveUrl = async (original_url, done) => {
  try {
    const lastUrl = await Url.findOne().sort('-short_url').exec();
    const newShortUrl = lastUrl ? lastUrl.short_url + 1 : 1;

    const urlObject = new Url({ original_url, short_url: newShortUrl });
    const data = await urlObject.save();
    return data
    // done(null, data);
  } catch (err) {
    console.error(err);
    // done(err, null);
  }
};

const getOriginalUrl = async(short,done) => {
  try{
    console.log(typeof short)
    const {original_url} = await Url.findOne({short_url: Number(short)})
    return original_url
  }catch(err){
    console.error(err)
  }
}
app.post('/api/shorturl',bodyParser.urlencoded({ extended: false }), async function(req, res){
  let urlObject = new URL(req.body.url);
  dns.lookup(urlObject.host, async function(err){
    if(err){
      res.json({error: 'invalid url'})
    }else{
      const createdObject = await createAndSaveUrl(req.body.url)
      const response = {original_url: createdObject.original_url, short_url: createdObject.short_url}
      res.json(response)
    }
  });   
  
})

app.get('/api/shorturl/:short_url', async function(req,res){
  console.log(req.params.short_url)
  const url = await getOriginalUrl(req.params.short_url)
  res.redirect(url)
 })



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
