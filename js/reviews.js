async function canUserReviewSeller({ buyerId, sellerId }) {
  if (!buyerId || !sellerId) return false;

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseClient
    .from("reviews")
    .select("id")
    .eq("buyer_id", buyerId)
    .eq("seller_id", sellerId)
    .gte("created_at", cutoff)
    .maybeSingle();

  if (error) {
    console.error(error);
    return false;
  }

  return !data;
}

async function getRecentSellerReviews(sellerId) {
  const { data, error } = await supabaseClient
    .from("reviews")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

async function updateSellerRating(sellerId) {
  const reviews = await getRecentSellerReviews(sellerId);

  if (!reviews.length) {
    await supabaseClient
      .from("users")
      .update({
        rating: 0,
        reviews_count: 0
      })
      .eq("id", sellerId);

    return;
  }

  const average = reviews.reduce((sum, item) => sum + Number(item.score || 0), 0) / reviews.length;

  await supabaseClient
    .from("users")
    .update({
      rating: Number(average.toFixed(1)),
      reviews_count: reviews.length
    })
    .eq("id", sellerId);
}