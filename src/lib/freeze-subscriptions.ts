import Stripe from 'stripe';

export const fetchSubscriptions = async (stripe: Stripe) => {
  const subscriptions = [];

  let startingAfter: Stripe.Subscription['id'] = '';
  let hasMoreSubscriptions: boolean = true;

  while (hasMoreSubscriptions) {
    const listParams: Stripe.SubscriptionListParams = {
      limit: 100,
    };

    if (startingAfter) {
      listParams.starting_after = startingAfter;
    }

    const response = await stripe.subscriptions.list(listParams);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Throttle requests to avoid rate limits
    console.log(`Fetched ${response.data.length} subscriptions...`);
    if (response.data.length > 0) {
      subscriptions.push(...response.data);
      startingAfter = response.data[response.data.length - 1].id;
    } else {
      hasMoreSubscriptions = false;
    }
  }

  return subscriptions;
};

export const freezeSubscriptions = async (stripe: Stripe, omitIds: string[]) => {
  const subscriptions = await fetchSubscriptions(stripe);

  const promises = subscriptions.map(async (subscription) => {
    if (omitIds.includes(subscription.id)) {
      console.log(`Skipping subscription ${subscription.id}`);
      return;
    }
    await stripe.subscriptions.update(
      subscription.id,
      {
        pause_collection: {
          behavior: 'keep_as_draft',
        },
      }
    );
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Throttle requests to avoid rate limits
    console.log(`Paused subscription ${subscription.id}`);
  });

  await Promise.all(promises);

  console.log('done');
};
