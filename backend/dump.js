const mongoose = require('mongoose');
const Order = require('./models/Order');

async function main() {
  await mongoose.connect('mongodb+srv://lakshithanayanagith4444_db_user:EaHb4eUj4S9nvYRu@cluster0.ecmoqlz.mongodb.net/?appName=Cluster0');
  const orders = await Order.find().sort({createdAt: -1}).limit(6);
  require('fs').writeFileSync('C:\\Users\\MSI\\Desktop\\Mobile App\\backend\\orders_dump.json', JSON.stringify(orders, null, 2));
  process.exit(0);
}
main().catch(console.error);
