const loanService = require('../services/loan.service');

exports.payLoan = async (req, res) => {
  try {
    const payment = await loanService.makePayment({
      loanId: req.body.loanId,
      amount: req.body.amount,
      paymentMethod: req.body.paymentMethod,
      userId: req.user.id
    });

    res.json(payment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getLoans = async (req, res) => {
  const loans = await loanService.getLoans();
  res.json(loans);
};

exports.getLoanPayments = async (req, res) => {
  const payments = await loanService.getLoanPayments(req.params.loanId);
  res.json(payments);
};