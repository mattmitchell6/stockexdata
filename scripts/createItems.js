const mongoose = require('mongoose');
require('dotenv').config();

// mongoose db connect
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const Item = require('../models/items');

console.log("Adding sample items to our database...");

const sampleItems = [
  {
    name: "Skis",
    imageUrl: "https://images.evo.com/imgp/zoom/80991/367315/clone.jpg",
    price: 20000,
    currency: "usd"
  },
  {
    name: "Water Purifier",
    imageUrl: "http://www.equipement-de-survie.fr/wp-content/uploads/2016/05/filtre-katadyn-vario.jpg",
    price: 9000,
    currency: "usd"
  },
  {
    name: "Anchor Steam 6 Pack",
    imageUrl: "https://cdn3.volusion.com/xqdoq.bdyht/v/vspfiles/photos/Bin-7261-2.jpg",
    price: 1000,
    currency: "usd"
  },
  {
    name: "The Office DVD Set",
    imageUrl: "http://www.dvdsetsdiscount.com/images/634520909517360000.jpg",
    price: 2000,
    currency: "usd"
  },
  {
    name: "Tent",
    imageUrl: "https://i5.walmartimages.com/asr/1493d369-1a7f-495e-976b-21b14e523bb5_1.0017e8ab4fbae6a82870b9f3413a4ee4.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF",
    price: 22900,
    currency: "usd"
  },
  {
    name: "SF Giants Hat",
    imageUrl: "https://i.ebayimg.com/images/g/eDcAAOSwx6pYq1T9/s-l225.jpg",
    price: 3900,
    currency: "usd"
  }
];

sampleItems.forEach((item) => {
  const newItem = new Item({
    name: item.name,
    imageUrl: item.imageUrl,
    price: item.price,
    currency: item.currency
  });

  newItem.save(function(err) {
    if (err) throw err;
    console.log(newItem.name + ' item successfully saved');
  });
})
