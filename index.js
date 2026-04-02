const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config()
const connection = require('./config/db.config');
const cookieParser = require('cookie-parser');

const app = express()

const PORT = process.env.PORT || 5050;

// Use the cors middleware
app.use(cors({
    origin: ['http://localhost:3000','http://localhost:5173','https://sm-glamx-frontend.vercel.app','https://sm-glamx-frontend.vercel.app/'], // Replace with your actual frontend domain
    credentials: true, // Enable credentials (cookies, authorization headers, etc.)
  }));


app.use(bodyParser.json())
// Use cookie-parser middleware
app.use(cookieParser());

connection();

const userRouter = require('./routes/users.routes')
const brandRouter = require('./routes/brand.routes');
const categoryRouter = require('./routes/category.routes');
const locationRouter = require('./routes/location.routes');
const supplierRouter = require('./routes/supplier.routes');
const paytermRouter = require('./routes/payterm.routes');
const productRouter = require('./routes/product.routes');
const discountRouter = require('./routes/discount.routes');
const stockRouter = require('./routes/stock.routes');
const salesRouter = require('./routes/sales.routes');
const salesReturnRouter = require('./routes/salesReturn.routes');
const inventoryRouter = require('./routes/inventory.routes');
const accountRouter = require('./routes/account.routes');


//user model
app.use('/api/users',userRouter);
app.use('/api/brands', brandRouter);
app.use('/api/categories',categoryRouter);
app.use('/api/locations',locationRouter);
app.use('/api/suppliers',supplierRouter);
app.use('/api/payterms',paytermRouter);
app.use('/api/products',productRouter);
app.use('/api/discounts',discountRouter);
app.use('/api/stocks',stockRouter);
app.use('/api/sales',salesRouter);
app.use('/api/inventories', inventoryRouter);
app.use('/api/accounts',accountRouter);
app.use('/api/sales-return',salesReturnRouter);

app.listen(PORT,()=>{
    console.log(`Server is up and run on port ${PORT}`);
});
