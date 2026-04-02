// roles.model.js
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role: {
    type: String,
    unique: true,
    required: true,
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
  }],
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
