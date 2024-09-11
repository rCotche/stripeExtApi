const functions = require("firebase-functions");
// const stripe = require("stripe")(functions.config().stripe.secret_key);
//in cmd type:
//firebase functions:config:set stripe.secret_key="sk_test_51LVCXZEwAr85lL0JvaJVNf2gCN7Q0331oJI5ak5C6hH8f70JpAmXzuLvUBhm8hZBoRMcBzPmcQwKNDlUU7IGun1R00NF4peuab"
const stripe = require("stripe")(
  "sk_test_51LVCXZEwAr85lL0JvaJVNf2gCN7Q0331oJI5ak5C6hH8f70JpAmXzuLvUBhm8hZBoRMcBzPmcQwKNDlUU7IGun1R00NF4peuab"
);

exports.stripePaymentIntentRequest = functions.https.onRequest(
  async (req, res) => {
    try {
      let customerId;

      //Gets the customer who's email id matches the one sent by the client
      const customerList = await stripe.customers.list({
        email: req.body.email,
        limit: 1,
      });

      //Checks the if the customer exists, if not creates a new customer
      if (customerList.data.length !== 0) {
        customerId = customerList.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: req.body.email,
        });
        customerId = customer.data.id;
      }

      //Creates a temporary secret key linked with the customer
      //TODO: mettre à jour apiVersion
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: "2024-06-20" }
      );

      //Creates a new payment intent with amount passed in from the client
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(req.body.amount),
        currency: "eur",
        customer: customerId,
      });

      //renvoi ceci
      res.status(200).send({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
        success: true,
        // paymentIntentData: paymentIntent,
        // amount: parseInt(req.body.amount),
        // currency: req.body.currency,
      });
    } catch (error) {
      res.status(404).send({ success: false, error: error.message });
    }
  }
);
