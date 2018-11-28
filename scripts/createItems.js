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
    name: "Airpods",
    imageUrl: "https://store.storeimages.cdn-apple.com/4981/as-images.apple.com/is/image/AppleInc/aos/published/images/M/ME/MMEF2/MMEF2?wid=572&hei=572&fmt=jpeg&qlt=95&op_usm=0.5,0.5&.v=1503962928226",
    price: 15900,
    currency: "usd"
  },
  {
    name: "The Office DVD Set",
    imageUrl: "http://www.dvdsetsdiscount.com/images/634520909517360000.jpg",
    price: 20000,
    currency: "usd"
  },
  {
    name: "Tent",
    imageUrl: "https://i5.walmartimages.com/asr/1493d369-1a7f-495e-976b-21b14e523bb5_1.0017e8ab4fbae6a82870b9f3413a4ee4.jpeg?odnHeight=450&odnWidth=450&odnBg=FFFFFF",
    price: 229000,
    currency: "usd"
  },
  {
    name: "SF Giants Tickets (2018)",
    imageUrl: "https://images.offerup.com/ng17OIRTYq4ss4zva8mv0lFptcg=/300x300/31b5/31b57324e47f479da2f953941cd285e6.jpg",
    price: 299,
    currency: "usd"
  }
];

sampleItems.forEach((item) => {
  const newItem = new Item({
    _id: new mongoose.Types.ObjectId(),
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
