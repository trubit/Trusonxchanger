import Transaction from "../models/Transaction.js";

// Admin: all transactions; user: their own, paginated.
export const listTransactions = async (req, res) => {
  const filter = req.user?.role === "admin" ? {} : { user: req.user.id };

  const page  = Math.max(1,   Number(req.query.page)  || 1);
  const limit = Math.min(100, Number(req.query.limit)  || 20);
  const skip  = (page - 1) * limit;

  if (req.query.type)  filter.type  = req.query.type;
  if (req.query.asset) filter.asset = String(req.query.asset).toUpperCase();

  const [transactions, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({ transactions, total, page, limit, pages: Math.ceil(total / limit) });
};
