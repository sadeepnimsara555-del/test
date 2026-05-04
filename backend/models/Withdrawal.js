const mongoose = require('mongoose');

const withdrawalSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: { type: String, enum: ['card', 'paypal'] },
      details: Object,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed', // For now we auto-complete as per user requirement simulation
    }
  },
  { timestamps: true }
);

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
module.exports = Withdrawal;
