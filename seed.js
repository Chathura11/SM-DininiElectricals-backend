// seed.js
require('dotenv').config(); // <-- ADD THIS
const mongoose = require('mongoose');
const Role = require('./models/roles.model');
const {User} = require('./models/users.model');
const Permission = require('./models/permissions.model');
const Account = require('./models/account.model');
const mongoURI = process.env.MONGODB_URL;
const bcrypt = require('bcrypt');

async function seedDatabase() {
  try {
    // Connect to your MongoDB database
    await mongoose.connect(mongoURI);

    // Clear existing data (optional, use with caution)
    await Permission.deleteMany({});
    await Role.deleteMany({});
    await User.deleteMany({});
    await Account.deleteMany({});

    // Define permissions data
    const permissionsData = [
      { name: 'manage_users' },
      { name: 'configure_settings' },
      { name: 'security_controls' },
      { name: 'process_transaction' },
      { name: 'apply_discount' },
      { name: 'generate_receipts' },
      { name: 'override_permissions' },
      { name: 'process_returns' },
      { name: 'manage_inventory' },
      { name: 'generate_reports' },
      { name: 'access_financial_data' },
      { name: 'review_reports' },
      
    ];

    // Insert permissions into the database
    const insertedPermissions = await Permission.insertMany(permissionsData);

    // Define roles data with associated permission IDs
    const rolesData = [
      { role: 'superAdmin', permissions: insertedPermissions.map(p => p._id) },
      { role: 'admin', permissions: [insertedPermissions[0]._id, insertedPermissions[1]._id, insertedPermissions[2]._id]},
      { role: 'operationsManager', permissions: [insertedPermissions[3]._id, insertedPermissions[4]._id, insertedPermissions[5]._id, insertedPermissions[6]._id, insertedPermissions[7]._id, insertedPermissions[8]._id, insertedPermissions[9]._id, insertedPermissions[10]._id, insertedPermissions[11]._id]},
      { role: 'salesPerson', permissions: [insertedPermissions[3]._id, insertedPermissions[4]._id, insertedPermissions[5]._id]},
      { role: 'manager', permissions: [insertedPermissions[6]._id, insertedPermissions[7]._id, insertedPermissions[8]._id, insertedPermissions[9]._id]},
      { role: 'inventoryManager', permissions: [insertedPermissions[8]._id]},
      { role: 'accountant', permissions: [insertedPermissions[10]._id, insertedPermissions[11]._id]},
      // Add other roles
    ];

    // Insert roles into the database
    const insertedRoles = await Role.insertMany(rolesData);

    // Find the superAdmin role
    const superAdminRole = insertedRoles.find(role => role.role === 'superAdmin');

    // Create a super admin user
    const salt =await  bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword =await  bcrypt.hash('Super@123',salt);

    const superAdminUser = new User({
      name: 'Super Admin',
      email: 'super@gmail.com',
      username:"Superadmin",
      password: hashPassword,
      role: superAdminRole._id,
    });

    await superAdminUser.save();

    //adding accounts
    await Account.insertMany([
      { name: 'Cash', type: 'Asset', balance: 0 },
      { name: 'Inventory', type: 'Asset', balance: 0 },
      { name: 'Sales Revenue', type: 'Revenue', balance: 0 },
      { name: 'COGS', type: 'Expense', balance: 0 },
      { name: "Owner's Equity", type: 'Liability', balance: 0 },
      { name: 'Salary Expense', type: 'Expense', balance: 0 },
      { name: 'Additional Expense', type: 'Expense', balance: 0 },
      { name: "Accounts Payable", type: 'Liability', balance: 0 }
    ]);

    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Run the seed function
seedDatabase();
