const Product = require('../models/product.model');
const XLSX = require('xlsx');
const Brand = require('../models/brand.model');
const Category = require('../models/category.model');

exports.CreateProduct = async (data)=>{
    try {

        let id= 0;
        const products = await Product.find().sort({id:-1}).limit(1);

        if(products.length == 0){
            id = 1;
        }else{
            id = products[0].id +1;
        }
        data.id = id;

        const product = new Product(data);
        return await product.save();
    } catch (error) {
        throw error;
    }
}

exports.GetAllProducts = async(req)=>{
    try {
        const user = req.user;
        const requiredPermission = 'configure_settings';
        const permissionNames = user.role.permissions.map(permission => permission.name);
        if(permissionNames && permissionNames.includes(requiredPermission)){
            return await Product.find()
                                        .populate("brand")
                                        .populate("category")
        }else{
            return await Product.find({status:true})
                                                    .populate("brand")
                                                    .populate("category")
        }
    } catch (error) {
        throw error;
    }
}


exports.UpdateProduct = async (id,data)=>{
    try {
       return await Product.findByIdAndUpdate(id,data,{new:true}); 
    } catch (error) {
        throw error;
    }
}

exports.processExcel = async (file) => {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
  
      const rows = XLSX.utils.sheet_to_json(sheet);
  
      let insertedCount = 0;
  
      // ✅ Get last product ID ONCE
      const lastProduct = await Product.findOne().sort({ id: -1 });
      let nextId = lastProduct ? lastProduct.id + 1 : 1;
  
      for (const row of rows) {
        const { name, code, price, brand, category } = row;
  
        // Validate required fields
        if (!name || !code || !price || !brand || !category) {
          continue;
        }
  
        // Find brand
        const brandDoc = await Brand.findOne({ name: brand });
        if (!brandDoc) {
          console.log(`❌ Brand not found: ${brand}`);
          continue;
        }
  
        // Find category
        const categoryDoc = await Category.findOne({ name: category });
        if (!categoryDoc) {
          console.log(`❌ Category not found: ${category}`);
          continue;
        }
  
        // Check duplicate code
        const existing = await Product.findOne({ code });
        if (existing) {
          console.log(`⚠️ Duplicate code skipped: ${code}`);
          continue;
        }
  
        // ✅ Assign incremental ID
        const newProduct = new Product({
          id: nextId++,
          name,
          code,
          price,
          brand: brandDoc._id,
          category: categoryDoc._id
        });
  
        await newProduct.save();
        insertedCount++;
      }
  
      return { count: insertedCount };
  
    } catch (error) {
      throw new Error(error.message);
    }
  };