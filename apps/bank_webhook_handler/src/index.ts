import express from "express";
import db from "@repo/db/client";
const app = express();

app.post("/hdfcWebhook", async (req, res) => {
  //TODO: Add zod validation here?
  // We should have webhook secret to check if this actually from hdfc bank
  const paymentInfo = {
    token: req.body.token,
    userId: req.body.user_identifier,
    amount: req.body.amount,
  };

  try {
    await db.$transaction([
      db.balance.update({
        where: {
          userId: Number(paymentInfo.userId),
        },
        data: {
          amount: {
            increment: Number(paymentInfo.amount),
          },
        },
      }),
      db.onRampTransaction.updateMany({
        where: {
          token: paymentInfo.token,
        },
        data: {
          status: "Success",
        },
      }),
    ]);

    res.json({
      message: "Captured",
    });
  } catch (e) {
    console.error(e);
    res.status(411).json({
      message: "Error while processing webhook",
    });
  }
  // Update balance in db, add txn
});
