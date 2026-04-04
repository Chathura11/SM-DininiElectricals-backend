// controllers/supplierPayment.controller.js

const supplierPaymentService = require('../services/supplierPayment.service');

exports.makePayment = async (req, res) => {
  try {
    const payment = await supplierPaymentService.makePayment(req.body);
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllPayments = async (req, res) => {
    const data = await supplierPaymentService.getAllPayments();
    res.json(data);
  };

  exports.getSupplierDue = async (req, res) => {
    try {
      const due = await supplierPaymentService.getSupplierDue(req.params.supplierId);
      res.json({ due });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };