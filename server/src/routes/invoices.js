const express = require('express');
const { getInvoices, createInvoice, markPaid } = require('../controllers/invoices');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

router.route('/:id/pay')
  .put(markPaid);

module.exports = router;
